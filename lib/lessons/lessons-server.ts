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
import { RULES_HOME } from './taalregels';
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

    /**
     * Twee onderdelen, in deze volgorde: dit onderdeel, en anders de gedeelde regelbibliotheek.
     *
     * Een taalregel staat één keer in de database — in blok B van Lezen (`RULES_HOME`) — maar
     * hij hoort bij stap 2 van álle vier de cursussen, en de kandidaat opent hem vanuit de
     * cursus waar hij in zit. Zonder deze val-terug zou `/luisteren/leren/b1-hoofdzin-woordorde`
     * een 404 zijn, en dan moest de kaart in Luisteren naar een ánder scherm wijzen dan de
     * kaarten ernaast. Eén les, één voortgang, vier plekken waar je hem opent.
     *
     * De poort blijft de cursus waar je hem vandaan opent: de aanroeper controleert
     * `ownsModule(meta, level, onderdeel)`, dus wie Luisteren heeft gekocht opent de regel via
     * Luisteren en niet via een onderdeel dat hij niet heeft.
     */
    const onderdelen: OnderdeelSlug[] = onderdeel === RULES_HOME.onderdeel
      ? [onderdeel]
      : [onderdeel, RULES_HOME.onderdeel];

    let row: unknown = null;
    for (const o of onderdelen) {
      const query = supabase.from('lessons').select(LESSON_SELECT)
        .eq('slug', slug)
        .eq('lesson_blocks.onderdeel', o);

      const { data, error } = await (level === null
        ? query.is('lesson_blocks.level', null)
        : query.eq('lesson_blocks.level', level)
      ).maybeSingle();

      if (!error && data) { row = data; break; }
    }
    if (!row) return null;

    type Row = {
      id: number; slug: string; title: string; what_you_learn: string | null;
      minutes: number | null; is_free: boolean; review_status: ReviewStatus;
      reviewed_by: string | null; reviewed_on: string | null;
      lesson_blocks: { id: number; letter: string; name_nl: string; level: Level | null; onderdeel: OnderdeelSlug };
      lesson_items: ItemRow[] | null;
      lesson_concepts: { role: 'teaches' | 'reviews'; concepts: { id: number; slug: string; name_nl: string } | null }[] | null;
    };

    const lesson = row as Row;

    return {
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      what_you_learn: lesson.what_you_learn,
      minutes: lesson.minutes,
      is_free: lesson.is_free,
      review_status: lesson.review_status,
      reviewed_by: lesson.reviewed_by,
      reviewed_on: lesson.reviewed_on,
      block: lesson.lesson_blocks,
      items: (lesson.lesson_items ?? [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(toItem)
        .filter((i): i is LessonItem => i !== null),
      concepts: (lesson.lesson_concepts ?? [])
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
  checked_by: string | null;
  checked_on: string | null;
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
          review_status, reviewed_by, reviewed_on, checked_by, checked_on,
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
      checked_by: string | null; checked_on: string | null;
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
          checked_by: l.checked_by,
          checked_on: l.checked_on,
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

// ---------------------------------------------------------------------------
// /admin/lessen/[id] — één les, om te bewerken
// ---------------------------------------------------------------------------

export type AdminLessonDetail = {
  id: number;
  slug: string;
  title: string;
  what_you_learn: string | null;
  minutes: number | null;
  is_free: boolean;
  sort_order: number;
  review_status: ReviewStatus;
  reviewed_by: string | null;
  reviewed_on: string | null;
  checked_by: string | null;
  checked_on: string | null;
  block: { id: number; letter: string; name_nl: string; level: Level | null; onderdeel: OnderdeelSlug };
  items: LessonItem[];
  concepts: { name_nl: string; role: 'teaches' | 'reviews' }[];
};

/**
 * Eén les op id, met alles wat de editor nodig heeft — óók een `pending` les.
 *
 * **Op id en niet op slug**, anders dan `fetchLesson`. De editor komt uit de lijst in
 * `/admin/lessen` en die heeft de id al; een slug zou hier bovendien het (niveau, onderdeel) mee
 * moeten dragen om uniek te zijn, en dat is drie params in een URL die één rij bedoelt.
 *
 * Geeft `null` in plaats van te gooien, zodat de pagina `notFound()` kan doen op een id die niet
 * bestaat in plaats van een 500 te tonen op een getypte URL.
 */
export async function fetchAdminLesson(id: number): Promise<AdminLessonDetail | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('lessons')
      .select(`
        id, slug, title, what_you_learn, minutes, is_free, sort_order,
        review_status, reviewed_by, reviewed_on, checked_by, checked_on,
        lesson_blocks!inner ( id, letter, name_nl, level, onderdeel ),
        lesson_items (
          id, sort_order, kind, tier, payload, explanation,
          sections ( name_nl ),
          lesson_item_options ( id, label, body, image_urls, image_alt, is_correct, sort_order )
        ),
        lesson_concepts ( role, concepts ( name_nl ) )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;

    type Row = Omit<AdminLessonDetail, 'block' | 'items' | 'concepts'> & {
      lesson_blocks: AdminLessonDetail['block'];
      lesson_items: ItemRow[] | null;
      lesson_concepts: { role: 'teaches' | 'reviews'; concepts: { name_nl: string } | null }[] | null;
    };
    const row = data as unknown as Row;

    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      what_you_learn: row.what_you_learn,
      minutes: row.minutes,
      is_free: row.is_free,
      sort_order: row.sort_order,
      review_status: row.review_status,
      reviewed_by: row.reviewed_by,
      reviewed_on: row.reviewed_on,
      checked_by: row.checked_by,
      checked_on: row.checked_on,
      block: row.lesson_blocks,
      // `toItem` slaat een item met een kapotte payload over en logt dat. Dat is hier één regel
      // erger dan in het portaal: de docent zou een item kwijt zijn zónder het te zien. De
      // editor toont daarom het aantal overgeslagen items apart — zie `skipped` hieronder.
      items: (row.lesson_items ?? [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(toItem)
        .filter((i): i is LessonItem => i !== null),
      concepts: (row.lesson_concepts ?? [])
        .flatMap(lc => lc.concepts ? [{ name_nl: lc.concepts.name_nl, role: lc.role }] : []),
    };
  } catch {
    return null;
  }
}

/**
 * Hoeveel items van deze les de editor niet kan tonen omdat hun payload niet valideert.
 *
 * Een aparte, kale telling. `fetchAdminLesson` gooit een kapot item stil weg (dat is wat één
 * kapotte rij een hele les niet onbereikbaar laat maken), maar in een editor is stil weggooien
 * precies verkeerd: opslaan zou het item dan definitief verwijderen zonder dat iemand het heeft
 * gezien. Het scherm zet er een waarschuwing bij.
 */
export async function countBrokenItems(lessonId: number, shown: number): Promise<number> {
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from('lesson_items')
      .select('id', { count: 'exact', head: true })
      .eq('lesson_id', lessonId);
    return Math.max(0, (count ?? shown) - shown);
  } catch {
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Waar je gebleven was
// ---------------------------------------------------------------------------

export type Resume = {
  level: Level | null;
  onderdeel: OnderdeelSlug;
  lessonId: number;
  lessonSlug: string;
  lessonTitle: string;
};

/**
 * De les waar de kandidaat het laatst aan werkte — de "ga verder"-regel op het overzicht.
 *
 * De modulenaam zit er bewust *niet* in: die komt uit `sporen-server`, en dat bestand importeert
 * dit bestand al. De aanroeper zoekt hem op met `findModule` als hij hem nodig heeft.
 *
 * De laatst aangeraakte rij in `user_lesson_progress`, ook een afgeronde: wie zojuist een les
 * afmaakte wil de vólgende les van diezelfde module, en die kent de modulekolom. Eén rij en
 * geen sortering in de code, want `order(...).limit(1)` doet dat in Postgres.
 *
 * Faalt stil naar `null`: dit is één regel op een overzichtsscherm, en een portaal dat niet
 * laadt omdat de "ga verder"-regel niets kon vinden is de verkeerde ruil.
 */
export async function fetchResume(userId: string): Promise<Resume | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('user_lesson_progress')
      .select('lesson_id, lessons!inner(slug, title, lesson_blocks!inner(level, onderdeel))')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1);

    const row = (data ?? [])[0] as unknown as {
      lesson_id: number;
      lessons: {
        slug: string; title: string;
        lesson_blocks: { level: Level | null; onderdeel: OnderdeelSlug };
      };
    } | undefined;
    if (!row) return null;

    return {
      level: row.lessons.lesson_blocks.level,
      onderdeel: row.lessons.lesson_blocks.onderdeel,
      lessonId: row.lesson_id,
      lessonSlug: row.lessons.slug,
      lessonTitle: row.lessons.title,
    };
  } catch {
    return null;
  }
}

/**
 * De eerstvolgende les per track — "volgende: …" op het overzicht.
 *
 * Eén query over alle nagekeken lessen plus de set afgeronde id's, en dan per track de eerste
 * die nog niet af is, in de volgorde die de docent gaf (`lesson_blocks.sort_order`, dan
 * `lessons.sort_order`). Per *track* en niet per onderdeel, want dat is de rij op het overzicht:
 * een niveau is één regel, en KNM ook.
 *
 * De sleutel is `a2` / `b1` / `knm` — het niveau, of het onderdeel als er geen niveau is.
 */
export async function fetchNextLessons(
  userId: string | null,
): Promise<Map<string, { slug: string; title: string; minutes: number | null; onderdeel: OnderdeelSlug }>> {
  const out = new Map<string, { slug: string; title: string; minutes: number | null; onderdeel: OnderdeelSlug }>();
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('lessons')
      .select('id, slug, title, minutes, sort_order, lesson_blocks!inner(level, onderdeel, sort_order)')
      .eq('review_status', 'validated')
      .order('sort_order', { ascending: true });

    if (!data) return out;
    type Row = {
      id: number; slug: string; title: string; minutes: number | null; sort_order: number;
      lesson_blocks: { level: Level | null; onderdeel: OnderdeelSlug; sort_order: number };
    };
    const rows = (data as unknown as Row[]).slice().sort(
      (a, b) => a.lesson_blocks.sort_order - b.lesson_blocks.sort_order || a.sort_order - b.sort_order,
    );

    const doneIds = userId ? await fetchDoneLessonIds(userId) : new Set<number>();

    for (const r of rows) {
      const key = r.lesson_blocks.level ?? r.lesson_blocks.onderdeel;
      if (out.has(key) || doneIds.has(r.id)) continue;
      out.set(key, {
        slug: r.slug,
        title: r.title,
        minutes: r.minutes,
        onderdeel: r.lesson_blocks.onderdeel,
      });
    }
    return out;
  } catch {
    return out;
  }
}

/**
 * Hoeveel lessen deze week zijn afgerond, en op welke dagen.
 *
 * Zeven vakjes, oudste eerst, met vandaag als laatste — dat is wat een reeks zichtbaar maakt.
 * Alleen `state = 'done'` telt, en alleen met een `completed_at`: een rij zonder die datum is
 * van vóór de kolom en hoort niet stil op vandaag te landen.
 */
export async function fetchWeek(
  userId: string | null,
): Promise<{ total: number; days: number[] }> {
  const days = [0, 0, 0, 0, 0, 0, 0];
  if (!userId) return { total: 0, days };
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6);

    const supabase = await createClient();
    const { data } = await supabase
      .from('user_lesson_progress')
      .select('completed_at')
      .eq('user_id', userId)
      .eq('state', 'done')
      .gte('completed_at', start.toISOString());

    for (const r of data ?? []) {
      if (!r.completed_at) continue;
      const d = new Date(r.completed_at as string);
      d.setHours(0, 0, 0, 0);
      const i = Math.round((d.getTime() - start.getTime()) / 86_400_000);
      if (i >= 0 && i < 7) days[i] += 1;
    }
    return { total: days.reduce((a, b) => a + b, 0), days };
  } catch {
    return { total: 0, days };
  }
}
