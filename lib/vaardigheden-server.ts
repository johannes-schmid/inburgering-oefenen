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
import { fetchCriterionSeries } from './criterion-progress';
import { fetchTeachersForCourse } from './lessons/concepts-server';
import { lessonPath } from './lessons/lessons';
import { latestPerQuestion, rollupVaardigheden, scoreToPct, sortWeakestFirst, type TaggedAnswer, type WeaknessRow } from './vaardigheden';
import { vaardighedenFor } from '@/data/vaardigheden';
import { isSkillSlug, type Level, type OnderdeelSlug } from '@/data/skills';
import { MAX_CRITERION_SCORE } from './rubrics';

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
 * `null` betekent: hier valt niets te tonen. Dat is iets anders dan een lege lijst rijen, en de
 * pagina hoeft het onderscheid niet te kennen — beide gevallen komen als `null` terug.
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
    return rows.length ? { source: 'rubric', rows, conceptStats: new Map() } : null;
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

async function mcqRows(userId: string, level: Level, onderdeel: OnderdeelSlug): Promise<McqResult> {
  const vaardigheden = vaardighedenFor(onderdeel);
  if (vaardigheden.length === 0) return EMPTY;

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

    if (error || !data || data.length === 0) return EMPTY;

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
    return out.some(r => r.pct !== null) ? { rows: out, conceptStats } : EMPTY;
  } catch {
    return EMPTY;
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
