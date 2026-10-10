/**
 * De leersporen — de queries.
 *
 * Bouwt op `fetchCourse`: dat haalt de blokken met hun nagekeken lessen én de voortgang van
 * deze kandidaat al op, en een tweede query naar dezelfde tabellen zou een tweede plek zijn
 * waar de reviewgate goed moet staan. Deze module hergroepeert dus wat er al is en voegt
 * precies één query toe: welke conceptgroep bij welke grammaticales hoort.
 */

import { createClient } from '@/lib/supabase/server';
import type { Level, OnderdeelSlug } from '@/data/skills';
import { fetchCourse } from './lessons-server';
import type { LessonBlock, LessonSummary } from './lessons';
import { type Spoor, type SpoorModule, type SpoorSlug, tally } from './sporen';
import { RULES_HOME } from './taalregels';

/** Het blok waar de grammaticalessen in staan, en de blokken die het examenspoor vormen. */
const GRAMMAR_LETTER = 'B';
const EXAM_LETTERS = ['C', 'D', 'E'];

function toModule(slug: string, name: string, intro: string | null, lessons: LessonSummary[]): SpoorModule {
  return { slug, name, intro, lessons, ...tally(lessons) };
}

function toSpoor(slug: SpoorSlug, modules: SpoorModule[]): Spoor {
  return { slug, modules, ...tally(modules.flatMap(m => m.lessons)) };
}

/**
 * De twee sporen van één onderdeel, met hun modules en de voortgang erin.
 *
 * Een module zonder lessen komt er niet in. `spelling-uitspraak` heeft wél twee concepten en
 * nog geen les, en een zesde kaart met "0 lessen" zou zeggen dat de cursus daar leeg is
 * terwijl hij daar nog niet bestaat — hetzelfde onderscheid als NULL tegenover 0 bij de
 * itemtellingen in `data/skills.ts`.
 */
export async function fetchSporen(
  level: Level,
  onderdeel: OnderdeelSlug,
  userId: string | null,
): Promise<Spoor[]> {
  const blocks = await fetchCourse(level, onderdeel, userId);
  return sporenFromBlocks(blocks, level, onderdeel, userId);
}

/**
 * Alleen de blokken die al gelezen zijn — voor een aanroeper die `fetchCourse` al deed.
 *
 * ── DE TAALREGELS ZIJN HIER WEG (oktober 2026) ───────────────────────────────
 * Tot oktober voegde deze functie de regelmodules van `concept_groups` aan het middelste spoor
 * toe (`fetchRuleModules`). Stap 2 komt nu uit de grammaticasyllabus van de eigenaar —
 * `data/grammar-syllabus.ts`, gelezen door `fetchGrammarStep` — en die dekt ook het eigen blok B
 * van Luisteren, Schrijven en Spreken (de onderwerpen plus `GRAMMAR_EXTRAS`). Wat hier van het
 * middelste spoor overblijft is alleen nog een vangnet voor `findModule` op een les die in
 * geen onderwerp staat; de lespagina kijkt eerst in de grammaticastap.
 */
export async function sporenFromBlocks(
  blocks: LessonBlock[],
  _level: Level,
  onderdeel: OnderdeelSlug,
  _userId: string | null,
): Promise<Spoor[]> {
  return buildSporen(blocks, await fetchLessonGroups(blocks), onderdeel);
}

type Group = { slug: string; name: string; rank: number };

