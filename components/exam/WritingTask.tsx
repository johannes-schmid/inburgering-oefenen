'use client';

import { useMemo, type ReactNode } from 'react';
import { Check, Info, Loader2, Lock, RotateCcw } from 'lucide-react';
import type { FeedbackHighlight, RubricFeedbackState } from './RubricFeedback';
import './glas-player.css';
import type { OpenTaskItem } from '@/lib/exam-content';
import { normalizeFormSchema, type FormField, type FormSection } from '@/lib/form-schema';

/** Korter dan dit (zonder plaatjes) staan opdracht en antwoord onder elkaar, zoals bij DUO. */
const STACK_BELOW_CHARS = 700;
/** Het afzenderadres in het mailvenster; DUO toont hier het adres van de kandidaat. */
const MAIL_FROM = 'kandidaat@mail.nl';

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
  const sections = useMemo(() => normalizeFormSchema(task.form_schema), [task]);
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
  /* Een korte opdracht zonder plaatjes staat bóven het antwoord, over de hele breedte — zoals
     het mailvenster bij DUO. Is er veel te lezen, dan blijven opdracht en antwoord naast elkaar. */
  const promptChars =
    (task.prompt_html ?? '').replace(/<[^>]+>/g, '').length + task.bullet_points.join(' ').length;
  const stacked = task.images.length === 0 && promptChars < STACK_BELOW_CHARS;
  const formPart =
    sections.length > 0 ? (
      <FormAnswer sections={sections} value={answer.json ?? {}} onChange={json => onChange({ ...answer, json })} />
    ) : null;

  /* Glas §10 "Schrijven": de opdracht links op wit met de punten in een mistvlak, rechts de
     e-mail als envelop (Aan/Onderwerp, dan de tekst), de beoordeling eronder over de hele breedte. */
  return (
    <div className={stacked ? 'g-xwrite g-xwrite-stack' : 'g-xwrite'}>
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
          formPart
        ) : (
          <>
            {formPart}
            <div className="g-xmail">
              {isMail && (
                <>
                  <div className="g-xmail-bar" aria-hidden>
                    <span>{task.email_subject || 'Nieuw bericht'}</span>
                    <i /><i /><i />
                  </div>
                  <dl style={{ margin: 0 }}>
                    <MailRow label="Van" value={MAIL_FROM} />
                    {task.email_to && <MailRow label="Aan" value={task.email_to} />}
                    {task.email_cc && <MailRow label="Cc" value={task.email_cc} />}
                    {task.email_subject && <MailRow label="Onderwerp" value={task.email_subject} />}
                  </dl>
                </>
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
          </>
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
  sections,
  value,
  onChange,
}: {
  sections: FormSection[];
  value: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}) {
  const set = (key: string, v: string) => onChange({ ...value, [key]: v });

  return (
    <div className="g-xform">
      {sections.map((sec, i) => (
        <div key={i} className="g-xform-sec">
          {sec.title && <h3 className="g-xform-h">{sec.title}</h3>}
          {sec.fields.map(f => (
            <FormRow key={f.key} field={f} value={value[f.key] ?? f.prefill ?? ''} onChange={v => set(f.key, v)} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Meerdere keuzes worden als "a; b" bewaard: `answer_json` is één string per sleutel. */
const SEP = '; ';

function FormRow({ field: f, value, onChange }: { field: FormField; value: string; onChange: (v: string) => void }) {
  if (f.type === 'static') {
    return (
      <div className="g-xform-static">
        <span className="g-xform-l">{f.label}</span>
        <span>{f.value}</span>
      </div>
    );
  }

  if (f.type === 'radio' || f.type === 'checkbox') {
    const multi = f.type === 'checkbox';
    const picked = multi ? value.split(SEP).filter(Boolean) : [value];
    const toggle = (opt: string) => {
      if (!multi) return onChange(opt);
      const next = picked.includes(opt) ? picked.filter(p => p !== opt) : [...picked, opt];
      onChange((f.options ?? []).filter(o => next.includes(o)).join(SEP));
    };
    return (
      <div className="g-xform-row">
        <span className="g-xform-l" id={`form-${f.key}-l`}>
          {f.label}
          {multi && <span className="g-xform-hint"> · meer antwoorden mogelijk</span>}
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }} role={multi ? 'group' : 'radiogroup'} aria-labelledby={`form-${f.key}-l`}>
          {(f.options ?? []).map(opt => (
            <button
              key={opt}
              type="button"
              role={multi ? 'checkbox' : 'radio'}
              aria-checked={picked.includes(opt)}
              onClick={() => toggle(opt)}
              className={multi ? 'g-xpick g-xpick-box' : 'g-xpick'}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="g-xform-row">
      <label className="g-xform-l" htmlFor={`form-${f.key}`}>
        {f.label}
      </label>
      {f.multiline ? (
        <textarea
          id={`form-${f.key}`}
          value={value}
          placeholder={f.placeholder}
          onChange={e => onChange(e.target.value)}
          rows={3}
          className="g-xtextarea g-xform-area"
        />
      ) : (
        <input
          id={`form-${f.key}`}
          type={f.type === 'date' ? 'date' : 'text'}
          value={value}
          placeholder={f.placeholder}
          onChange={e => onChange(e.target.value)}
          className="g-xinput"
        />
      )}
    </div>
  );
}
