'use client';

import { useMemo } from 'react';
import type { FormField, OpenTaskItem } from '@/lib/exam-content';

export type WritingAnswer = { text: string; json: Record<string, string> | null };

type Props = {
  task: OpenTaskItem;
  answer: WritingAnswer;
  onChange: (next: WritingAnswer) => void;
  taskNumber: number;
  total: number;
};

/**
 * The four Schrijven shapes DUO publishes, in one component because they differ only in the
 * chrome around the input: an e-mail with a fixed Aan/Onderwerp and a seeded greeting and
 * closing the candidate writes *between*; a free short text with a minimum sentence count;
 * a form of typed rows; and a note driven by a picture sequence.
 *
 * `form` answers go to `answer_json`, everything else to `answer_text` — flattening a filled
 * form into prose is what makes a rubric prompt unparseable later.
 */
export default function WritingTask({ task, answer, onChange, taskNumber, total }: Props) {
  const fields = useMemo(() => flattenFields(task), [task]);
  const words = answer.text.trim() ? answer.text.trim().split(/\s+/).length : 0;

  return (
    <div className="flex flex-col gap-4">
      <div
        className="rounded-2xl bg-surface-container-lowest"
        style={{ padding: '1.375rem 1.5rem', boxShadow: 'var(--shadow-card-md)' }}
      >
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <span className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/70">
            Opdracht {taskNumber} van {total}
          </span>
          {task.min_sentences && (
            <span
              className="text-[0.65rem] font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
              style={{ background: '#fcecdd', color: '#a24000' }}
            >
              Minimaal {task.min_sentences} zinnen
            </span>
          )}
        </div>

        {task.title && (
          <h2
            className="font-headline font-bold text-on-surface mb-2.5"
            style={{ fontSize: '1.15rem', letterSpacing: '-0.01em', textWrap: 'balance' }}
          >
            {task.title}
          </h2>
        )}

        {task.prompt_html && (
          <div
            className="exam-task-prompt text-on-surface-variant"
            dangerouslySetInnerHTML={{ __html: task.prompt_html }}
          />
        )}

        {task.bullet_points.length > 0 && (
          <ul className="mt-3 mb-0 pl-5 flex flex-col gap-1.5">
            {task.bullet_points.map((b, i) => (
              <li key={i} className="text-sm leading-relaxed text-on-surface">{b}</li>
            ))}
          </ul>
        )}

        {task.images.length > 0 && (
          <div
            className="grid gap-3 mt-4"
            style={{ gridTemplateColumns: `repeat(auto-fit, minmax(140px, 1fr))` }}
          >
            {task.images.map(img => (
              <figure key={img.id} className="m-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.image_url}
                  alt={img.alt_text ?? ''}
                  className="rounded-xl"
                  style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', display: 'block' }}
                />
                {img.caption && (
                  <figcaption className="text-xs font-semibold text-on-surface-variant mt-1.5 text-center">
                    {img.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        )}

        <style>{`
          .exam-task-prompt { font-size: 0.95rem; line-height: 1.7; }
          .exam-task-prompt > * + * { margin-top: 0.75rem; }
          .exam-task-prompt p { margin: 0; }
        `}</style>
      </div>

      {/* ── The answer surface ── */}
      {task.task_type === 'form' ? (
        <FormAnswer
          fields={fields}
          value={answer.json ?? {}}
          onChange={json => onChange({ ...answer, json })}
        />
      ) : (
        <div
          className="rounded-2xl bg-surface-container-lowest"
          style={{ padding: '1.25rem 1.375rem', boxShadow: 'var(--shadow-card-md)' }}
        >
          {task.task_type === 'email' && (
            <dl
              className="grid gap-x-4 gap-y-1.5 mb-4 pb-4 m-0"
              style={{ gridTemplateColumns: 'auto 1fr', borderBottom: '1px solid var(--color-outline-variant)' }}
            >
              {task.email_to && <MailRow label="Aan" value={task.email_to} />}
              {task.email_cc && <MailRow label="Cc" value={task.email_cc} />}
              {task.email_subject && <MailRow label="Onderwerp" value={task.email_subject} />}
            </dl>
          )}

          {task.greeting && (
            <p className="text-sm font-semibold text-on-surface m-0 mb-2.5">{task.greeting}</p>
          )}

          <label className="block">
            <span className="sr-only">Jouw antwoord</span>
            <textarea
              value={answer.text}
              onChange={e => onChange({ ...answer, text: e.target.value })}
              rows={task.task_type === 'email' ? 9 : 7}
              placeholder="Schrijf hier je antwoord…"
              className="exam-textarea w-full rounded-xl bg-surface-container text-on-surface"
              style={{
                padding: '0.875rem 1rem',
                fontSize: '0.95rem',
                lineHeight: 1.7,
                border: '1.5px solid var(--color-outline-variant)',
                resize: 'vertical',
                font: 'inherit',
              }}
            />
          </label>

          {task.closing && (
            <p className="text-sm font-semibold text-on-surface m-0 mt-2.5">{task.closing}</p>
          )}

          <p className="text-xs text-on-surface-variant mt-2.5 mb-0" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {words} {words === 1 ? 'woord' : 'woorden'}
          </p>

          <style>{`
            .exam-textarea { transition: border-color .18s ease; }
            .exam-textarea:focus { outline: none; border-color: #fe762c; }
            .exam-textarea:focus-visible { outline: 3px solid var(--color-secondary); outline-offset: 1px; }
            @media (prefers-reduced-motion: reduce) { .exam-textarea { transition: none; } }
          `}</style>
        </div>
      )}
    </div>
  );
}

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
