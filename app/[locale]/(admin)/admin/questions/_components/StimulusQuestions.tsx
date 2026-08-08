'use client';

import { useState } from 'react';
import { Check, Loader2, Pencil, Plus, Trash2, TriangleAlert } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { AuthoringQuestion } from '@/lib/admin/authoring';
import { formatRange, formatRules, isSkillSlug, type Level } from '@/data/skills';

/**
 * The questions hanging off one fragment, managed from the fragment's own drawer.
 *
 * A stimulus and its 2–3 questions are one unit of work — DUO shares a text across them and the
 * structure rules count them per fragment — so "hoeveel vragen zitten er op deze tekst, en klopt
 * dat?" has to be answerable without leaving the fragment. Only *adding* and *removing* live here;
 * the wording, the options and the explanation stay in the question editor, which is one click away.
 *
 * ## Adding writes a real, empty row
 * `questions.prompt` and `.explanation` are NOT NULL, so a new question is inserted with empty
 * strings and three empty options rather than held in draft state. That is deliberate: it is
 * immediately visible to `exam_publish_issues()` as incomplete, which is exactly what a
 * half-authored item should be. A draft that only exists in the browser is invisible to every
 * completeness check on the platform.
 *
 * ## Removing is real too, and it is told the truth about answers
 * Deleting a question cascades its `question_options` **and** every `user_question_results` row
 * pointing at it — the recorded answers of past candidates, gone. `answerCount` is counted on the
 * service key server-side (the docent's own session sees zero rows through RLS, which would make
 * the warning silently never fire), and a question that has been answered has to be confirmed twice.
 */
