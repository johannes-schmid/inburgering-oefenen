'use client';

import { useMemo, type ReactNode } from 'react';
import { Check, Info, Loader2, Lock, RotateCcw } from 'lucide-react';
import type { FeedbackHighlight, RubricFeedbackState } from './RubricFeedback';
import type { FormField, OpenTaskItem } from '@/lib/exam-content';

export type WritingAnswer = { text: string; json: Record<string, string> | null };

type Props = {
  task: OpenTaskItem;
  answer: WritingAnswer;
  onChange: (next: WritingAnswer) => void;
  taskNumber: number;
  total: number;
  /** The review action sits under the answer, next to what it judges — as in Spreken. */
  review?: {
    state: RubricFeedbackState;
    onGrade: () => void;
    answerText: string | null;
    highlights: FeedbackHighlight[];
  };
  /** The assessment, rendered full-width below both panes. */
  feedback?: ReactNode;
  /** Compleet gates the docent's model answer; below it the candidate sees only that it exists. */
  canSeeModelAnswer?: boolean;
};

/**
 * The four Schrijven shapes DUO publishes, in one component because they differ only in the
 * chrome around the input: an e-mail with a fixed Aan/Onderwerp and a seeded greeting and
 * closing the candidate writes *between*; a free short text with a minimum sentence count;
 * a form of typed rows; and a note driven by a picture sequence.
 *
 * `form` answers go to `answer_json`, everything else to `answer_text` — flattening a filled
 * form into prose is what makes a rubric prompt unparseable later.
 *
 * ## Layout
 * Split, like Spreken: the opdracht on the left, the answer surface on the right, assessment
 * full-width beneath. Schrijven differs from Spreken in one way that matters — the answer is a
 * paragraph rather than a 20-second recording, so its column is the tall one and the assessment
 * reads better as a wide strip under both panes than as a narrow column beside them.
 *
 * Once graded, the textarea is replaced by the marked-up text. Leaving an editable field next to a
 * score invites the candidate to "fix" it and wonder why the score does not move — a re-grade is
 * an explicit action.
 */
