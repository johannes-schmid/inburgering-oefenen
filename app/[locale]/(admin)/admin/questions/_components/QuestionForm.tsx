'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import OptionImagePicker from './OptionImagePicker';
import MagicFill from '../../../_components/MagicFill';
import LengthMeter from '../../../_components/LengthMeter';
import { isLevel } from '@/data/skills';
import { stripHtml } from '@/lib/admin/length-targets';
import {
  OPTION_LABELS, blankQuestion, saveQuestionDraft, validateQuestion,
  type OptionDraft, type QuestionDraft,
} from '@/lib/admin/question-write';

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

// The drafts and the write rules moved to `lib/admin/question-write.ts` when the fragment page
// became a second thing that saves questions. Re-exported because the page routes import them
// from here.
export type { OptionDraft, QuestionDraft };

export type StimulusChoice = {
  id: number;
  skill: string;
  /** From the fragment's exam. Null for a non-levelled onderdeel; see `skills.is_levelled`. */
  level: string | null;
  exam_number: number;
  sort_order: number;
  title: string | null;
  kind: string;
};

const LABELS = OPTION_LABELS;

const LAYOUTS: { value: QuestionDraft['option_layout']; label: string; hint: string }[] = [
  { value: 'text', label: 'Tekst', hint: 'Elke optie is een korte tekst.' },
  { value: 'image', label: 'Eén afbeelding', hint: 'Elke optie is één afbeelding.' },
  { value: 'image_grid', label: 'Meerdere afbeeldingen', hint: 'Elke optie is een setje afbeeldingen.' },
];

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
  const [form, setForm] = useState<QuestionDraft>(initial ?? blankQuestion(1));
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

  /** The fragment currently picked — it decides the level and skill a suggestion is written at. */
  const chosen = stimuli.find(s => s.id === form.stimulus_id) ?? null;

  /**
   * The text of the picked fragment.
   *
   * Fetched on demand rather than shipped with the picker: `fetchStimulusChoices` returns every
   * fragment in the database, and carrying 400 `body_html` values into the page payload to display
   * one of them is a large cost for a small panel. The browser client reads it under the same admin
   * policies the rest of this screen uses.
   */
  const [fragment, setFragment] = useState<{
    id: number; intro: string | null; body_html: string | null; script: string | null;
  } | null>(null);

  const loadFragment = useCallback(async (id: number | null) => {
    if (id == null) { setFragment(null); return; }
    const { data } = await createClient()
      .from('stimuli')
      .select('id, intro, body_html, script')
      .eq('id', id)
      .maybeSingle();
    setFragment((data as typeof fragment) ?? null);
  }, []);

  useEffect(() => {
    // Synchronising with the database when the selection changes is what effects are for; the
    // state it sets is the fetched row, after an await, and it cannot loop because the only
    // dependency is the id itself.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadFragment(form.stimulus_id);
  }, [form.stimulus_id, loadFragment]);

  const fragmentText = fragment
    ? (fragment.script?.trim() || stripHtml(fragment.body_html ?? ''))
    : '';

  /**
   * The level the length meters measure against.
   *
   * Read off the picked fragment, so before one is chosen there is no meter rather than an A2 one:
   * a B1 item measured against A2 guidance reads as "wat lang" on every field, which trains the
   * docent to ignore the meter exactly where it would have been worth something.
   */
  const meterLevel = isLevel(chosen?.level) ? chosen.level : null;

  /**
   * Drop a suggested question into the form.
   *
   * Options are replaced wholesale in the *draft*, which is not the same as replacing them in the
   * database: `handleSave` still reconciles by label and never deletes a row that a candidate's
   * `chosen_option_id` points at. Nothing here saves, and `review_status` is untouched — the
   * suggestion is a starting point the docent then owns.
   */
  function applySuggestion(s: {
    prompt: string;
    explanation: string;
    options: { label: 'A' | 'B' | 'C' | 'D'; body: string; is_correct: boolean }[];
  }) {
    patch({
      prompt: s.prompt || form.prompt,
      explanation: s.explanation || form.explanation,
      // Text only. An image-option question's answers are pictures the docent picks herself, so
      // overwriting the layout's option bodies there would say nothing and lose her image sets.
      options: usesImages
        ? form.options
        : s.options.map(o => ({
            label: o.label,
            body: o.body,
            image_urls: [],
            image_alt: '',
            is_correct: o.is_correct,
          })),
    });
  }

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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const problem = validateQuestion(form);
    if (problem) { setError(problem); return; }

    setSaving(true);
    setError('');

    // Every rule about how these rows are written lives in `saveQuestionDraft` — reconciliation
    // by label, the false-first upsert, and never sending `exam_id`. See the note at the top of
    // that module for why each one matters.
    try {
      await saveQuestionDraft(createClient(), form);
    } catch (err) {
      setSaving(false);
      setError(err instanceof Error ? err.message : 'Opslaan is niet gelukt.');
      return;
    }

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

      {/* The fragment's own words, so "does this vraag have one defensible answer?" is answerable
          without opening a second screen. Read-only: this editor owns the question, and a second
          place to edit the fragment is a second place to break `stimuli_payload_matches_kind`. */}
      {(fragmentText || fragment?.intro) && (
        <section className="rounded-xl border border-outline-variant bg-surface-container-low p-3">
          <p className="m-0 mb-1.5 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Het fragment
          </p>
          {fragment?.intro && (
            <p className="m-0 mb-1.5 text-xs italic text-on-surface-variant">{fragment.intro}</p>
          )}
          <p className="m-0 max-h-56 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-on-surface">
            {fragmentText}
          </p>
        </section>
      )}

      {/* Below the picker, not above it: the suggestion is written *for* a fragment, so the
          fragment is the first decision. Disabled until one is chosen, with the reason said out
          loud — the route rejects it anyway, and a button that 400s teaches nothing. */}
      <MagicFill
        placeholder="Bijv. een vraag over de openingstijden (mag leeg)"
        disabled={!chosen}
        disabledReason={
          chosen
            ? undefined
            : 'Kies eerst een stimulus — een vraag wordt bij een bestaand fragment bedacht.'
        }
        body={() => ({
          target: 'question',
          stimulusId: form.stimulus_id,
          level: chosen?.level ?? undefined,
          skill: chosen?.skill,
        })}
        onSuggestion={applySuggestion}
      />

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
        {meterLevel && (
          <LengthMeter text={form.prompt} level={meterLevel} field="prompt" skill={chosen?.skill} />
        )}
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
            {/* Text options only: on an image question the body is an optional caption, and a
                guideline about its length would be advice about the wrong thing. */}
            {meterLevel && !usesImages && (
              <LengthMeter text={o.body} level={meterLevel} field="option" skill={chosen?.skill} />
            )}

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
        {meterLevel && (
          <LengthMeter
            text={form.explanation}
            level={meterLevel}
            field="explanation"
            skill={chosen?.skill}
            showSentences
          />
        )}
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
