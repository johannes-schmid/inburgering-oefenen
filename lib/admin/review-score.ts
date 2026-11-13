/**
 * De gebruiksscore achter `/admin/reviews`: hoeveel heeft een betalende klant het product
 * gebruikt, op een schaal van 0 tot 100.
 *
 * De score **sorteert en licht toe, en filtert nooit**. Trustpilot verbiedt het om alleen klanten
 * uit te nodigen van wie je een goede review verwacht; iedereen die betaald heeft staat dus in de
 * lijst en kan gevraagd worden. Gebruik is ook geen tevredenheid — het zegt alleen wie genoeg
 * gezien heeft om er iets over te kunnen zeggen.
 *
 * Elk deel heeft een plafond, zodat één kandidaat met tachtig examens de schaal niet oprekt.
 */
export type UsageInput = {
  /** Afgeronde oefenexamens. */
  examsCompleted: number;
  lessonsDone: number;
  /** Nagekeken opdrachten Schrijven + Spreken. */
  gradedTasks: number;
  cardsKnown: number;
  /** Verschillende dagen waarop iets gedaan is. */
  activeDays: number;
};

export type UsageParts = { exams: number; lessons: number; graded: number; cards: number; days: number };

const WEIGHTS = {
  exams: { cap: 10, points: 40 },
  days: { cap: 10, points: 20 },
  lessons: { cap: 10, points: 20 },
  graded: { cap: 10, points: 15 },
  cards: { cap: 50, points: 5 },
} as const;

const part = (value: number, w: { cap: number; points: number }) =>
  Math.round((Math.min(Math.max(value, 0), w.cap) / w.cap) * w.points);

export function usageScore(input: UsageInput): { score: number; parts: UsageParts } {
  const parts: UsageParts = {
    exams: part(input.examsCompleted, WEIGHTS.exams),
    days: part(input.activeDays, WEIGHTS.days),
    lessons: part(input.lessonsDone, WEIGHTS.lessons),
    graded: part(input.gradedTasks, WEIGHTS.graded),
    cards: part(input.cardsKnown, WEIGHTS.cards),
  };
  return { score: parts.exams + parts.days + parts.lessons + parts.graded + parts.cards, parts };
}

export type UsageBand = 'laag' | 'midden' | 'hoog';

export function usageBand(score: number): UsageBand {
  return score >= 60 ? 'hoog' : score >= 30 ? 'midden' : 'laag';
}

/** Zo lang wachten we voor dezelfde klant opnieuw gevraagd kan worden. */
export const REVIEW_COOLDOWN_DAYS = 90;

export function canRequestReview(lastRequestedAt: string | null, now = Date.now()): boolean {
  if (!lastRequestedAt) return true;
  return now - Date.parse(lastRequestedAt) >= REVIEW_COOLDOWN_DAYS * 86400000;
}

/** Het aantal verschillende kalenderdagen (UTC) in een lijst tijdstippen. */
export function distinctDays(timestamps: (string | null | undefined)[]): number {
  const days = new Set<string>();
  for (const t of timestamps) if (t) days.add(t.slice(0, 10));
  return days.size;
}
