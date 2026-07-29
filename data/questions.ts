/**
 * Static fallback for the question bank. Supabase (`questions`) is the source of truth;
 * this array is only used when the DB is unreachable or empty.
 *
 * The KNM question set was removed when this project was forked to the A2 exams — it
 * stays empty until A2 content is seeded (see scripts/seed-a2.mjs).
 */
export type KnmQuestion = {
  id: number;
  /** Which exam component this belongs to; comes from the stimulus' exam. */
  skill?: 'lezen' | 'luisteren';
  /** Sub-skill display name (advertentie, gesprek …). Was the KNM topic. */
  category: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  /** DUO uses 3 OR 4 options — undefined for a three-option item. */
  optionD?: string;
  correct: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  imageUrl?: string | null;
  /** `image`/`image_grid` render the options as thumbnails instead of text. */
  optionLayout?: 'text' | 'image' | 'image_grid';
  audioQuestion?: string | null;
  audioA?: string | null;
  audioB?: string | null;
  audioC?: string | null;
  audioD?: string | null;
  exam: number | null;
  section_id?: number | null;
  section_slug?: string;
};

export const KNM_QUESTIONS: KnmQuestion[] = [];
