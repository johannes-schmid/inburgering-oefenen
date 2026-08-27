'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, Loader2, Plus, TriangleAlert } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import StimulusEditor, {
  blankStimulus, missingPayload, toStimulusDraft, toStimulusRow, type StimulusDraft,
} from '../../../_components/StimulusEditor';
import { categoryColors, UNCATEGORISED, type CategoryColor } from '@/lib/admin/category-colors';
import {
  blankQuestion, saveQuestionDraft, validateQuestion, type QuestionDraft,
} from '@/lib/admin/question-write';
import type { FragmentContext } from '@/lib/admin/stimuli';
import { examLabel, isBacklog } from '@/lib/admin/backlog';
import { formatRange, formatRules, isSkillSlug, levelLabel, type Level } from '@/data/skills';
import { stripHtml } from '@/lib/admin/length-targets';
import FragmentPreview from './FragmentPreview';
import QuestionCard from './QuestionCard';

/**
 * The fragment, full page: two thirds authoring, one third live preview.
 *
 * A fragment used to be edited in a right-hand drawer. That was the wrong container for it — a
 * fragment is a text plus 2–3 questions plus their options and answer keys, and the drawer could
 * show about a fifth of that at a time. Worse, the questions were edited on a different screen
 * from the text they are about, which is the one relationship that matters when writing them.
 *
 * ## One draft, one save
 * The fragment and every one of its questions live in this component's state and are written by a
 * single "Opslaan". That is what makes the preview honest: it renders the draft, so it shows what
 * you just typed rather than what is in the database. It also means a half-finished question
 * cannot be silently left behind on a screen you navigated away from.
 *
 * The write order matters and is not interchangeable: the fragment goes first, because a new one
 * has no id until it is inserted and `questions.stimulus_id` is NOT NULL; reordered questions are
 * then parked at temporary positions before the real ones are written (see `save` — the deferred
 * unique key does not help across separate PostgREST requests); deletions go last, so a failure
 * part-way through has removed nothing.
 *
 * ## The colour is the tekstsoort
 * Taken from `categoryColors()` over the (level, skill)'s full section list in `sort_order` — the
 * same list the exam builder passes, which is what makes "gesprek" the same colour on both
 * screens. Colours are assigned per list, so a different list means different colours.
 */
