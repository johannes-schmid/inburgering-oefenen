'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, GripVertical, Info, Loader2, Plus, Save, Sparkles, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  categoriesForSkill,
  categoryLabel,
  MAX_CRITERION_SCORE,
  type RubricCriterion,
  type RubricSkill,
} from '@/lib/rubrics';
import { draftCriteria, draftSystemPrompt } from '@/lib/rubric-templates';
import type { RubricDraft } from '../_draft';
import { LEVELS, levelLabel, type Level } from '@/data/skills';

/**
 * The rubric editor.
 *
 * ## Versioning is the whole design of this form
 * `open_criterion_scores.rubric_version` is what makes a stored grade interpretable a year later.
 * So a rubric that has already graded somebody is **never** mutated: saving it inserts
 * version + 1 and leaves the old row intact. A rubric nobody has been graded against is edited in
 * place, because minting v2, v3, v4 while the docent is still drafting would be noise.
 *
 * `used_count` (from `open_criterion_scores`) is what distinguishes the two, not `active` — a
 * rubric can be deactivated and still have graded a hundred candidates.
 *
 * ## Activation
 * `rubrics_one_active_idx` is `UNIQUE (skill, task_type) WHERE active`, so exactly one version per
 * category can be live. Activating v2 therefore has to deactivate v1 **first** — the other order
 * trips the index. Supabase's JS client has no transaction, so this is two statements; for a
 * single-docent admin the window between them is not a real risk, but the order is not optional.
 */


const ANCHOR_KEYS = ['0', '1', '2', '3'] as const;

function emptyCriterion(): RubricCriterion {
  return {
    key: '',
    criterion: '',
    description: '',
    anchors: { '0': '', '1': '', '2': '', '3': '' },
  };
}

