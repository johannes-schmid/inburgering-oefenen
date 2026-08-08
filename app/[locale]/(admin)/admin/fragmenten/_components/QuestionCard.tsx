'use client';

import { Check, ChevronDown, ChevronUp, Eye, Minus, Plus, Trash2, TriangleAlert, Undo2 } from 'lucide-react';
import OptionImagePicker from '../../questions/_components/OptionImagePicker';
import MagicFill from '../../../_components/MagicFill';
import { OPTION_LABELS, type OptionDraft, type QuestionDraft } from '@/lib/admin/question-write';

/** What `/api/admin/suggest-item` returns for `target: 'question'`. */
type QuestionSuggestion = {
  prompt: string;
  explanation: string;
  options: { label: 'A' | 'B' | 'C' | 'D'; body: string; is_correct: boolean }[];
};

/**
 * One question, edited in place on the fragment page.
 *
 * Everything the candidate meets is here — the wording, the option layout, the options, which one
 * is right, the explanation — because the preview beside it is only worth having if it can show
 * the answer being marked. What is *not* here is the stimulus picker: on this page the fragment is
 * a given, and offering to move a question to another fragment inside the fragment's own editor is
 * an invitation to lose it.
 *
 * ## The answer key is a radio, deliberately — and it says so
 * `question_options_one_correct_idx` allows at most one correct option, so a set of checkboxes
 * would model a state the database rejects. Picking C unpicks B in the draft, which is also what
 * `saveQuestionDraft` writes. The column is **labelled "Juist"** and the chosen row is tinted
 * green with a check: a bare radio beside a text field reads as a decoration, and the first
 * question anyone asked of this screen was where you mark the right answer.
 *
 * ## Removal is staged, not immediate
 * The page saves as one draft, so a removed question is marked and struck through until Save —
 * with its recorded-answer count named at the moment she asks for it, because deleting a question
 * cascades every `user_question_results` row pointing at it.
 */
