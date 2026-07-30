'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import OptionImagePicker from './OptionImagePicker';

/**
 * The question editor, against the post-fork schema.
 *
 * Three things changed and all three were silently broken before: a question hangs off a
 * **stimulus** (there is no `exam` integer any more — the exam is derived from the stimulus
 * by a trigger), options are **rows** in `question_options` rather than `option_a..c`, and
 * there may be **three or four** of them, holding text or images.
 *
 * Options are reconciled by label rather than deleted and re-inserted: a delete would cascade
 * `user_question_results.chosen_option_id` to NULL and quietly erase which answer past
 * candidates actually picked.
 */

export type OptionDraft = {
  id?: number;
  label: 'A' | 'B' | 'C' | 'D';
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

export type StimulusChoice = {
  id: number;
  skill: string;
  exam_number: number;
  sort_order: number;
  title: string | null;
  kind: string;
};

const LABELS = ['A', 'B', 'C', 'D'] as const;

const LAYOUTS: { value: QuestionDraft['option_layout']; label: string; hint: string }[] = [
  { value: 'text', label: 'Tekst', hint: 'Elke optie is een korte tekst.' },
  { value: 'image', label: 'Eén afbeelding', hint: 'Elke optie is één afbeelding.' },
  { value: 'image_grid', label: 'Meerdere afbeeldingen', hint: 'Elke optie is een setje afbeeldingen.' },
];

function emptyDraft(): QuestionDraft {
  return {
    stimulus_id: null,
    sort_order: 1,
    prompt: '',
    explanation: '',
    image_url: '',
    option_layout: 'text',
    options: LABELS.slice(0, 3).map(label => ({
      label, body: '', image_urls: [], image_alt: '', is_correct: label === 'A',
    })),
  };
}

export default function QuestionForm({
  initial,
  stimuli,
  locale,
}: {
  initial?: QuestionDraft;
  stimuli: StimulusChoice[];
  locale: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<QuestionDraft>(initial ?? emptyDraft());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isNew = !form.id;
  const usesImages = form.option_layout !== 'text';

  const grouped = useMemo(() => {
    const acc: Record<string, StimulusChoice[]> = {};
    for (const s of stimuli) {
      const key = `${s.skill} — examen ${s.exam_number}`;
      (acc[key] ??= []).push(s);
    }
    return acc;
  }, [stimuli]);

  function patch(next: Partial<QuestionDraft>) {
    setForm(f => ({ ...f, ...next }));
    setSaved(false);
  }

  function patchOption(label: string, next: Partial<OptionDraft>) {
    patch({ options: form.options.map(o => (o.label === label ? { ...o, ...next } : o)) });
  }

  function setCorrect(label: string) {
    patch({ options: form.options.map(o => ({ ...o, is_correct: o.label === label })) });
  }

  function addOption() {
    const next = LABELS[form.options.length];
    if (!next) return;
    patch({
      options: [...form.options, { label: next, body: '', image_urls: [], image_alt: '', is_correct: false }],
    });
  }

  function removeLastOption() {
    if (form.options.length <= 3) return;
    const dropped = form.options[form.options.length - 1];
    const kept = form.options.slice(0, -1);
    // If the dropped option was the correct one, fall back to A rather than saving a
    // question with no answer key at all.
    patch({ options: dropped.is_correct ? kept.map(o => ({ ...o, is_correct: o.label === 'A' })) : kept });
  }

  function validate(): string | null {
    if (!form.stimulus_id) return 'Kies eerst een stimulus — een vraag hangt altijd aan een tekst, afbeelding of fragment.';
    if (!form.prompt.trim()) return 'De vraag mag niet leeg zijn.';
    if (!form.explanation.trim()) return 'Vul de uitleg in — die hoort bij het Compleet-pakket.';
    if (form.options.length < 3) return 'Een vraag heeft minimaal 3 opties.';
    if (!form.options.some(o => o.is_correct)) return 'Markeer één optie als het juiste antwoord.';
    for (const o of form.options) {
      const hasContent = usesImages ? o.image_urls.length > 0 : Boolean(o.body.trim());
      if (!hasContent) return `Optie ${o.label} heeft nog geen ${usesImages ? 'afbeelding' : 'tekst'}.`;
    }
    return null;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const problem = validate();
    if (problem) { setError(problem); return; }

    setSaving(true);
    setError('');
    const supabase = createClient();

    // `exam_id` is deliberately absent: a BEFORE trigger derives it from the stimulus, so
    // sending it here would just create a second version of the truth.
    const row = {
      stimulus_id: form.stimulus_id,
      sort_order: form.sort_order,
      prompt: form.prompt.trim(),
      explanation: form.explanation.trim(),
      image_url: form.image_url.trim() || null,
      option_layout: form.option_layout,
    };

    let questionId = form.id;
    if (isNew) {
      const { data, error: err } = await supabase.from('questions').insert(row).select('id').single();
      if (err) { setSaving(false); setError(err.message); return; }
      questionId = (data as { id: number }).id;
    } else {
      const { error: err } = await supabase.from('questions').update(row).eq('id', questionId!);
      if (err) { setSaving(false); setError(err.message); return; }
    }

    const optionRows = form.options.map((o, i) => ({
      question_id: questionId!,
      label: o.label,
      sort_order: i + 1,
      body: usesImages ? (o.body.trim() || null) : o.body.trim(),
      image_urls: usesImages ? o.image_urls : [],
      image_alt: o.image_alt.trim() || null,
      // Written false for every row first: `question_options_one_correct_idx` is a unique
      // partial index, so upserting the new correct option while the old one is still true
      // trips a duplicate-key error.
      is_correct: false,
    }));

    const { error: optErr } = await supabase
      .from('question_options')
      .upsert(optionRows, { onConflict: 'question_id,label' });
    if (optErr) { setSaving(false); setError(optErr.message); return; }

    const keptLabels = form.options.map(o => o.label);
    const { error: delErr } = await supabase
      .from('question_options')
      .delete()
      .eq('question_id', questionId!)
      .not('label', 'in', `(${keptLabels.join(',')})`);
    if (delErr) { setSaving(false); setError(delErr.message); return; }

    const correctLabel = form.options.find(o => o.is_correct)!.label;
    const { error: corErr } = await supabase
      .from('question_options')
      .update({ is_correct: true })
      .eq('question_id', questionId!)
      .eq('label', correctLabel);
    if (corErr) { setSaving(false); setError(corErr.message); return; }

    setSaving(false);
    setSaved(true);
    if (isNew) router.push(`/${locale}/admin/questions`);
    else router.refresh();
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setSaving(true);
    const { error: err } = await createClient().from('questions').delete().eq('id', form.id!);
    if (err) { setSaving(false); setError(err.message); return; }
    router.push(`/${locale}/admin/questions`);
  }

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-5">
      {error && (
        <div className="bg-error/10 border border-error/20 rounded-xl p-3 text-sm text-error">{error}</div>
      )}

      <div className="grid grid-cols-[1fr_auto] gap-4">
        <Field label="Stimulus" hint="De tekst, afbeelding of het fragment waar deze vraag bij hoort.">
          <select
            value={form.stimulus_id ?? ''}
            onChange={e => patch({ stimulus_id: e.target.value ? parseInt(e.target.value, 10) : null })}
            required
            className="field"
          >
            <option value="">Kies stimulus…</option>
            {Object.entries(grouped).map(([group, items]) => (
              <optgroup key={group} label={group}>
                {items.map(s => (
                  <option key={s.id} value={s.id}>
                    #{s.sort_order} · {s.kind} · {s.title || `stimulus ${s.id}`}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>
        <Field label="Positie" hint="Binnen de stimulus.">
          <input
            type="number"
            min={1}
            value={form.sort_order}
            onChange={e => patch({ sort_order: Math.max(1, parseInt(e.target.value, 10) || 1) })}
            className="field"
            style={{ width: 90 }}
          />
        </Field>
      </div>

      {stimuli.length === 0 && (
        <p className="text-sm text-on-surface-variant">
          Er zijn nog geen stimuli. Maak er eerst een aan bij het examen.
        </p>
      )}

      <Field label="Vraag">
        <textarea
          value={form.prompt}
          onChange={e => patch({ prompt: e.target.value })}
          required
          rows={3}
          className="field resize-none"
        />
      </Field>

      <Field label="Soort opties">
        <div className="flex flex-wrap gap-2">
          {LAYOUTS.map(l => (
            <button
              key={l.value}
              type="button"
              onClick={() => patch({ option_layout: l.value })}
              title={l.hint}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                form.option_layout === l.value
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface-container text-on-surface-variant border-outline-variant hover:bg-surface-container-high'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-on-surface-variant">
          {LAYOUTS.find(l => l.value === form.option_layout)?.hint}
        </p>
      </Field>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-on-surface">Antwoordopties</p>
          <div className="flex items-center gap-2">
            {form.options.length > 3 && (
              <button
                type="button"
                onClick={removeLastOption}
                className="inline-flex items-center gap-1 text-xs font-medium text-error hover:underline"
              >
                <X size={13} strokeWidth={2.5} aria-hidden />
                Optie {form.options[form.options.length - 1].label} weg
              </button>
            )}
            {form.options.length < 4 && (
              <button
                type="button"
                onClick={addOption}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <Plus size={13} strokeWidth={2.5} aria-hidden />
                Optie D
              </button>
            )}
          </div>
        </div>

        {form.options.map(o => (
          <div key={o.label} className="rounded-xl border border-outline-variant p-3 space-y-2">
            <div className="flex items-start gap-3">
              <label className="flex items-center gap-2 mt-1.5 cursor-pointer shrink-0">
                <input
                  type="radio"
                  name="correct"
                  checked={o.is_correct}
                  onChange={() => setCorrect(o.label)}
                  className="accent-primary w-4 h-4"
                />
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                  {o.label}
                </span>
              </label>
              <input
                value={o.body}
                onChange={e => patchOption(o.label, { body: e.target.value })}
                placeholder={usesImages ? `Toelichting bij optie ${o.label} (optioneel)` : `Optie ${o.label}`}
                required={!usesImages}
                className="field flex-1"
              />
            </div>

            {usesImages && (
              <div className="pl-[52px] space-y-2">
                <OptionImagePicker
                  urls={o.image_urls}
                  max={form.option_layout === 'image' ? 1 : 3}
                  query={form.prompt}
                  onChange={urls => patchOption(o.label, { image_urls: urls })}
                />
                <input
                  value={o.image_alt}
                  onChange={e => patchOption(o.label, { image_alt: e.target.value })}
                  placeholder="Alt-tekst (voor schermlezers)"
                  className="field"
                />
              </div>
            )}
          </div>
        ))}
        <p className="text-xs text-on-surface-variant">
          Markeer met het bolletje welke optie juist is. Precies één per vraag.
        </p>
      </div>

      <Field label="Uitleg" hint="Zichtbaar in het Compleet-pakket na het inleveren.">
        <textarea
          value={form.explanation}
          onChange={e => patch({ explanation: e.target.value })}
          required
          rows={3}
          className="field resize-none"
        />
      </Field>

      <Field label="Afbeelding bij de vraag zelf (optioneel)" hint="Niet de stimulus — een plaatje dat bij deze ene vraag hoort.">
        <input
          value={form.image_url}
          onChange={e => patch({ image_url: e.target.value })}
          placeholder="https://…"
          className="field"
        />
      </Field>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-container transition-colors disabled:opacity-50"
        >
          {saving
            ? <><Loader2 size={16} className="animate-spin" aria-hidden /> Opslaan…</>
            : saved
              ? <><Check size={16} aria-hidden /> Opgeslagen</>
              : <><Save size={16} aria-hidden /> Opslaan</>}
        </button>

        {!isNew && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              confirmDelete ? 'bg-error text-white' : 'border border-error/30 text-error hover:bg-error/10'
            }`}
          >
            <Trash2 size={16} aria-hidden />
            {confirmDelete ? 'Zeker verwijderen?' : 'Verwijderen'}
          </button>
        )}

        {confirmDelete && (
          <button
            type="button"
            onClick={() => setConfirmDelete(false)}
            className="text-sm text-on-surface-variant hover:text-on-surface"
          >
            Annuleren
          </button>
        )}
      </div>

      <style>{`
        .field {
          width: 100%;
          border: 1px solid var(--color-outline-variant);
          border-radius: 0.75rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
          background: var(--color-surface);
          color: var(--color-on-surface);
        }
        .field:focus { border-color: var(--color-primary); }
      `}</style>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-on-surface block">{label}</label>
      {children}
      {hint && <p className="text-xs text-on-surface-variant">{hint}</p>}
    </div>
  );
}
