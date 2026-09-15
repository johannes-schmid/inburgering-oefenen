/**
 * De zwaktekaart ophalen: één rij per vaardigheid, voor elk onderdeel.
 *
 * ── HET LEEST, HET SCHRIJFT NIET ─────────────────────────────────────────────
 * `user_concept_mastery` blijft het signaal van de lesoefeningen — `/api/lesson-answer` is de
 * enige schrijver en dat blijft zo. Deze kaart rékent bij het lezen, uit `user_question_results`
 * en `question_concepts`. Dat is met opzet en het is de belangrijkste keuze in dit bestand:
 *
 * - er hoeft geen schrijfpad bij in de speler, die de resultaten vanuit de browser wegschrijft
 *   (en een client die zijn eigen beheersing mag schrijven mag hem ook verzinnen);
 * - de cijfers werken **met terugwerkende kracht**. Zodra een examen getagd wordt, klopt de kaart
 *   ook voor de kandidaat die dat examen vorige maand maakte. Bij een bijgehouden teller zou die
 *   geschiedenis voorgoed weg zijn, en het taggen loopt achter op het maken.
 *
 * ── TWEE BRONNEN, ÉÉN RIJVORM ────────────────────────────────────────────────
 * Lezen en Luisteren komen uit de tags, Schrijven en Spreken uit de rubriekcriteria die er al
 * zijn (`fetchCriterionSeries`). KNM heeft geen concepten — zijn as is het thema — en krijgt hier
 * dus niets. Zie `data/vaardigheden.ts` voor waarom dat geen gat is.
 *
 * Een leeg antwoord is de eerlijke uitkomst en geen fout: een onderdeel waarvan de items nog niet
 * getagd zijn kan niets zeggen, en de kaart rendert dan niets in plaats van een kop met lege
 * balken eronder.
 */

import { createClient } from './supabase/server';
import { fetchCriterionSeries, labelForCriterion } from './criterion-progress';
import { draftCriteria } from './rubric-templates';
import { fetchTeachersForCourse } from './lessons/concepts-server';
import { lessonPath } from './lessons/lessons';
import { MIN_ANSWERS, latestPerQuestion, rollupVaardigheden, scoreToPct, sortWeakestFirst, type TaggedAnswer, type WeaknessRow } from './vaardigheden';
import { vaardighedenFor } from '@/data/vaardigheden';
import { KNM_SLUG, KNM_THEMES, isSkillSlug, type Level, type OnderdeelSlug } from '@/data/skills';
import { MAX_CRITERION_SCORE, categoriesForSkill } from './rubrics';

export type { WeaknessRow } from './vaardigheden';

/** Wat de kaart in haar kop zet: waar deze rijen vandaan komen. */
export type WeaknessSource = 'mcq' | 'rubric';

/** Wat de examens per concept hebben laten zien: het bewijs achter de balken. */
export type ConceptExamStat = { seen: number; correct: number };

export type SkillWeakness = {
  source: WeaknessSource;
  rows: WeaknessRow[];
  /**
   * Per concept-id hoeveel getagde examenvragen erover gingen en hoeveel er goed waren.
   *
   * Dit is dezelfde telling die de balken voedt, maar dan ongegroepeerd — het paneel naast de
   * slaagkansmeter toont concepten en niet vaardigheden, en het hoort hetzelfde bewijs te
   * gebruiken als de kaart eronder. Twee lijsten op één scherm die uit verschillende bronnen
   * komen is precies de fout van 10-09.
   */
  conceptStats: Map<number, ConceptExamStat>;
};