export default function StimulusQuestions({
  stimulusId,
  level,
  skill,
  questions,
  onChanged,
  onOpenQuestion,
}: {
  stimulusId: number;
  level: Level;
  skill: string;
  questions: AuthoringQuestion[];
  onChanged: () => void;
  /** Hands the question over to the item drawer — the one place its content is edited. */
  onOpenQuestion: (id: number) => void;
}) {
  const supabase = createClient();
  const [busy, setBusy] = useState<number | 'add' | null>(null);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState<number | null>(null);

  const rules = isSkillSlug(skill) ? formatRules(level, skill) : null;
  const perStimulus = rules?.questionsPerStimulus ?? null;
  const optionsMin = rules?.options?.[0] ?? 3;
  const outsideRange =
    perStimulus != null && (questions.length < perStimulus[0] || questions.length > perStimulus[1]);

  async function addQuestion() {
    setBusy('add');
    setError('');

    const sortOrder = Math.max(0, ...questions.map(q => q.sort_order)) + 1;
    const { data, error: insErr } = await supabase
      .from('questions')
      // `exam_id` is deliberately absent: `questions_sync_exam_id()` derives it from the stimulus,
      // and the column's comment says never to write it.
      .insert({ stimulus_id: stimulusId, sort_order: sortOrder, prompt: '', explanation: '' })
      .select('id')
      .single();

    if (insErr || !data) {
      setBusy(null);
      setError(insErr?.message ?? 'De vraag kon niet worden aangemaakt.');
      return;
    }

    // The minimum from the format, so Lezen's 3 and a 4-option Luisteren item both start right.
    // `body: ''` rather than null satisfies `question_options_has_content`; is_correct stays false
    // on all of them, which `question_options_one_correct_idx` requires and the publish gate flags.
    const labels = ['A', 'B', 'C', 'D'].slice(0, Math.min(4, Math.max(3, optionsMin)));
    const { error: optErr } = await supabase.from('question_options').insert(
      labels.map((label, i) => ({
        question_id: (data as { id: number }).id,
        label,
        sort_order: i + 1,
        body: '',
        is_correct: false,
      }))
    );

    setBusy(null);
    if (optErr) { setError(optErr.message); return; }
    onChanged();
    onOpenQuestion((data as { id: number }).id);
  }

  async function removeQuestion(q: AuthoringQuestion) {
    setBusy(q.id);
    setError('');
    const { error: err } = await supabase.from('questions').delete().eq('id', q.id);
    setBusy(null);
    setConfirming(null);
    if (err) { setError(err.message); return; }
    onChanged();
  }

  return (
    <section className="space-y-2.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="m-0 font-headline text-sm font-bold text-on-surface">
          Vragen
          <span className="ml-1.5 text-xs font-normal text-on-surface-variant tabular-nums">
            {questions.length}
            {perStimulus && ` van ${formatRange(perStimulus)} verwacht`}
          </span>
        </h3>
        {/* Stated, never enforced: the per-fragment count is a publish-time warning, and blocking
            here would stop her parking a fragment with one question written so far. */}
        {outsideRange && (
          <span className="inline-flex items-center gap-1 text-xs" style={{ color: '#a24000' }}>
            <TriangleAlert size={12} aria-hidden />
            Buiten de richtlijn voor dit onderdeel
          </span>
        )}
      </div>

      {error && (
        <p className="flex items-start gap-2 rounded-xl bg-error-container/20 p-3 text-sm text-error">
          <TriangleAlert size={15} className="mt-0.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      {questions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-outline-variant p-3.5 text-sm text-on-surface-variant">
          Nog geen vragen op dit fragment. Zonder vraag telt het fragment nergens mee.
        </p>
      ) : (
        <ul className="list-none space-y-1.5 p-0">
          {questions.map((q, i) => {
            const correct = q.optionCount > 0 && q.hasCorrect;
            const incomplete = !q.prompt.trim() || !correct;
            return (
              <li
                key={q.id}
                className="rounded-xl border border-outline-variant bg-surface-container-lowest p-3"
              >
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 w-5 shrink-0 text-xs font-bold text-on-surface-variant tabular-nums">
                    {i + 1}.
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="m-0 truncate text-sm text-on-surface">
                      {q.prompt.trim() || (
                        <em className="text-on-surface-variant">Nog geen vraagtekst</em>
                      )}
                    </p>
                    <p className="m-0 mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs leading-snug text-on-surface-variant">
                      <span className="tabular-nums">{q.optionCount} opties</span>
                      {correct ? (
                        <span className="inline-flex items-center gap-1 whitespace-nowrap text-[#15803d]">
                          <Check size={12} strokeWidth={2.6} aria-hidden /> juist antwoord
                        </span>
                      ) : (
                        <span className="whitespace-nowrap" style={{ color: '#a24000' }}>
                          geen juist antwoord
                        </span>
                      )}
                      {q.review_status === 'validated' && (
                        <span className="text-[#15803d]">nagekeken</span>
                      )}
                      {q.answerCount > 0 && (
                        <span className="tabular-nums">{q.answerCount} gegeven antwoorden</span>
                      )}
                      {incomplete && q.review_status !== 'validated' && (
                        <span className="text-on-surface-variant">concept</span>
                      )}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onOpenQuestion(q.id)}
                      aria-label={`Vraag ${i + 1} bewerken`}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                    >
                      <Pencil size={13} aria-hidden />
                    </button>
                    {/* Icon, not the word: at 390px the label pushed the question's own text down
                        to four characters, and the row exists to show that text. */}
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => setConfirming(confirming === q.id ? null : q.id)}
                      aria-label={`Vraag ${i + 1} verwijderen`}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-error-container/20 hover:text-error disabled:opacity-50"
                    >
                      <Trash2 size={13} aria-hidden />
                    </button>
                  </div>
                </div>

                {confirming === q.id && (
                  <div className="mt-2.5 rounded-lg bg-error-container/15 p-2.5">
                    <p className="m-0 text-xs text-on-surface">
                      {q.answerCount > 0 ? (
                        <>
                          Deze vraag is <strong className="tabular-nums">{q.answerCount}×</strong>{' '}
                          beantwoord. Verwijderen wist die antwoorden mee — ze zijn niet terug te
                          halen.
                        </>
                      ) : (
                        <>Verwijderen wist de vraag en haar antwoordopties.</>
                      )}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        disabled={busy === q.id}
                        onClick={() => removeQuestion(q)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-error px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                      >
                        {busy === q.id && <Loader2 size={12} className="animate-spin" aria-hidden />}
                        Ja, verwijderen
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirming(null)}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-on-surface-variant hover:bg-surface-container"
                      >
                        Annuleren
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        disabled={busy !== null}
        onClick={addQuestion}
        className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant px-2.5 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-50"
      >
        {busy === 'add' ? (
          <Loader2 size={13} className="animate-spin" aria-hidden />
        ) : (
          <Plus size={13} aria-hidden />
        )}
        Vraag toevoegen
      </button>
    </section>
  );
}
