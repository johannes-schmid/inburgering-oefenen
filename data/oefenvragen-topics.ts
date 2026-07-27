export type Question = {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  correct: 'A' | 'B' | 'C';
  explanation: string;
};

export type Topic = {
  slug: string;
  name: string;
  icon: string;
  total: number;
  sublabel: string;
  intro: string;
  questions: Question[];
};

/**
 * Free topic-quiz pages are disabled for the A2 launch
 * (see FEATURES.oefenvragen in lib/features.ts).
 */
const TOPICS: Topic[] = [];

export function getTopicBySlug(slug: string): Topic | undefined {
  return TOPICS.find(t => t.slug === slug);
}

export default TOPICS;