/**
 * De zwaktekaart van één (niveau, onderdeel) voor één kandidaat.
 *
 * `null` betekent: hier valt niets te tonen — en sinds 15-09 is dat een stuk zeldzamer. Waar de
 * *koppen* bekend zijn zonder dat er één examen gemaakt is (Lezen en Luisteren hebben hun
 * vaardigheden in `data/vaardigheden.ts`, KNM zijn zeven thema's) komt de lijst terug met alle
 * rijen op `pct: null`: de naam, de stippellijn en een streepje. Dat is de lege staat die de
 * eigenaar vroeg, en hij is eerlijker dan een verdwenen paneel — hij laat zien *waarop* je
 * straks beoordeeld wordt.
 *
 * `null` blijft over voor de twee gevallen waarin er geen koppen zijn: een gast, en Schrijven en
 * Spreken vóór hun eerste beoordeling. Die twee lezen hun rijen uit de rubriek, en die staat in
 * `rubrics` — een tabel zonder SELECT-policy buiten admin (§6, invariant 9). Een skeletlijst zou
 * daar dus verzonnen moeten worden.
 */
export async function fetchSkillWeakness(
  userId: string | null,
  level: Level,
  onderdeel: OnderdeelSlug,
): Promise<SkillWeakness | null> {
  if (!userId) return null;

  if (onderdeel === 'schrijven' || onderdeel === 'spreken') {
    const rows = await rubricRows(userId, onderdeel);
    // `open_task_concepts` wordt nog door niets gevuld, dus hier is er geen conceptbewijs uit de
    // examens. Het paneel valt dan terug op de beheersing uit de lessen — zie `page.tsx`.
    return {
      source: 'rubric',
      rows: rows.length ? rows : skeletonCriterionRows(onderdeel),
      conceptStats: new Map(),
    };
  }

  const { rows, conceptStats } = await mcqRows(userId, level, onderdeel);
  return rows.length ? { source: 'mcq', rows, conceptStats } : null;
}

// ---------------------------------------------------------------------------
// Lezen en Luisteren: de tags
// ---------------------------------------------------------------------------

type ResultRow = {
  question_id: number;
  was_correct: boolean;
  answered_at: string;
  question: {
    exam: { number: number } | null;
    tags: { concept: { id: number; slug: string; name_nl: string } | null }[];
  } | null;
};

type McqResult = { rows: WeaknessRow[]; conceptStats: Map<number, ConceptExamStat> };
const EMPTY: McqResult = { rows: [], conceptStats: new Map() };

/**
 * De lege staat van een uitsplitsing: alle koppen, geen cijfers.
 *
 * Eén rij per vaardigheid of thema met `pct: null`, wat `SkillWeakness` als stippellijn met een
 * streepje tekent — dezelfde vorm die een kop krijgt waarvan er nog te weinig antwoorden zijn. De
 * eigenaar vroeg hierom (15-09): het paneel helemaal weglaten tot het eerste examen verbergt
 * juist waarop de kandidaat straks beoordeeld wordt, en de eerste keer dat hij het scherm opent
 * is precies wanneer hij dat wil weten.
 *
 * Nooit een 0: dat is een oordeel over iets wat niet gemeten is. Zelfde regel als een NULL-telling
 * in `data/skills.ts`.
 */
function skeletonRows(items: { key: string; label: string; one_liner: string | null }[]): WeaknessRow[] {
  return items.map(i => ({
    key: i.key,
    label: i.label,
    one_liner: i.one_liner,
    pct: null,
    n: 0,
    detail: 'Nog geen oefenexamen gemaakt',
    score: null,
    delta: null,
    concepts: [],
  }));
}

