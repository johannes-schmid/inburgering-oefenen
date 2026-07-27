import { createClient } from './supabase/server';
import type { KnmQuestion } from '@/data/questions';

const SELECT_COLS =
  'id, category, question, option_a, option_b, option_c, correct, explanation, image_url, audio_question, audio_a, audio_b, audio_c, exam';

type QuestionRow = {
  id: number;
  category: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct: string;
  explanation: string;
  image_url: string | null;
  audio_question: string | null;
  audio_a: string | null;
  audio_b: string | null;
  audio_c: string | null;
  exam: number | null;
};

function mapRow(r: QuestionRow): KnmQuestion {
  return {
    id: r.id,
    category: r.category,
    question: r.question,
    optionA: r.option_a,
    optionB: r.option_b,
    optionC: r.option_c,
    correct: r.correct as 'A' | 'B' | 'C',
    explanation: r.explanation,
    imageUrl: r.image_url ?? undefined,
    audioQuestion: r.audio_question ?? undefined,
    audioA: r.audio_a ?? undefined,
    audioB: r.audio_b ?? undefined,
    audioC: r.audio_c ?? undefined,
    exam: r.exam,
  };
}

export async function fetchAllQuestions(): Promise<KnmQuestion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('questions').select(SELECT_COLS).order('id');

  if (error || !data?.length) {
    // Fallback to static data if DB is unavailable or empty
    const { KNM_QUESTIONS } = await import('@/data/questions');
    return KNM_QUESTIONS;
  }

  return (data as QuestionRow[]).map(mapRow);
}

// Questions curated for the free /oefenen practice set (via the `oefenen` flag).
// Returns [] when none are flagged or the column/table is unavailable.
export async function fetchOefenenQuestions(): Promise<KnmQuestion[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('questions')
      .select(SELECT_COLS)
      .eq('oefenen', true)
      .order('id');
    if (error || !data) return [];
    return (data as QuestionRow[]).map(mapRow);
  } catch {
    return [];
  }
}
