import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { recordConceptAnswer } from '@/lib/lessons/concepts-server';
import {
  PAYLOAD_SCHEMAS, isExerciseKind, matchesTyped, normaliseTyped, tierBucket,
  type ItemKind, type Tier,
} from '@/lib/lessons/items';

/**
 * Eén antwoord op één lesopgave: nakijken, en de voortgang en beheersing bijwerken.
 *
 * ── WAAROM DIT SERVER-SIDE NAKIJKT ───────────────────────────────────────────
 * De lesstroom kijkt het antwoord óók lokaal na, met dezelfde pure functies uit
 * `lib/lessons/items.ts`, zodat de cursist meteen feedback ziet zonder op het netwerk te
 * wachten. Dit endpoint kijkt het opnieuw na en dát getal gaat de database in.
 *
 * De reden is niet dat de cursist zou frauderen — het antwoordmodel is publiek leesbaar, net
 * als `question_options.is_correct`, en `user_concept_mastery` geeft nergens toegang. De reden
 * is dat een zelfgerapporteerd cijfer geen cijfer is: zodra de client mag zeggen "dit was goed"
 * betekent "45% beheersing" niets meer, en dat getal is precies wat de conceptpagina en de
 * remediatie na een examen gebruiken om iemand te vertellen wat hij moet oefenen.
 *
 * Wat de client dus NIET meestuurt: of het goed was, welke trap de opgave heeft, of welk
 * concept eraan hangt. Alle drie worden hier uit de database gelezen.
 */

type Body = {
  lessonId: number;
  itemId: number;
  /** Het antwoord van de cursist. Vorm hangt af van de soort opgave. */
  answer: unknown;
};

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'niet ingelogd' }, { status: 401 });

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'geen geldige body' }, { status: 400 });
  }

  const { lessonId, itemId, answer } = body;
  if (!Number.isInteger(lessonId) || !Number.isInteger(itemId)) {
    return NextResponse.json({ error: 'lessonId en itemId zijn verplicht' }, { status: 400 });
  }

  // Het item, mét zijn les, zodat een itemId uit een andere les niet de voortgang van deze les
  // kan bijwerken.
  const { data: item, error } = await supabase
    .from('lesson_items')
    .select(`
      id, kind, tier, payload, explanation, lesson_id,
      lesson_item_options ( label, is_correct )
    `)
    .eq('id', itemId)
    .eq('lesson_id', lessonId)
    .maybeSingle();

  if (error || !item) {
    return NextResponse.json({ error: 'opgave niet gevonden' }, { status: 404 });
  }
  if (!isExerciseKind(item.kind)) {
    // Een uitlegblok kan niet beantwoord worden. Zou dit doorgaan, dan telde het mee in de
    // beheersing van een concept zonder dat er iets gevraagd is.
    return NextResponse.json({ error: 'dit item is geen opgave' }, { status: 400 });
  }

  const correct = grade(item.kind as ItemKind, item.payload, item.lesson_item_options ?? [], answer);

  // ── de beheersing van elk concept dat deze les uitlegt ────────────────────
  //
  // Op de LES gekeyed en niet op het item: een opgave hangt aan de les, en de les hangt aan het
  // concept. Alleen `teaches` telt mee — een les die er alleen op terugkomt mag de beheersing
  // van een concept niet verschuiven, want dan gaat het getal over de verkeerde les.
  const { data: links } = await supabase
    .from('lesson_concepts')
    .select('concept_id')
    .eq('lesson_id', lessonId)
    .eq('role', 'teaches');

  const bucket = tierBucket((item.tier ?? 0) as Tier);
  await Promise.all((links ?? []).map(l =>
    recordConceptAnswer(user.id, l.concept_id, correct, bucket)));

  await bumpLessonProgress(supabase, user.id, lessonId);

  return NextResponse.json({ correct, explanation: item.explanation ?? null });
}

/**
 * Kijk één antwoord na.
 *
 * Gebruikt dezelfde pure functies als de client (`matchesTyped`, `normaliseTyped`), zodat de
 * directe feedback en het opgeslagen cijfer nooit uiteen kunnen lopen. Een onbekende vorm
 * levert `false` en geen exception: een kapot item mag een les niet onbruikbaar maken, en de
 * docent ziet het in `/admin/lessen`.
 */
