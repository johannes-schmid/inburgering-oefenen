/**
 * De queries van de leerlaag. Server-only — importeert `lib/supabase/server`.
 *
 * De types en de pure functies staan in `lessons.ts` en `items.ts`, die client-veilig zijn.
 * Deze splitsing is niet cosmetisch: de lesstroom en de leseditor zijn clientcomponenten, en
 * één module zou `lib/supabase/server` de browserbundle in sleuren en de build laten falen.
 *
 * Twee regels gelden in élke functie hier:
 *
 *   1. **Level-filteren gaat door `levelFilter()`.** PostgREST rendert `.eq('level', null)` als
 *      SQL `= NULL`, wat nooit waar is: nul rijen, 200 OK, en de pagina rendert stil zijn
 *      leegstaat. Dat is de val die KNM steeds opnieuw zet.
 *   2. **Een fout geeft de leegvorm, geen throw.** De cursus is een strook op een pagina die
 *      ook over examens gaat; hem laten crashen omdat de leerlaag even onbereikbaar is haalt
 *      het portaal onderuit voor iets bijkomstigs.
 */

import { createClient } from '@/lib/supabase/server';
import { levelFilter } from '@/lib/exams';
import { fetchAll } from '@/lib/admin/fetch-all';
import type { Level, OnderdeelSlug } from '@/data/skills';
import {
  itemInputSchema, PAYLOAD_SCHEMAS,
  type ItemKind, type LessonItem, type Tier,
} from './items';
import type { LessonBlock, LessonDetail, LessonSummary, ReviewStatus } from './lessons';

// ---------------------------------------------------------------------------
// Rijvormen zoals PostgREST ze teruggeeft
// ---------------------------------------------------------------------------

type OptionRow = {
  id: number;
  label: 'A' | 'B' | 'C' | 'D';
  body: string | null;
  image_urls: string[] | null;
  image_alt: string | null;
  is_correct: boolean;
  sort_order: number;
};

type ItemRow = {
  id: number;
  sort_order: number;
  kind: string;
  tier: number | null;
  payload: unknown;
  explanation: string | null;
  sections: { name_nl: string } | null;
  lesson_item_options: OptionRow[] | null;
};

/**
 * Zet een databaserij om in een `LessonItem`, met zijn payload geparseerd naar de vorm die bij
 * zijn `kind` hoort.
 *
 * Geeft `null` als de payload niet valideert. Dat is bewust een stille overslag en geen
 * throw: één kapot item mag geen hele les onbereikbaar maken, en de docent ziet het in
 * `/admin/lessen` waar de validatie zichtbaar is. Wél gelogd, want een weggegooid item is
 * anders precies de verdwenen content waar deze codebase al een les over heeft.
 */
function toItem(row: ItemRow): LessonItem | null {
  if (!(row.kind in PAYLOAD_SCHEMAS)) {
    console.error('[lessons] onbekende item-kind in de database', row.id, row.kind);
    return null;
  }
  const kind = row.kind as ItemKind;
  const parsed = PAYLOAD_SCHEMAS[kind].safeParse(row.payload);
  if (!parsed.success) {
    console.error('[lessons] payload valideert niet, item overgeslagen', row.id, kind,
      parsed.error.issues.map(i => i.message).join('; '));
    return null;
  }

  return {
    id: row.id,
    kind,
    sort_order: row.sort_order,
    tier: (row.tier as Tier | null) ?? null,
    payload: parsed.data,
    explanation: row.explanation,
    section_name: row.sections?.name_nl ?? null,
    options: (row.lesson_item_options ?? [])
      .map(o => ({
        id: o.id,
        label: o.label,
        body: o.body,
        image_urls: o.image_urls ?? [],
        image_alt: o.image_alt,
        is_correct: o.is_correct,
        sort_order: o.sort_order,
      }))
      .sort((a, b) => a.sort_order - b.sort_order),
  } as LessonItem;
}

// ---------------------------------------------------------------------------
// De cursus van één onderdeel
// ---------------------------------------------------------------------------