async function mcqRows(userId: string, level: Level, onderdeel: OnderdeelSlug): Promise<McqResult> {
  const vaardigheden = vaardighedenFor(onderdeel);
  if (vaardigheden.length === 0) return EMPTY;

  /* Waar dit onderdeel op beoordeeld wordt, ook als er nog niets gemeten is. Zie `skeletonRows`. */
  const blank: McqResult = {
    rows: skeletonRows(vaardigheden.map(v => ({ key: v.slug, label: v.name_nl, one_liner: v.one_liner }))),
    conceptStats: new Map(),
  };

  try {
    const supabase = await createClient();

    /*
     * Eén query voor het hele scherm. De join gaat over `questions` naar het examen — zo vallen
     * de antwoorden van de gratis taster (waar `attempt_id` NULL is en het examen van een ander
     * onderdeel kan zijn) er vanzelf buiten, zonder een tweede filter dat kan verschuiven.
     *
     * `!inner` op elke schakel behalve `tags`: een vraag zonder tags hoort wél op te komen, want
     * `rollupVaardigheden` moet kunnen zien dat hij bestond en hem dan overslaan.
     */
    const { data, error } = await supabase
      .from('user_question_results')
      .select(`
        question_id, was_correct, answered_at,
        question:questions!inner (
          exam:exams!inner ( number, level, skill ),
          tags:question_concepts ( concept:concepts!inner ( id, slug, name_nl, review_status ) )
        )
      `)
      .eq('user_id', userId)
      .eq('question.exam.level', level)
      .eq('question.exam.skill', onderdeel)
      .eq('question.tags.concept.review_status', 'validated')
      .order('answered_at', { ascending: true });

    if (error || !data || data.length === 0) return blank;

    const rows = data as unknown as ResultRow[];
    const answers: TaggedAnswer[] = [];
    const conceptNames = new Map<string, string>();
    const conceptIds = new Map<string, number>();
    const examNumbers = new Set<number>();

    for (const r of rows) {
      const tags = r.question?.tags ?? [];
      for (const t of tags) {
        if (!t.concept) continue;
        conceptNames.set(t.concept.slug, t.concept.name_nl);
        conceptIds.set(t.concept.slug, t.concept.id);
      }
      if (r.question?.exam?.number) examNumbers.add(r.question.exam.number);
      answers.push({
        questionId: r.question_id,
        wasCorrect: r.was_correct,
        answeredAt: r.answered_at,
        conceptSlugs: tags.map(t => t.concept?.slug).filter((s): s is string => Boolean(s)),
      });
    }

    // De bestemming per concept: de les die het in dít onderdeel uitlegt. Eén query voor de hele
    // cursus, zoals `fetchTeachersForCourse` er precies voor bedoeld is.
    const lessons = new Map<string, { href: string; title: string | null }>();
    if (conceptIds.size && isSkillSlug(onderdeel)) {
      const teachers = await fetchTeachersForCourse(level, onderdeel, [...conceptIds.values()]);
      for (const [slug, id] of conceptIds) {
        const lesson = teachers.get(id);
        if (lesson) lessons.set(slug, { href: lessonPath(level, onderdeel, lesson.slug), title: lesson.title });
      }
    }

    /*
     * Dezelfde antwoorden, maar geteld per concept in plaats van per vaardigheid — en over
     * dezelfde `latestPerQuestion`, zodat een vraag die je de derde keer goed deed hier net zo
     * telt als in de balken.
     */
    const conceptStats = new Map<number, ConceptExamStat>();
    for (const a of latestPerQuestion(answers).values()) {
      for (const slug of a.conceptSlugs) {
        const id = conceptIds.get(slug);
        if (id === undefined) continue;
        const cur = conceptStats.get(id) ?? { seen: 0, correct: 0 };
        cur.seen += 1;
        if (a.wasCorrect) cur.correct += 1;
        conceptStats.set(id, cur);
      }
    }

    const out = rollupVaardigheden(vaardigheden, answers, conceptNames, lessons, examNumbers.size);

    // Alles onder de drempel betekent dat er wel geantwoord is maar nergens genoeg: dan zegt de
    // kaart niets in plaats van vijf keer "nog te weinig gegevens".
    /* Overal te weinig antwoorden leest hetzelfde als nog niets gemaakt: dezelfde lege staat,
       met de koppen die er wél zijn. */
    return out.some(r => r.pct !== null) ? { rows: out, conceptStats } : blank;
  } catch {
    return blank;
  }
}

// ---------------------------------------------------------------------------
// Schrijven en Spreken: de rubriek
// ---------------------------------------------------------------------------

/**
 * De bestaande criteriumreeksen, in de vorm van deze kaart.
 *
 * Een dunne vertaling en geen tweede berekening: `fetchCriterionSeries` bepaalt al welk cijfer
 * geldt (die van de docent boven die van het model) en hoe de sessies worden gegroepeerd. Dat
 * hier overdoen zou twee getallen voor hetzelfde criterium opleveren.
 *
 * De balk vult op `score / 3`, maar het bijschrift noemt de score en niet het percentage: de
 * ankerteksten van een rubriek zijn geen percentages, en "70%" zou suggereren dat ze dat wel zijn.
 */