function grade(
  kind: ItemKind,
  rawPayload: unknown,
  options: { label: string; is_correct: boolean }[],
  answer: unknown,
): boolean {
  const parsed = PAYLOAD_SCHEMAS[kind].safeParse(rawPayload);
  if (!parsed.success) return false;
  const p = parsed.data as Record<string, unknown>;

  switch (kind) {
    case 'mcq':
      return options.some(o => o.is_correct && o.label === answer);

    case 'gap_choice':
      return typeof answer === 'string'
        && normaliseTyped(answer) === normaliseTyped(String(p.answer));

    case 'gap_type':
      return typeof answer === 'string'
        && matchesTyped(answer, String(p.answer), (p.accept as string[]) ?? []);

    case 'woordorde': {
      const want = (p.answer as string[]) ?? [];
      return Array.isArray(answer)
        && answer.length === want.length
        && answer.every((t, i) => normaliseTyped(String(t)) === normaliseTyped(want[i]));
    }

    case 'matchen': {
      // De client stuurt per linkerkant de gekozen rechterkant. Alle paren moeten goed zijn:
      // een half goede koppelopgave is niet "half beheerst", het is niet af.
      const pairs = (p.pairs as { left: string; right: string }[]) ?? [];
      if (typeof answer !== 'object' || answer === null) return false;
      const given = answer as Record<string, string>;
      return pairs.every(pair => normaliseTyped(given[pair.left] ?? '') === normaliseTyped(pair.right));
    }

    case 'open_zin':
      // Zelfvergelijking: er is geen goed of fout. Hij telt mee als gezien en als goed zodra
      // er iets van substantie staat — het alternatief is een 0 die zegt dat een geldig
      // antwoord fout was, en dat is erger dan geen meting.
      return typeof answer === 'string' && answer.trim().split(/\s+/).length >= 3;

    case 'markeren': {
      const targets = (p.targets as { label: string; text: string }[]) ?? [];
      if (typeof answer !== 'object' || answer === null) return false;
      const given = answer as Record<string, string>;
      return targets.every(t => normaliseTyped(given[t.label] ?? '') === normaliseTyped(t.text));
    }

    default:
      return false;
  }
}

/**
 * Werk de voortgang van de les bij.
 *
 * `items_total` is het aantal opgaven in de les; `items_done` loopt op tot dat maximum en
 * `state` wordt `done` zodra het bereikt is.
 *
 * **Twee keer dezelfde opgave beantwoorden telt twee keer**, dus de balk kan sneller vol lopen
 * dan strikt klopt. Dat is een bewuste afweging: exact tellen vraagt een rij per beantwoord
 * item (`user_lesson_item_answers`), en die tabel is de moeite pas waard als er iets van
 * afhangt. Vandaag hangt er een balkje en een vinkje van af. De beheersing per concept — het
 * getal waar de remediatie op stuurt — telt wél elk antwoord apart en staat in
 * `user_concept_mastery`.
 */
async function bumpLessonProgress(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  lessonId: number,
): Promise<void> {
  try {
    const { count: total } = await supabase
      .from('lesson_items')
      .select('id', { count: 'exact', head: true })
      .eq('lesson_id', lessonId)
      .not('tier', 'is', null);

    const { data: existing } = await supabase
      .from('user_lesson_progress')
      .select('items_done')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    const itemsTotal = total ?? 0;
    const itemsDone = Math.min((existing?.items_done ?? 0) + 1, itemsTotal || 1);
    const done = itemsTotal > 0 && itemsDone >= itemsTotal;

    const { error } = await supabase
      .from('user_lesson_progress')
      .upsert({
        user_id: userId,
        lesson_id: lessonId,
        items_done: itemsDone,
        items_total: itemsTotal,
        state: done ? 'done' : 'started',
        completed_at: done ? new Date().toISOString() : null,
      }, { onConflict: 'user_id,lesson_id' });

    // Nooit stil laten falen. Een weggegooid resultaat is een verdwenen feature tot je het
    // tegendeel hebt gecontroleerd — dat heeft `user_leren_progress` dit project al gekost.
    if (error) console.error('[lessons] lesvoortgang niet bijgewerkt', error.message);
  } catch (e) {
    console.error('[lessons] lesvoortgang niet bijgewerkt', e);
  }
}
