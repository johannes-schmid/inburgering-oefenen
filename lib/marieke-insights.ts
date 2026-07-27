// Rule-based "Marieke" coaching engine. Picks the single most relevant message
// for the learner's current state — no AI calls. First matching rule wins, so
// order = priority. Returns a render descriptor (i18n key + params, and the
// topic name when the message embeds a <topicLink>).

import type { TopicStat } from './exam-readiness';

export type MariekeMessage = {
  key: string;
  params: Record<string, string | number>;
  topic?: string; // present when the message contains a <topicLink> tag
};

export type MariekeInput = {
  examResults: { pct: number; passed: boolean; completedAt?: string }[];
  topicProgress: Record<string, TopicStat>;
  weakest: { title: string; pct: number; target: number; minutes: number } | null;
  slaagkans: number;
  mistakeCount: number;
  openCount: number;
  totalQuestions: number;
  answeredCount: number;
  lastAnsweredAt: string | null;
  nowMs: number;
};

const WELCOME_BACK_DAYS = 7;
const MISTAKES_PILING = 15;
const COVERAGE_GAP = 0.4;
const READY_SLAAGKANS = 80;
const READY_TOPIC_PCT = 70;

export function pickMariekeState(input: MariekeInput): MariekeMessage {
  const { examResults, topicProgress, weakest, slaagkans, mistakeCount, openCount, totalQuestions, answeredCount, lastAnsweredAt, nowMs } = input;

  const sorted = [...examResults].sort((a, b) => (a.completedAt ?? '').localeCompare(b.completedAt ?? ''));
  const n = sorted.length;

  const attempted = Object.values(topicProgress).filter(s => s.mastered + s.reviewing > 0);
  const allStrong = attempted.length >= 3 && attempted.every(s => (s.total > 0 ? (s.mastered / s.total) * 100 : 0) >= READY_TOPIC_PCT);

  // 1. Exam-ready
  if (slaagkans >= READY_SLAAGKANS && allStrong) {
    return { key: 'marieke_state_exam_ready', params: { slaagkans } };
  }

  // 2. Brand-new user
  if (n === 0 && answeredCount === 0) {
    return { key: 'marieke_state_new_user', params: {} };
  }

  // 3. Returning after a break
  if (lastAnsweredAt) {
    const days = (nowMs - Date.parse(lastAnsweredAt)) / 86_400_000;
    if (days > WELCOME_BACK_DAYS) return { key: 'marieke_state_welcome_back', params: { days: Math.round(days) } };
  }

  // 4/5. First exam done
  if (n === 1) {
    const e = sorted[0];
    if (!e.passed) return { key: 'marieke_state_first_exam_failed', params: { pct: e.pct, topic: weakest?.title ?? '' }, topic: weakest?.title };
    return { key: 'marieke_state_first_exam_passed', params: { pct: e.pct } };
  }

  // 6. Improving streak
  if (n >= 2) {
    const latest = sorted[n - 1];
    const earlierBest = Math.max(...sorted.slice(0, n - 1).map(e => e.pct));
    if (latest.pct >= earlierBest + 10) return { key: 'marieke_state_improving', params: { prev: earlierBest, pct: latest.pct } };
  }

  // 7. Declining
  if (n >= 3) {
    const avg = sorted.reduce((a, b) => a + b.pct, 0) / n;
    const lastTwo = sorted.slice(n - 2);
    if (lastTwo.every(e => e.pct < avg)) return { key: 'marieke_state_declining', params: {} };
  }

  // 8. Mistakes piling up
  if (mistakeCount >= MISTAKES_PILING) {
    return { key: 'marieke_state_mistakes_piling', params: { count: mistakeCount } };
  }

  // 9. Weak topic (previous default behaviour)
  if (weakest) {
    return { key: 'marieke_feedback', params: { topic: weakest.title, minutes: weakest.minutes, target: weakest.target }, topic: weakest.title };
  }

  // 10. Coverage too narrow
  if (totalQuestions > 0 && openCount / totalQuestions > COVERAGE_GAP && answeredCount > 0) {
    return { key: 'marieke_state_coverage_gap', params: {} };
  }

  // Fallback
  return { key: 'marieke_feedback_empty', params: {} };
}
