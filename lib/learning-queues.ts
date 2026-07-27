// Derives learning queues + study recommendations from the raw per-question
// answer log. Pure and client-computable — no new DB schema required.
//
// NOTE: `answers` must be ordered by answered_at ASCending, so the last row
// seen per question is the latest answer (last-write-wins replay). The
// user_question_results table is append-only; when per-user histories grow
// large, back this with a `latest_user_question_results` DISTINCT-ON view.

export type AnswerRow = { question_id: number; was_correct: boolean; answered_at: string };
export type QuestionLite = { id: number; category: string; section_id: number | null; exam: number | null };
export type SectionLite = { id: number; slug: string; name_nl: string; topic: string; sort_order: number };
export type ExamProgressLite = { number: number; pct: number; passed: boolean };

export type QuestionState = {
  latestCorrect: boolean | null;
  attempts: number;
  wrongCount: number;
  lastAnsweredAt: string | null;
};

export type SectionQueue = {
  sectionId: number;
  slug: string;
  name: string;
  topic: string;
  total: number;
  mistakes: number;
  open: number;
  mastered: number;
  wrongQuestionIds: number[];
  priority: number;
};

export type TopicQueue = { mistakes: number; open: number; mastered: number; total: number; pct: number };

export type Recommendation =
  | { type: 'repeat_mistakes'; questionIds: number[]; topic: string; count: number }
  | { type: 'study_section'; sectionId: number; sectionName: string; topic: string; mistakes: number }
  | { type: 'retake_exam'; examNumber: number; pct: number }
  | { type: 'practice_topic'; topic: string; openCount: number }
  | { type: 'take_exam'; examNumber: number };

export type LearningQueues = {
  byQuestion: Map<number, QuestionState>;
  mistakeQueue: number[];
  openQueue: number[];
  sectionQueues: SectionQueue[];
  topicQueues: Record<string, TopicQueue>;
  recommendations: Recommendation[];
  counts: { mistakes: number; open: number; mastered: number; total: number };
};

const MISTAKE_QUEUE_MIN = 5;
const MISTAKE_PAYLOAD_CAP = 20;
const SECTION_STUDY_MIN = 3;
const PASS_PCT = 70;