function buildSporen(
  blocks: LessonBlock[],
  groups: Map<number, Group>,
  onderdeel: OnderdeelSlug,
): Spoor[] {
  /* ── Het middelste spoor: blok B, gesplitst op conceptgroep ─────────────
     Behalve bij Lezen: daar ís blok B de gedeelde regelbibliotheek en geen stap van deze
     cursus. Die 28 lessen stonden hier als "stap 2 van Lezen · Grammatica · 2 / 28", en
     woordorde is geen leesvaardigheid. Wat er nu in stap 2 komt zijn de zeven kernregels van
     Lezen, en die worden door `sporenFromBlocks` toegevoegd. Zie `lib/lessons/taalregels.ts`. */
  const isRulesHome = onderdeel === RULES_HOME.onderdeel;
  const grammar = isRulesHome ? undefined : blocks.find(b => b.letter === GRAMMAR_LETTER);
  const byGroup = new Map<string, { group: Group; lessons: LessonSummary[] }>();
  /**
   * Het vangnet voor een blok B zonder conceptgroepen — en dat is sinds 08-09 de normale
   * situatie bij drie van de vier cursussen.
   *
   * Alleen bij Lezen is blok B de grammatica, en alleen grammaticaconcepten hebben een
   * `group_id`. Bij Luisteren, Schrijven en Spreken is blok B de vaardigheidsmechaniek — Klank
   * en tempo, Bouwstenen, Uitspraak — en die leunt op strategieconcepten, die per ontwerp
   * gróeploos zijn. Die lessen kwamen daardoor onder de kop **"Overig"** te staan, wat op een
   * uitspraakcursus leest als een restbak in plaats van als het blok waar de cursus om draait.
   *
   * Dus: geen groep betekent één module met de naam van het blok zelf. Die naam staat al in
   * `lesson_blocks.name_nl` en is dus dezelfde die de docent in `/admin/lessen` ziet.
   */
  const fallback = {
    slug: grammar ? grammar.letter.toLowerCase() : 'overig',
    name: grammar?.name_nl ?? 'Overig',
    rank: 9999,
  };
  for (const les of grammar?.lessons ?? []) {
    const group = groups.get(les.id);
    const key = group?.slug ?? fallback.slug;
    const entry = byGroup.get(key) ?? { group: group ?? fallback, lessons: [] };
    entry.lessons.push(les);
    byGroup.set(key, entry);
  }
  const grammarModules = [...byGroup.values()]
    .sort((a, b) => a.group.rank - b.group.rank || a.group.slug.localeCompare(b.group.slug))
    .map(e => toModule(e.group.slug, e.group.name, null, e.lessons));

  /* ── Examentraining: de blokken C, D en E, elk één module ──────────────── */
  const examModules = blocks
    .filter(b => EXAM_LETTERS.includes(b.letter) && b.lessons.length > 0)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(b => toModule(b.letter.toLowerCase(), b.name_nl, b.intro, b.lessons));

  return [
    /* De naam van het middelste spoor komt uit blok B en niet uit een vertaalsleutel: bij Lezen
       is dat "Grammatica", bij Spreken "Uitspraak". Eén label voor vier verschillende blokken
       zou op drie van de vier cursussen iets beweren wat er niet staat. De slug blijft
       `grammatica`, want die staat in URL's, in `SpoorSlug` en in gedeelde links. */
    {
      ...toSpoor('taalregels', grammarModules),
      name: grammar?.name_nl ?? null,
      intro: grammar?.intro ?? null,
    },
    /* Examentraining bundelt drie blokken (C, D en E) en heeft dus geen één inleiding die de
       hele stap dekt; daar blijft de vertaalde tekst staan. */
    { ...toSpoor('examentraining', examModules), name: null, intro: null },
  ];
}

/**
 * Welke conceptgroep elke grammaticales uitlegt.
 *
 * Via `lesson_concepts` op `role = 'teaches'` — een les die een concept alleen *herhaalt* mag
 * de module van dat concept niet bepalen, anders staat dezelfde les in twee modules. Vandaag
 * heeft elke les van blok B precies één `teaches`-concept; als dat er ooit twee worden wint de
 * eerste op groepsvolgorde, wat een keuze is en geen fout.
 */
async function fetchLessonGroups(blocks: LessonBlock[]): Promise<Map<number, Group>> {
  const out = new Map<number, Group>();
  const ids = blocks
    .filter(b => b.letter === GRAMMAR_LETTER)
    .flatMap(b => b.lessons.map(l => l.id));
  if (ids.length === 0) return out;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('lesson_concepts')
      .select('lesson_id, concepts!inner(concept_groups!inner(slug, name_nl, sort_order))')
      .eq('role', 'teaches')
      .in('lesson_id', ids);

    type Row = {
      lesson_id: number;
      concepts: { concept_groups: { slug: string; name_nl: string; sort_order: number } | null } | null;
    };

    for (const r of (data ?? []) as unknown as Row[]) {
      const g = r.concepts?.concept_groups;
      if (!g) continue;
      const found = out.get(r.lesson_id);
      const next: Group = { slug: g.slug, name: g.name_nl, rank: g.sort_order };
      if (!found || next.rank < found.rank) out.set(r.lesson_id, next);
    }
    return out;
  } catch {
    // Zonder groepen valt Grammatica terug op één module "Overig" in plaats van op een 500.
    return out;
  }
}