const BLOCK_SELECT = `
  id, letter, name_nl, intro, sort_order,
  lessons ( id, slug, title, minutes, is_free, sort_order, review_status ),
  block_outcomes ( text, lesson_ids, sort_order )
`;

/**
 * De blokken A–E van één (niveau, onderdeel), met hun lessen en de voortgang van deze
 * kandidaat.
 *
 * `userId` mag `null` zijn — dan is elke `progress` null en rendert de cursus als "nog niet
 * begonnen", wat precies goed is voor een gast die de pagina te zien krijgt.
 *
 * Alleen `validated` lessen komen mee. Een `pending` les is langs zijn URL leesbaar (dat is
 * wat reviewen mogelijk maakt) maar staat in geen blok, in geen voortgang en in geen menu.
 */
export async function fetchCourse(
  level: Level | null,
  onderdeel: OnderdeelSlug,
  userId: string | null,
): Promise<LessonBlock[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await levelFilter(
      supabase.from('lesson_blocks').select(BLOCK_SELECT),
      level,
    )
      .eq('onderdeel', onderdeel)
      .order('sort_order');

    if (error || !data) return [];

    type Row = {
      id: number; letter: string; name_nl: string; intro: string | null; sort_order: number;
      lessons: (Omit<LessonSummary, 'progress'> & { review_status: ReviewStatus })[] | null;
      block_outcomes: { text: string; lesson_ids: number[] | null; sort_order: number }[] | null;
    };

    const rows = data as unknown as Row[];

    const lessonIds = rows.flatMap(b =>
      (b.lessons ?? []).filter(l => l.review_status === 'validated').map(l => l.id));

    const progress = userId && lessonIds.length
      ? await fetchLessonProgress(userId, lessonIds)
      : new Map<number, LessonSummary['progress']>();

    return rows.map(b => ({
      id: b.id,
      letter: b.letter,
      name_nl: b.name_nl,
      intro: b.intro,
      sort_order: b.sort_order,
      lessons: (b.lessons ?? [])
        .filter(l => l.review_status === 'validated')
        .sort((x, y) => x.sort_order - y.sort_order)
        .map(l => ({
          id: l.id,
          slug: l.slug,
          title: l.title,
          minutes: l.minutes,
          is_free: l.is_free,
          sort_order: l.sort_order,
          progress: progress.get(l.id) ?? null,
        })),
      outcomes: (b.block_outcomes ?? [])
        .sort((x, y) => x.sort_order - y.sort_order)
        .map(o => ({ text: o.text, lesson_ids: o.lesson_ids ?? [] })),
    }));
  } catch {
    return [];
  }
}

/**
 * Heeft dit (niveau, onderdeel) een cursus?
 *
 * Dit is de publicatiegate van de hele laag, en het is een **feit over de content** in plaats
 * van een vlag. `FEATURES.leren` is één boolean en kan niet zeggen "KNM leeft, A2 leeft, B1
 * nog niet"; een tweede vlag ernaast zou een tweede schakelaar voor hetzelfde ding zijn, en
 * die twee gaan uit elkaar lopen. Dezelfde koppeling als de `robots`-gate voor B1, die op
 * `itemCount !== null` staat: het feit dat de pagina mogelijk maakt, is ook het feit dat hem
 * opent.
 */
export async function hasCourse(level: Level | null, onderdeel: OnderdeelSlug): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data, error } = await levelFilter(
      supabase.from('lesson_blocks').select('id, lessons!inner(id)'),
      level,
    )
      .eq('onderdeel', onderdeel)
      .eq('lessons.review_status', 'validated')
      .limit(1);

    return !error && !!data?.length;
  } catch {
    return false;
  }
}