export function buildLearningQueues(
  questions: QuestionLite[],
  sections: SectionLite[],
  answers: AnswerRow[],
  opts: { exams?: ExamProgressLite[]; totalExams?: number } = {}
): LearningQueues {
  const { exams = [], totalExams = 10 } = opts;

  // 1. Replay the answer log chronologically → per-question latest state.
  const byQuestion = new Map<number, QuestionState>();
  for (const a of answers) {
    const prev = byQuestion.get(a.question_id);
    if (prev) {
      prev.attempts += 1;
      if (!a.was_correct) prev.wrongCount += 1;
      prev.latestCorrect = a.was_correct;
      prev.lastAnsweredAt = a.answered_at;
    } else {
      byQuestion.set(a.question_id, {
        latestCorrect: a.was_correct,
        attempts: 1,
        wrongCount: a.was_correct ? 0 : 1,
        lastAnsweredAt: a.answered_at,
      });
    }
  }

  const sectionById = new Map<number, SectionLite>();
  sections.forEach(s => sectionById.set(s.id, s));

  // 2. Topic-level rollup.
  const topicQueues: Record<string, TopicQueue> = {};
  const ensureTopic = (cat: string) => {
    if (!topicQueues[cat]) topicQueues[cat] = { mistakes: 0, open: 0, mastered: 0, total: 0 as number, pct: 0 };
    return topicQueues[cat];
  };

  // 3. Section-level rollup.
  const sectionAgg = new Map<number, { mistakes: number; open: number; mastered: number; total: number }>();
  const ensureSection = (id: number) => {
    if (!sectionAgg.has(id)) sectionAgg.set(id, { mistakes: 0, open: 0, mastered: 0, total: 0 });
    return sectionAgg.get(id)!;
  };
  const sectionWrong = new Map<number, { id: number; at: string | null }[]>();

  const mistakeRows: { id: number; at: string | null }[] = [];
  const openRows: { id: number; sort: number }[] = [];

  for (const q of questions) {
    const tq = ensureTopic(q.category);
    tq.total += 1;
    const st = byQuestion.get(q.id);
    const sec = q.section_id != null ? ensureSection(q.section_id) : null;
    if (sec) sec.total += 1;

    if (!st) {
      tq.open += 1;
      if (sec) sec.open += 1;
      const sort = q.section_id != null ? (sectionById.get(q.section_id)?.sort_order ?? 999) : 999;
      openRows.push({ id: q.id, sort });
    } else if (st.latestCorrect === true) {
      tq.mastered += 1;
      if (sec) sec.mastered += 1;
    } else {
      tq.mistakes += 1;
      if (sec) sec.mistakes += 1;
      if (q.section_id != null) {
        const arr = sectionWrong.get(q.section_id) ?? [];
        arr.push({ id: q.id, at: st.lastAnsweredAt });
        sectionWrong.set(q.section_id, arr);
      }
      mistakeRows.push({ id: q.id, at: st.lastAnsweredAt });
    }
  }

  Object.values(topicQueues).forEach(t => { t.pct = t.total > 0 ? Math.round((t.mastered / t.total) * 100) : 0; });

  // 4. Ordered queues.
  const mistakeQueue = mistakeRows
    .sort((a, b) => (a.at ?? '').localeCompare(b.at ?? '')) // oldest mistake first
    .map(r => r.id);
  const openQueue = openRows
    .sort((a, b) => a.sort - b.sort || a.id - b.id)
    .map(r => r.id);

  // 5. Section queues, prioritised (weak topics weighted up).
  const sectionQueues: SectionQueue[] = [];
  sectionAgg.forEach((agg, id) => {
    const meta = sectionById.get(id);
    if (!meta) return;
    const topicPct = topicQueues[meta.topic]?.pct ?? 0;
    const weight = 1 + (1 - topicPct / 100);
    const priority = (agg.mistakes * 2 + agg.open * 0.5) * weight;
    const wrongQuestionIds = (sectionWrong.get(id) ?? [])
      .sort((a, b) => (a.at ?? '').localeCompare(b.at ?? '')) // oldest mistake first
      .map(r => r.id);
    sectionQueues.push({
      sectionId: id,
      slug: meta.slug,
      name: meta.name_nl,
      topic: meta.topic,
      total: agg.total,
      mistakes: agg.mistakes,
      open: agg.open,
      mastered: agg.mastered,
      wrongQuestionIds,
      priority,
    });
  });
  sectionQueues.sort((a, b) => b.priority - a.priority);

  // 6. Recommendations — priority order, first-applicable wins per type.
  const recommendations: Recommendation[] = [];

  if (mistakeQueue.length >= MISTAKE_QUEUE_MIN) {
    const worstTopic = Object.entries(topicQueues).sort((a, b) => b[1].mistakes - a[1].mistakes)[0];
    recommendations.push({
      type: 'repeat_mistakes',
      questionIds: mistakeQueue.slice(0, MISTAKE_PAYLOAD_CAP),
      topic: worstTopic?.[0] ?? '',
      count: mistakeQueue.length,
    });
  }

  const studySection = sectionQueues.find(s => s.mistakes >= SECTION_STUDY_MIN);
  if (studySection) {
    recommendations.push({
      type: 'study_section',
      sectionId: studySection.sectionId,
      sectionName: studySection.name,
      topic: studySection.topic,
      mistakes: studySection.mistakes,
    });
  }

  const failed = exams.filter(e => e.pct < PASS_PCT).sort((a, b) => a.pct - b.pct)[0];
  if (failed) {
    recommendations.push({ type: 'retake_exam', examNumber: failed.number, pct: failed.pct });
  }

  const openTopic = Object.entries(topicQueues)
    .filter(([, t]) => t.open > 0)
    .sort((a, b) => b[1].open - a[1].open)[0];
  if (openTopic) {
    recommendations.push({ type: 'practice_topic', topic: openTopic[0], openCount: openTopic[1].open });
  }

  const attempted = new Set(exams.map(e => e.number));
  let nextExam = 0;
  for (let n = 1; n <= totalExams; n++) { if (!attempted.has(n)) { nextExam = n; break; } }
  if (nextExam > 0) recommendations.push({ type: 'take_exam', examNumber: nextExam });

  const counts = Object.values(topicQueues).reduce(
    (acc, t) => ({ mistakes: acc.mistakes + t.mistakes, open: acc.open + t.open, mastered: acc.mastered + t.mastered, total: acc.total + t.total }),
    { mistakes: 0, open: 0, mastered: 0, total: 0 }
  );

  return { byQuestion, mistakeQueue, openQueue, sectionQueues, topicQueues, recommendations: recommendations.slice(0, 5), counts };
}
