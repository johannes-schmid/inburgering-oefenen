'use client';

import { useMemo, type ReactNode } from 'react';
import { Check, Info, Loader2, Lock, RotateCcw } from 'lucide-react';
import type { FeedbackHighlight, RubricFeedbackState } from './RubricFeedback';
import './glas-player.css';
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

  /* Glas §10 "Schrijven": de opdracht links op wit met de punten in een mistvlak, rechts de
     e-mail als envelop (Aan/Onderwerp, dan de tekst), de beoordeling eronder over de hele breedte. */
  return (
    <div className="g-xwrite">
      {/* ── Left: the opdracht ── */}
      <section className="g-xbody">
        <div className="g-xqhead" style={{ justifyContent: 'space-between' }}>
          <span className="g-mono">De opdracht</span>
          <span className="g-mono g-tnum">{taskNumber} / {total}</span>
        </div>

        {task.title && <h2 className="g-xtitle">{task.title}</h2>}

        {task.prompt_html && (
          <div className="g-xprompt exam-rich exam-rich-scroll" dangerouslySetInnerHTML={{ __html: task.prompt_html }} />
        )}

        {/* Numbered rather than bulleted: these are the points the rubric checks off one by one,
            so the candidate can count them against what they wrote. */}
        {task.bullet_points.length > 0 && (
          <ol className="g-xpoints">
            {task.bullet_points.map((b, i) => (
              <li key={i}>
                <span className="n">{i + 1}</span>
                <span>{b}</span>
              </li>
            ))}
          </ol>
        )}

        {(task.min_sentences || task.greeting) && (
          <p className="g-xnotice">
            <Info strokeWidth={2.3} aria-hidden />
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
          <div className="g-ximgs">
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
      <section className="g-xbody">
        <div className="g-xqhead" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
          <span className="g-mono">{paneLabel}</span>
          {graded && <span className="g-xbdg g-xbdg-goed"><Check strokeWidth={3} aria-hidden />Ingeleverd</span>}
        </div>

        {isForm ? (
          <FormAnswer
            fields={fields}
            value={answer.json ?? {}}
            onChange={json => onChange({ ...answer, json })}
          />
        ) : (
          <div className="g-xmail">
            {isMail && (
              <dl style={{ margin: 0 }}>
                {task.email_to && <MailRow label="Aan" value={task.email_to} />}
                {task.email_cc && <MailRow label="Cc" value={task.email_cc} />}
                {task.email_subject && <MailRow label="Onderwerp" value={task.email_subject} />}
              </dl>
            )}

            <div className="g-xmail-t">
              {task.greeting && <p className="g-xmail-fixed">{task.greeting}</p>}

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
                    className="g-xtextarea"
                    readOnly={grading}
                  />
                </label>
              )}

              {task.closing && <p className="g-xmail-fixed g-xmail-fixed-end">{task.closing}</p>}
            </div>

            <div className="g-xmail-ft">
              <span className="g-mono g-tnum" style={{ fontSize: 11 }}>
                {words} {words === 1 ? 'woord' : 'woorden'}
              </span>
              {graded && review && review.highlights.length > 0 && (
                <span style={{ display: 'flex', gap: 12 }}>
                  <span className="g-xmark g-xmark-good">goed</span>
                  <span className="g-xmark g-xmark-improve">kan beter</span>
                </span>
              )}
            </div>
          </div>
        )}

        {review && (
          <div className="g-xactions">
            {graded ? (
              <button type="button" onClick={review.onGrade} className="g-btn g-btn-ghost g-btn-sm">
                <RotateCcw aria-hidden />
                Opnieuw nakijken
              </button>
            ) : (
              <button
                type="button"
                onClick={review.onGrade}
                disabled={grading || (!answer.text.trim() && !answer.json)}
                className="g-btn g-btn-navy"
              >
                {grading ? (
                  <>
                    <Loader2 className="g-xspin" aria-hidden /> Nakijken…
                  </>
                ) : (
                  <>
                    <Check strokeWidth={2.8} aria-hidden /> Beoordeel mijn tekst
                  </>
                )}
              </button>
            )}

            {graded && !canSeeModelAnswer && (
              <span className="g-xlocked">
                <Lock aria-hidden />
                Modelantwoord van de docent in Compleet
              </span>
            )}
          </div>
        )}
      </section>

      {feedback && <div className="g-xwrite-fb">{feedback}</div>}
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
      <mark key={i} className={`g-xmark g-xmark-${h.kind}`} tabIndex={0}>
        {text.slice(h.start, h.end)}
        <span className="g-xmark-note">{h.note}</span>
      </mark>
    );
    cursor = h.end;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <p className="g-xmarked">{parts}</p>;
}

function MailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="g-xmail-r">
      <dt style={{ width: 84, flex: 'none', color: 'var(--ink-2)' }}>{label}</dt>
      <dd style={{ margin: 0, color: 'var(--ink)', minWidth: 0 }}>{value}</dd>
    </div>
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
    <div className="g-xform">
      {fields.map(f => (
        <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label className="g-xform-l" htmlFor={`form-${f.key}`}>
            {f.label}
          </label>

          {f.type === 'radio' || f.type === 'checkbox' ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }} role="radiogroup" aria-label={f.label}>
              {(f.options ?? []).map(opt => (
                <button
                  key={opt}
                  type="button"
                  role="radio"
                  aria-checked={value[f.key] === opt}
                  onClick={() => set(f.key, opt)}
                  className="g-xpick"
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <input
              id={`form-${f.key}`}
              type={f.type === 'date' ? 'date' : 'text'}
              value={value[f.key] ?? ''}
              placeholder={f.placeholder}
              onChange={e => set(f.key, e.target.value)}
              className="g-xinput"
            />
          )}
        </div>
      ))}
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