export default function WritingTask({
  task,
  answer,
  onChange,
  taskNumber,
  total,
  review,
  feedback,
  canSeeModelAnswer = false,
}: Props) {
  const fields = useMemo(() => flattenFields(task), [task]);
  const words = answer.text.trim() ? answer.text.trim().split(/\s+/).length : 0;
  const isForm = task.task_type === 'form';
  /**
   * Is this a mail? Keyed on the presence of the header fields, not on `task_type`.
   *
   * At A2 every `email` task carries `email_to`, so the two are equivalent there. At B1 they
   * are not: a `sentence_completion` opdracht is a part-written *e-mail* about half the time
   * and a website- or nieuwsbericht the rest, and `letter` is a brief with a postal address
   * and no Aan/Onderwerp at all. Reading the fields renders each of those correctly, where
   * a task_type allowlist would have to be extended for every shape DUO adds.
   */
  const isMail = Boolean(task.email_to || task.email_cc || task.email_subject);
  const grading = review?.state === 'grading';
  const graded = review?.state === 'graded';
  const gradedText = graded ? review?.answerText?.trim() || '' : '';

  const paneLabel = isForm ? 'Het formulier' : isMail ? 'Jouw e-mail' : 'Jouw tekst';

  return (
    <div className="wr-split">
      {/* ── Left: the opdracht ── */}
      <section className="wr-pane wr-brief">
        <header className="wr-brief-head">
          <span className="wr-eyebrow">De opdracht</span>
          <span className="wr-step">
            {taskNumber} / {total}
          </span>
        </header>

        {task.title && <h2 className="wr-title">{task.title}</h2>}

        {task.prompt_html && (
          <div className="wr-prompt exam-rich exam-rich-scroll" dangerouslySetInnerHTML={{ __html: task.prompt_html }} />
        )}

        {/* Numbered rather than bulleted: these are the points the rubric checks off one by one,
            so the candidate can count them against what they wrote. */}
        {task.bullet_points.length > 0 && (
          <ol className="wr-points">
            {task.bullet_points.map((b, i) => (
              <li key={i}>
                <span className="wr-num">{i + 1}</span>
                <span>{b}</span>
              </li>
            ))}
          </ol>
        )}

        {(task.min_sentences || task.greeting) && (
          <p className="wr-hint">
            <Info size={15} strokeWidth={2.3} aria-hidden />
            <span>
              {task.min_sentences ? (
                <>
                  Schrijf <strong>minimaal {task.min_sentences} zinnen</strong>.{' '}
                </>
              ) : null}
              Gebruik hele zinnen{task.greeting ? ' en schrijf tussen de aanhef en de afsluiting' : ''}.
            </span>
          </p>
        )}

        {task.images.length > 0 && (
          <div className="wr-images">
            {task.images.map(img => (
              <figure key={img.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.image_url} alt={img.alt_text ?? ''} />
                {img.caption && <figcaption>{img.caption}</figcaption>}
              </figure>
            ))}
          </div>
        )}
      </section>

      {/* ── Right: the answer ── */}
      <section className="wr-pane wr-answer">
        <header className="wr-answer-head">
          <span className="wr-eyebrow">{paneLabel}</span>
          {!isForm && (
            <span className="wr-words">
              {graded ? 'Ingeleverd' : `${words} ${words === 1 ? 'woord' : 'woorden'}`}
            </span>
          )}
        </header>

        {isForm ? (
          <FormAnswer
            fields={fields}
            value={answer.json ?? {}}
            onChange={json => onChange({ ...answer, json })}
          />
        ) : (
          <div className="wr-letter">
            {isMail && (
              <dl className="wr-mail">
                {task.email_to && <MailRow label="Aan" value={task.email_to} />}
                {task.email_cc && <MailRow label="Cc" value={task.email_cc} />}
                {task.email_subject && <MailRow label="Onderwerp" value={task.email_subject} />}
              </dl>
            )}

            <div className="wr-body">
              {task.greeting && <p className="wr-fixed">{task.greeting}</p>}

              {graded && gradedText && review ? (
                <MarkedText text={gradedText} highlights={review.highlights} />
              ) : (
                <label className="block">
                  <span className="sr-only">Jouw antwoord</span>
                  <textarea
                    value={answer.text}
                    onChange={e => onChange({ ...answer, text: e.target.value })}
                    rows={isMail ? 8 : 7}
                    placeholder="Schrijf hier je antwoord…"
                    className={`wr-textarea${grading ? ' wr-reading' : ''}`}
                    readOnly={grading}
                  />
                </label>
              )}

              {task.closing && <p className="wr-fixed wr-fixed-end">{task.closing}</p>}
            </div>
          </div>
        )}

        {review && (
          <div className="wr-actions">
            {graded ? (
              <button type="button" onClick={review.onGrade} className="wr-btn wr-btn-ghost">
                <RotateCcw size={16} strokeWidth={2.4} aria-hidden />
                Opnieuw nakijken
              </button>
            ) : (
              <button
                type="button"
                onClick={review.onGrade}
                disabled={grading || (!answer.text.trim() && !answer.json)}
                className="wr-btn wr-btn-primary"
              >
                {grading ? (
                  <>
                    <Loader2 size={16} className="wr-spin" aria-hidden /> Nakijken…
                  </>
                ) : (
                  <>
                    <Check size={16} strokeWidth={2.8} aria-hidden /> Beoordeel mijn tekst
                  </>
                )}
              </button>
            )}

            {graded && !canSeeModelAnswer && (
              <span className="wr-locked">
                <Lock size={13} aria-hidden />
                Modelantwoord van de docent in Compleet
              </span>
            )}
          </div>
        )}
      </section>

      {feedback && <div className="wr-feedback">{feedback}</div>}

      <style>{CSS}</style>
    </div>
  );
}

