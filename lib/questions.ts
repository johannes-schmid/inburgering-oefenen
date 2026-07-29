import { createClient } from './supabase/server';
import type { KnmQuestion } from '@/data/questions';

// Reads `questions_flat`, not `questions`: options live in their own table now, and the
// view pivots them back into option_a..option_d. It is READ-ONLY — anything that writes
// an option must go to `question_options` directly.
const SELECT_COLS =
  'id, skill, category, question, option_a, option_b, option_c, option_d, correct, ' +
  'explanation, image_url, option_layout, audio_question, audio_a, audio_b, audio_c, audio_d, exam';

type QuestionRow = {
  id: number;
  skill: 'lezen' | 'luisteren' | null;
  category: string | null;
  question: string;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  correct: string | null;
  explanation: string;
  image_url: string | null;
  option_layout: 'text' | 'image' | 'image_grid';
  audio_question: string | null;
  audio_a: string | null;
  audio_b: string | null;
  audio_c: string | null;
  audio_d: string | null;
  exam: number | null;
};

function mapRow(r: QuestionRow): KnmQuestion {
  return {
    id: r.id,
    skill: r.skill ?? undefined,
    category: r.category ?? '',
    question: r.question,
    optionA: r.option_a ?? '',
    optionB: r.option_b ?? '',
    optionC: r.option_c ?? '',
    // DUO uses 3 OR 4 options; undefined means this is a three-option item.
    optionD: r.option_d ?? undefined,
    correct: (r.correct ?? 'A') as 'A' | 'B' | 'C' | 'D',
    explanation: r.explanation,
    imageUrl: r.image_url ?? undefined,
    optionLayout: r.option_layout,
    audioQuestion: r.audio_question ?? undefined,
    audioA: r.audio_a ?? undefined,
    audioB: r.audio_b ?? undefined,
    audioC: r.audio_c ?? undefined,
    audioD: r.audio_d ?? undefined,
    exam: r.exam,
  };
}

export async function fetchAllQuestions(): Promise<KnmQuestion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('questions_flat').select(SELECT_COLS).order('id');

  if (error || !data?.length) {
    // Fallback to static data if DB is unavailable or empty
    const { KNM_QUESTIONS } = await import('@/data/questions');
    return KNM_QUESTIONS;
  }

  return (data as unknown as QuestionRow[]).map(mapRow);
}

// Questions curated for the free /oefenen practice set (via the `oefenen` flag).
// Returns [] when none are flagged or the column/table is unavailable.
export async function fetchOefenenQuestions(): Promise<KnmQuestion[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('questions_flat')
      .select(SELECT_COLS)
      .eq('oefenen', true)
      .order('id');
    if (error || !data) return [];
    return (data as unknown as QuestionRow[]).map(mapRow);
  } catch {
    return [];
  }
}