/** Per (niveau, onderdeel) hoeveel lessen er zijn, voor de portaalchrome. */
export async function fetchLessonCounts(
  userId: string | null,
): Promise<Map<string, { done: number; total: number }>> {
  const out = new Map<string, { done: number; total: number }>();
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('lessons')
      .select('id, lesson_blocks!inner(level, onderdeel)')
      .eq('review_status', 'validated');

    if (!data) return out;

    type Row = { id: number; lesson_blocks: { level: Level | null; onderdeel: OnderdeelSlug } };
    const rows = data as unknown as Row[];

    const doneIds = userId ? await fetchDoneLessonIds(userId) : new Set<number>();

    for (const r of rows) {
      // De sleutel draagt het niveau, ook als het null is. `knm` en `a2:knm` mogen nooit
      // dezelfde bak worden — dat is de `exam_${number}`-botsing in een nieuwe jas.
      const key = moduleKey(r.lesson_blocks.level, r.lesson_blocks.onderdeel);
      const cur = out.get(key) ?? { done: 0, total: 0 };
      cur.total += 1;
      if (doneIds.has(r.id)) cur.done += 1;
      out.set(key, cur);
    }
    return out;
  } catch {
    return out;
  }
}

/** De sleutel waaronder een (niveau, onderdeel) in lesvoortgangkaarten staat. */
export function moduleKey(level: Level | null, onderdeel: OnderdeelSlug): string {
  return level ? `${level}:${onderdeel}` : onderdeel;
}

// ---------------------------------------------------------------------------
// Eén les
// ---------------------------------------------------------------------------

const LESSON_SELECT = `
  id, slug, title, what_you_learn, minutes, is_free, review_status, reviewed_by, reviewed_on,
  lesson_blocks!inner ( id, letter, name_nl, level, onderdeel ),
  lesson_items (
    id, sort_order, kind, tier, payload, explanation,
    sections ( name_nl ),
    lesson_item_options ( id, label, body, image_urls, image_alt, is_correct, sort_order )
  ),
  lesson_concepts ( role, concepts ( id, slug, name_nl ) )
`;

/**
 * Eén les, op slug binnen een (niveau, onderdeel).
 *
 * Op slug en niet op id, want de URL draagt de slug. De (niveau, onderdeel) staan in de
 * filter omdat een slug alleen binnen zijn blok uniek is: zonder die filter zou
 * `/dashboard/b1/lezen/leren/perfectum` de A2-les kunnen opdienen — dezelfde soort fout die
 * `getGuideBySlug` sectie-gescoped maakte, zodat één gids niet onder twee URL's kan bestaan.
 *
 * Geeft ook een `pending` les terug. Dat is de reviewgate: bereikbaar om nagekeken te worden,
 * en door `fetchCourse` uit elk blok gehouden. De pagina zegt het met een banner.
 */