export default function FragmentEditor({
  context,
  locale,
  focusQuestionId = null,
}: {
  context: FragmentContext;
  locale: string;
  /**
   * Open this question rather than the first one. The content table links a question row to its
   * fragment — a Lezen question is not editable away from the text it is about — and without this
   * the link would land on the right page with the wrong question expanded.
   */
  focusQuestionId?: number | null;
}) {
  const router = useRouter();
  const { exam, sections } = context;
  const level = (exam.level ?? 'a2') as Level;

  const [fragment, setFragment] = useState<StimulusDraft>(
    context.stimulus
      ? toStimulusDraft(context.stimulus)
      : blankStimulus(exam.skill, 1)
  );
  const [questions, setQuestions] = useState<QuestionDraft[]>(() =>
    context.questions.map(q => ({
      id: q.id,
      stimulus_id: context.stimulus?.id ?? null,
      sort_order: q.sort_order,
      prompt: q.prompt ?? '',
      explanation: q.explanation ?? '',
      image_url: q.image_url ?? '',
      option_layout: q.option_layout,
      options: q.options.map(o => ({
        id: o.id,
        label: o.label,
        body: o.body ?? '',
        image_urls: o.image_urls ?? [],
        image_alt: o.image_alt ?? '',
        is_correct: o.is_correct,
      })),
    }))
  );
  /** Ids marked for deletion, applied on save. Only ever holds ids that exist in the database. */
  const [removed, setRemoved] = useState<Set<number>>(new Set());
  /** The question `?vraag=` asked for, or the first one. -1 when it is not on this fragment. */
  const focusIndex = focusQuestionId
    ? context.questions.findIndex(q => q.id === focusQuestionId)
    : -1;
  const initialIndex = focusIndex >= 0 ? focusIndex : context.questions.length ? 0 : null;
  const [openIndex, setOpenIndex] = useState<number | null>(initialIndex);
  const [previewIndex, setPreviewIndex] = useState(Math.max(0, focusIndex));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  const answerCounts = useMemo(
    () => new Map(context.questions.map(q => [q.id, q.answerCount])),
    [context.questions]
  );
  /**
   * Where each saved question sits **in the database**, which is not where the draft says it sits.
   * `moveQuestion` renumbers the draft immediately so the list and the preview agree; the save
   * needs the other number to know which rows are actually moving. See the parking pass in `save`.
   */
  const savedOrder = useMemo(
    () => new Map(context.questions.map(q => [q.id, q.sort_order])),
    [context.questions]
  );

  const rules = isSkillSlug(exam.skill) ? formatRules(level, exam.skill) : null;
  const optionRange: [number, number] = rules?.options ?? [3, 4];
  const perStimulus = rules?.questionsPerStimulus ?? null;

  const colours = useMemo(
    () => categoryColors(sections.map(s => s.slug)),
    [sections]
  );
  const section = sections.find(s => s.id === fragment.section_id) ?? null;
  const colour: CategoryColor = section ? colours.get(section.slug) ?? UNCATEGORISED : UNCATEGORISED;

  /**
   * What a question suggestion is written *about*, taken from the draft rather than the database:
   * on a brand-new fragment there is no saved row to read, and on an edited one the saved text is
   * the old text. The script wins for Luisteren — the audio is the fragment there, and `body_html`
   * is usually empty on those.
   */
  const stimulusText = (fragment.script.trim() || stripHtml(fragment.body_html)).trim();

  const live = questions.filter(q => !(q.id && removed.has(q.id)));
  const outsideRange =
    perStimulus != null && (live.length < perStimulus[0] || live.length > perStimulus[1]);

  /**
   * Check the live questions against the fragment as it now reads, and patch only what changed.
   *
   * Handed to `StimulusEditor` as the second button beside the length rewrite, because the
   * questions live here and the text lives there. Three rules the route already enforces and this
   * relies on:
   *
   * - A question the model leaves alone comes back in `skipped` and is **not** touched here, so it
   *   keeps its own option ids and the docent's own wording.
   * - A revised question keeps exactly the labels and option count it was sent with. Options are
   *   reconciled by label on save (`saveQuestionDraft`), and a dropped label would delete a
   *   `question_options` row — which cascades `user_question_results.chosen_option_id` to NULL and
   *   erases what past candidates picked.
   * - Nothing is written. This patches the draft; "Opslaan" is still the only write on this page.
   */
  async function reviseQuestions(): Promise<string> {
    if (!stimulusText) throw new Error('Dit fragment heeft nog geen tekst om de vragen tegen te controleren.');
    if (live.length === 0) throw new Error('Er staan nog geen vragen op dit fragment.');

    const res = await fetch('/api/admin/rewrite-length', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target: 'questions',
        level,
        skill: exam.skill,
        stimulusText,
        questions: live.map((q, i) => ({
          sort_order: i + 1,
          prompt: q.prompt,
          explanation: q.explanation,
          options: q.options.map(o => ({ label: o.label, body: o.body, is_correct: o.is_correct })),
        })),
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.revision) throw new Error(json.error || 'Bijwerken is niet gelukt.');

    const revised = json.revision.revised as {
      sort_order: number;
      prompt: string;
      explanation: string;
      options: { label: string; body: string; is_correct: boolean }[];
    }[];

    if (revised.length === 0) {
      return 'Alle vragen kloppen nog bij deze tekst — niets aangepast.';
    }

    // Keyed on the position in the live list, which is what was sent. The stored `sort_order` on a
    // draft can lag a reorder, so matching on it would patch the wrong question.
    const byPosition = new Map(revised.map(r => [r.sort_order, r]));
    setQuestions(qs => {
      let position = 0;
      return qs.map(q => {
        if (q.id && removed.has(q.id)) return q;
        position += 1;
        const r = byPosition.get(position);
        if (!r) return q;
        const byLabel = new Map(r.options.map(o => [o.label, o]));
        return {
          ...q,
          prompt: r.prompt,
          explanation: r.explanation,
          options: q.options.map(o => {
            const next = byLabel.get(o.label);
            return next ? { ...o, body: next.body, is_correct: next.is_correct } : o;
          }),
        };
      });
    });

    const numbers = revised.map(r => r.sort_order).join(', ');
    return `Vraag ${numbers} aangepast aan de nieuwe tekst. Lees na en sla zelf op.`;
  }

  function patchQuestion(index: number, next: QuestionDraft) {
    setQuestions(qs => qs.map((q, i) => (i === index ? next : q)));
    setNote('');
  }

  function moveQuestion(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= questions.length) return;
    setQuestions(qs => {
      const next = [...qs];
      [next[index], next[target]] = [next[target], next[index]];
      // `sort_order` is the position within the fragment and is rewritten from the array on every
      // move, so the two can never disagree — the array is the truth on this screen.
      return next.map((q, i) => ({ ...q, sort_order: i + 1 }));
    });
    setOpenIndex(cur => (cur === index ? target : cur === target ? index : cur));
  }

  function addQuestion() {
    setQuestions(qs => [
      ...qs,
      { ...blankQuestion(qs.length + 1, optionRange[0]), stimulus_id: fragment.id ?? null },
    ]);
    setOpenIndex(questions.length);
    setPreviewIndex(live.length);
    setNote('');
  }

  function removeQuestion(index: number) {
    const q = questions[index];
    if (q.id) {
      // Staged: a saved question is only really deleted by "Opslaan", so an accidental click is
      // recoverable and the cascade onto `user_question_results` happens once, deliberately.
      setRemoved(prev => new Set(prev).add(q.id!));
    } else {
      setQuestions(qs => qs.filter((_, i) => i !== index).map((x, i) => ({ ...x, sort_order: i + 1 })));
    }
    setOpenIndex(null);
  }

  async function save() {
    const payloadProblem = missingPayload(fragment);
    if (payloadProblem) { setError(payloadProblem); return; }

    for (const [i, q] of live.entries()) {
      // Validated against the *live* list so the numbering in the message matches what she sees,
      // and a question queued for deletion never blocks the save.
      const problem = validateQuestion({ ...q, stimulus_id: q.stimulus_id ?? fragment.id ?? -1 }, i);
      if (problem) { setError(problem); return; }
    }

    setBusy(true);
    setError('');
    setNote('');
    const supabase = createClient();

    try {
      // 1. The fragment first — a new one has no id until now, and `questions.stimulus_id` is
      //    NOT NULL, so nothing below can run before this returns.
      const row = toStimulusRow(fragment, exam.id, exam.skill);
      let stimulusId = fragment.id;
      if (stimulusId) {
        const { error: err } = await supabase.from('stimuli').update(row).eq('id', stimulusId);
        if (err) throw new Error(err.message);
      } else {
        const { data, error: err } = await supabase.from('stimuli').insert(row).select('id').single();
        if (err) throw new Error(err.message);
        stimulusId = (data as { id: number }).id;
      }

      // 2. Park the reordered questions out of the way first.
      //
      //    `questions_stimulus_sort_key` is UNIQUE (stimulus_id, sort_order) DEFERRABLE INITIALLY
      //    DEFERRED — but deferral only helps *inside one transaction*, and PostgREST runs every
      //    request in its own. Swapping questions 1 and 2 therefore fails on the first UPDATE:
      //    question 1 takes position 2 while question 2 is still sitting on it. Negative ids are
      //    used as the temporary positions because they are unique by construction and no real
      //    sort_order is ever below 1.
      const reordered = live.filter((q, i) => q.id && savedOrder.get(q.id) !== i + 1);
      for (const q of reordered) {
        const { error: err } = await supabase
          .from('questions')
          .update({ sort_order: -q.id! })
          .eq('id', q.id!);
        if (err) throw new Error(err.message);
      }

      // 3. The questions, in list order. `saveQuestionDraft` holds every rule about how options
      //    are reconciled — see the note at the top of that module.
      for (const [i, q] of live.entries()) {
        await saveQuestionDraft(supabase, { ...q, sort_order: i + 1 }, stimulusId);
      }

      // 4. Deletions last, so a failure above leaves the docent's work intact.
      if (removed.size > 0) {
        const { error: err } = await supabase
          .from('questions')
          .delete()
          .in('id', [...removed]);
        if (err) throw new Error(err.message);
      }

      if (!fragment.id) {
        router.replace(`/${locale}/admin/fragmenten/${stimulusId}`);
      } else {
        router.refresh();
      }
      setBusy(false);
      setRemoved(new Set());
      setNote('Opgeslagen.');
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : 'Opslaan is niet gelukt.');
    }
  }

  return (
    <div className="space-y-4">
      {/* Sticky: the page runs to several screens once a fragment has three questions open, and
          "Opslaan" is the only way anything on it is written. A save button below the fold on a
          one-draft page is a page that loses work. */}
      <header className="sticky top-0 z-10 -mx-1 flex flex-wrap items-start justify-between gap-3 bg-surface/95 px-1 pt-1 pb-2 backdrop-blur">
        <div className="min-w-0">
          <Link
            href={`/${locale}/admin/questions?niveau=${level}&onderdeel=${exam.skill}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-on-surface-variant no-underline hover:text-on-surface"
          >
            <ArrowLeft size={13} aria-hidden />
            Terug naar vragen &amp; opdrachten
          </Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <h1 className="m-0 font-headline text-xl font-extrabold tracking-tight text-on-surface">
              {fragment.id ? fragment.title.trim() || 'Fragment' : 'Nieuw fragment'}
            </h1>
            {/* The tekstsoort chip carries the category colour — the same colour this soort has in
                the exam builder's Opbouw card and chip rows. */}
            <span
              className="rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap"
              style={{ background: colour.tint, color: colour.ink }}
            >
              {section?.name_nl ?? 'Geen tekstsoort'}
            </span>
          </div>
          <p className="m-0 mt-1 text-xs text-on-surface-variant">
            Niveau {levelLabel(level)} · {exam.skill} ·{' '}
            {isBacklog(exam.number) ? examLabel(exam.number).toLowerCase() : `examen ${exam.number}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {note && <span className="text-xs text-on-surface-variant">{note}</span>}
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-container disabled:opacity-50"
          >
            {busy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Check size={16} aria-hidden />}
            Opslaan
          </button>
        </div>

        {/* A rail in the tekstsoort's colour, inside the sticky header: the fastest way to see,
            on a screen full of fragment tabs, which soort this one is — and it stays visible. */}
        <div
          className="h-1 w-full rounded-full"
          style={{ background: colour.base }}
          aria-hidden
        />
      </header>

      {error && (
        <p className="flex items-start gap-2 rounded-xl bg-error-container/20 p-3 text-sm text-error">
          <TriangleAlert size={15} className="mt-0.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <StimulusEditor
            examId={exam.id}
            level={level}
            skill={exam.skill}
            sections={sections}
            initial={fragment}
            value={fragment}
            onChange={setFragment}
            onClose={() => router.back()}
            onSaved={() => router.refresh()}
            embedded
            questionCount={live.length}
            onReviseQuestions={reviseQuestions}
          />

          <section className="space-y-2.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="m-0 font-headline text-sm font-bold text-on-surface">
                Vragen
                <span className="ml-1.5 text-xs font-normal text-on-surface-variant tabular-nums">
                  {live.length}
                  {perStimulus && ` van ${formatRange(perStimulus)} verwacht`}
                </span>
              </h2>
              {outsideRange && (
                <span className="inline-flex items-center gap-1 text-xs" style={{ color: '#a24000' }}>
                  <TriangleAlert size={12} aria-hidden />
                  Buiten de richtlijn voor dit onderdeel
                </span>
              )}
            </div>

            {questions.length === 0 ? (
              <p className="rounded-xl border border-dashed border-outline-variant p-3.5 text-sm text-on-surface-variant">
                Nog geen vragen op dit fragment. Zonder vraag telt het fragment nergens mee.
              </p>
            ) : (
              <ul className="list-none space-y-1.5 p-0">
                {questions.map((q, i) => (
                  <QuestionCard
                    key={q.id ?? `new-${i}`}
                    question={q}
                    index={i}
                    total={questions.length}
                    level={level}
                    skill={exam.skill}
                    stimulusId={fragment.id ?? null}
                    stimulusText={stimulusText}
                    open={openIndex === i}
                    removed={Boolean(q.id && removed.has(q.id))}
                    answerCount={q.id ? answerCounts.get(q.id) ?? 0 : 0}
                    optionRange={optionRange}
                    onToggle={() => setOpenIndex(cur => (cur === i ? null : i))}
                    onChange={next => patchQuestion(i, next)}
                    onMove={d => moveQuestion(i, d)}
                    onRemove={() => removeQuestion(i)}
                    onRestore={() =>
                      setRemoved(prev => {
                        const next = new Set(prev);
                        if (q.id) next.delete(q.id);
                        return next;
                      })
                    }
                    onPreview={() => setPreviewIndex(Math.max(0, live.indexOf(q)))}
                  />
                ))}
              </ul>
            )}

            <button
              type="button"
              onClick={addQuestion}
              className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant px-2.5 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container"
            >
              <Plus size={13} aria-hidden />
              Vraag toevoegen
            </button>
          </section>
        </div>

        {/* Sticky, because the point of the preview is to watch it change while you type in the
            column beside it — one that scrolls away is a screenshot. */}
        <aside className="lg:sticky lg:top-4 lg:col-span-1 lg:max-h-[calc(100vh-2rem)]">
          <div className="h-full rounded-2xl border border-outline-variant bg-surface-container-low/40 p-4">
            <FragmentPreview
              stimulus={fragment}
              questions={live}
              sectionName={section?.name_nl ?? null}
              index={previewIndex}
              onIndexChange={setPreviewIndex}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
