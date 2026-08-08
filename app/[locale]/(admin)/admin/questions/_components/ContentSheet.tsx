'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AudioLines, BadgeCheck, Check, ExternalLink, ImagePlus, Loader2, Plus, Sparkles, TriangleAlert,
} from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import type { ContentRow } from '@/lib/admin/content-rows';
import type { AuthorAction } from '@/lib/ai/author';
import OptionImagePicker from './OptionImagePicker';
import LengthMeter from '../../../_components/LengthMeter';
import MagicFill from '../../../_components/MagicFill';
import { formatRules, isSkillSlug, type Level } from '@/data/skills';
import { stripHtml } from '@/lib/admin/length-targets';

/**
 * The editing drawer for one item, whichever table it came from.
 *
 * ## What it deliberately does not carry
 * Adding, removing and re-labelling options, stimulus reassignment and the form-schema editor stay
 * in the full-page editors. A drawer that does everything is a second implementation of those
 * forms, and the option-reconciliation rules in `QuestionForm` (options matched **by label**, never
 * deleted and re-inserted, because a delete cascades `user_question_results.chosen_option_id` to
 * NULL) are exactly the kind of thing that gets lost in a re-implementation.
 *
 * ## Images are here, though
 * Pictures were the one thing the docent had to leave the screen for on every Spreken task, and
 * they are safe to edit here because none of it inserts or deletes an option: an option's image set
 * is an UPDATE of `image_urls` on a row that already exists, and `open_task_images` has nothing
 * pointing at it, so it is replaced wholesale exactly as `OpgaveForm` does it. Uploads go through
 * `/api/admin/upload-image`, which rehosts into our own bucket — see `OptionImagePicker`.
 *
 * ## AI drafting writes to the form, never to the database
 * Every "voorstellen" button fills a field the docent then reads, edits and saves herself, and no
 * AI action touches `review_status`. That is what keeps "door een docent gevalideerd" true while
 * still saving her the blank page.
 */

type OptionDetail = {
  id: number;
  label: string;
  body: string | null;
  is_correct: boolean;
  image_urls: string[];
  image_alt: string | null;
};

type QuestionDetail = {
  id: number;
  prompt: string;
  explanation: string | null;
  option_layout: string;
  review_status: 'pending' | 'validated';
  prompt_audio_url: string | null;
  question_options: OptionDetail[];
  stimuli: {
    id: number;
    title: string | null;
    kind: string;
    /** The framing line above the fragment; part of what the question has to make sense against. */
    intro: string | null;
    body_html: string | null;
    script: string | null;
    audio_url: string | null;
    image_url: string | null;
    image_alt: string | null;
  } | null;
};

type TaskImage = {
  /** Absent on a row that has not been saved yet. */
  id?: number;
  image_url: string;
  caption: string | null;
  alt_text: string | null;
  group_label: string | null;
};

type TaskDetail = {
  id: number;
  title: string | null;
  prompt_html: string | null;
  prompt_script: string | null;
  model_answer: string | null;
  image_usage: string;
  review_status: 'pending' | 'validated';
  prompt_audio_url: string | null;
  images: TaskImage[];
};

const LABELS = ['A', 'B', 'C', 'D'] as const;

/** Mirrors `LAYOUTS` in `QuestionForm` — the same three shapes `questions.option_layout` allows. */
const LAYOUTS: { value: 'text' | 'image' | 'image_grid'; label: string; hint: string }[] = [
  { value: 'text', label: 'Tekst', hint: 'Elke optie is een korte tekst.' },
  { value: 'image', label: 'Eén afbeelding', hint: 'Elke optie is één afbeelding.' },
  { value: 'image_grid', label: 'Meerdere afbeeldingen', hint: 'Elke optie is een setje afbeeldingen.' },
];

/** How many pictures each Spreken image rule expects. Mirrors REQUIRED_IMAGES in OpgaveForm. */
const REQUIRED_IMAGES: Record<string, number> = {
  none: 0,
  react: 1,
  describe: 1,
  choose: 2,
  // Three, not four. This said 4 and so disagreed with both the constraint in
  // `exam_publish_issues()` and the map it claims to mirror.
  cover_all: 3,
};

