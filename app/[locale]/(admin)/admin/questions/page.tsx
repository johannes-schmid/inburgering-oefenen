import { createClient } from '@/lib/supabase/server';
import QuestionsTable from './_components/QuestionsTable';

export const revalidate = 0;

export default async function QuestionsPage() {
  const supabase = await createClient();

  const { data: questions } = await supabase
    .from('questions_flat')
    .select('id, category, question, option_a, option_b, option_c, correct, explanation, image_url, exam, review_status, updated_at, reviewed_at, audio_question, audio_a, audio_b, audio_c')
    .order('id');

  const categories = [...new Set((questions ?? []).map(q => q.category))].sort();

  return (
    <QuestionsTable questions={questions ?? []} categories={categories} />
  );
}