export default function RubricForm({
  initial,
  locale,
}: {
  initial: RubricDraft;
  locale: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<RubricDraft>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNew = !form.id;
  const willVersion = !isNew && form.used_count > 0;

  const patch = (next: Partial<RubricDraft>) => {
    setForm(f => ({ ...f, ...next }));
    setSaved(false);
  };

  const patchCriterion = (i: number, next: Partial<RubricCriterion>) => {
    setForm(f => ({
      ...f,
      criteria: f.criteria.map((c, j) => (j === i ? { ...c, ...next } : c)),
    }));
    setSaved(false);
  };

  const patchAnchor = (i: number, level: (typeof ANCHOR_KEYS)[number], value: string) => {
    setForm(f => ({
      ...f,
      criteria: f.criteria.map((c, j) =>
        j === i ? { ...c, anchors: { ...c.anchors, [level]: value } } : c
      ),
    }));
    setSaved(false);
  };

  const move = (i: number, delta: number) => {
    const j = i + delta;
    if (j < 0 || j >= form.criteria.length) return;
    const next = [...form.criteria];
    [next[i], next[j]] = [next[j], next[i]];
    patch({ criteria: next });
  };

  function prefill() {
    patch({
      criteria: draftCriteria(form.task_type as never),
      system_prompt: form.system_prompt.trim() || draftSystemPrompt(form.task_type as never, form.level),
    });
  }

  function validate(): string | null {
    if (form.criteria.length === 0) return 'Voeg minstens één criterium toe.';
    const keys = new Set<string>();
    for (const [i, c] of form.criteria.entries()) {
      const n = i + 1;
      if (!c.key.trim()) return `Criterium ${n}: de sleutel is verplicht.`;
      if (!/^[a-z][a-z0-9_]*$/.test(c.key.trim())) {
        return `Criterium ${n}: de sleutel mag alleen kleine letters, cijfers en _ bevatten.`;
      }
      if (keys.has(c.key.trim())) return `De sleutel "${c.key.trim()}" komt twee keer voor.`;
      keys.add(c.key.trim());
      if (!c.criterion.trim()) return `Criterium ${n}: de naam is verplicht.`;
      for (const level of ANCHOR_KEYS) {
        if (!c.anchors[level].trim()) {
          return `Criterium ${n} ("${c.criterion.trim()}"): de beschrijving bij ${level} ontbreekt. Zonder alle vier de ankers weet het model niet wat een cijfer betekent.`;
        }
      }
    }
    return null;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    setSaving(true);
    setError(null);
    const supabase = createClient();

    const criteria = form.criteria.map(c => ({
      key: c.key.trim(),
      criterion: c.criterion.trim(),
      description: c.description?.trim() || undefined,
      anchors: c.anchors,
    }));

    const payload = {
      level: form.level,
      skill: form.skill,
      task_type: form.task_type,
      criteria,
      system_prompt: form.system_prompt.trim() || null,
    };

    try {
      // The unique partial index allows one active version per category, so clear the incumbent
      // before claiming the flag. Doing it the other way round fails on the index.
      //
      // Scoped to the level: the index is UNIQUE (level, skill, task_type) WHERE active, so
      // without this filter activating a B1 e-mail rubric would silently deactivate the A2 one
      // and leave every A2 Schrijven task with no active rubric to grade against.
      if (form.active) {
        await supabase
          .from('rubrics')
          .update({ active: false })
          .eq('level', form.level)
          .eq('skill', form.skill)
          .eq('task_type', form.task_type)
          .eq('active', true);
      }

      let id = form.id;

      if (isNew || willVersion) {
        const { data: latest } = await supabase
          .from('rubrics')
          .select('version')
          .eq('level', form.level)
          .eq('skill', form.skill)
          .eq('task_type', form.task_type)
          .order('version', { ascending: false })
          .limit(1)
          .maybeSingle();

        const version = ((latest as { version: number } | null)?.version ?? 0) + 1;
        const { data, error: insErr } = await supabase
          .from('rubrics')
          .insert({ ...payload, version, active: form.active })
          .select('id, version')
          .single();
        if (insErr) throw insErr;
        id = (data as { id: number }).id;
        patch({ id, version: (data as { version: number }).version, used_count: 0 });
      } else {
        const { error: updErr } = await supabase
          .from('rubrics')
          .update({ ...payload, active: form.active })
          .eq('id', form.id!);
        if (updErr) throw updErr;
      }

      setSaved(true);
      if (isNew) router.push(`/${locale}/admin/rubrics/${id}/edit`);
      else router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Opslaan mislukt.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
      {error && (
        <div className="bg-error/10 border border-error/20 rounded-xl p-3 text-sm text-error">
          {error}
        </div>
      )}

      <div className="flex items-start gap-3 rounded-xl border border-outline-variant bg-surface-container-low p-4">
        <Info size={18} className="text-primary shrink-0 mt-0.5" aria-hidden />
        <p className="text-sm text-on-surface-variant leading-relaxed">
          Deze criteria zijn de norm. Het model kiest per criterium het anker dat het antwoord het
          beste beschrijft — het bedenkt zelf niets. Wat je hier niet opschrijft, wordt niet
          beoordeeld.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {/* Locked after creation, like skill and task_type: together they are the rubric's
            identity, and moving an existing rubric to another level would silently reinterpret
            every grade already recorded against it. Make a new one instead. */}
        <Field label="Niveau">
          <select
            value={form.level}
            onChange={e => patch({ level: e.target.value as Level })}
            disabled={!isNew}
            className="field"
          >
            {LEVELS.map(l => (
              <option key={l} value={l}>
                {levelLabel(l)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Onderdeel">
          <select
            value={form.skill}
            onChange={e => {
              const skill = e.target.value as RubricSkill;
              patch({ skill, task_type: categoriesForSkill(skill)[0] });
            }}
            disabled={!isNew}
            className="field"
          >
            <option value="schrijven">Schrijven</option>
            <option value="spreken">Spreken</option>
          </select>
        </Field>

        <Field
          label="Soort opdracht"
          hint={
            isNew
              ? undefined
              : 'Vastgezet: een rubriek verhuizen naar een andere categorie zou bestaande beoordelingen van betekenis veranderen.'
          }
        >
          <select
            value={form.task_type}
            onChange={e => patch({ task_type: e.target.value })}
            disabled={!isNew}
            className="field"
          >
            {categoriesForSkill(form.skill).map(c => (
              <option key={c} value={c}>
                {categoryLabel(c)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {!isNew && (
        <p className="text-xs text-on-surface-variant">
          Versie {form.version}
          {form.used_count > 0 ? (
            <>
              {' · '}
              <strong className="text-on-surface font-semibold">
                {form.used_count} beoordelingen gebruiken deze versie
              </strong>
              , dus opslaan maakt versie {form.version + 1}. De oude versie blijft bestaan zodat
              eerdere cijfers hun betekenis houden.
            </>
          ) : (
            ' · nog niet gebruikt voor een beoordeling, dus opslaan past deze versie aan.'
          )}
        </p>
      )}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-headline text-lg font-bold text-on-surface">
            Criteria{' '}
            <span className="text-sm font-normal text-on-surface-variant tabular-nums">
              ({form.criteria.length})
            </span>
          </h2>
          <div className="flex items-center gap-2">
            {form.criteria.length === 0 && (
              <button
                type="button"
                onClick={prefill}
                className="inline-flex items-center gap-2 border border-outline-variant px-3 py-2 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                <Sparkles size={15} aria-hidden />
                Concept invullen
              </button>
            )}
            <button
              type="button"
              onClick={() => patch({ criteria: [...form.criteria, emptyCriterion()] })}
              className="inline-flex items-center gap-2 border border-outline-variant px-3 py-2 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              <Plus size={15} aria-hidden />
              Criterium
            </button>
          </div>
        </div>

        {form.criteria.length === 0 && (
          <p className="text-sm text-on-surface-variant leading-relaxed rounded-xl border border-dashed border-outline-variant p-4">
            Nog geen criteria. &ldquo;Concept invullen&rdquo; zet een voorzet neer op basis van de
            A2-descriptoren — <strong className="font-semibold">bedoeld om te herschrijven</strong>,
            niet om zo te gebruiken. Het is jouw rubriek die de norm is.
          </p>
        )}

        {form.criteria.map((c, i) => (
          <fieldset
            key={i}
            className="rounded-xl border border-outline-variant bg-surface p-4 space-y-3"
          >
            <div className="flex items-start gap-2">
              <div className="flex flex-col pt-1.5 text-outline">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="hover:text-on-surface disabled:opacity-25 leading-none"
                  aria-label="Omhoog"
                >
                  ▴
                </button>
                <GripVertical size={14} aria-hidden />
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === form.criteria.length - 1}
                  className="hover:text-on-surface disabled:opacity-25 leading-none"
                  aria-label="Omlaag"
                >
                  ▾
                </button>
              </div>

              <div className="flex-1 min-w-0 grid gap-3 sm:grid-cols-[1fr_170px]">
                <Field label="Naam van het criterium">
                  <input
                    value={c.criterion}
                    onChange={e => patchCriterion(i, { criterion: e.target.value })}
                    placeholder="Inhoud en volledigheid"
                    className="field"
                  />
                </Field>
                <Field label="Sleutel" hint="Vast in de database.">
                  <input
                    value={c.key}
                    onChange={e =>
                      patchCriterion(i, { key: e.target.value.toLowerCase().replace(/\s+/g, '_') })
                    }
                    placeholder="inhoud"
                    className="field font-mono text-xs"
                  />
                </Field>
              </div>

              <button
                type="button"
                onClick={() => patch({ criteria: form.criteria.filter((_, j) => j !== i) })}
                className="text-error/70 hover:text-error pt-7"
                aria-label="Criterium verwijderen"
              >
                <Trash2 size={16} aria-hidden />
              </button>
            </div>

            <Field label="Uitleg voor de beoordelaar (optioneel)">
              <textarea
                value={c.description ?? ''}
                onChange={e => patchCriterion(i, { description: e.target.value })}
                rows={2}
                placeholder="Waar moet de beoordelaar naar kijken, en waar juist niet?"
                className="field resize-y"
              />
            </Field>

            <div className="space-y-2">
              <p className="text-sm font-medium text-on-surface">
                Wat betekent elk cijfer? (0–{MAX_CRITERION_SCORE})
              </p>
              {ANCHOR_KEYS.map(level => (
                <div key={level} className="flex items-start gap-2">
                  <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-xs font-extrabold text-primary tabular-nums">
                    {level}
                  </span>
                  <textarea
                    value={c.anchors[level]}
                    onChange={e => patchAnchor(i, level, e.target.value)}
                    rows={1}
                    placeholder={
                      level === '0'
                        ? 'Wanneer is dit criterium helemaal niet behaald?'
                        : level === '3'
                          ? 'Wanneer is dit criterium volledig behaald op A2-niveau?'
                          : 'Wat onderscheidt dit cijfer van het cijfer eronder?'
                    }
                    className="field resize-y"
                  />
                </div>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <Field
        label="Instructie voor de beoordelaar (optioneel)"
        hint="Gaat boven de criteria mee. Gebruik dit voor wat over de hele opdracht geldt — bijvoorbeeld hoe streng A2 beoordeeld moet worden."
      >
        <textarea
          value={form.system_prompt}
          onChange={e => patch({ system_prompt: e.target.value })}
          rows={6}
          className="field resize-y font-mono text-xs leading-relaxed"
        />
      </Field>

      <label className="flex items-start gap-3 rounded-xl border border-outline-variant bg-surface p-4 cursor-pointer">
        <input
          type="checkbox"
          checked={form.active}
          onChange={e => patch({ active: e.target.checked })}
          className="mt-0.5 h-4 w-4 accent-[var(--color-primary)]"
        />
        <span className="text-sm">
          <strong className="font-semibold text-on-surface">
            Gebruik deze versie voor nieuwe beoordelingen
          </strong>
          <span className="block text-on-surface-variant mt-0.5 leading-relaxed">
            Er kan er één actief zijn per categorie. Aanzetten zet de vorige versie uit; eerdere
            beoordelingen blijven aan hun eigen versie hangen.
          </span>
        </span>
      </label>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-container transition-colors disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden /> Opslaan…
            </>
          ) : saved ? (
            <>
              <Check size={16} aria-hidden /> Opgeslagen
            </>
          ) : (
            <>
              <Save size={16} aria-hidden />
              {willVersion ? `Opslaan als versie ${form.version + 1}` : 'Opslaan'}
            </>
          )}
        </button>
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
        .field:disabled { background: var(--color-surface-container-low); color: var(--color-on-surface-variant); }
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