export default function ContentSheet({
  row,
  locale,
  onClose,
}: {
  row: ContentRow | null;
  locale: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [task, setTask] = useState<TaskDetail | null>(null);
  /** Which row the loaded detail belongs to; `loading` is derived from it rather than stored. */
  const [loadedUid, setLoadedUid] = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    if (!row) return;
    // Every setState below happens after an await. Setting a "loading" flag synchronously here
    // is what react-hooks/set-state-in-effect objects to, and deriving it from `loadedUid`
    // avoids the extra render as well as the lint error.
    if (!force && loadedUid === row.uid) return;
    if (row.kind === 'question') {
      const { data, error: err } = await supabase
        .from('questions')
        .select(
          'id, prompt, explanation, option_layout, review_status, prompt_audio_url, ' +
            'question_options(id, label, body, is_correct, image_urls, image_alt), ' +
            'stimuli(id, title, kind, intro, body_html, script, audio_url, image_url, image_alt)'
        )
        .eq('id', row.id)
        .single();
      if (err) setError(err.message);
      else {
        setQuestion(data as unknown as QuestionDetail);
        setTask(null);
      }
    } else {
      const { data, error: err } = await supabase
        .from('open_tasks')
        .select(
          'id, title, prompt_html, prompt_script, model_answer, image_usage, review_status, ' +
            'prompt_audio_url, ' +
            'open_task_images(id, sort_order, image_url, caption, alt_text, group_label)'
        )
        .eq('id', row.id)
        .single();
      if (err) setError(err.message);
      else {
        const raw = data as unknown as Omit<TaskDetail, 'images'> & {
          open_task_images: (TaskImage & { sort_order: number })[];
        };
        setTask({
          ...raw,
          // Ordered here rather than in the query so the drawer's list order is the order the
          // candidate sees — `sort_order` is what the player reads, not row order.
          images: [...(raw.open_task_images ?? [])].sort((a, b) => a.sort_order - b.sort_order),
        });
        setQuestion(null);
      }
    }
    setLoadedUid(row.uid);
  }, [row, supabase, loadedUid]);

  useEffect(() => {
    // The rule flags any setState reachable from an effect. Here the effect is doing exactly what
    // effects are for — synchronising with an external system (the database) when the selected row
    // changes — and the state it sets is the fetched row, after an await. The `loadedUid` guard
    // above means it cannot loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const loading = row != null && loadedUid !== row.uid;

  /** Ask for a draft and drop it into a field. Never saves — the docent does that. */
  async function draft(action: AuthorAction, current: string, apply: (text: string) => void) {
    setBusy(action);
    setError(null);
    setNote(null);
    try {
      const context =
        row?.kind === 'question'
          ? [question?.stimuli?.body_html, question?.stimuli?.script, question?.prompt]
              .filter(Boolean)
              .join('\n\n')
          : [task?.title, task?.prompt_html].filter(Boolean).join('\n\n');

      const res = await fetch('/api/admin/draft-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // `level` decides the register the draft is written at, so it comes off the row being
        // edited rather than defaulting — a B1 item drafted at A2 register reads fine and tests
        // the wrong thing.
        body: JSON.stringify({
          action,
          text: current,
          context,
          skill: row?.skill,
          level: row?.level,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.text) throw new Error(json.error || 'Het voorstel is niet gelukt.');
      apply(json.text);
      setNote('Voorstel ingevuld. Lees het na en sla het op — het is nog niet bewaard.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Het voorstel is niet gelukt.');
    } finally {
      setBusy(null);
    }
  }

  async function save(patch: Record<string, unknown>) {
    if (!row) return;
    setBusy('save');
    setError(null);
    const table = row.kind === 'question' ? 'questions' : 'open_tasks';
    const { error: err } = await supabase.from(table).update(patch).eq('id', row.id);
    setBusy(null);
    if (err) {
      setError(err.message);
      return;
    }
    setNote('Opgeslagen.');
    router.refresh();
    void load(true);
  }

  /**
   * Save the whole question in one action: the question row, every option, and the answer key.
   *
   * This replaces the per-field saves. Six buttons meant six ways to end up with half a question
   * saved — a reworded vraag stored against the old options, or new option text with the answer key
   * still pointing at what used to be the right answer.
   *
   * The order is forced by the schema, not chosen:
   *
   * 1. New options are inserted first, so an option added in this same edit can be the correct one.
   * 2. Every option is then written `is_correct: false`. `question_options_one_correct_idx` is
   *    `UNIQUE (question_id) WHERE is_correct`, so flipping the new answer on while the old one is
   *    still true trips a duplicate-key error.
   * 3. Only then is the one correct option flipped true.
   *
   * Options are still matched **by label and never deleted** — a delete cascades
   * `user_question_results.chosen_option_id` to NULL and erases what past candidates picked.
   * Removing an option therefore stays in the full editor, which does it deliberately.
   */
  async function saveQuestionAll(next: QuestionDetail) {
    if (!row) return;

    const usesImages = next.option_layout !== 'text';
    if (!next.prompt.trim()) {
      setError('De vraag mag niet leeg zijn.');
      return;
    }
    // Checked here rather than left to the index: a missing answer key saves cleanly and leaves a
    // question no candidate can ever get right.
    const correct = next.question_options.filter(o => o.is_correct);
    if (correct.length !== 1) {
      setError('Markeer precies één optie als het juiste antwoord.');
      return;
    }
    const emptyOption = next.question_options.find(o =>
      usesImages ? (o.image_urls ?? []).length === 0 : !(o.body ?? '').trim()
    );
    if (emptyOption) {
      setError(
        `Optie ${emptyOption.label} heeft nog geen ${usesImages ? 'afbeelding' : 'tekst'}.`
      );
      return;
    }

    setBusy('save');
    setError(null);
    setNote(null);

    const fail = (message: string) => {
      setBusy(null);
      setError(message);
    };

    const { error: qErr } = await supabase
      .from('questions')
      .update({
        prompt: next.prompt.trim(),
        explanation: next.explanation?.trim() || '',
        option_layout: next.option_layout,
      })
      .eq('id', row.id);
    if (qErr) return fail(qErr.message);

    // A negative id is an option added in this drawer and not yet in the database — see
    // `addOption` in `QuestionEditor`.
    const fresh = next.question_options.filter(o => o.id < 0);
    if (fresh.length) {
      const { error: insErr } = await supabase.from('question_options').insert(
        fresh.map((o, i) => ({
          question_id: row.id,
          label: o.label,
          sort_order: next.question_options.length - fresh.length + i + 1,
          body: (o.body ?? '').trim(),
          image_urls: o.image_urls ?? [],
          image_alt: o.image_alt?.trim() || null,
          is_correct: false,
        }))
      );
      if (insErr) return fail(insErr.message);
    }

    for (const o of next.question_options.filter(o => o.id > 0)) {
      const { error: optErr } = await supabase
        .from('question_options')
        .update({
          body: (o.body ?? '').trim(),
          image_urls: o.image_urls ?? [],
          image_alt: o.image_alt?.trim() || null,
          is_correct: false,
        })
        .eq('id', o.id);
      if (optErr) return fail(optErr.message);
    }

    const { error: corErr } = await supabase
      .from('question_options')
      .update({ is_correct: true })
      .eq('question_id', row.id)
      .eq('label', correct[0].label);
    if (corErr) return fail(corErr.message);

    // The image stimulus rides along, so "Opslaan" means what it says on this screen. The CHECK
    // `stimuli_payload_matches_kind` requires a URL, so an emptied picker is refused here with a
    // sentence rather than by Postgres with a constraint name.
    if (next.stimuli && next.stimuli.kind === 'image') {
      if (!next.stimuli.image_url) return fail('Een beeldstimulus moet een afbeelding hebben.');
      const { error: stimErr } = await supabase
        .from('stimuli')
        .update({
          image_url: next.stimuli.image_url,
          image_alt: next.stimuli.image_alt?.trim() || null,
        })
        .eq('id', next.stimuli.id);
      if (stimErr) return fail(stimErr.message);
    }

    setBusy(null);
    setNote('Opgeslagen — vraag, opties en het juiste antwoord.');
    router.refresh();
    void load(true);
  }

  /**
   * Replace an open task's pictures.
   *
   * Wholesale delete-and-insert, unlike the options above: nothing references `open_task_images`, so
   * there is no history to preserve, and position *is* the identity — reordering by patching ids
   * would fight the unique `(task_id, sort_order)` key half way through. Same approach as
   * `OpgaveForm`, deliberately, so the two cannot disagree about what a saved task looks like.
   */
  async function saveTaskImages(images: TaskImage[]) {
    if (!row) return;
    setBusy('save');
    setError(null);
    const usable = images.filter(im => im.image_url.trim());
    const del = await supabase.from('open_task_images').delete().eq('task_id', row.id);
    if (del.error) {
      setBusy(null);
      setError(del.error.message);
      return;
    }
    if (usable.length > 0) {
      const ins = await supabase.from('open_task_images').insert(
        usable.map((im, i) => ({
          task_id: row.id,
          sort_order: i + 1,
          image_url: im.image_url.trim(),
          caption: im.caption?.trim() || null,
          alt_text: im.alt_text?.trim() || null,
          group_label: im.group_label?.trim() || null,
        }))
      );
      if (ins.error) {
        setBusy(null);
        setError(ins.error.message);
        return;
      }
    }
    setBusy(null);
    setNote('Afbeeldingen opgeslagen.');
    router.refresh();
    void load(true);
  }

  async function generateAudio(kind: 'question' | 'stimulus' | 'task') {
    setBusy(`audio-${kind}`);
    setError(null);
    setNote(null);
    try {
      const [url, body] =
        kind === 'stimulus'
          ? ['/api/generate-stimulus-audio', { stimulusId: question?.stimuli?.id, force: true }]
          : kind === 'task'
            ? ['/api/generate-question-audio', { openTaskId: row?.id }]
            : ['/api/generate-question-audio', { id: row?.id }];

      const res = await fetch(url as string, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Audio genereren is niet gelukt.');
      // The stimulus route reports per-item failures inside a 200 — a batch where everything
      // failed is not an error response, and treating it as success would be a lie.
      if (Array.isArray(json.failed) && json.failed.length > 0) {
        throw new Error(json.failed.map((f: { error: string }) => f.error).join('; '));
      }
      setNote('Audio gegenereerd.');
      router.refresh();
      void load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Audio genereren is niet gelukt.');
    } finally {
      setBusy(null);
    }
  }

  const validated = (question ?? task)?.review_status === 'validated';

  return (
    <Sheet open={row != null} onOpenChange={(open: boolean) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-xl">
        {row && (
          <div className="flex flex-col gap-5 p-6">
            <header className="pr-8">
              <p className="text-xs font-bold tracking-widest text-on-surface-variant uppercase">
                {row.skill} · examen {row.examNumber} · #{row.sortOrder}
              </p>
              <h2 className="mt-1 font-headline text-lg leading-snug font-bold text-on-surface">
                {row.kind === 'question' ? 'Vraag bewerken' : 'Opdracht bewerken'}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {validated ? (
                  // Green, not the brand orange: "nagekeken" is the good state, and orange reads
                  // as needs-attention next to the concept badge.
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#15803d]">
                    <Check size={13} strokeWidth={2.6} aria-hidden /> Nagekeken
                  </span>
                ) : (
                  <Badge variant="outline" className="text-on-surface-variant">Concept</Badge>
                )}
                <span className="text-xs text-on-surface-variant">{row.typeLabel}</span>
              </div>
            </header>

            {loading && (
              <p className="flex items-center gap-2 text-sm text-on-surface-variant">
                <Loader2 size={15} className="animate-spin" aria-hidden /> Laden…
              </p>
            )}

            {error && (
              <p className="flex items-start gap-2 rounded-xl bg-error-container/20 p-3 text-sm text-error">
                <TriangleAlert size={15} className="mt-0.5 shrink-0" aria-hidden />
                {error}
              </p>
            )}
            {note && <p className="rounded-xl bg-surface-container-low p-3 text-sm text-on-surface-variant">{note}</p>}

            {question && (
              <QuestionEditor
                q={question}
                busy={busy}
                level={row.level}
                skill={row.skill}
                onSaveAll={saveQuestionAll}
                onChange={setQuestion}
                onDraft={draft}
                onAudio={generateAudio}
              />
            )}

            {task && (
              <TaskEditor
                t={task}
                busy={busy}
                level={row.level}
                skill={row.skill}
                onChange={setTask}
                onDraft={draft}
                onSave={save}
                onSaveImages={saveTaskImages}
                onAudio={generateAudio}
              />
            )}

            <footer className="flex flex-wrap items-center gap-2 border-t border-outline-variant pt-4">
              {/* Validation is a human action and is its own button, never a side effect of
                  saving text — that distinction is the entire "door een docent gevalideerd" claim. */}
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => save({ review_status: validated ? 'pending' : 'validated' })}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                  validated
                    ? 'border border-outline-variant text-on-surface-variant hover:bg-surface-container'
                    : 'bg-primary text-white hover:bg-primary-container'
                }`}
              >
                <BadgeCheck size={15} aria-hidden />
                {validated ? 'Terug naar concept' : 'Markeer als nagekeken'}
              </button>

              <Link
                href={
                  row.kind === 'question'
                    ? `/${locale}/admin/questions/${row.id}/edit`
                    : `/${locale}/admin/opgaven/${row.id}/edit`
                }
                className="ml-auto inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface"
              >
                Volledige editor
                <ExternalLink size={14} aria-hidden />
              </Link>
            </footer>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/**
 * What `/api/admin/suggest-item` returns for `target: 'question'`.
 *
 * Declared here rather than imported from `lib/ai/suggest.ts`: that module pulls in the `ai` SDK and
 * the gateway config, and this is a client component — importing it would drag all of that into the
 * browser bundle. The route re-labels options from "A" and guarantees exactly one `is_correct`.
 */
type QuestionSuggestionShape = {
  prompt: string;
  explanation: string;
  options: { label: 'A' | 'B' | 'C' | 'D'; body: string; is_correct: boolean }[];
};

/* ── Editors ──────────────────────────────────────────────────────────────────────────────── */

type DraftFn = (action: AuthorAction, current: string, apply: (t: string) => void) => void;

function QuestionEditor({
  q, busy, level, skill, onChange, onDraft, onSaveAll, onAudio,
}: {
  q: QuestionDetail;
  busy: string | null;
  /** Null on a non-levelled onderdeel — there is no register, so no meter is shown. */
  level: Level | null;
  skill: string;
  onChange: (q: QuestionDetail) => void;
  onDraft: DraftFn;
  onSaveAll: (q: QuestionDetail) => void;
  onAudio: (k: 'question' | 'stimulus' | 'task') => void;
}) {
  // `image` → one picture per option, `image_grid` → up to three. `text` options have none, and
  // showing an empty picker on all 25 Lezen questions would be noise.
  const perOption = q.option_layout === 'image_grid' ? 3 : q.option_layout === 'image' ? 1 : 0;

  const options = [...q.question_options].sort((a, b) => a.label.localeCompare(b.label));

  /** How many options this onderdeel allows, from `exam_formats`. */
  const maxOptions =
    (level && isSkillSlug(skill) ? formatRules(level, skill).options?.[1] : null) ?? 4;

  /** Mark one option as the answer. Exactly one, always — a radio, not a checkbox. */
  function setCorrect(label: string) {
    onChange({
      ...q,
      question_options: q.question_options.map(o => ({ ...o, is_correct: o.label === label })),
    });
  }

  /**
   * Add an option, unsaved.
   *
   * Negative ids mark a row that does not exist yet; `saveQuestionAll` inserts those and updates the
   * rest. Adding is safe here because it is an INSERT — it is *removing* an option that cascades
   * `user_question_results.chosen_option_id` to NULL, which is why that stays in the full editor.
   */
  function addOption() {
    const label = LABELS[options.length];
    if (!label) return;
    const tempId = Math.min(0, ...q.question_options.map(o => o.id)) - 1;
    onChange({
      ...q,
      question_options: [
        ...q.question_options,
        { id: tempId, label, body: '', is_correct: false, image_urls: [], image_alt: null },
      ],
    });
  }

  return (
    <div className="space-y-5">
      {q.stimuli && (
        <section className="rounded-xl border border-outline-variant p-3.5">
          <p className="text-xs font-bold tracking-widest text-on-surface-variant uppercase">
            Stimulus · {q.stimuli.kind}
          </p>
          <p className="mt-1 text-sm font-medium text-on-surface">{q.stimuli.title || '—'}</p>

          {/* The text the question is *about*, read-only and right here.
              Judging "does this vraag have exactly one defensible answer?" means reading the
              fragment, and the drawer used to show only its title — so the docent either guessed or
              opened a second screen. Capped in height because a Lezen text is longer than the
              fields below it and would push the whole editor off-screen. */}
          {(q.stimuli.body_html || q.stimuli.script || q.stimuli.intro) && (
            <div className="mt-2 max-h-52 overflow-y-auto rounded-lg bg-surface-container-low p-2.5">
              {q.stimuli.intro && (
                <p className="m-0 mb-1.5 text-xs italic text-on-surface-variant">{q.stimuli.intro}</p>
              )}
              <p className="m-0 whitespace-pre-wrap text-xs leading-relaxed text-on-surface">
                {q.stimuli.script?.trim() || stripHtml(q.stimuli.body_html ?? '')}
              </p>
            </div>
          )}

          {/* A whole question suggested against this fragment — vraagzin, opties and uitleg in one
              go, which is the only way the three can be consistent with each other. Filling them
              one button at a time produced an explanation for an answer the options did not offer. */}
          {level && (
            <div className="mt-2.5">
              <MagicFill<QuestionSuggestionShape>
                placeholder="Waar de vraag over moet gaan (mag leeg)"
                body={() => ({
                  target: 'question',
                  stimulusId: q.stimuli?.id,
                  level,
                  skill,
                })}
                onSuggestion={sug => {
                  const byLabel = new Map<string, string>(sug.options.map(o => [o.label, o.body]));
                  onChange({
                    ...q,
                    prompt: sug.prompt || q.prompt,
                    explanation: sug.explanation || q.explanation,
                    // Matched by label, and only the text is touched: `is_correct` stays where it
                    // is because flipping it needs the unique-index dance in the full editor.
                    question_options: q.question_options.map(o =>
                      byLabel.has(o.label) ? { ...o, body: byLabel.get(o.label) ?? o.body } : o
                    ),
                  });
                }}
              />
            </div>
          )}

          {q.stimuli.kind === 'image' && (
            <div className="mt-2.5 space-y-2">
              <OptionImagePicker
                urls={q.stimuli.image_url ? [q.stimuli.image_url] : []}
                max={1}
                query={q.stimuli.title ?? q.prompt}
                onChange={urls =>
                  onChange({
                    ...q,
                    stimuli: q.stimuli ? { ...q.stimuli, image_url: urls[0] ?? null } : null,
                  })
                }
              />
              <input
                value={q.stimuli.image_alt ?? ''}
                onChange={e =>
                  onChange({
                    ...q,
                    stimuli: q.stimuli ? { ...q.stimuli, image_alt: e.target.value } : null,
                  })
                }
                placeholder="Alt-tekst — beschrijf wat er te zien is"
                className="admin-field"
              />
              {!q.stimuli.image_url && (
                <p className="m-0 text-xs text-[#a24000]">
                  {/* The CHECK `stimuli_payload_matches_kind` requires a URL, so the save refuses
                      this rather than letting Postgres answer with a constraint name. */}
                  Een beeldstimulus moet een afbeelding hebben.
                </p>
              )}
            </div>
          )}

          {q.stimuli.kind === 'audio' && (
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {q.stimuli.audio_url && <audio controls src={q.stimuli.audio_url} className="h-9 max-w-[260px]" />}
              <AiButton
                busy={busy === 'audio-stimulus'}
                disabled={busy !== null}
                onClick={() => onAudio('stimulus')}
                icon="audio"
              >
                {q.stimuli.audio_url ? 'Opnieuw genereren' : 'Genereer audio'}
              </AiButton>
            </div>
          )}
        </section>
      )}

      <Field label="Vraag">
        <textarea
          value={q.prompt}
          onChange={e => onChange({ ...q, prompt: e.target.value })}
          rows={3}
          className="admin-field"
        />
        {level && <LengthMeter text={q.prompt} level={level} field="prompt" skill={skill} />}
        <Row>
          <AiButton busy={busy === 'draft_question'} disabled={busy !== null}
            onClick={() => onDraft('draft_question', q.prompt, t => onChange({ ...q, prompt: t }))}>
            Voorstellen
          </AiButton>
          <AiButton busy={busy === 'simpler'} disabled={busy !== null}
            onClick={() => onDraft('simpler', q.prompt, t => onChange({ ...q, prompt: t }))}>
            Makkelijker
          </AiButton>
        </Row>
      </Field>

      <Field label="Soort vraag" hint="Bepaalt of de antwoorden tekst of afbeeldingen zijn.">
        <div className="flex flex-wrap gap-1.5">
          {LAYOUTS.map(l => (
            <button
              key={l.value}
              type="button"
              onClick={() => onChange({ ...q, option_layout: l.value })}
              aria-pressed={q.option_layout === l.value}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                q.option_layout === l.value
                  ? 'bg-primary text-white'
                  : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
        <p className="mt-1 mb-0 text-xs text-on-surface-variant">
          {LAYOUTS.find(l => l.value === q.option_layout)?.hint}
        </p>
      </Field>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <p className="m-0 text-sm font-medium text-on-surface">Antwoordopties</p>
          {options.length < maxOptions && (
            <button
              type="button"
              onClick={addOption}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <Plus size={13} aria-hidden /> Optie {LABELS[options.length]}
            </button>
          )}
        </div>
        <ul className="list-none space-y-1.5 p-0">
          {options.map(o => (
            <li key={o.id} className="rounded-xl border border-outline-variant p-3">
              <div className="flex items-start gap-2 text-sm">
                {/* The answer key, editable at last. A radio rather than a toggle per option,
                    because `question_options_one_correct_idx` allows exactly one correct row per
                    question — the input mirrors the constraint instead of letting her build a
                    state the database will refuse. */}
                <label className="mt-0.5 flex shrink-0 cursor-pointer items-center gap-1.5">
                  <input
                    type="radio"
                    name={`correct-${q.id}`}
                    checked={o.is_correct}
                    onChange={() => setCorrect(o.label)}
                    aria-label={`Optie ${o.label} is het juiste antwoord`}
                    className="accent-primary"
                  />
                  <span className={`w-4 font-bold ${o.is_correct ? 'text-primary' : 'text-on-surface-variant'}`}>
                    {o.label}
                  </span>
                </label>

                {/* The answer text is editable here, and that is not a loosening of the drawer's
                    rule: writing `body` is an UPDATE of a row that already exists, exactly like
                    `image_urls` below. What stays in the full editor is adding, removing and
                    re-labelling options, because a *delete* cascades
                    `user_question_results.chosen_option_id` to NULL.

                    It used to be read-only, which meant a question whose options were still empty
                    could not be answered at all from this screen — and an empty option rendered as
                    the italic word "afbeelding" whatever its layout, so a text question read as a
                    picture question. */}
                <div className="min-w-0 flex-1">
                  <input
                    value={o.body ?? ''}
                    onChange={e =>
                      onChange({ ...q, question_options: replace(q.question_options, o.id, { body: e.target.value }) })
                    }
                    placeholder={perOption > 0 ? 'Tekst naast de afbeelding (optioneel)' : `Antwoord ${o.label}`}
                    className="admin-field"
                  />
                  {level && perOption === 0 && <LengthMeter text={o.body ?? ''} level={level} field="option" />}
                </div>

              </div>

              {perOption > 0 && (
                <div className="mt-2.5 space-y-2">
                  <OptionImagePicker
                    urls={o.image_urls ?? []}
                    max={perOption}
                    query={q.prompt}
                    onChange={urls => onChange({ ...q, question_options: replace(q.question_options, o.id, { image_urls: urls }) })}
                  />
                  <input
                    value={o.image_alt ?? ''}
                    onChange={e => onChange({ ...q, question_options: replace(q.question_options, o.id, { image_alt: e.target.value }) })}
                    placeholder="Alt-tekst"
                    className="admin-field"
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <Field label="Uitleg">
        <textarea
          value={q.explanation ?? ''}
          onChange={e => onChange({ ...q, explanation: e.target.value })}
          rows={4}
          placeholder="Waarom is dit het juiste antwoord?"
          className="admin-field"
        />
        {level && (
          <LengthMeter text={q.explanation ?? ''} level={level} field="explanation" skill={skill} showSentences />
        )}
        <Row>
          <AiButton busy={busy === 'draft_explanation'} disabled={busy !== null}
            onClick={() => onDraft('draft_explanation', q.explanation ?? '', t => onChange({ ...q, explanation: t }))}>
            Voorstellen
          </AiButton>
          <AiButton busy={busy === 'shorter'} disabled={busy !== null}
            onClick={() => onDraft('shorter', q.explanation ?? '', t => onChange({ ...q, explanation: t }))}>
            Korter
          </AiButton>
        </Row>
      </Field>

      <Field label="Vraag voorlezen">
        <div className="flex flex-wrap items-center gap-2">
          {q.prompt_audio_url && <audio controls src={q.prompt_audio_url} className="h-9 max-w-[260px]" />}
          <AiButton busy={busy === 'audio-question'} disabled={busy !== null} onClick={() => onAudio('question')} icon="audio">
            {q.prompt_audio_url ? 'Opnieuw genereren' : 'Genereer audio'}
          </AiButton>
        </div>
      </Field>

      {/* One save for the whole question — vraag, soort, alle opties, het juiste antwoord and the
          image stimulus. It sits at the bottom of the editor rather than beside each field, because
          six buttons meant six ways to save half a question. Validation stays its own action in the
          drawer's footer: marking an item "nagekeken" is a human judgement, never a side effect of
          saving text. */}
      <div className="sticky bottom-0 -mx-0.5 flex flex-wrap items-center gap-2 border-t border-outline-variant bg-surface px-0.5 py-3">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => onSaveAll(q)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-container disabled:opacity-50"
        >
          {busy === 'save' ? (
            <Loader2 size={15} className="animate-spin motion-reduce:animate-none" aria-hidden />
          ) : (
            <Check size={15} aria-hidden />
          )}
          Alles opslaan
        </button>
        <span className="text-xs text-on-surface-variant">
          Een optie verwijderen doe je in de volledige editor — dat wist wat kandidaten kozen.
        </span>
      </div>
    </div>
  );
}

function TaskEditor({
  t, busy, level, skill, onChange, onDraft, onSave, onSaveImages, onAudio,
}: {
  t: TaskDetail;
  busy: string | null;
  /** Null on a non-levelled onderdeel — there is no register, so no meter is shown. */
  level: Level | null;
  skill: string;
  onChange: (t: TaskDetail) => void;
  onDraft: DraftFn;
  onSave: (patch: Record<string, unknown>) => void;
  onSaveImages: (images: TaskImage[]) => void;
  onAudio: (k: 'question' | 'stimulus' | 'task') => void;
}) {
  const expected = REQUIRED_IMAGES[t.image_usage] ?? 0;
  const patchImage = (i: number, patch: Partial<TaskImage>) =>
    onChange({ ...t, images: t.images.map((im, j) => (j === i ? { ...im, ...patch } : im)) });

  return (
    <div className="space-y-5">
      <Field label="Titel">
        <input
          value={t.title ?? ''}
          onChange={e => onChange({ ...t, title: e.target.value })}
          className="admin-field"
        />
        <Row>
          <SaveButton busy={busy === 'save'} onClick={() => onSave({ title: t.title })} />
        </Row>
      </Field>

      <Field label="Opdracht">
        <textarea
          value={t.prompt_html ?? ''}
          onChange={e => onChange({ ...t, prompt_html: e.target.value })}
          rows={6}
          className="admin-field font-mono text-xs"
        />
        {level && (
          <LengthMeter
            text={stripHtml(t.prompt_html ?? '')}
            level={level}
            field="task_prompt"
            skill={skill}
            showSentences
          />
        )}
        <Row>
          <AiButton busy={busy === 'draft_task'} disabled={busy !== null}
            onClick={() => onDraft('draft_task', t.prompt_html ?? '', v => onChange({ ...t, prompt_html: v }))}>
            Voorstellen
          </AiButton>
          <AiButton busy={busy === 'longer'} disabled={busy !== null}
            onClick={() => onDraft('longer', t.prompt_html ?? '', v => onChange({ ...t, prompt_html: v }))}>
            Langer
          </AiButton>
          <AiButton busy={busy === 'shorter'} disabled={busy !== null}
            onClick={() => onDraft('shorter', t.prompt_html ?? '', v => onChange({ ...t, prompt_html: v }))}>
            Korter
          </AiButton>
          <SaveButton busy={busy === 'save'} onClick={() => onSave({ prompt_html: t.prompt_html })} />
        </Row>
      </Field>

      {skill === 'spreken' && (
        <Field label="Gesproken opdracht" hint="Wat de kandidaat hoort. Niet hetzelfde als de tekst hierboven.">
          <textarea
            value={t.prompt_script ?? ''}
            onChange={e => onChange({ ...t, prompt_script: e.target.value })}
            rows={3}
            className="admin-field"
          />
          <Row>
            <SaveButton busy={busy === 'save'} onClick={() => onSave({ prompt_script: t.prompt_script })} />
            <AiButton busy={busy === 'audio-task'} disabled={busy !== null} onClick={() => onAudio('task')} icon="audio">
              {t.prompt_audio_url ? 'Opnieuw genereren' : 'Genereer audio'}
            </AiButton>
          </Row>
          {t.prompt_audio_url && <audio controls src={t.prompt_audio_url} className="mt-2 h-9 max-w-[260px]" />}
        </Field>
      )}

      {/* Shown whenever the task's image rule expects pictures. `image_usage: 'none'` is every
          Schrijven task except picture_note, and an empty picker there invites images the CHECK
          `open_tasks_image_usage_is_speaking` would reject. */}
      {t.image_usage !== 'none' && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-on-surface">
              Afbeeldingen
              <span className="ml-1.5 text-xs font-normal text-on-surface-variant tabular-nums">
                {t.images.length} van {expected} verwacht
              </span>
            </p>
            {/* Stated, not silently enforced: the count is a publish-time rule
                (`exam_publish_issues()`), and blocking a save mid-authoring would mean she cannot
                park a half-finished task. */}
            {t.images.length !== expected && (
              <span className="inline-flex items-center gap-1 text-xs text-secondary">
                <TriangleAlert size={12} aria-hidden />
                Deze plaatjesregel verwacht {expected}
              </span>
            )}
          </div>

          <ul className="list-none space-y-3 p-0">
            {t.images.map((im, i) => (
              <li key={im.id ?? `new-${i}`} className="rounded-xl border border-outline-variant p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold tracking-widest text-on-surface-variant uppercase">
                    Plaatje {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => onChange({ ...t, images: t.images.filter((_, j) => j !== i) })}
                    className="text-xs font-medium text-on-surface-variant hover:text-error"
                  >
                    Verwijderen
                  </button>
                </div>

                <OptionImagePicker
                  urls={im.image_url ? [im.image_url] : []}
                  max={1}
                  query={t.title ?? ''}
                  onChange={urls => patchImage(i, { image_url: urls[0] ?? '' })}
                />

                <div className="mt-2 space-y-2">
                  <input
                    value={im.caption ?? ''}
                    onChange={e => patchImage(i, { caption: e.target.value })}
                    placeholder="Bijschrift — wat de kandidaat leest"
                    className="admin-field"
                  />
                  <input
                    value={im.alt_text ?? ''}
                    onChange={e => patchImage(i, { alt_text: e.target.value })}
                    placeholder="Alt-tekst — beschrijf wat er te zien is"
                    className="admin-field"
                  />
                  <input
                    value={im.group_label ?? ''}
                    onChange={e => patchImage(i, { group_label: e.target.value })}
                    placeholder="Groep, bijv. picture_note: voor / na"
                    className="admin-field"
                  />
                </div>
              </li>
            ))}
          </ul>

          <Row>
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...t,
                  images: [...t.images, { image_url: '', caption: null, alt_text: null, group_label: null }],
                })
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant px-2.5 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container"
            >
              <ImagePlus size={13} aria-hidden />
              Plaatje toevoegen
            </button>
            <SaveButton busy={busy === 'save'} onClick={() => onSaveImages(t.images)} />
          </Row>
        </section>
      )}

      <Field label="Voorbeeldantwoord" hint="Wordt nooit naar de kandidaat gestuurd — het is de scoringssleutel.">
        <textarea
          value={t.model_answer ?? ''}
          onChange={e => onChange({ ...t, model_answer: e.target.value })}
          rows={5}
          className="admin-field"
        />
        {level && (
          <LengthMeter
            text={t.model_answer ?? ''}
            level={level}
            field="model_answer"
            skill={skill}
            showSentences
          />
        )}
        <Row>
          <AiButton busy={busy === 'draft_model_answer'} disabled={busy !== null}
            onClick={() => onDraft('draft_model_answer', t.model_answer ?? '', v => onChange({ ...t, model_answer: v }))}>
            Voorstellen
          </AiButton>
          <SaveButton busy={busy === 'save'} onClick={() => onSave({ model_answer: t.model_answer })} />
        </Row>
      </Field>
    </div>
  );
}

/* ── Bits ─────────────────────────────────────────────────────────────────────────────────── */

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-on-surface">{label}</label>
      {children}
      {hint && <p className="text-xs text-on-surface-variant">{hint}</p>}
      <style>{`
        .admin-field {
          width:100%; border-radius:12px; border:1.5px solid var(--color-outline-variant);
          background:var(--color-surface-container-lowest); padding:9px 12px; font:inherit;
          font-size:0.875rem; color:var(--color-on-surface); resize:vertical;
        }
        .admin-field:focus { outline:none; border-color:var(--color-primary); }
      `}</style>
    </div>
  );
}

/** One option updated in place, by id — the list order and every other option are untouched. */
function replace(options: OptionDetail[], id: number, patch: Partial<OptionDetail>): OptionDetail[] {
  return options.map(o => (o.id === id ? { ...o, ...patch } : o));
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-1.5 pt-0.5">{children}</div>;
}

function AiButton({
  children, busy, disabled, onClick, icon = 'ai',
}: {
  children: React.ReactNode;
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
  icon?: 'ai' | 'audio';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant px-2.5 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-50"
    >
      {busy ? (
        <Loader2 size={13} className="animate-spin" aria-hidden />
      ) : icon === 'audio' ? (
        <AudioLines size={13} aria-hidden />
      ) : (
        <Sparkles size={13} aria-hidden />
      )}
      {children}
    </button>
  );
}

function SaveButton({
  busy,
  onClick,
  disabled = false,
}: {
  busy: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || disabled}
      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-container disabled:opacity-50"
    >
      {busy ? <Loader2 size={13} className="animate-spin" aria-hidden /> : <Check size={13} aria-hidden />}
      Opslaan
    </button>
  );
}
