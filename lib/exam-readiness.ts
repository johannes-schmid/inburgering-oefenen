const FULL_CONFIDENCE_EXAMS = 5;
const PRIOR = 50;

export type SlaagkansBand = 'low' | 'moderate' | 'fair' | 'good' | 'high';

export type SlaagkansResult = {
  slaagkans: number;
  avgScore: number;
  confidence: number;
  band: SlaagkansBand;
};

export function bandFor(v: number): SlaagkansBand {
  if (v < 20) return 'low';
  if (v < 40) return 'moderate';
  if (v < 60) return 'fair';
  if (v < 80) return 'good';
  return 'high';
}

export function calculateSlaagkans(scores: number[]): SlaagkansResult {
  const n = scores.length;
  if (n === 0) return { slaagkans: 0, avgScore: 0, confidence: 0, band: 'low' };

  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / n);
  const confidence = Math.min(1, n / FULL_CONFIDENCE_EXAMS);
  const slaagkans = Math.round(PRIOR + confidence * (avgScore - PRIOR));
  return { slaagkans, avgScore, confidence, band: bandFor(slaagkans) };
}

export type TopicStat = { total: number; mastered: number; reviewing: number; unseen: number };

export type MariekeFeedback = {
  weakest: { title: string; pct: number; target: number; minutes: number } | null;
  strongest: { title: string; pct: number } | null;
};

const MIN_ATTEMPTED = 3;

export function calculateMariekeFeedback(topicProgress: Record<string, TopicStat>): MariekeFeedback {
  const entries = Object.entries(topicProgress)
    .map(([title, s]) => ({
      title,
      attempted: s.mastered + s.reviewing,
      pct: s.total > 0 ? Math.round((s.mastered / s.total) * 100) : 0,
      target: s.total > 0 ? Math.round(((s.mastered + s.reviewing) / s.total) * 100) : 0,
      minutes: Math.min(60, Math.max(10, Math.round((s.reviewing * 2) / 5) * 5)),
    }))
    .filter(t => t.attempted >= MIN_ATTEMPTED);

  if (entries.length === 0) return { weakest: null, strongest: null };

  const sorted = [...entries].sort((a, b) => a.pct - b.pct);
  const weakest = sorted[0];
  const strongest = sorted.length > 1 ? sorted[sorted.length - 1] : null;
  return {
    weakest: { title: weakest.title, pct: weakest.pct, target: weakest.target, minutes: weakest.minutes },
    strongest: strongest && strongest.title !== weakest.title ? { title: strongest.title, pct: strongest.pct } : null,
  };
}

export type SectionStat = { id: number; name: string; total: number; mastered: number; reviewing: number; unseen: number };

export function buildSectionProgress(
  questions: { id: number; category: string; section_id: number | null }[],
  sections: { id: number; name_nl: string; topic: string; sort_order: number }[],
  results: Record<number, boolean>
): Record<string, SectionStat[]> {
  const totals = new Map<number, { total: number; mastered: number; reviewing: number }>();

  questions.forEach(q => {
    if (q.section_id == null) return;
    if (!totals.has(q.section_id)) totals.set(q.section_id, { total: 0, mastered: 0, reviewing: 0 });
    const t = totals.get(q.section_id)!;
    t.total++;
    if (results[q.id] === true) t.mastered++;
    else if (results[q.id] === false) t.reviewing++;
  });

  const bySectionTopic: Record<string, SectionStat[]> = {};
  sections
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .forEach(s => {
      const t = totals.get(s.id) ?? { total: 0, mastered: 0, reviewing: 0 };
      const stat: SectionStat = { id: s.id, name: s.name_nl, total: t.total, mastered: t.mastered, reviewing: t.reviewing, unseen: t.total - t.mastered - t.reviewing };
      if (!bySectionTopic[s.topic]) bySectionTopic[s.topic] = [];
      bySectionTopic[s.topic].push(stat);
    });

  return bySectionTopic;
}

export function bucketTopicMastery(topicProgress: Record<string, TopicStat>) {
  let sterk = 0, aandacht = 0, nietGestart = 0;
  Object.values(topicProgress).forEach(s => {
    const attempted = s.mastered + s.reviewing;
    if (attempted === 0) { nietGestart++; return; }
    const pct = s.total > 0 ? (s.mastered / s.total) * 100 : 0;
    if (pct >= 70) sterk++; else aandacht++;
  });
  return { sterk, aandacht, nietGestart };
}
