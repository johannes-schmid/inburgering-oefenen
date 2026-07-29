import { createClient } from '@/lib/supabase/server';
import ExamsGrid from './_components/ExamsGrid';

export default async function ExamsPage() {
  const supabase = await createClient();

  let { data: questions } = await supabase
    .from('questions_flat')
    .select('id, category, question, exam, oefenen, review_status, explanation, image_url')
    .order('id');

  // Fallback when the `oefenen` column hasn't been migrated yet.
  if (!questions) {
    const res = await supabase
      .from('questions_flat')
      .select('id, category, question, exam, review_status, explanation, image_url')
      .order('id');
    questions = (res.data ?? []).map((q) => ({ ...q, oefenen: false }));
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-headline font-bold text-on-surface">Examens</h1>
        <p className="text-sm text-on-surface/60 mt-1">Overzicht van alle 10 proefexamens én de gratis oefenflow, met hun vraagsamenstelling</p>
      </div>
      <ExamsGrid questions={questions ?? []} />
    </div>
  );
}