/**
 * The graded answer with its spans marked.
 *
 * Offsets come from `matchHighlights` server-side, where every quote was verified to be a literal
 * substring of what the candidate wrote.
 */
function MarkedText({ text, highlights }: { text: string; highlights: FeedbackHighlight[] }) {
  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const [i, h] of [...highlights].sort((a, b) => a.start - b.start).entries()) {
    if (h.start > cursor) parts.push(text.slice(cursor, h.start));
    parts.push(
      <mark key={i} className={`wr-mark wr-mark-${h.kind}`} tabIndex={0}>
        {text.slice(h.start, h.end)}
        <span className="wr-mark-note">{h.note}</span>
      </mark>
    );
    cursor = h.end;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <p className="wr-marked">{parts}</p>;
}

const CSS = `
  .wr-split { display: grid; grid-template-columns: 1fr; gap: 18px; align-items: start; }
  @media (min-width: 900px) {
    /* The brief is reference material and needs less room than the answer being written in it. */
    .wr-split { grid-template-columns: minmax(0, 0.78fr) minmax(0, 1fr); gap: 22px; }
    .wr-brief { grid-column: 1; grid-row: 1; }
    .wr-answer { grid-column: 2; grid-row: 1; }
    .wr-feedback { grid-column: 1 / -1; grid-row: 2; }
  }
  .wr-brief { order: 1; } .wr-answer { order: 2; } .wr-feedback { order: 3; min-width: 0; }

  .wr-pane {
    background: var(--color-surface-container-lowest); border-radius: 24px; padding: 22px 24px;
    box-shadow: 0 12px 40px rgba(0, 43, 109, 0.12); min-width: 0;
  }
  @media (max-width: 520px) { .wr-pane { padding: 18px 16px; border-radius: 20px; } }

  .wr-brief-head, .wr-answer-head {
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
    flex-wrap: wrap; margin-bottom: 12px;
  }
  .wr-eyebrow {
    font-size: 0.65rem; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--color-on-surface-variant); opacity: 0.72;
  }
  .wr-step, .wr-words {
    font-size: 0.7rem; font-weight: 700; color: var(--color-outline);
    font-variant-numeric: tabular-nums;
  }

  .wr-title {
    font-family: var(--font-headline); font-size: 1.45rem; font-weight: 800;
    letter-spacing: -0.025em; color: var(--color-primary); margin: 0 0 10px;
    text-wrap: balance; line-height: 1.2;
  }
  /* Tag-level rules live in .exam-rich in app/globals.css — see the note there. */
  .wr-prompt { font-size: 0.95rem; line-height: 1.7; color: var(--color-on-surface-variant); }

  .wr-points { list-style: none; margin: 16px 0 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
  .wr-points li { display: flex; align-items: flex-start; gap: 10px; font-size: 0.92rem; line-height: 1.55; color: var(--color-on-surface); }
  .wr-num {
    flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center;
    width: 22px; height: 22px; border-radius: 999px; margin-top: 1px;
    background: rgba(0, 43, 109, 0.08); color: var(--color-primary);
    font-size: 0.72rem; font-weight: 800; font-variant-numeric: tabular-nums;
  }

  .wr-hint {
    display: flex; align-items: flex-start; gap: 8px; margin: 16px 0 0; padding: 11px 13px;
    border-radius: 12px; background: var(--color-surface-container-low);
    border: 1px solid var(--color-outline-variant);
    font-size: 0.83rem; line-height: 1.55; color: var(--color-on-surface-variant);
  }
  .wr-hint svg { flex-shrink: 0; margin-top: 1px; color: var(--color-secondary); }
  .wr-hint strong { color: var(--color-on-surface); font-weight: 800; }

  .wr-images { display: grid; gap: 10px; margin-top: 16px; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); }
  .wr-images figure { margin: 0; }
  .wr-images img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; display: block; border-radius: 14px; background: var(--color-surface-container); }
  .wr-images figcaption { font-size: 0.75rem; font-weight: 700; text-align: center; margin-top: 6px; color: var(--color-on-surface-variant); }

  /* The letter frame: fixed chrome the candidate cannot edit, around the part they write. */
  .wr-letter { border: 1.5px solid var(--color-outline-variant); border-radius: 16px; overflow: hidden; }
  .wr-mail { display: grid; grid-template-columns: auto 1fr; margin: 0; }
  .wr-mail dt {
    padding: 11px 14px; font-size: 0.68rem; font-weight: 800; letter-spacing: 0.09em;
    text-transform: uppercase; color: var(--color-on-surface-variant); align-self: center;
    background: var(--color-surface-container-low);
  }
  .wr-mail dd {
    margin: 0; padding: 11px 14px; font-size: 0.9rem; color: var(--color-on-surface);
    background: var(--color-surface-container-low);
  }
  .wr-mail dt, .wr-mail dd { border-bottom: 1px solid var(--color-outline-variant); }
  .wr-body { padding: 16px; }
  /*
   * white-space: pre-line, because greeting and closing are authored plain text and carry real
   * newlines. At A2 each was a single line ("Beste meneer Jansen,") so nothing showed. B1's
   * sentence_completion puts the whole given half of the bericht in them — an aanhef, a blank
   * line, one or two sentences, then the unfinished sentence — and without this the browser
   * collapses all of it into one paragraph: "Geachte heer, mevrouw, Ik ben Amina Yildiz en …".
   * pre-line collapses runs of spaces but honours newlines, which is exactly the authored shape.
   */
  .wr-fixed {
    margin: 0 0 12px; font-size: 0.95rem; color: var(--color-on-surface);
    white-space: pre-line;
  }
  .wr-fixed-end { margin: 12px 0 0; }

  .wr-textarea {
    width: 100%; border-radius: 12px; padding: 0.875rem 1rem; font: inherit; font-size: 0.95rem;
    line-height: 1.75; resize: vertical; background: var(--color-surface);
    color: var(--color-on-surface); border: 1.5px solid var(--color-outline-variant);
    transition: border-color .18s ease;
  }
  .wr-textarea:focus { outline: none; border-color: var(--color-secondary-container); }
  .wr-textarea:focus-visible { outline: 3px solid var(--color-secondary); outline-offset: 1px; }
  .wr-reading { animation: wr-pulse 1.6s ease-in-out infinite; }
  @keyframes wr-pulse {
    0%, 100% { border-color: var(--color-outline-variant); }
    50% { border-color: var(--color-secondary-container); }
  }

  .wr-marked { margin: 0; font-size: 0.95rem; line-height: 2; color: var(--color-on-surface); }
  .wr-mark { position: relative; background: none; color: inherit; border-radius: 3px; padding: 1px 0; cursor: help; }
  /* Green is already this codebase's success accent (globals.css .info-box-green). */
  .wr-mark-good { box-shadow: inset 0 -0.42em 0 rgba(76, 175, 122, 0.26); }
  .wr-mark-improve { box-shadow: inset 0 -0.42em 0 rgba(254, 118, 44, 0.32); }
  .wr-mark-note {
    position: absolute; left: 0; bottom: calc(100% + 8px); z-index: 5; width: max-content;
    max-width: 250px; padding: 8px 10px; border-radius: 10px; background: var(--color-on-surface);
    color: #fff; font-size: 0.75rem; line-height: 1.5; opacity: 0; pointer-events: none;
    transition: opacity 140ms ease;
  }
  .wr-mark:hover .wr-mark-note, .wr-mark:focus-visible .wr-mark-note { opacity: 1; }

  .wr-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 14px; }
  .wr-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 9px;
    padding: 0.8rem 1.35rem; border-radius: 14px; cursor: pointer; font: inherit;
    font-size: 0.88rem; font-weight: 800; border: 0;
    transition: transform 180ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 180ms ease;
  }
  .wr-btn:hover { transform: translateY(-2px); }
  .wr-btn:active { transform: translateY(0) scale(0.98); }
  .wr-btn:focus-visible { outline: 3px solid var(--color-secondary); outline-offset: 2px; }
  .wr-btn:disabled { opacity: 0.5; cursor: default; }
  .wr-btn:disabled:hover { transform: none; }
  .wr-btn-primary { background: var(--gradient-btn-orange); color: #5f2200; box-shadow: var(--shadow-btn-orange); }
  .wr-btn-ghost { background: transparent; color: var(--color-primary); border: 1.5px solid var(--color-primary); }

  .wr-locked { display: inline-flex; align-items: center; gap: 6px; font-size: 0.76rem; color: var(--color-outline); }
  .wr-spin { animation: wr-rotate 900ms linear infinite; }
  @keyframes wr-rotate { to { transform: rotate(360deg); } }

  @media (prefers-reduced-motion: reduce) {
    .wr-btn, .wr-textarea { transition: none; }
    .wr-btn:hover { transform: none; }
    .wr-spin, .wr-reading { animation: none; }
  }
`;

function MailRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/70 self-center">
        {label}
      </dt>
      <dd className="text-sm text-on-surface m-0">{value}</dd>
    </>
  );
}

function FormAnswer({
  fields,
  value,
  onChange,
}: {
  fields: FormField[];
  value: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}) {
  const set = (key: string, v: string) => onChange({ ...value, [key]: v });

  return (
    <div
      className="rounded-2xl bg-surface-container-lowest flex flex-col gap-4"
      style={{ padding: '1.375rem 1.5rem', boxShadow: 'var(--shadow-card-md)' }}
    >
      {fields.map(f => (
        <div key={f.key} className="flex flex-col gap-1.5">
          <label
            className="text-xs font-bold uppercase tracking-wider text-on-surface-variant"
            htmlFor={`form-${f.key}`}
          >
            {f.label}
          </label>

          {f.type === 'radio' || f.type === 'checkbox' ? (
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={f.label}>
              {(f.options ?? []).map(opt => {
                const active = value[f.key] === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => set(f.key, opt)}
                    className="exam-chip rounded-full text-sm font-semibold cursor-pointer"
                    style={{
                      padding: '0.45rem 0.95rem',
                      background: active ? '#fff6ec' : 'var(--color-surface-container)',
                      border: `1.5px solid ${active ? '#fe762c' : 'transparent'}`,
                      color: active ? '#a24000' : 'var(--color-on-surface-variant)',
                      font: 'inherit',
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          ) : (
            <input
              id={`form-${f.key}`}
              type={f.type === 'date' ? 'date' : 'text'}
              value={value[f.key] ?? ''}
              placeholder={f.placeholder}
              onChange={e => set(f.key, e.target.value)}
              className="exam-textarea rounded-xl bg-surface-container text-on-surface"
              style={{
                padding: '0.65rem 0.875rem',
                fontSize: '0.95rem',
                border: '1.5px solid var(--color-outline-variant)',
                font: 'inherit',
              }}
            />
          )}
        </div>
      ))}

      <style>{`
        .exam-chip { transition: background-color .16s ease, border-color .16s ease, color .16s ease; }
        .exam-chip:hover { background: var(--color-surface-container-high); }
        .exam-chip:focus-visible { outline: 3px solid var(--color-secondary); outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { .exam-chip { transition: none; } }
      `}</style>
    </div>
  );
}

/** `form_schema` may be a flat field list or grouped into sections; both flatten to rows. */
function flattenFields(task: OpenTaskItem): FormField[] {
  const schema = task.form_schema;
  if (!schema) return [];
  if (schema.sections?.length) return schema.sections.flatMap(s => s.fields ?? []);
  return schema.fields ?? [];
}
