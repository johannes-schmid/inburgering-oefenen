/**
 * Static fallback for the question bank. Supabase (`questions`) is the source of truth;
 * this array is only used when the DB is unreachable or empty.
 *
 * The KNM question set was removed when this project was forked to the A2 exams — it
 * stays empty until A2 content is seeded (see scripts/seed-a2.mjs).
 */
export type KnmQuestion = {
  id: number;
  category: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  correct: 'A' | 'B' | 'C';
  explanation: string;
  imageUrl?: string | null;
  audioQuestion?: string | null;
  audioA?: string | null;
  audioB?: string | null;
  audioC?: string | null;
  exam: number | null;
  section_id?: number | null;
  section_slug?: string;
};

export const KNM_QUESTIONS: KnmQuestion[] = [];