export default function QuestionCard({
  question: q,
  index,
  total,
  level,
  skill,
  stimulusId,
  stimulusText,
  open,
  removed,
  answerCount,
  optionRange,
  onToggle,
  onChange,
  onMove,
  onRemove,
  onRestore,
  onPreview,
}: {
  question: QuestionDraft;
  index: number;
  total: number;
  level: string;
  skill: string;
  /** Null while the fragment itself is unsaved — the suggestion then works off `stimulusText`. */
  stimulusId: number | null;
  /** The fragment's text or script as it stands in the draft, unsaved edits included. */
  stimulusText: string;
  open: boolean;
  removed: boolean;
  answerCount: number;
  /** [min, max] options this onderdeel's format allows, from `exam_formats`. */
  optionRange: [number, number];
  onToggle: () => void;
  onChange: (next: QuestionDraft) => void;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
  onRestore: () => void;
  /** Show this question in the preview pane. */
  onPreview: () => void;
}) {
  const usesImages = q.option_layout !== 'text';
  const [minOptions, maxOptions] = optionRange;

  const patch = (next: Partial<QuestionDraft>) => onChange({ ...q, ...next });
  const patchOption = (label: string, next: Partial<OptionDraft>) =>
    patch({ options: q.options.map(o => (o.label === label ? { ...o, ...next } : o)) });

  function setCorrect(label: string) {
    patch({ options: q.options.map(o => ({ ...o, is_correct: o.label === label })) });
  }

  function addOption() {
    const next = OPTION_LABELS[q.options.length];
    if (!next || q.options.length >= maxOptions) return;
    patch({
      options: [...q.options, { label: next, body: '', image_urls: [], image_alt: '', is_correct: false }],
    });
  }

  function removeLastOption() {
    if (q.options.length <= minOptions) return;
    const dropped = q.options[q.options.length - 1];
    const kept = q.options.slice(0, -1);
    // If the dropped option was the answer key, fall back to A rather than leaving the question
    // with no correct option at all — which saves cleanly and marks every candidate wrong.
    patch({ options: dropped.is_correct ? kept.map(o => ({ ...o, is_correct: o.label === 'A' })) : kept });
  }

  /**
   * Drop a suggestion into this question's fields. Nothing is saved, and the answer key it
   * proposes is a proposal: it lands on the radio the docent can see and change.
   *
   * Image-option questions keep their own options — their answers are pictures she picked, and
   * overwriting them with option text would say nothing and lose the image sets.
   */
  function applySuggestion(sug: QuestionSuggestion) {
    patch({
      prompt: sug.prompt || q.prompt,
      explanation: sug.explanation || q.explanation,
      options: usesImages
        ? q.options
        : sug.options.map(o => ({
            label: o.label,
            body: o.body,
            image_urls: [],
            image_alt: '',
            is_correct: o.is_correct,
          })),
    });
  }

  const incomplete = !q.prompt.trim() || !q.options.some(o => o.is_correct);

  if (removed) {
    return (
      <li className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-outline-variant p-3 text-sm">
        <span className="text-on-surface-variant line-through">
          {index + 1}. {q.prompt.trim() || 'Nog geen vraagtekst'}
        </span>
        <span className="text-xs text-error">wordt verwijderd bij opslaan</span>
        <button
          type="button"
          onClick={onRestore}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-outline-variant px-2.5 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container"
        >
          <Undo2 size={12} aria-hidden />
          Terugzetten
        </button>
      </li>
    );
  }

  return (
    <li className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
      <div className="flex items-start gap-2 p-3">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-start gap-2.5 text-left"
        >
          <span className="mt-0.5 w-5 shrink-0 text-xs font-bold text-on-surface-variant tabular-nums">
            {index + 1}.
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm text-on-surface">
              {q.prompt.trim() || <em className="text-on-surface-variant">Nog geen vraagtekst</em>}
            </span>
            <span className="mt-0.5 flex flex-wrap items-center gap-x-2.5 text-xs text-on-surface-variant">
              <span className="tabular-nums">{q.options.length} opties</span>
              {q.options.find(o => o.is_correct) ? (
                <span className="inline-flex items-center gap-1" style={{ color: '#15803d' }}>
                  <Check size={11} strokeWidth={3} aria-hidden />
                  juist: {q.options.find(o => o.is_correct)!.label}
                </span>
              ) : (
                <span style={{ color: '#a24000' }}>geen juist antwoord</span>
              )}
              {incomplete && !q.prompt.trim() && (
                <span className="inline-flex items-center gap-1" style={{ color: '#a24000' }}>
                  <TriangleAlert size={11} aria-hidden /> geen vraagtekst
                </span>
              )}
              {answerCount > 0 && <span className="tabular-nums">{answerCount} antwoorden</span>}
            </span>
          </span>
          <span className="mt-0.5 shrink-0 text-on-surface-variant">
            {open ? <ChevronUp size={15} aria-hidden /> : <ChevronDown size={15} aria-hidden />}
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-0.5">
          <IconButton label={`Vraag ${index + 1} in het voorbeeld tonen`} onClick={onPreview}>
            <Eye size={13} aria-hidden />
          </IconButton>
          <IconButton
            label={`Vraag ${index + 1} omhoog`}
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            <ChevronUp size={13} aria-hidden />
          </IconButton>
          <IconButton
            label={`Vraag ${index + 1} omlaag`}
            disabled={index === total - 1}
            onClick={() => onMove(1)}
          >
            <ChevronDown size={13} aria-hidden />
          </IconButton>
          <IconButton label={`Vraag ${index + 1} verwijderen`} danger onClick={onRemove}>
            <Trash2 size={13} aria-hidden />
          </IconButton>
        </div>
      </div>

      {open && (
        <div className="space-y-3.5 border-t border-outline-variant p-3.5">
          {/* Per question, not per fragment: a suggestion is written *about* this fragment's text
              and has to land in one question's fields. `stimulusText` carries the draft, so a
              fragment that has not been saved yet can still have questions suggested for it. */}
          <MagicFill<QuestionSuggestion>
            placeholder="Bijv. een vraag over de openingstijden (mag leeg)"
            disabled={!stimulusText.trim()}
            disabledReason={
              stimulusText.trim()
                ? undefined
                : 'Schrijf eerst de tekst of het script van het fragment — een vraag wordt daarbij bedacht.'
            }
            body={() => ({
              target: 'question',
              stimulusId,
              stimulusText,
              level,
              skill,
            })}
            onSuggestion={applySuggestion}
          />

          <Field label="Vraag">
            <textarea
              value={q.prompt}
              onChange={e => patch({ prompt: e.target.value })}
              rows={2}
              className="qfield"
            />
          </Field>

          <Field label="Antwoorden">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <select
                value={q.option_layout}
                onChange={e => patch({ option_layout: e.target.value as QuestionDraft['option_layout'] })}
                className="qfield w-auto text-xs"
              >
                <option value="text">Tekst</option>
                <option value="image">Eén afbeelding</option>
                <option value="image_grid">Meerdere afbeeldingen</option>
              </select>
              <IconButton
                label="Optie verwijderen"
                disabled={q.options.length <= minOptions}
                onClick={removeLastOption}
              >
                <Minus size={13} aria-hidden />
              </IconButton>
              <IconButton
                label="Optie toevoegen"
                disabled={q.options.length >= maxOptions}
                onClick={addOption}
              >
                <Plus size={13} aria-hidden />
              </IconButton>
              <span className="text-xs text-on-surface-variant">
                {minOptions === maxOptions ? `${minOptions} opties` : `${minOptions} of ${maxOptions} opties`}
              </span>
            </div>

            <div className="mb-1 flex items-center gap-2 text-[0.65rem] font-bold tracking-widest text-on-surface-variant uppercase">
              <span className="w-[58px] shrink-0">Juist</span>
              <span>Antwoord</span>
            </div>

            <ul className="list-none space-y-2 p-0">
              {q.options.map(o => (
                <li key={o.label} className="flex items-start gap-2">
                  {/* One radio group name per question, so the browser enforces the single-answer
                      rule that `question_options_one_correct_idx` enforces in the database. */}
                  <label
                    className={`mt-1 flex w-[58px] shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-1.5 py-1.5 transition-colors ${
                      o.is_correct ? 'bg-[rgba(22,163,74,0.10)]' : 'hover:bg-surface-container'
                    }`}
                    title={`Markeer ${o.label} als het juiste antwoord`}
                  >
                    <input
                      type="radio"
                      name={`correct-${q.id ?? `new-${index}`}`}
                      checked={o.is_correct}
                      onChange={() => setCorrect(o.label)}
                      aria-label={`Optie ${o.label} is het juiste antwoord`}
                    />
                    <span
                      className="text-xs font-bold"
                      style={{ color: o.is_correct ? '#15803d' : 'var(--color-on-surface-variant)' }}
                    >
                      {o.label}
                    </span>
                    {o.is_correct && (
                      <Check size={12} strokeWidth={3} style={{ color: '#15803d' }} aria-hidden />
                    )}
                  </label>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <input
                      value={o.body}
                      onChange={e => patchOption(o.label, { body: e.target.value })}
                      placeholder={usesImages ? 'Bijschrift (optioneel)' : `Antwoord ${o.label}`}
                      className="qfield"
                      style={o.is_correct ? { borderColor: 'rgba(22,163,74,0.55)' } : undefined}
                    />
                    {usesImages && (
                      <>
                        <OptionImagePicker
                          urls={o.image_urls}
                          max={q.option_layout === 'image_grid' ? 3 : 1}
                          query={q.prompt}
                          onChange={urls => patchOption(o.label, { image_urls: urls })}
                        />
                        <input
                          value={o.image_alt}
                          onChange={e => patchOption(o.label, { image_alt: e.target.value })}
                          placeholder="Alt-tekst"
                          className="qfield"
                        />
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Field>

          <Field label="Uitleg" hint="Waarom is dit het juiste antwoord? De kandidaat leest dit na afloop.">
            <textarea
              value={q.explanation}
              onChange={e => patch({ explanation: e.target.value })}
              rows={3}
              className="qfield"
            />
          </Field>
        </div>
      )}

      <style>{`
        .qfield {
          width: 100%; border-radius: 10px; border: 1px solid var(--color-outline-variant);
          background: var(--color-surface); padding: 7px 10px; font: inherit; font-size: 0.85rem;
          color: var(--color-on-surface); outline: none; resize: vertical;
        }
        .qfield:focus { border-color: var(--color-primary); }
      `}</style>
    </li>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold tracking-wide text-on-surface-variant uppercase">
        {label}
      </label>
      {children}
      {hint && <p className="m-0 text-xs text-on-surface-variant">{hint}</p>}
    </div>
  );
}

function IconButton({
  children, label, disabled, danger, onClick,
}: {
  children: React.ReactNode;
  label: string;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-on-surface-variant transition-colors disabled:opacity-30 ${
        danger ? 'hover:bg-error-container/20 hover:text-error' : 'hover:bg-surface-container hover:text-on-surface'
      }`}
    >
      {children}
    </button>
  );
}