export async function fetchLesson(
  level: Level | null,
  onderdeel: OnderdeelSlug,
  slug: string,
): Promise<LessonDetail | null> {
  try {
    const supabase = await createClient();

    const query = supabase.from('lessons').select(LESSON_SELECT)
      .eq('slug', slug)
      .eq('lesson_blocks.onderdeel', onderdeel);

    const { data, error } = await (level === null
      ? query.is('lesson_blocks.level', null)
      : query.eq('lesson_blocks.level', level)
    ).maybeSingle();

    if (error || !data) return null;

    type Row = {
      id: number; slug: string; title: string; what_you_learn: string | null;
      minutes: number | null; is_free: boolean; review_status: ReviewStatus;
      reviewed_by: string | null; reviewed_on: string | null;
      lesson_blocks: { id: number; letter: string; name_nl: string; level: Level | null; onderdeel: OnderdeelSlug };
      lesson_items: ItemRow[] | null;
      lesson_concepts: { role: 'teaches' | 'reviews'; concepts: { id: number; slug: string; name_nl: string } | null }[] | null;
    };

    const row = data as unknown as Row;

    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      what_you_learn: row.what_you_learn,
      minutes: row.minutes,
      is_free: row.is_free,
      review_status: row.review_status,
      reviewed_by: row.reviewed_by,
      reviewed_on: row.reviewed_on,
      block: row.lesson_blocks,
      items: (row.lesson_items ?? [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(toItem)
        .filter((i): i is LessonItem => i !== null),
      concepts: (row.lesson_concepts ?? [])
        .flatMap(lc => lc.concepts ? [{ ...lc.concepts, role: lc.role }] : []),
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Voortgang
// ---------------------------------------------------------------------------

async function fetchLessonProgress(
  userId: string,
  lessonIds: number[],
): Promise<Map<number, LessonSummary['progress']>> {
  const out = new Map<number, LessonSummary['progress']>();
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('user_lesson_progress')
      .select('lesson_id, state, items_done, items_total')
      .eq('user_id', userId)
      .in('lesson_id', lessonIds);

    for (const r of data ?? []) {
      out.set(r.lesson_id, {
        state: r.state as 'started' | 'done',
        items_done: r.items_done,
        items_total: r.items_total,
      });
    }
    return out;
  } catch {
    return out;
  }
}

async function fetchDoneLessonIds(userId: string): Promise<Set<number>> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('user_lesson_progress')
      .select('lesson_id')
      .eq('user_id', userId)
      .eq('state', 'done');
    return new Set((data ?? []).map(r => r.lesson_id));
  } catch {
    return new Set();
  }
}

/**
 * De woorden waar de `woordenlijst`-items van deze les naar verwijzen.
 *
 * Het item draagt alleen `word_ids`; de woorden staan in `lesson_words`, zodat een correctie
 * aan een woord op één plek landt in plaats van in elke les die het gebruikt. Deze functie
 * haalt ze op voor alle woordenlijst-items van één les in één query.
 *
 * Geeft een lege map als er geen woordenlijst in de les zit — dan is er ook geen query.
 */
export async function fetchLessonWords(items: LessonItem[]): Promise<Map<number, LessonWordRow[]>> {
  const out = new Map<number, LessonWordRow[]>();

  const ids = items
    .filter(i => i.kind === 'woordenlijst')
    .flatMap(i => (i.payload as { word_ids?: number[] }).word_ids ?? []);
  if (!ids.length) return out;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('lesson_words')
      .select('id, dutch, article, plural, frame, meaning_nl, example, usage, sort_order')
      .in('id', ids)
      .order('sort_order');

    const byId = new Map((data ?? []).map(w => [w.id, w as LessonWordRow]));
    for (const item of items) {
      if (item.kind !== 'woordenlijst') continue;
      const wanted = (item.payload as { word_ids?: number[] }).word_ids ?? [];
      out.set(item.id, wanted.map(id => byId.get(id)).filter((w): w is LessonWordRow => !!w));
    }
    return out;
  } catch {
    return out;
  }
}

export type LessonWordRow = {
  id: number;
  dutch: string;
  article: string | null;
  plural: string | null;
  frame: string | null;
  meaning_nl: string;
  example: string | null;
  usage: 'receptief' | 'productief';
  sort_order: number;
};

/** De woorden van één (niveau, onderdeel), voor de woordenlijstpagina van blok A. */
export async function fetchWordsByTheme(
  level: Level,
  onderdeel: OnderdeelSlug,
): Promise<Map<string, LessonWordRow[]>> {
  const out = new Map<string, LessonWordRow[]>();
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('lesson_words')
      .select('id, theme, dutch, article, plural, frame, meaning_nl, example, usage, sort_order')
      .eq('level', level)
      .eq('onderdeel', onderdeel)
      .order('sort_order');

    for (const w of (data ?? []) as (LessonWordRow & { theme: string })[]) {
      const list = out.get(w.theme) ?? [];
      list.push(w);
      out.set(w.theme, list);
    }
    return out;
  } catch {
    return out;
  }
}

// ---------------------------------------------------------------------------
// /admin/lessen
// ---------------------------------------------------------------------------

export type AdminLessonRow = {
  id: number;
  slug: string;
  title: string;
  minutes: number | null;
  is_free: boolean;
  sort_order: number;
  review_status: ReviewStatus;
  reviewed_by: string | null;
  reviewed_on: string | null;
  itemCount: number;
  exerciseCount: number;
  conceptNames: string[];
};

