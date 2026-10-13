import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ONA_CARDS } from '@/data/ona/cards';
import { ONA_GESPREK_MAX_QUESTIONS } from '@/data/ona/eindgesprek';
import { ownsOna } from '@/lib/entitlements';
import { canOpenOnaCard, canStartOnaPractice, isOnaAvailable } from '@/lib/ona/access';
import { checkOnaRate, logOnaCall } from '@/lib/ona/limits';
import { gesprekFeedback, nextGesprekQuestion, type GesprekTurn } from '@/lib/ona/ai';
import { countOnaPracticeSessions, fetchOnaState } from '@/lib/ona/server';
import { isAnswered } from '@/lib/ona/rules';
import { clientIp } from '@/lib/grading-limits';
import { assertGatewayConfigured } from '@/lib/ai/gateway';

/**
 * Het oefengesprek, beurt voor beurt. Drie acties:
 *
 * - `start`  — nieuwe sessie over de gekozen kaarten, plus de eerste vraag;
 * - `answer` — het antwoord erbij, en de volgende vraag (of de terugblik na de laatste);
 * - `finish` — eerder stoppen en de terugblik krijgen.
 *
 * Het transcript staat op de server (`ona_practice_sessions`), niet in de client: een client die
 * zijn eigen transcript post kan het model alles laten zeggen. Alleen het nieuwe antwoord komt
 * van buiten, en dat wordt afgekapt.
 */

const ANSWER_MAX = 1500;

type Body = { action?: unknown; sessionId?: unknown; cardNos?: unknown; answer?: unknown };

export async function POST(request: Request) {
  if (!isOnaAvailable()) return NextResponse.json({ error: 'ONA is nog niet beschikbaar.' }, { status: 404 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Log eerst in.' }, { status: 401 });

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag.' }, { status: 400 });
  }

  const meta = user.user_metadata;
  const state = await fetchOnaState(user.id);
  if (!state.portfolio) return NextResponse.json({ error: 'Kies eerst je beroep.' }, { status: 400 });
  const beroep = state.portfolio.beroep;

  /** Alleen kaarten die open staan voor dit account en waar iets op staat. */
  function contextFor(cardNos: number[]) {
    return ONA_CARDS
      .filter(c => cardNos.includes(c.number) && canOpenOnaCard(meta, c.number))
      .map(card => ({ card, answers: state.entries.find(e => e.cardNo === card.number)?.answers ?? {} }))
      .filter(ctx => ctx.card.prompts.some(p => isAnswered(ctx.answers[p.id])));
  }

  const verdict = await checkOnaRate(user.id, ownsOna(meta));
  if (!verdict.allowed) return NextResponse.json({ error: verdict.message, code: 'rate' }, { status: 429 });
  try {
    assertGatewayConfigured();
  } catch {
    return NextResponse.json({ error: 'Oefenen is nu niet beschikbaar.' }, { status: 503 });
  }
  const ip = clientIp(request);

  if (body.action === 'start') {
    const sessions = await countOnaPracticeSessions(user.id);
    if (!canStartOnaPractice(meta, sessions)) {
      return NextResponse.json({ error: 'Meer oefengesprekken horen bij de ONA-module.', code: 'paywall' }, { status: 402 });
    }
    const requested = Array.isArray(body.cardNos) ? body.cardNos.map(Number).filter(Number.isInteger) : [];
    const cards = contextFor(requested);
    if (cards.length === 0) {
      return NextResponse.json({ error: 'Kies een kaart waar je al iets op hebt geschreven.' }, { status: 400 });
    }

    await logOnaCall(user.id, ip);
    let first;
    try {
      first = await nextGesprekQuestion({ beroep, cards, turns: [] });
    } catch {
      return NextResponse.json({ error: 'Het gesprek kon niet starten. Probeer het zo opnieuw.' }, { status: 502 });
    }
    const transcript: GesprekTurn[] = [{ role: 'vraag', cardNo: first.cardNo, text: first.text }];
    const { data, error } = await supabase
      .from('ona_practice_sessions')
      .insert({ user_id: user.id, card_nos: cards.map(c => c.card.number), transcript })
      .select('id');
    if (error || !data?.length) return NextResponse.json({ error: 'Opslaan lukte niet.' }, { status: 500 });

    return NextResponse.json({ sessionId: (data[0] as { id: number }).id, transcript, done: false, feedback: null });
  }

  // `answer` en `finish` werken op een bestaande sessie van deze gebruiker.
  const sessionId = Number(body.sessionId);
  const { data: row } = await supabase
    .from('ona_practice_sessions')
    .select('id, card_nos, transcript, finished_at')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!row) return NextResponse.json({ error: 'Dit gesprek bestaat niet.' }, { status: 404 });
  if (row.finished_at) return NextResponse.json({ error: 'Dit gesprek is al afgelopen.' }, { status: 409 });

  const cards = contextFor(row.card_nos as number[]);
  const transcript = (row.transcript as GesprekTurn[]) ?? [];

  if (body.action === 'answer') {
    const answer = typeof body.answer === 'string' ? body.answer.trim().slice(0, ANSWER_MAX) : '';
    if (answer.length < 1) return NextResponse.json({ error: 'Schrijf eerst je antwoord.' }, { status: 400 });
    if (transcript[transcript.length - 1]?.role !== 'vraag') {
      return NextResponse.json({ error: 'Wacht op de volgende vraag.' }, { status: 409 });
    }
    transcript.push({ role: 'antwoord', text: answer });
  } else if (body.action !== 'finish') {
    return NextResponse.json({ error: 'Onbekende actie.' }, { status: 400 });
  }

  const asked = transcript.filter(t => t.role === 'vraag').length;
  const finishing = body.action === 'finish' || asked >= ONA_GESPREK_MAX_QUESTIONS;

  await logOnaCall(user.id, ip);
  try {
    if (finishing) {
      // Een vraag zonder antwoord aan het eind telt niet mee in de terugblik.
      const turns = transcript[transcript.length - 1]?.role === 'vraag' ? transcript.slice(0, -1) : transcript;
      const feedback = await gesprekFeedback({ beroep, cards, turns });
      await supabase
        .from('ona_practice_sessions')
        .update({ transcript: turns, feedback, finished_at: new Date().toISOString() })
        .eq('id', sessionId)
        .eq('user_id', user.id);
      return NextResponse.json({ sessionId, transcript: turns, done: true, feedback });
    }

    const next = await nextGesprekQuestion({ beroep, cards, turns: transcript });
    transcript.push({ role: 'vraag', cardNo: next.cardNo, text: next.text });
    await supabase
      .from('ona_practice_sessions')
      .update({ transcript })
      .eq('id', sessionId)
      .eq('user_id', user.id);
    return NextResponse.json({ sessionId, transcript, done: false, feedback: null });
  } catch {
    return NextResponse.json({ error: 'Dat lukte niet. Probeer het zo opnieuw.' }, { status: 502 });
  }
}