async function rubricRows(userId: string, skill: 'schrijven' | 'spreken'): Promise<WeaknessRow[]> {
  const series = await fetchCriterionSeries(userId, skill);

  return sortWeakestFirst(series.map(s => {
    const delta = s.points.length < 2 ? null : Math.round((s.latest - s.first) * 100) / 100;
    const sittings = s.points.length;
    return {
      key: s.key,
      label: s.label,
      one_liner: null,
      pct: scoreToPct(s.latest),
      n: s.n,
      detail: `${s.latest.toFixed(1)} / ${MAX_CRITERION_SCORE} · over ${sittings} ${sittings === 1 ? 'beoordeelde sessie' : 'beoordeelde sessies'}`,
      score: s.latest,
      delta,
      concepts: [],
    };
  }));
}

/**
 * De lege staat van Schrijven en Spreken: de criteria waarop straks beoordeeld wordt.
 *
 * **Waarom dit niet uit `rubrics` komt.** Die tabel heeft buiten admin geen SELECT-policy, want
 * de criteria dragen de 0–3-ankers en die zijn een nakijksleutel (§6, invariant 9). Een query
 * vanaf een kandidaatpagina zou niet falen maar niets teruggeven, en dan stond hier stil een lege
 * lijst. Daarom komen de sleutels uit `draftCriteria` — hetzelfde sjabloon waarmee de rubrieken
 * van dit onderdeel zijn aangemaakt — en de namen uit `labelForCriterion`, precies zoals de
 * *echte* rijen ze maken zodra er beoordeeld is. Zo staat er na de eerste beoordeling geen andere
 * naam voor hetzelfde criterium.
 *
 * Alleen de sleutels, nooit de ankers of de omschrijvingen: dit is een inhoudsopgave van wat
 * geteld gaat worden, geen nakijkmodel dat de kandidaat vooraf mag lezen.
 *
 * De verzameling is de unie over de opgavesoorten van dit onderdeel, in de volgorde waarin ze
 * voorkomen — een opgave telt maar een deel ervan, en welk deel hangt af van de soort opgave die
 * in het examen zit. Heeft de docent een criterium weggelaten, dan valt de rij weg zodra er een
 * echte beoordeling is; hij verzint nooit een cijfer, alleen een naam.
 */
function skeletonCriterionRows(skill: 'schrijven' | 'spreken'): WeaknessRow[] {
  const keys: string[] = [];
  for (const category of categoriesForSkill(skill)) {
    for (const c of draftCriteria(category)) {
      if (!keys.includes(c.key)) keys.push(c.key);
    }
  }
  return skeletonRows(keys.map(k => ({ key: k, label: labelForCriterion(k), one_liner: null })));
}

// ---------------------------------------------------------------------------
// KNM: de zeven thema's
// ---------------------------------------------------------------------------

/**
 * De uitsplitsing van KNM, per thema in plaats van per vaardigheid.
 *
 * KNM heeft geen concepten — `fetchSkillWeakness` geeft daar dus niets voor terug, en dat blijft
 * zo. Zijn as is het **thema**: `sections.theme_id` groepeert de 43 subonderwerpen onder de zeven
 * officiële thema's, en een KNM-vraag draagt zijn subonderwerp zelf (`questions.section_id`, want
 * er is geen stimulus om het aan te hangen). Zie `20260824120000_knm_onderdeel.sql`.
 *
 * Dezelfde rijvorm als de taalonderdelen, zodat `components/exam/SkillWeakness` hem ongewijzigd
 * tekent: één lijst met balken op één scherm, en niet een tweede tekening die hetzelfde zegt.
 *
 * Dezelfde twee regels als daar, ook:
 *
 * - **`latestPerQuestion`**, dus een vraag die je de derde keer goed deed telt één keer en telt
 *   goed. Anders straft het opnieuw maken van een examen de kandidaat die juist oefent.
 * - **`MIN_ANSWERS` per thema**, en daaronder `pct: null`. Twee beantwoorde vragen van een thema
 *   zijn een steekproef van twee, en een balk op 0% leest als een oordeel.
 *
 * **Zonder cijfers komt de lijst er wél**, met alle zeven thema's op een streepje (15-09,
 * eigenaar): geen gemaakt examen en overal te weinig antwoorden geven dezelfde lege staat als bij
 * de taalonderdelen. Alleen een gast krijgt `null` — die heeft geen antwoorden om te tonen en
 * ziet het paneel niet.
 */
