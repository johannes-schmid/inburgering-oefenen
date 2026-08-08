/**
 * How a question and its options are written. One copy, because the rules are not guessable.
 *
 * Two editors now save a question — the full-page question editor (`QuestionForm`) and the
 * fragment page, which saves a whole fragment's worth of them in one go. Both have to obey the
 * same three constraints, and each of them fails in a way that looks like something else:
 *
 *   1. **Options are reconciled by label, never deleted and re-inserted.** A delete cascades
 *      `user_question_results.chosen_option_id` to NULL and quietly erases which answer past
 *      candidates picked. Nothing errors; the data is simply gone.
 *   2. **Every row is upserted `is_correct: false` first, and the correct one flipped after.**
 *      `question_options_one_correct_idx` is `UNIQUE (question_id) WHERE is_correct`, so writing
 *      the new correct option while the old one is still true trips a duplicate-key error.
 *   3. **`exam_id` is never sent.** `questions_sync_exam_id()` derives it from the stimulus; a
 *      value from the client is a second version of the truth that the trigger will overwrite
 *      anyway on insert and silently disagree with on update.
 *
 * Client-safe: it takes the Supabase client as an argument rather than creating one, so it runs
 * in a browser component without dragging the server client into the bundle.
 */

export const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;
export type OptionLabel = (typeof OPTION_LABELS)[number];

export type OptionDraft = {
  id?: number;
  label: OptionLabel;
  body: string;
  image_urls: string[];
  image_alt: string;
  is_correct: boolean;
};

export type QuestionDraft = {
  id?: number;
  stimulus_id: number | null;
  sort_order: number;
  prompt: string;
  explanation: string;
  image_url: string;
  option_layout: 'text' | 'image' | 'image_grid';
  options: OptionDraft[];
};

/** A new question, with the option count the onderdeel's format asks for (3 or 4). */
export function blankQuestion(sortOrder: number, optionCount = 3): QuestionDraft {
  const count = Math.min(4, Math.max(3, optionCount));
  return {
    stimulus_id: null,
    sort_order: sortOrder,
    prompt: '',
    explanation: '',
    image_url: '',
    option_layout: 'text',
    options: OPTION_LABELS.slice(0, count).map(label => ({
      label,
      body: '',
      image_urls: [],
      image_alt: '',
      is_correct: label === 'A',
    })),
  };
}

/**
 * What must be true before a question can be written, in the docent's words.
 *
 * Deliberately *not* the same set as `exam_publish_issues()`: this is the minimum the database
 * will accept plus the two things that make a saved question meaningless (no answer key, an empty
 * option). Everything else — length, register, completeness of the exam — is a publish-time
 * warning, because a half-authored item has to stay parkable.
 */
export function validateQuestion(q: QuestionDraft, index?: number): string | null {
  const where = index == null ? '' : `Vraag ${index + 1}: `;
  const usesImages = q.option_layout !== 'text';

  if (!q.stimulus_id) return `${where}een vraag hangt altijd aan een fragment.`;
  if (!q.prompt.trim()) return `${where}de vraagtekst mag niet leeg zijn.`;
  if (!q.explanation.trim()) return `${where}vul de uitleg in.`;
  if (q.options.length < 3) return `${where}een vraag heeft minimaal 3 opties.`;
  if (!q.options.some(o => o.is_correct)) return `${where}markeer één optie als het juiste antwoord.`;
  for (const o of q.options) {
    const hasContent = usesImages ? o.image_urls.length > 0 : Boolean(o.body.trim());
    if (!hasContent) return `${where}optie ${o.label} heeft nog geen ${usesImages ? 'afbeelding' : 'tekst'}.`;
  }
  return null;
}

/** Minimal shape of the Supabase client this needs — avoids importing the generated types. */
type Db = {
  from: (table: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

/**
 * Insert or update one question and reconcile its options. Returns the question's id.
 *
 * `stimulusId` overrides the draft's own, which is what the fragment page needs: a brand-new
 * fragment has no id until its own row is written, so its questions are drafted with
 * `stimulus_id: null` and given the real id here.
 *
 * Throws on any database error rather than returning it — the callers save several questions in
 * sequence and need the first failure to stop the run, not to be threaded through by hand.
 */
export async function saveQuestionDraft(
  supabase: Db,
  q: QuestionDraft,
  stimulusId?: number
): Promise<number> {
  const usesImages = q.option_layout !== 'text';
  const targetStimulus = stimulusId ?? q.stimulus_id;
  if (!targetStimulus) throw new Error('Een vraag hangt altijd aan een fragment.');

  const row = {
    stimulus_id: targetStimulus,
    sort_order: q.sort_order,
    prompt: q.prompt.trim(),
    explanation: q.explanation.trim(),
    image_url: q.image_url.trim() || null,
    option_layout: q.option_layout,
  };

  let questionId = q.id;
  if (questionId) {
    const { error } = await supabase.from('questions').update(row).eq('id', questionId);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await supabase.from('questions').insert(row).select('id').single();
    if (error) throw new Error(error.message);
    questionId = (data as { id: number }).id;
  }

  // Rule 2: everything false first. The correct one is flipped in the last statement.
  const optionRows = q.options.map((o, i) => ({
    question_id: questionId!,
    label: o.label,
    sort_order: i + 1,
    body: usesImages ? o.body.trim() || null : o.body.trim(),
    image_urls: usesImages ? o.image_urls : [],
    image_alt: o.image_alt.trim() || null,
    is_correct: false,
  }));

  const up = await supabase
    .from('question_options')
    .upsert(optionRows, { onConflict: 'question_id,label' });
  if (up.error) throw new Error(up.error.message);

  // Rule 1: only labels the docent actually removed are deleted — the rows she kept are updated
  // in place above, so their ids, and every `chosen_option_id` pointing at them, survive.
  const kept = q.options.map(o => o.label);
  const del = await supabase
    .from('question_options')
    .delete()
    .eq('question_id', questionId!)
    .not('label', 'in', `(${kept.join(',')})`);
  if (del.error) throw new Error(del.error.message);

  const correct = q.options.find(o => o.is_correct)!.label;
  const cor = await supabase
    .from('question_options')
    .update({ is_correct: true })
    .eq('question_id', questionId!)
    .eq('label', correct);
  if (cor.error) throw new Error(cor.error.message);

  return questionId!;
}
