'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GripVertical, Loader2, Plus, Trash2, TriangleAlert } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { createClient } from '@/lib/supabase/client';
import { levelLabel, type Level, type SkillSlug } from '@/data/skills';
import { slugify, type ExamSetup, type SectionRow, type TaskRuleRow } from '@/lib/admin/exam-setup';

/**
 * The setup of an onderdeel, edited from inside one exam.
 *
 * **Everything in here is shared by all ten oefenexamens of the onderdeel**, because
 * `exam_formats`, `sections` and `exam_task_rules` are keyed by (level, skill) and not by exam.
 * That is deliberate — the shape of "A2 Lezen" is one fact, not ten — but it is also the one
 * thing a docent opening this from "Examen 1" will get wrong, so the banner says it outright
 * and every save button repeats the scope.
 *
 * A blank field means **NULL: not verified against DUO**, and the publish validator skips the
 * check rather than blocking on a guess. Clearing a field is therefore a real action, not a
 * mistake, and the placeholder says "onbepaald" rather than showing a 0.
 *
 * The three panels write directly to their own table and re-render the server component through
 * `router.refresh()`, the same way `StimulusEditor` does — no shared draft, so a failed save in
 * one panel cannot roll back a good save in another.
 */
export default function ExamSetupSheet({
  open,
  level,
  skill,
  setup,
  onClose,
}: {
  open: boolean;
  level: Level;
  skill: SkillSlug;
  setup: ExamSetup;
  onClose: () => void;
}) {
  const isOpenSkill = skill === 'schrijven' || skill === 'spreken';

  return (
    <Sheet open={open} onOpenChange={(next: boolean) => !next && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-2xl">
        <div className="flex flex-col gap-6 p-6">
          <header className="pr-8">
            <p className="text-xs font-bold tracking-widest text-on-surface-variant uppercase">
              Opzet van het onderdeel
            </p>
            <h2 className="text-lg font-headline font-bold text-on-surface capitalize m-0">
              {levelLabel(level)} {skill}
            </h2>
          </header>

          {/* The one thing that is easy to get wrong from this entry point. */}
          <p className="flex gap-2 items-start text-xs rounded-xl px-3 py-2.5 m-0"
             style={{ background: '#fcecdd', color: '#a24000' }}>
            <TriangleAlert size={15} className="shrink-0 mt-px" aria-hidden />
            <span>
              Deze instellingen gelden voor <strong>alle tien de oefenexamens</strong> van{' '}
              {levelLabel(level)} {skill}, niet alleen voor dit examen.
            </span>
          </p>

          <RulesPanel level={level} skill={skill} setup={setup} />
          {isOpenSkill
            ? <TaskRulesPanel level={level} skill={skill} rows={setup.taskRules} />
            : <SectionsPanel level={level} skill={skill} rows={setup.sections} />}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */

/** `''` → null, so clearing a field genuinely unverifies the rule. */
function toNum(v: string): number | null {
  const t = v.trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function NumField({
  label, value, onChange, hint, width = 'w-32',
}: {
  label: string;
  value: number | null;
  onChange: (n: number | null) => void;
  hint?: string;
  width?: string;
}) {
  // The width goes on the wrapper, not the input: `.field` carries `w-full`, and a `w-24` on the
  // input loses to it — every field then stacks full-width instead of wrapping into rows.
  return (
    <label className={`flex flex-col gap-1 ${width}`}>
      <span className="text-xs font-medium text-on-surface">{label}</span>
      <input
        type="number"
        min={0}
        value={value ?? ''}
        placeholder="onbepaald"
        onChange={e => onChange(toNum(e.target.value))}
        className="field"
      />
      {hint && <span className="text-[11px] text-on-surface-variant">{hint}</span>}
    </label>
  );
}

function SaveRow({ busy, error, onSave }: { busy: boolean; error: string; onSave: () => void }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <button
        type="button"
        onClick={onSave}
        disabled={busy}
        className="btn-primary text-sm px-4 py-2 disabled:opacity-60"
      >
        {busy ? <Loader2 size={15} className="animate-spin" aria-hidden /> : null}
        Opslaan voor alle examens
      </button>
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}

/* ── The numeric rules (exam_formats) ─────────────────────────────────────── */

function RulesPanel({ level, skill, setup }: { level: Level; skill: SkillSlug; setup: ExamSetup }) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [f, setF] = useState(setup.format);

  const isOpenSkill = skill === 'schrijven' || skill === 'spreken';
  const isAudio = skill === 'luisteren';
  const set = (patch: Partial<NonNullable<typeof f>>) => setF(prev => (prev ? { ...prev, ...patch } : prev));

  if (!f) {
    return (
      <section className="rounded-2xl border border-outline-variant p-4">
        <h3 className="text-sm font-medium text-on-surface m-0 mb-1">Regels</h3>
        <p className="text-xs text-on-surface-variant m-0">
          Geen exam_formats-rij voor {levelLabel(level)} {skill}. Die hoort er te zijn — meld dit.
        </p>
      </section>
    );
  }

  async function save() {
    if (!f) return;
    setBusy(true);
    setError('');
    const { error: err } = await supabase
      .from('exam_formats')
      .update({
        item_count: f.item_count,
        duration_seconds: f.duration_seconds,
        part_count: f.part_count,
        items_per_part: f.items_per_part,
        stimulus_count: f.stimulus_count,
        questions_per_stimulus_min: f.questions_per_stimulus_min,
        questions_per_stimulus_max: f.questions_per_stimulus_max,
        options_min: f.options_min,
        options_max: f.options_max,
        audio_seconds_min: f.audio_seconds_min,
        audio_seconds_max: f.audio_seconds_max,
        verified_note: f.verified_note,
      })
      .eq('level', level)
      .eq('skill', skill);
    setBusy(false);
    // `exam_formats_ranges_ordered` rejects a min above its max; surface it rather than
    // silently keeping the old row.
    if (err) return setError(err.message);
    router.refresh();
  }

  return (
    <section className="rounded-2xl border border-outline-variant p-4 space-y-3">
      <div>
        <h3 className="text-sm font-medium text-on-surface m-0">Regels</h3>
        <p className="text-xs text-on-surface-variant m-0 mt-0.5">
          Leeg = niet vastgesteld tegen DUO. De publicatiecheck slaat een lege regel over.
        </p>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-3">
        <NumField label="Opgaven" value={f.item_count} onChange={n => set({ item_count: n })} />
        <NumField
          label="Duur (min)"
          value={f.duration_seconds === null ? null : Math.round(f.duration_seconds / 60)}
          onChange={n => set({ duration_seconds: n === null ? null : n * 60 })}
        />
        {isOpenSkill ? (
          <>
            <NumField label="Onderdelen" value={f.part_count} onChange={n => set({ part_count: n })} />
            <NumField label="Opgaven per onderdeel" value={f.items_per_part} onChange={n => set({ items_per_part: n })} width="w-40" />
          </>
        ) : (
          <>
            <NumField label="Fragmenten" value={f.stimulus_count} onChange={n => set({ stimulus_count: n })} />
            <NumField label="Vragen p/fragment min" value={f.questions_per_stimulus_min} onChange={n => set({ questions_per_stimulus_min: n })} width="w-36" />
            <NumField label="max" value={f.questions_per_stimulus_max} onChange={n => set({ questions_per_stimulus_max: n })} width="w-24" />
            <NumField label="Antwoorden min" value={f.options_min} onChange={n => set({ options_min: n })} width="w-28" />
            <NumField label="max" value={f.options_max} onChange={n => set({ options_max: n })} width="w-24" />
          </>
        )}
        {isAudio && (
          <>
            <NumField label="Audio sec min" value={f.audio_seconds_min} onChange={n => set({ audio_seconds_min: n })} width="w-28" />
            <NumField label="max" value={f.audio_seconds_max} onChange={n => set({ audio_seconds_max: n })} width="w-24" />
          </>
        )}
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-on-surface">Bron</span>
        <input
          value={f.verified_note ?? ''}
          placeholder="Waar komen deze getallen vandaan?"
          onChange={e => set({ verified_note: e.target.value || null })}
          className="field"
        />
      </label>

      <SaveRow busy={busy} error={error} onSave={save} />
    </section>
  );
}

/* ── The tekstsoorten (sections) ──────────────────────────────────────────── */

function SectionsPanel({
  level, skill, rows,
}: { level: Level; skill: SkillSlug; rows: SectionRow[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState(rows);
  const [adding, setAdding] = useState('');

  function rename(id: number, name_nl: string) {
    setDraft(d => d.map(s => (s.id === id ? { ...s, name_nl } : s)));
  }

  async function save() {
    setBusy(true);
    setError('');
    // One update per renamed row. `sort_order` is rewritten from the array index so the
    // displayed order is the stored order — the panel is the only thing that sets it.
    for (const [i, s] of draft.entries()) {
      const before = rows.find(r => r.id === s.id);
      if (before && before.name_nl === s.name_nl && before.sort_order === (i + 1) * 10) continue;
      const { error: err } = await supabase
        .from('sections')
        .update({ name_nl: s.name_nl.trim(), sort_order: (i + 1) * 10 })
        .eq('id', s.id);
      if (err) { setBusy(false); return setError(err.message); }
    }
    setBusy(false);
    router.refresh();
  }

  async function add() {
    const name = adding.trim();
    if (!name) return;
    setBusy(true);
    setError('');
    // Only this level. B1's tekstsoorten may genuinely differ from A2's, so they are edited
    // from a B1 exam rather than mirrored automatically (owner's decision, 2026-08-08).
    const { error: err } = await supabase.from('sections').insert({
      level,
      topic: skill,
      slug: slugify(name),
      name_nl: name,
      sort_order: (draft.length + 1) * 10,
    });
    setBusy(false);
    if (err) return setError(err.message);
    setAdding('');
    router.refresh();
  }

  async function remove(s: SectionRow) {
    // `stimuli.section_id` is ON DELETE SET NULL, so this does not delete content — it
    // un-files it, and those fragments then show as "geen tekstsoort" in every Opbouw panel.
    const warn = s.in_use > 0
      ? `${s.name_nl} verwijderen? ${s.in_use} fragment(en) verliezen hun tekstsoort.`
      : `${s.name_nl} verwijderen?`;
    if (!confirm(warn)) return;
    setBusy(true);
    setError('');
    const { error: err } = await supabase.from('sections').delete().eq('id', s.id);
    setBusy(false);
    if (err) return setError(err.message);
    router.refresh();
  }

  function move(i: number, by: number) {
    const j = i + by;
    if (j < 0 || j >= draft.length) return;
    setDraft(d => {
      const next = [...d];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  return (
    <section className="rounded-2xl border border-outline-variant p-4 space-y-3">
      <div>
        <h3 className="text-sm font-medium text-on-surface m-0">Tekstsoorten</h3>
        <p className="text-xs text-on-surface-variant m-0 mt-0.5">
          De categorieën waaronder fragmenten vallen. Er is geen aantal per tekstsoort — de
          Opbouw toont de verdeling, jij beoordeelt hem.
        </p>
      </div>

      <ul className="space-y-1.5 list-none p-0 m-0">
        {draft.map((s, i) => (
          <li key={s.id} className="flex items-center gap-2">
            <span className="flex flex-col text-on-surface-variant">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                      aria-label="Omhoog" className="leading-none text-[10px] disabled:opacity-30 hover:text-on-surface">▲</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === draft.length - 1}
                      aria-label="Omlaag" className="leading-none text-[10px] disabled:opacity-30 hover:text-on-surface">▼</button>
            </span>
            <GripVertical size={14} className="text-on-surface-variant shrink-0" aria-hidden />
            <input
              value={s.name_nl}
              onChange={e => rename(s.id, e.target.value)}
              className="field flex-1 text-sm"
            />
            <span className="text-xs text-on-surface-variant tabular-nums w-20 text-right">
              {s.in_use > 0 ? `${s.in_use} fragm.` : '—'}
            </span>
            <button
              type="button"
              onClick={() => remove(s)}
              aria-label={`${s.name_nl} verwijderen`}
              className="text-on-surface-variant hover:text-error transition-colors p-1"
            >
              <Trash2 size={15} aria-hidden />
            </button>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <input
          value={adding}
          onChange={e => setAdding(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="Nieuwe tekstsoort…"
          className="field flex-1 text-sm"
        />
        <button type="button" onClick={add} disabled={busy || !adding.trim()}
                className="btn-secondary text-sm px-3 py-2 disabled:opacity-50 inline-flex items-center gap-1.5">
          <Plus size={15} aria-hidden /> Toevoegen
        </button>
      </div>

      <SaveRow busy={busy} error={error} onSave={save} />
    </section>
  );
}

/* ── The per-soort rules (exam_task_rules) ────────────────────────────────── */

function TaskRulesPanel({
  level, skill, rows,
}: { level: Level; skill: SkillSlug; rows: TaskRuleRow[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState(rows);

  const isSpeaking = skill === 'spreken';
  const set = (category: string, patch: Partial<TaskRuleRow>) =>
    setDraft(d => d.map(r => (r.category === category ? { ...r, ...patch } : r)));

  async function save() {
    setBusy(true);
    setError('');
    // Upsert: a category that has never had rules has no row yet, and the panel offers every
    // category from `task_categories` precisely so one can be given rules for the first time.
    const { error: err } = await supabase.from('exam_task_rules').upsert(
      draft.map(r => ({
        level,
        skill,
        category: r.category,
        sort_order: r.sort_order,
        min_per_exam: r.min_per_exam,
        max_per_exam: r.max_per_exam,
        image_count: r.image_count,
        min_sentences: r.min_sentences,
        bullets_min: r.bullets_min,
        bullets_max: r.bullets_max,
        record_seconds: r.record_seconds,
      })),
      { onConflict: 'level,skill,category' }
    );
    setBusy(false);
    if (err) return setError(err.message);
    router.refresh();
  }

  return (
    <section className="rounded-2xl border border-outline-variant p-4 space-y-3">
      <div>
        <h3 className="text-sm font-medium text-on-surface m-0">Soorten opgaven</h3>
        <p className="text-xs text-on-surface-variant m-0 mt-0.5">
          Hoeveel van elke soort in één examen, en hoe zo&apos;n opgave eruitziet. De soorten
          zelf liggen vast — ze zijn ook de sleutel waarop de rubrieken hangen.
        </p>
      </div>

      <div className="space-y-3">
        {draft.map(r => (
          <div key={r.category} className="border-t border-outline-variant pt-3 first:border-t-0 first:pt-0">
            <p className="text-xs font-medium text-on-surface m-0 mb-2">{r.label_nl}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <NumField label="Min p/examen" value={r.min_per_exam} onChange={n => set(r.category, { min_per_exam: n })} width="w-32" />
              <NumField label="Max p/examen" value={r.max_per_exam} onChange={n => set(r.category, { max_per_exam: n })} width="w-32" />
              {isSpeaking ? (
                <>
                  <NumField label="Afbeeldingen" value={r.image_count} onChange={n => set(r.category, { image_count: n })} width="w-28" />
                  <NumField label="Opnametijd (sec)" value={r.record_seconds} onChange={n => set(r.category, { record_seconds: n })} width="w-32" />
                </>
              ) : (
                <>
                  <NumField label="Min. zinnen" value={r.min_sentences} onChange={n => set(r.category, { min_sentences: n })} width="w-32" />
                  <NumField label="Punten min" value={r.bullets_min} onChange={n => set(r.category, { bullets_min: n })} width="w-32" />
                  <NumField label="max" value={r.bullets_max} onChange={n => set(r.category, { bullets_max: n })} width="w-24" />
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <SaveRow busy={busy} error={error} onSave={save} />
    </section>
  );
}