export async function fetchKnmThemeWeakness(userId: string | null): Promise<SkillWeakness | null> {
  if (!userId) return null;

  /* De zeven koppen, ook als er nog niets gemeten is — en ook als de query faalt. Zie
     `skeletonRows`. */
  const blank: SkillWeakness = {
    source: 'mcq',
    rows: skeletonRows(KNM_THEMES.map(th => ({ key: `thema-${th.id}`, label: th.title, one_liner: null }))),
    conceptStats: new Map(),
  };

  try {
    const supabase = await createClient();

    /*
     * `!inner` op de hele keten: een antwoord telt alleen mee als de vraag bij een KNM-examen
     * hoort én een subonderwerp met een thema draagt. De join over het examen houdt de gratis
     * taster erbuiten, net als in `mcqRows`.
     */
    const { data, error } = await supabase
      .from('user_question_results')
      .select(`
        question_id, was_correct, answered_at,
        question:questions!inner (
          exam:exams!inner ( number, skill ),
          section:sections!inner ( theme_id )
        )
      `)
      .eq('user_id', userId)
      .eq('question.exam.skill', KNM_SLUG)
      .order('answered_at', { ascending: true });

    if (error || !data || data.length === 0) return blank;

    type KnmRow = {
      question_id: number;
      was_correct: boolean;
      answered_at: string;
      question: { exam: { number: number } | null; section: { theme_id: number | null } | null } | null;
    };

    /* Het thema van een vraag draagt hier de rol die de conceptslugs bij de taalonderdelen
       spelen, zodat `latestPerQuestion` er ongewijzigd overheen kan. */
    const answers: TaggedAnswer[] = [];
    const examNumbers = new Set<number>();
    for (const r of data as unknown as KnmRow[]) {
      const themeId = r.question?.section?.theme_id;
      if (themeId == null) continue;
      if (r.question?.exam?.number) examNumbers.add(r.question.exam.number);
      answers.push({
        questionId: r.question_id,
        wasCorrect: r.was_correct,
        answeredAt: r.answered_at,
        conceptSlugs: [String(themeId)],
      });
    }
    if (answers.length === 0) return blank;

    const latest = [...latestPerQuestion(answers).values()];
    const examCount = examNumbers.size;

    const rows: WeaknessRow[] = KNM_THEMES.map(thema => {
      const mine = String(thema.id);
      let seen = 0;
      let correct = 0;
      for (const a of latest) {
        if (!a.conceptSlugs.includes(mine)) continue;
        seen += 1;
        if (a.wasCorrect) correct += 1;
      }
      const enough = seen >= MIN_ANSWERS;
      return {
        key: `thema-${thema.id}`,
        label: thema.title,
        one_liner: null,
        pct: enough ? Math.round((correct / seen) * 100) : null,
        n: seen,
        detail: enough
          ? `${correct} van ${seen} goed${examCount > 0 ? ` · over ${examCount} ${examCount === 1 ? 'examen' : 'examens'}` : ''}`
          : 'Nog te weinig gegevens',
        score: null,
        delta: null,
        concepts: [],
      } satisfies WeaknessRow;
    });

    // Nergens genoeg antwoorden is hetzelfde als niets te zeggen hebben: dan blijft de kaart leeg
    // in plaats van zeven keer "Nog te weinig gegevens" te tonen.
    return rows.some(r => r.pct !== null)
      ? { source: 'mcq', rows: sortWeakestFirst(rows), conceptStats: new Map() }
      : blank;
  } catch {
    return blank;
  }
}
