import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOnaCard } from '@/data/ona/cards';
import { ownsOna } from '@/lib/entitlements';
import { canOpenOnaCard, isOnaAvailable } from '@/lib/ona/access';
import { checkOnaRate, logOnaCall } from '@/lib/ona/limits';
import { checkOnaCard } from '@/lib/ona/ai';
import { fetchOnaEntry, fetchOnaPortfolio } from '@/lib/ona/server';
import { clientIp } from '@/lib/grading-limits';
import { assertGatewayConfigured } from '@/lib/ai/gateway';

/**
 * "Laat nakijken" op één ONA-kaart.
 *
 * Leest de **opgeslagen** antwoorden, niet wat de client meestuurt: de check gaat over wat er in
 * het portfolio staat, en zo kan niemand de route gebruiken als gratis tekstmodel.
 * Geeft alleen vragen terug (`lib/ona/ai.ts`). Poort: ingelogd, kaart open voor dit account,
 * en de rem in `lib/ona/limits.ts`.
 */
export async function POST(request: Request) {
  if (!isOnaAvailable()) {
    return NextResponse.json({ error: 'ONA is nog niet beschikbaar.' }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Log eerst in.' }, { status: 401 });

  let body: { cardNo?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag.' }, { status: 400 });
  }
  const card = getOnaCard(Number(body.cardNo));
  if (!card) return NextResponse.json({ error: 'Deze kaart bestaat niet.' }, { status: 400 });

  const meta = user.user_metadata;
  if (!canOpenOnaCard(meta, card.number)) {
    return NextResponse.json({ error: 'Deze kaart hoort bij de ONA-module.', code: 'paywall' }, { status: 402 });
  }

  const portfolio = await fetchOnaPortfolio(user.id);
  if (!portfolio) return NextResponse.json({ error: 'Kies eerst je beroep.' }, { status: 400 });
  const entry = await fetchOnaEntry(portfolio.id, card.number);
  if (!entry) return NextResponse.json({ flags: [], checkedAt: null });

  const verdict = await checkOnaRate(user.id, ownsOna(meta));
  if (!verdict.allowed) return NextResponse.json({ error: verdict.message, code: 'rate' }, { status: 429 });

  try {
    assertGatewayConfigured();
  } catch {
    return NextResponse.json({ error: 'Nakijken is nu niet beschikbaar.' }, { status: 503 });
  }

  await logOnaCall(user.id, clientIp(request));

  let flags;
  try {
    flags = await checkOnaCard({ card, beroep: portfolio.beroep, answers: entry.answers });
  } catch {
    return NextResponse.json({ error: 'Nakijken lukte niet. Probeer het zo opnieuw.' }, { status: 502 });
  }

  const checkedAt = new Date().toISOString();
  await supabase
    .from('ona_card_entries')
    .update({ ai_flags: flags, ai_checked_at: checkedAt })
    .eq('portfolio_id', portfolio.id)
    .eq('card_no', card.number);

  return NextResponse.json({ flags, checkedAt });
}
