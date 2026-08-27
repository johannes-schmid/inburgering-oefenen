'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Check, ChevronLeft, ChevronRight, CircleCheck, CircleDashed, Info, Loader2, Plus,
  Save, Trash2, TriangleAlert,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { categoryLabel, rubricCategory } from '@/lib/rubrics';
import { levelLabel, type Level } from '@/data/skills';
import type { ExamChoice, OpgaveNav, PartChoice, RubricChoice, SectionChoice } from '@/lib/admin/open-tasks';
import OpgavePreview from './OpgavePreview';
import OptionImagePicker from '../../questions/_components/OptionImagePicker';
import {
  IMAGE_USAGE_LABELS,
  REQUIRED_IMAGES,
  TASK_TYPE_LABELS,
  type ImageUsage,
  type OpgaveDraft,
  type TaskType,
} from '../_draft';

/**
 * The Schrijven/Spreken task editor — the last surface that had no write path at all, so half the
 * product could not receive content from the docent.
 *
 * ## What the shape of this form is fighting
 * `open_tasks` carries five task types in one row, and three CHECK constraints police which columns
 * may be set together:
 *
 *   · `open_tasks_type_matches_skill`  — spreken ⇒ task_type 'speaking'; schrijven ⇒ anything else
 *   · `open_tasks_form_has_schema`     — task_type 'form' ⇒ form_schema NOT NULL
 *   · `open_tasks_image_usage_is_speaking` — schrijven ⇒ image_usage 'none'
 *
 * So the fields are shown per shape rather than all at once, and `validate()` refuses the
 * combinations the database would reject anyway. A constraint violation surfaces as a Postgres
 * error string, which is not a sentence anyone should have to read.
 *
 * `exam_publish_issues()` adds softer requirements — a rubric, a model answer, and for Spreken an
 * image count matching the image rule. Those are surfaced as warnings while editing rather than
 * blocks, because a half-authored task must stay savable; the publish button in the exam builder is
 * where they become fatal.
 *
 * Images are reconciled by position and written after the task, since `open_task_images.task_id`
 * needs an id that does not exist until the task row is inserted.
 */