export type AdminBlock = {
  id: number;
  letter: string;
  name_nl: string;
  sort_order: number;
  lessons: AdminLessonRow[];
};

/**
 * Alle lessen van één (niveau, onderdeel) voor de docent — óók de nog niet nagekeken.
 *
 * Anders dan `fetchCourse`, dat alleen `validated` teruggeeft: dit is precies het scherm waar
 * `pending` het werk ís.
 *
 * **De itemtelling gaat door `fetchAll`.** Een kale `select()` kapt stil op 1.000 rijen, en
 * 558 items voor één onderdeel is met vier onderdelen erbij al over de grens. Dat heeft
 * `/admin/exams` en `/admin/questions` allebei laten liegen over hoeveel content er was — op
 * de schermen waarvan dat de hele functie is.
 */
export async function fetchAdminLessons(
  level: Level | null,
  onderdeel: OnderdeelSlug,
): Promise<AdminBlock[]> {
  try {
    const supabase = await createClient();

    const { data: blocks } = await levelFilter(
      supabase.from('lesson_blocks').select(`
        id, letter, name_nl, sort_order,
        lessons (
          id, slug, title, minutes, is_free, sort_order,
          review_status, reviewed_by, reviewed_on,
          lesson_concepts ( concepts ( name_nl ) )
        )
      `),
      level,
    )
      .eq('onderdeel', onderdeel)
      .order('sort_order');

    if (!blocks) return [];

    type LessonRow = {
      id: number; slug: string; title: string; minutes: number | null; is_free: boolean;
      sort_order: number; review_status: ReviewStatus;
      reviewed_by: string | null; reviewed_on: string | null;
      lesson_concepts: { concepts: { name_nl: string } | null }[] | null;
    };
    type BlockRow = {
      id: number; letter: string; name_nl: string; sort_order: number;
      lessons: LessonRow[] | null;
    };
    const rows = blocks as unknown as BlockRow[];

    const lessonIds = rows.flatMap(b => (b.lessons ?? []).map(l => l.id));
    const counts = await fetchItemCounts(lessonIds);

    return rows.map(b => ({
      id: b.id,
      letter: b.letter,
      name_nl: b.name_nl,
      sort_order: b.sort_order,
      lessons: (b.lessons ?? [])
        .sort((x, y) => x.sort_order - y.sort_order)
        .map(l => ({
          id: l.id,
          slug: l.slug,
          title: l.title,
          minutes: l.minutes,
          is_free: l.is_free,
          sort_order: l.sort_order,
          review_status: l.review_status,
          reviewed_by: l.reviewed_by,
          reviewed_on: l.reviewed_on,
          itemCount: counts.get(l.id)?.total ?? 0,
          exerciseCount: counts.get(l.id)?.exercises ?? 0,
          conceptNames: (l.lesson_concepts ?? [])
            .flatMap(lc => lc.concepts ? [lc.concepts.name_nl] : []),
        })),
    }));
  } catch {
    return [];
  }
}

async function fetchItemCounts(
  lessonIds: number[],
): Promise<Map<number, { total: number; exercises: number }>> {
  const out = new Map<number, { total: number; exercises: number }>();
  if (!lessonIds.length) return out;

  try {
    const supabase = await createClient();
    // Via `fetchAll`, niet via één `select()`: zie de doc-comment hierboven.
    const rows = await fetchAll<{ lesson_id: number; tier: number | null }>(
      (from, to) => supabase
        .from('lesson_items')
        .select('lesson_id, tier')
        .in('lesson_id', lessonIds)
        .range(from, to),
    );
    for (const r of rows) {
      const cur = out.get(r.lesson_id) ?? { total: 0, exercises: 0 };
      cur.total += 1;
      if (r.tier !== null) cur.exercises += 1;
      out.set(r.lesson_id, cur);
    }
    return out;
  } catch {
    return out;
  }
}