export default function OpgaveForm({
  initial,
  exams,
  parts,
  rubrics,
  sections,
  nav,
  locale,
}: {
  initial: OpgaveDraft;
  exams: ExamChoice[];
  parts: PartChoice[];
  rubrics: RubricChoice[];
  sections: SectionChoice[];
  /** Absent on `/opgaven/new` — there is no run to walk until the row exists. */
  nav?: OpgaveNav;
  locale: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<OpgaveDraft>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isNew = !form.id;
  const isSpeaking = form.skill === 'spreken';
  const examParts = parts.filter(p => p.exam_id === form.exam_id);
  const examOptions = exams.filter(e => e.skill === form.skill);
  const category = rubricCategory({ task_type: form.task_type, image_usage: form.image_usage });

  const patch = (next: Partial<OpgaveDraft>) => {
    setForm(f => ({ ...f, ...next }));
    setSaved(false);
  };

  /** Switching skill invalidates task_type, image_usage and the part, so reset them together. */
  function changeSkill(skill: 'schrijven' | 'spreken') {
    patch({
      skill,
      task_type: skill === 'spreken' ? 'speaking' : 'email',
      image_usage: 'none',
      exam_id: null,
      part_id: null,
      rubric_id: null,
    });
  }

  function validate(): string | null {
    if (!form.exam_id) return 'Kies bij welk examen deze opgave hoort.';
    if (!form.prompt_html.trim()) return 'De opdrachttekst is verplicht.';
    if (form.sort_order < 1) return 'De positie moet 1 of hoger zijn.';

    if (isSpeaking && form.task_type !== 'speaking') {
      return 'Een spreekopdracht moet het type "Spreekopdracht" hebben.';
    }
    if (!isSpeaking && form.task_type === 'speaking') {
      return 'Een schrijfopdracht kan niet het type "Spreekopdracht" hebben.';
    }
    if (!isSpeaking && form.image_usage !== 'none') {
      return 'Een plaatjesregel geldt alleen bij spreken. Zet die op "Geen plaatjes".';
    }
    if (form.task_type === 'form' && form.form_sections.length === 0) {
      return 'Een formulieropgave heeft minstens één sectie met velden nodig.';
    }
    for (const s of form.form_sections) {
      for (const f of s.fields) {
        if (!f.key.trim() || !f.label.trim()) {
          return 'Elk formulierveld heeft een sleutel en een label nodig.';
        }
      }
    }
    if (form.images.some(i => !i.image_url.trim())) {
      return 'Elk plaatje heeft een afbeelding nodig, of verwijder de rij.';
    }
    return null;
  }

  /** Not fatal — the publish gate is. Shown so the docent is not surprised later. */
  function warnings(): string[] {
    const out: string[] = [];
    if (!form.rubric_id) out.push('Geen rubriek gekoppeld — publiceren lukt dan niet.');
    if (!form.model_answer.trim()) out.push('Geen voorbeeldantwoord. De beoordeling wordt daar merkbaar beter van.');
    if (isSpeaking) {
      const need = REQUIRED_IMAGES[form.image_usage];
      if (form.images.length !== need) {
        out.push(`Deze plaatjesregel verwacht ${need} plaatje(s), er staan er ${form.images.length}.`);
      }
      if (!form.prompt_audio_url.trim()) out.push('Geen audio bij de vraag — de kandidaat hoort niets.');
    }
    if (form.review_status !== 'validated') out.push('Nog niet op "gevalideerd" gezet.');
    return out;
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

    const row = {
      exam_id: form.exam_id,
      part_id: isSpeaking ? form.part_id : null,
      skill: form.skill,
      sort_order: form.sort_order,
      section_id: form.section_id,
      task_type: form.task_type,
      title: form.title.trim() || null,
      prompt_html: form.prompt_html.trim() || null,
      bullet_points: form.bullet_points.map(b => b.trim()).filter(Boolean),
      email_to: form.task_type === 'email' ? form.email_to.trim() || null : null,
      email_cc: form.task_type === 'email' ? form.email_cc.trim() || null : null,
      email_subject: form.task_type === 'email' ? form.email_subject.trim() || null : null,
      greeting: form.greeting.trim() || null,
      closing: form.closing.trim() || null,
      min_sentences: form.min_sentences && form.min_sentences > 0 ? form.min_sentences : null,
      // The player reads `sections[].fields[]` (lib/exam-content.ts FormSchema). The column comment
      // in the baseline describes a different `rows[].kind` shape and is stale — the code is what
      // renders, so this matches the code.
      form_schema: form.task_type === 'form' ? { sections: form.form_sections } : null,
      image_usage: isSpeaking ? form.image_usage : 'none',
      prompt_audio_url: isSpeaking ? form.prompt_audio_url.trim() || null : null,
      prompt_script: isSpeaking ? form.prompt_script.trim() || null : null,
      max_record_seconds: isSpeaking ? form.max_record_seconds : 60,
      model_answer: form.model_answer.trim() || null,
      rubric_id: form.rubric_id,
      review_status: form.review_status,
      reviewed_at: form.review_status === 'validated' ? new Date().toISOString() : null,
    };

    try {
      let id = form.id;
      if (isNew) {
        const { data, error: insErr } = await supabase
          .from('open_tasks')
          .insert(row)
          .select('id')
          .single();
        if (insErr) throw insErr;
        id = (data as { id: number }).id;
      } else {
        const { error: updErr } = await supabase.from('open_tasks').update(row).eq('id', form.id!);
        if (updErr) throw updErr;
      }

      // Images are replaced wholesale. Unlike `question_options` — where a delete cascades
      // `user_question_results.chosen_option_id` to NULL and erases what candidates picked —
      // `open_task_images` has no rows pointing at it, so there is nothing to preserve.
      await supabase.from('open_task_images').delete().eq('task_id', id!);
      if (form.images.length > 0) {
        const { error: imgErr } = await supabase.from('open_task_images').insert(
          form.images.map((im, i) => ({
            task_id: id!,
            sort_order: i + 1,
            image_url: im.image_url.trim(),
            caption: im.caption.trim() || null,
            alt_text: im.alt_text.trim() || null,
            group_label: im.group_label.trim() || null,
          }))
        );
        if (imgErr) throw imgErr;
      }

      setSaved(true);
      if (isNew) router.push(`/${locale}/admin/opgaven/${id}/edit`);
      else router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Opslaan mislukt.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!form.id) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error: delErr } = await supabase.from('open_tasks').delete().eq('id', form.id);
    if (delErr) {
      setError(delErr.message);
      setSaving(false);
      return;
    }
    router.push(`/${locale}/admin/questions?niveau=${level}&onderdeel=${form.skill}`);
  }

  const warns = warnings();
  const validated = form.review_status === 'validated';
  const exam = exams.find(e => e.id === form.exam_id) ?? null;
  const level = (exam?.level ?? 'a2') as Level;
  const backHref = `/${locale}/admin/questions?niveau=${level}&onderdeel=${form.skill}`;
  const href = (id: number) => `/${locale}/admin/opgaven/${id}/edit`;

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {/* Sticky: an opgave with a form schema or three plaatjes runs to several screens, and
          "Opslaan" is the only thing that writes any of it. A save button below the fold on a
          one-draft page is a page that loses work — the same call `FragmentEditor` made. */}
      <header className="sticky top-0 z-10 -mx-1 flex flex-wrap items-start justify-between gap-3 bg-surface/95 px-1 pt-1 pb-2 backdrop-blur">
        <div className="min-w-0">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-on-surface-variant no-underline hover:text-on-surface"
          >
            <ArrowLeft size={13} aria-hidden />
            Terug naar vragen &amp; opdrachten
          </Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <h1 className="m-0 font-headline text-xl font-extrabold tracking-tight text-on-surface">
              {isNew ? 'Nieuwe opgave' : form.title.trim() || TASK_TYPE_LABELS[form.task_type]}
            </h1>
            {/* The review status, at the top where it is read rather than at the bottom where it
                is set. "Is deze opgave al nagekeken?" is the question the docent arrives with, and
                the checkbox answering it was the last control on a five-screen page. */}
            <StatusChip validated={validated} />
          </div>
          <p className="m-0 mt-1 text-xs text-on-surface-variant">
            Niveau {levelLabel(level)} · {form.skill}
            {exam ? ` · examen ${exam.number}` : ''}
            {nav ? ` · opgave ${nav.position} van ${nav.total}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {nav && nav.total > 1 && (
            <div className="flex items-center gap-1">
              <StepLink href={nav.prevId ? href(nav.prevId) : null} direction="prev" />
              <StepLink href={nav.nextId ? href(nav.nextId) : null} direction="next" />
            </div>
          )}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-container disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" aria-hidden />
            ) : saved ? (
              <Check size={16} aria-hidden />
            ) : (
              <Save size={16} aria-hidden />
            )}
            {saving ? 'Opslaan…' : saved ? 'Opgeslagen' : 'Opslaan'}
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-error/10 border border-error/20 rounded-xl p-3 text-sm text-error">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">

      {/* ── Where it lives ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Onderdeel">
          <select
            value={form.skill}
            onChange={e => changeSkill(e.target.value as 'schrijven' | 'spreken')}
            disabled={!isNew}
            className="field"
          >
            <option value="schrijven">Schrijven</option>
            <option value="spreken">Spreken</option>
          </select>
        </Field>

        <Field label="Examen">
          <select
            value={form.exam_id ?? ''}
            onChange={e => {
              const exam = examOptions.find(x => x.id === Number(e.target.value));
              patch({
                exam_id: exam?.id ?? null,
                part_id: null,
                sort_order: exam ? exam.maxSortOrder + 1 : 1,
              });
            }}
            className="field"
          >
            <option value="">Kies een examen…</option>
            {examOptions.map(e => (
              <option key={e.id} value={e.id}>
                {e.skill} {e.number}
                {e.title ? ` — ${e.title}` : ''}
                {e.published ? ' (gepubliceerd)' : ''}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Soort opgave">
          <select
            value={form.task_type}
            onChange={e => patch({ task_type: e.target.value as TaskType, rubric_id: null })}
            disabled={isSpeaking}
            className="field"
          >
            {(isSpeaking ? (['speaking'] as TaskType[]) : (['email', 'short_text', 'form', 'picture_note'] as TaskType[])).map(
              t => (
                <option key={t} value={t}>
                  {TASK_TYPE_LABELS[t]}
                </option>
              )
            )}
          </select>
        </Field>

        <Field label="Positie in het examen" hint="Bepaalt de volgorde. Moet uniek zijn per examen.">
          <input
            type="number"
            min={1}
            value={form.sort_order}
            onChange={e => patch({ sort_order: Number(e.target.value) })}
            className="field"
          />
        </Field>

        {isSpeaking && (
          <Field
            label="Onderdeel van het examen"
            hint={
              examParts.length === 0
                ? 'Dit examen heeft nog geen onderdelen. Spreken heeft er vier nodig om te kunnen publiceren.'
                : undefined
            }
          >
            <select
              value={form.part_id ?? ''}
              onChange={e => patch({ part_id: e.target.value ? Number(e.target.value) : null })}
              className="field"
            >
              <option value="">Geen</option>
              {examParts.map(p => (
                <option key={p.id} value={p.id}>
                  {p.sort_order}. {p.title}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Sub-vaardigheid (optioneel)">
          <select
            value={form.section_id ?? ''}
            onChange={e => patch({ section_id: e.target.value ? Number(e.target.value) : null })}
            className="field"
          >
            <option value="">Geen</option>
            {sections
              .filter(s => s.topic === form.skill)
              .map(s => (
                <option key={s.id} value={s.id}>
                  {s.name_nl}
                </option>
              ))}
          </select>
        </Field>
      </div>

      {/* ── The opdracht ── */}
      <Field label="Titel (optioneel)">
        <input
          value={form.title}
          onChange={e => patch({ title: e.target.value })}
          placeholder="E-mail naar de taalschool"
          className="field"
        />
      </Field>

      <Field label="Opdrachttekst" hint="Wat de kandidaat moet doen. HTML mag; <p> per alinea.">
        <textarea
          value={form.prompt_html}
          onChange={e => patch({ prompt_html: e.target.value })}
          rows={4}
          className="field resize-y"
        />
      </Field>

      <Field
        label="Punten die behandeld moeten worden"
        hint="Genummerd bij de kandidaat, en de rubriek rekent ze één voor één af."
      >
        <div className="space-y-2">
          {form.bullet_points.map((b, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs font-bold text-outline w-4 text-right">{i + 1}</span>
              <input
                value={b}
                onChange={e =>
                  patch({ bullet_points: form.bullet_points.map((x, j) => (j === i ? e.target.value : x)) })
                }
                className="field"
              />
              <button
                type="button"
                onClick={() => patch({ bullet_points: form.bullet_points.filter((_, j) => j !== i) })}
                className="text-error/70 hover:text-error"
                aria-label="Punt verwijderen"
              >
                <Trash2 size={15} aria-hidden />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => patch({ bullet_points: [...form.bullet_points, ''] })}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Plus size={14} aria-hidden /> Punt toevoegen
          </button>
        </div>
      </Field>

      {/* ── Shape-specific ── */}
      {form.task_type === 'email' && (
        <fieldset className="rounded-xl border border-outline-variant p-4 space-y-3">
          <legend className="text-sm font-semibold px-1">Voorgedrukte e-mail</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Aan">
              <input value={form.email_to} onChange={e => patch({ email_to: e.target.value })} className="field" />
            </Field>
            <Field label="Cc (optioneel)">
              <input value={form.email_cc} onChange={e => patch({ email_cc: e.target.value })} className="field" />
            </Field>
          </div>
          <Field label="Onderwerp">
            <input
              value={form.email_subject}
              onChange={e => patch({ email_subject: e.target.value })}
              className="field"
            />
          </Field>
        </fieldset>
      )}

      {form.task_type !== 'form' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Aanhef (voorgedrukt, optioneel)" hint="De kandidaat schrijft híertussen.">
            <input value={form.greeting} onChange={e => patch({ greeting: e.target.value })} className="field" />
          </Field>
          <Field label="Afsluiting (voorgedrukt, optioneel)">
            <input value={form.closing} onChange={e => patch({ closing: e.target.value })} className="field" />
          </Field>
        </div>
      )}

      {(form.task_type === 'short_text' || form.task_type === 'picture_note') && (
        <Field label="Minimaal aantal zinnen (optioneel)">
          <input
            type="number"
            min={1}
            value={form.min_sentences ?? ''}
            onChange={e => patch({ min_sentences: e.target.value ? Number(e.target.value) : null })}
            className="field"
          />
        </Field>
      )}

      {form.task_type === 'form' && (
        <FormSchemaEditor
          sections={form.form_sections}
          onChange={form_sections => patch({ form_sections })}
        />
      )}

      {isSpeaking && (
        <fieldset className="rounded-xl border border-outline-variant p-4 space-y-3">
          <legend className="text-sm font-semibold px-1">Spreken</legend>
          <Field label="Plaatjesregel" hint="Wordt aan de kandidaat gezegd én door de rubriek beoordeeld.">
            <select
              value={form.image_usage}
              onChange={e => patch({ image_usage: e.target.value as ImageUsage, rubric_id: null })}
              className="field"
            >
              {(Object.keys(IMAGE_USAGE_LABELS) as ImageUsage[]).map(u => (
                <option key={u} value={u}>
                  {IMAGE_USAGE_LABELS[u]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Script van de vraag" hint="De tekst waaruit de audio gegenereerd is.">
            <textarea
              value={form.prompt_script}
              onChange={e => patch({ prompt_script: e.target.value })}
              rows={2}
              className="field resize-y"
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Audio-URL van de vraag">
              <input
                value={form.prompt_audio_url}
                onChange={e => patch({ prompt_audio_url: e.target.value })}
                placeholder="https://…/question-audio/…"
                className="field"
              />
            </Field>
            <Field label="Max. opnametijd (seconden)">
              <input
                type="number"
                min={10}
                value={form.max_record_seconds}
                onChange={e => patch({ max_record_seconds: Number(e.target.value) })}
                className="field"
              />
            </Field>
          </div>
        </fieldset>
      )}

      {/* ── Images ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-on-surface">
            Plaatjes{' '}
            <span className="text-xs font-normal text-on-surface-variant tabular-nums">
              ({form.images.length}
              {isSpeaking ? ` van ${REQUIRED_IMAGES[form.image_usage]} verwacht` : ''})
            </span>
          </p>
          <button
            type="button"
            onClick={() =>
              patch({
                images: [...form.images, { image_url: '', caption: '', alt_text: '', group_label: '' }],
              })
            }
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Plus size={14} aria-hidden /> Plaatje
          </button>
        </div>

        {form.images.map((im, i) => (
          <div key={i} className="rounded-xl border border-outline-variant p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-bold text-outline mt-1">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <OptionImagePicker
                  urls={im.image_url ? [im.image_url] : []}
                  max={1}
                  query={form.title || 'nederland'}
                  onChange={urls =>
                    patch({
                      images: form.images.map((x, j) => (j === i ? { ...x, image_url: urls[0] ?? '' } : x)),
                    })
                  }
                />
              </div>
              <button
                type="button"
                onClick={() => patch({ images: form.images.filter((_, j) => j !== i) })}
                className="text-error/70 hover:text-error mt-1"
                aria-label="Plaatje verwijderen"
              >
                <Trash2 size={15} aria-hidden />
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <input
                value={im.caption}
                onChange={e =>
                  patch({ images: form.images.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)) })
                }
                placeholder="Bijschrift (inhoud, bijv. 'kapot')"
                className="field"
              />
              <input
                value={im.alt_text}
                onChange={e =>
                  patch({ images: form.images.map((x, j) => (j === i ? { ...x, alt_text: e.target.value } : x)) })
                }
                placeholder="Alt-tekst (toegankelijkheid)"
                className="field"
              />
              <input
                value={im.group_label}
                onChange={e =>
                  patch({
                    images: form.images.map((x, j) => (j === i ? { ...x, group_label: e.target.value } : x)),
                  })
                }
                placeholder="Groep (bijv. 'voor' / 'na')"
                className="field"
              />
            </div>
          </div>
        ))}
      </div>

      {/* ── Grading ── */}
      <Field
        label="Voorbeeldantwoord"
        hint="Een antwoord dat volledig voldoet. Gaat mee naar de beoordelaar, nooit naar de kandidaat."
      >
        <textarea
          value={form.model_answer}
          onChange={e => patch({ model_answer: e.target.value })}
          rows={4}
          className="field resize-y"
        />
      </Field>

      <Field label="Rubriek" hint={`Categorie van deze opgave: ${categoryLabel(category)}.`}>
        <select
          value={form.rubric_id ?? ''}
          onChange={e => patch({ rubric_id: e.target.value ? Number(e.target.value) : null })}
          className="field"
        >
          <option value="">Geen</option>
          {rubrics
            .filter(r => r.skill === form.skill)
            .map(r => (
              <option key={r.id} value={r.id}>
                {categoryLabel(r.task_type)} v{r.version}
                {r.active ? ' (actief)' : ''}
                {r.task_type === category ? ' — past bij deze opgave' : ''}
              </option>
            ))}
        </select>
      </Field>

      <label className="flex items-start gap-3 rounded-xl border border-outline-variant bg-surface p-4 cursor-pointer">
        <input
          type="checkbox"
          checked={form.review_status === 'validated'}
          onChange={e => patch({ review_status: e.target.checked ? 'validated' : 'pending' })}
          className="mt-0.5 h-4 w-4 accent-[var(--color-primary)]"
        />
        <span className="text-sm">
          <strong className="font-semibold text-on-surface">Gevalideerd</strong>
          <span className="block text-on-surface-variant mt-0.5 leading-relaxed">
            Vink aan als deze opgave klaar is voor kandidaten. Een examen publiceren lukt niet zolang
            er opgaven op &ldquo;in behandeling&rdquo; staan.
          </span>
        </span>
      </label>

      {warns.length > 0 && (
        <div className="rounded-xl border border-secondary-container/40 bg-secondary-container/10 p-3">
          <p className="text-sm font-semibold text-on-surface flex items-center gap-2">
            <TriangleAlert size={15} className="text-secondary" aria-hidden />
            Nog te doen voordat dit examen gepubliceerd kan worden
          </p>
          <ul className="mt-1.5 pl-6 text-sm text-on-surface-variant list-disc space-y-0.5">
            {warns.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Save lives in the sticky header; only the destructive action is down here, where it
          cannot be hit on the way to something else. */}
      <div className="flex items-center gap-3 pt-2">
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
        </div>

        {/* Sticky, because the point of a preview is to watch it change while you type in the
            column beside it — one that scrolls away is a screenshot. */}
        <aside className="lg:sticky lg:top-20 lg:col-span-2 lg:max-h-[calc(100vh-6rem)]">
          <div className="h-full rounded-2xl border border-outline-variant bg-surface-container-low/40 p-4">
            <OpgavePreview
              form={form}
              position={nav?.position ?? form.sort_order}
              total={nav?.total ?? form.sort_order}
            />
          </div>
        </aside>
      </div>

      <style>{`
        .field { width:100%; border:1px solid var(--color-outline-variant); border-radius:0.75rem; padding:0.5rem 0.75rem; font-size:0.875rem; outline:none; background:var(--color-surface); color:var(--color-on-surface); }
        .field:focus { border-color: var(--color-primary); }
        .field:disabled { background: var(--color-surface-container-low); color: var(--color-on-surface-variant); }
      `}</style>
    </form>
  );
}

/**
 * Is this opgave nagekeken? A chip rather than a dot: "gevalideerd" and "in behandeling" are the
 * two words the publish gate uses, and a colour alone cannot say which is which to anyone who
 * cannot separate the two hues. Clay for done, never a green — see the no-new-hue rule.
 */
function StatusChip({ validated }: { validated: boolean }) {
  const Icon = validated ? CircleCheck : CircleDashed;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap"
      style={
        validated
          ? { background: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)' }
          : { background: '#fcecdd', color: '#a24000' }
      }
    >
      <Icon size={12} aria-hidden />
      {validated ? 'Gevalideerd' : 'In behandeling'}
    </span>
  );
}

/**
 * Walk to the opgave either side of this one, in `sort_order` — the order the candidate meets
 * them in, so "volgende" means here what it means in the player.
 *
 * A plain `<Link>`, not a router push: this is a full page load of the next opgave's own server
 * data, and the unsaved draft is deliberately *not* carried across. Silently moving a half-typed
 * opdracht onto the next row is the one thing a next button must never do.
 */
function StepLink({ href, direction }: { href: string | null; direction: 'prev' | 'next' }) {
  const Icon = direction === 'prev' ? ChevronLeft : ChevronRight;
  const label = direction === 'prev' ? 'Vorige opgave' : 'Volgende opgave';
  const cls =
    'inline-flex h-9 items-center gap-1.5 rounded-lg border border-outline-variant px-2.5 text-xs font-medium transition-colors';

  if (!href) {
    return (
      <span className={`${cls} text-on-surface-variant opacity-35`} aria-hidden>
        {direction === 'prev' && <Icon size={14} />}
        {direction === 'next' && <>Volgende<Icon size={14} /></>}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={label}
      className={`${cls} text-on-surface-variant no-underline hover:bg-surface-container hover:text-on-surface`}
    >
      {direction === 'prev' && <Icon size={14} aria-hidden />}
      {direction === 'next' && <>Volgende<Icon size={14} aria-hidden /></>}
    </Link>
  );
}

/**
 * The `form` shape: a variable table of rows, which is why it is the one jsonb payload in
 * `open_tasks`. Produces `{ sections: [{ title, fields: [...] }] }` — the shape
 * `lib/exam-content.ts` actually reads.
 */
function FormSchemaEditor({
  sections,
  onChange,
}: {
  sections: { title: string; fields: import('@/lib/exam-content').FormField[] }[];
  onChange: (next: { title: string; fields: import('@/lib/exam-content').FormField[] }[]) => void;
}) {
  const patchSection = (i: number, next: Partial<(typeof sections)[number]>) =>
    onChange(sections.map((s, j) => (j === i ? { ...s, ...next } : s)));

  return (
    <fieldset className="rounded-xl border border-outline-variant p-4 space-y-4">
      <legend className="text-sm font-semibold px-1">Formulier</legend>
      <p className="text-xs text-on-surface-variant flex items-start gap-2">
        <Info size={14} className="shrink-0 mt-0.5" aria-hidden />
        Elke sectie is een kopje met velden eronder, zoals &ldquo;Persoonsgegevens&rdquo;. Een
        sleutel is de naam waaronder het antwoord wordt opgeslagen.
      </p>

      {sections.map((s, i) => (
        <div key={i} className="rounded-lg border border-outline-variant p-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              value={s.title}
              onChange={e => patchSection(i, { title: e.target.value })}
              placeholder="Kopje van de sectie"
              className="field"
            />
            <button
              type="button"
              onClick={() => onChange(sections.filter((_, j) => j !== i))}
              className="text-error/70 hover:text-error"
              aria-label="Sectie verwijderen"
            >
              <Trash2 size={15} aria-hidden />
            </button>
          </div>

          {s.fields.map((f, k) => (
            <div key={k} className="grid gap-2 sm:grid-cols-[1fr_1fr_130px_auto] items-start">
              <input
                value={f.label}
                onChange={e =>
                  patchSection(i, {
                    fields: s.fields.map((x, m) => (m === k ? { ...x, label: e.target.value } : x)),
                  })
                }
                placeholder="Label"
                className="field"
              />
              <input
                value={f.key}
                onChange={e =>
                  patchSection(i, {
                    fields: s.fields.map((x, m) =>
                      m === k ? { ...x, key: e.target.value.toLowerCase().replace(/\s+/g, '_') } : x
                    ),
                  })
                }
                placeholder="sleutel"
                className="field font-mono text-xs"
              />
              <select
                value={f.type}
                onChange={e =>
                  patchSection(i, {
                    fields: s.fields.map((x, m) =>
                      m === k ? { ...x, type: e.target.value as FormFieldType } : x
                    ),
                  })
                }
                className="field"
              >
                <option value="text">Tekst</option>
                <option value="date">Datum</option>
                <option value="radio">Keuze (één)</option>
                <option value="checkbox">Keuze (meer)</option>
              </select>
              <button
                type="button"
                onClick={() => patchSection(i, { fields: s.fields.filter((_, m) => m !== k) })}
                className="text-error/70 hover:text-error mt-2"
                aria-label="Veld verwijderen"
              >
                <Trash2 size={14} aria-hidden />
              </button>
              {(f.type === 'radio' || f.type === 'checkbox') && (
                <input
                  value={(f.options ?? []).join(', ')}
                  onChange={e =>
                    patchSection(i, {
                      fields: s.fields.map((x, m) =>
                        m === k
                          ? { ...x, options: e.target.value.split(',').map(o => o.trim()).filter(Boolean) }
                          : x
                      ),
                    })
                  }
                  placeholder="Keuzes, gescheiden door komma's"
                  className="field sm:col-span-4"
                />
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={() =>
              patchSection(i, { fields: [...s.fields, { key: '', label: '', type: 'text' }] })
            }
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Plus size={14} aria-hidden /> Veld toevoegen
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...sections, { title: '', fields: [] }])}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <Plus size={14} aria-hidden /> Sectie toevoegen
      </button>
    </fieldset>
  );
}

type FormFieldType = import('@/lib/exam-content').FormField['type'];

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
