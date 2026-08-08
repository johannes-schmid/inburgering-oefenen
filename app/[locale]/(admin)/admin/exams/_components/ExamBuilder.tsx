'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle, ArrowRightLeft, AudioLines, Check, ChevronDown, Inbox, Loader2, Pencil, Plus,
  Settings2, TriangleAlert, X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { AdminStimulus, PublishIssue, StructureRow, TaskSummaryRow } from '@/lib/admin/stimuli';
import type { AssignTarget } from '@/lib/admin/backlog';
import type { ExamSetup } from '@/lib/admin/exam-setup';
import ExamSetupSheet from './ExamSetupSheet';
import {
  formatCount, formatRange, formatRules, formatTaskRules, getFormat, isSkillSlug,
  type Level, type SkillSlug,
} from '@/data/skills';

type Exam = {
  id: number;
  level: Level;
  skill: string;
  /** 0 is the backlog — see lib/admin/backlog.ts. */
  number: number;
  title: string | null;
  is_free: boolean;
  published: boolean;
};

type Task = {
  id: number;
  sort_order: number;
  task_type: string;
  title: string | null;
  image_usage: string;
  review_status: string;
};


/**
 * The authoring surface for one exam.
 *
 * It is organised around stimuli because the content is: a stimulus is the left pane, and
 * 1..N questions hang off it. Publishing is gated on `exam_publish_issues()` — a database
 * validator rather than a trigger, so incomplete work stays savable — and the button is
 * disabled only on `error` rows, never on warnings.
 */
export default function ExamBuilder({
  locale,
  exam,
  stimuli,
  issues,
  tasks,
  targets,
  backlogStimuli,
  backlogTasks,
  recordedAnswers,
  viewingBacklog,
  structure,
  backlogStructure,
  taskStructure,
  setup,
}: {
  locale: string;
  exam: Exam;
  stimuli: AdminStimulus[];
  issues: PublishIssue[];
  tasks: Task[];
  targets: AssignTarget[];
  backlogStimuli: AdminStimulus[];
  backlogTasks: Task[];
  recordedAnswers: Record<string, number>;
  viewingBacklog: boolean;
  structure: StructureRow[];
  backlogStructure: StructureRow[];
  taskStructure: TaskSummaryRow[];
  /** The onderdeel's shared rules. `null` only for an unknown skill slug. */
  setup: ExamSetup | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [genBusy, setGenBusy] = useState(false);
  const [genNote, setGenNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState<number | null>(stimuli[0]?.id ?? null);
  /** Which item's "verplaats naar" dropdown is open, as `stimuli:12` / `open_tasks:4`. */
  const [moving, setMoving] = useState<string | null>(null);
  const [pulling, setPulling] = useState<number | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);

  const isOpenSkill = exam.skill === 'schrijven' || exam.skill === 'spreken';
  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity !== 'error');

  /**
   * The authoring rules for this (level, skill). Every field can be `null` — that means DUO's
   * shape has not been verified for this pair, and the rule is not shown rather than guessed.
   */
  const rules = isSkillSlug(exam.skill) ? formatRules(exam.level, exam.skill) : null;

  const totalStimuli = structure.reduce((n, r) => n + r.stimulus_count, 0);
  const totalQuestions = structure.reduce((n, r) => n + r.question_count, 0);
  const totalTasks = taskStructure.reduce((n, r) => n + r.task_count, 0);

  /**
   * The recording cap, if every soort opgave in this onderdeel agrees on one. They do at A2
   * (60 seconds throughout), but a single number is only printable while that holds — so it
   * is derived rather than assumed, and the line is dropped if they ever diverge.
   */
  const recordSeconds = (() => {
    if (!isSkillSlug(exam.skill)) return null;
    const secs = formatTaskRules(exam.level, exam.skill)
      .map(r => r.recordSeconds)
      .filter((s): s is number => s !== null);
    return secs.length > 0 && secs.every(s => s === secs[0]) ? secs[0] : null;
  })();
  /** Backlog counts by tekstsoort, so a shortfall can be read next to what is already waiting. */
  const backlogBySection = new Map(backlogStructure.map(r => [r.section_id, r]));

  /**
   * The structure warnings for one stimulus, taken from `issues` rather than re-derived here.
   * One source of truth: the rules live in `exam_publish_issues()`, and a second copy in the
   * client would drift the moment a bound changes.
   */
  function stimulusIssues(id: number): PublishIssue[] {
    return issues.filter(i => i.entity === 'stimulus' && i.entity_id === id);
  }

  /**
   * Collapse identical issues into one line naming the items they apply to.
   *
   * The structure rules apply per fragment, so one missing habit produces one row per item —
   * ten copies of "Lengte van de audio niet vastgelegd" pushed the actual blocking errors off
   * the screen. Grouped, the panel says what is wrong once and where, which is what the docent
   * needs in order to act.
   */
  function groupIssues(list: PublishIssue[]) {
    const groups = new Map<string, { issue: PublishIssue; ids: number[] }>();
    for (const i of list) {
      const key = `${i.severity}|${i.entity}|${i.issue}`;
      const g = groups.get(key);
      if (g) { if (i.entity_id != null) g.ids.push(i.entity_id); }
      else groups.set(key, { issue: i, ids: i.entity_id == null ? [] : [i.entity_id] });
    }
    return [...groups.values()];
  }

  /** Generate every audio stimulus in this exam that has no file yet. */
  async function generateMissingAudio() {
    setGenBusy(true);
    setGenNote('');
    setError('');
    try {
      const res = await fetch('/api/generate-stimulus-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId: exam.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Genereren is niet gelukt.');
      const made = json.generated?.length ?? 0;
      const bad = json.failed ?? [];
      // Failures are named per stimulus rather than summarised: "3 mislukt" tells the docent
      // nothing about which script to fix.
      setGenNote(
        made === 0 && bad.length === 0
          ? 'Alle audiostimuli hebben al een bestand.'
          : `${made} gegenereerd.` +
            (bad.length ? ` Mislukt: ${bad.map((f: { id: number; error: string }) => `#${f.id} — ${f.error}`).join('; ')}` : '')
      );
      if (made > 0) router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Genereren is niet gelukt.');
    } finally {
      setGenBusy(false);
    }
  }

  async function togglePublished() {
    setBusy(true);
    setError('');
    const { error: err } = await supabase
      .from('exams')
      .update({ published: !exam.published })
      .eq('id', exam.id);
    setBusy(false);
    if (err) { setError(err.message); return; }
    router.refresh();
  }

  /**
   * Move a stimulus (with its questions) or an open task into another exam.
   *
   * One UPDATE of `exam_id`. For a stimulus the `questions_sync_exam_id` trigger carries its
   * questions across, which is exactly why assignment is modelled this way rather than as a
   * per-question field: a Lezen text and its three questions are one unit and cannot be split
   * across two exams.
   *
   * `sort_order` is renumbered to the end of the destination, because `(stimulus_id, sort_order)`
   * and `(exam_id, sort_order)` are unique — dropping an item in at its old position would collide
   * with whatever is already there. The constraint is DEFERRABLE, so the collision would surface at
   * commit as an opaque error rather than here.
   */
  async function moveItem(
    table: 'stimuli' | 'open_tasks',
    id: number,
    targetId: number,
    nextSortOrder: number,
  ) {
    setBusy(true);
    setError('');
    const { error: err } = await supabase
      .from(table)
      .update({ exam_id: targetId, sort_order: nextSortOrder })
      .eq('id', id);
    setBusy(false);
    setMoving(null);
    if (err) { setError(err.message); return; }
    router.refresh();
  }

  /**
   * How many items the destination already holds, so the moved item lands after them.
   *
   * Read off `targets` rather than counted again: it is the same number shown in the dropdown, so
   * the position cannot disagree with what the docent was told.
   */
  function nextSortOrderIn(targetId: number): number {
    return (targets.find(t => t.id === targetId)?.itemCount ?? 0) + 1;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {setup && isSkillSlug(exam.skill) && (
        <ExamSetupSheet
          open={setupOpen}
          level={exam.level}
          skill={exam.skill}
          setup={setup}
          onClose={() => setSetupOpen(false)}
        />
      )}

      {error && (
        <div className="bg-error/10 border border-error/20 rounded-xl p-3 text-sm text-error">{error}</div>
      )}

      {/* ── Opbouw: how the exam is spread across the tekstsoorten ──
          There is deliberately no per-tekstsoort target to compare against. Nobody has
          verified how many gesprekken versus mededelingen a DUO exam contains, so this
          reports the distribution and the docent judges it. What *is* verified — the
          fragment count and the per-fragment rules — is stated underneath. */}
      {isOpenSkill ? (
        /* ── Opbouw for Schrijven en Spreken ──
           The axis here is the soort opgave, not the tekstsoort: for Schrijven the genre *is*
           `task_type` and for Spreken the shape *is* `image_usage`, which is why `sections` was
           retired for these two. Unlike the tekstsoort breakdown this one does have a verified
           quota to compare against — DUO's three A2 Schrijven oefenexamens agree on the mix
           (always one formulier, always one korte tekst) even though they order it differently.

           A soort with zero opgaven is the row most worth seeing, so it is rendered rather than
           omitted, in the brand orange. */
        <div className="rounded-2xl border border-outline-variant p-4">
          <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
            <div className="flex items-baseline gap-3">
              <h2 className="text-sm font-medium text-on-surface m-0">Opbouw</h2>
              <button
                type="button"
                onClick={() => setSetupOpen(true)}
                aria-label="Opzet van het onderdeel bewerken"
                className="inline-flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <Settings2 size={13} aria-hidden /> Opzet
              </button>
            </div>
            <p className="text-xs text-on-surface-variant m-0 tabular-nums">
              {viewingBacklog
                ? `${totalTasks} opgaven`
                : `${totalTasks} van ${formatCount(getFormat(exam.level, exam.skill as SkillSlug).itemCount)} opgaven`}
            </p>
          </div>

          {taskStructure.length === 0 ? (
            <p className="text-xs text-on-surface-variant m-0">
              {viewingBacklog
                ? 'Nog niets in de backlog. Wat je hier maakt, wijs je later aan een examen toe.'
                : 'Nog geen opgaven. Voeg er een toe, of haal er een uit de backlog.'}
            </p>
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="text-on-surface-variant text-left">
                  <th className="font-medium pb-1.5">Soort opgave</th>
                  <th className="font-medium pb-1.5 text-right tabular-nums">Opgaven</th>
                  {!viewingBacklog && (
                    <th className="font-medium pb-1.5 text-right tabular-nums">Verwacht</th>
                  )}
                  {/* A total across the soort, not a per-opgave count — the per-opgave rule is
                      already a hard error in the validator, so this is the "hoeveel plaatjes
                      heb ik hier eigenlijk staan" number. */}
                  <th className="font-medium pb-1.5 text-right tabular-nums">Afbeeldingen totaal</th>
                  <th className="font-medium pb-1.5 text-right">Rubriek</th>
                </tr>
              </thead>
              <tbody>
                {taskStructure.map(r => {
                  // A gap only counts as a gap against a verified expectation. On the backlog
                  // there is no expectation at all — it is a holding area, not an exam.
                  const short = !viewingBacklog
                    && r.expected_min !== null && r.task_count < r.expected_min;
                  return (
                    <tr key={r.category} className="border-t border-outline-variant">
                      <td className={`py-1.5 ${short ? 'text-secondary' : 'text-on-surface'}`}>
                        {r.label_nl}
                      </td>
                      <td className={`py-1.5 text-right tabular-nums ${short ? 'text-secondary' : 'text-on-surface'}`}>
                        {r.task_count}
                      </td>
                      {!viewingBacklog && (
                        <td className="py-1.5 text-right tabular-nums text-on-surface-variant">
                          {formatRange(
                            r.expected_min !== null && r.expected_max !== null
                              ? [r.expected_min, r.expected_max]
                              : null,
                          )}
                        </td>
                      )}
                      <td className="py-1.5 text-right tabular-nums text-on-surface-variant">
                        {r.image_count || '—'}
                      </td>
                      {/* Without a rubriek this soort cannot be graded at all — a harder gap
                          than a missing opgave, and one the publish gate only reports per
                          opgave, never per soort. */}
                      <td className="py-1.5 text-right">
                        {r.rubric_id === null ? (
                          <Link
                            href={`/${locale}/admin/rubrics/new?niveau=${exam.level}&onderdeel=${exam.skill}&categorie=${r.category}`}
                            className="text-secondary hover:underline"
                          >
                            ontbreekt
                          </Link>
                        ) : (
                          <Link
                            href={`/${locale}/admin/rubrics/${r.rubric_id}`}
                            className="text-on-surface-variant hover:text-on-surface hover:underline tabular-nums"
                          >
                            v{r.rubric_version}
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {rules && (rules.partCount || rules.itemsPerPart || recordSeconds) && (
            <p className="text-xs text-on-surface-variant m-0 mt-3 pt-3 border-t border-outline-variant">
              {[
                rules.partCount !== null && `${rules.partCount} onderdelen`,
                rules.itemsPerPart !== null && `${rules.itemsPerPart} opgaven per onderdeel`,
                recordSeconds !== null && `${recordSeconds} sec opname`,
              ].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-outline-variant p-4">
          <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
            <div className="flex items-baseline gap-3">
              <h2 className="text-sm font-medium text-on-surface m-0">Opbouw</h2>
              <button
                type="button"
                onClick={() => setSetupOpen(true)}
                aria-label="Opzet van het onderdeel bewerken"
                className="inline-flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <Settings2 size={13} aria-hidden /> Opzet
              </button>
            </div>
            <p className="text-xs text-on-surface-variant m-0 tabular-nums">
              {/* No target on the backlog: it is a holding area, not an exam, so "0 van 10"
                  would invent a shortfall the docent is not supposed to close there. */}
              {viewingBacklog
                ? `${totalStimuli} fragmenten · ${totalQuestions} vragen`
                : `${totalStimuli} van ${formatCount(rules?.stimulusCount ?? null)} fragmenten · ${totalQuestions} vragen`}
            </p>
          </div>

          {structure.length === 0 ? (
            <p className="text-xs text-on-surface-variant m-0">
              {viewingBacklog
                ? 'Nog niets in de backlog. Wat je hier maakt, wijs je later aan een examen toe.'
                : 'Nog geen fragmenten. Voeg er een toe, of haal er een uit de backlog.'}
            </p>
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="text-on-surface-variant text-left">
                  <th className="font-medium pb-1.5">Tekstsoort</th>
                  <th className="font-medium pb-1.5 text-right tabular-nums">Fragmenten</th>
                  <th className="font-medium pb-1.5 text-right tabular-nums">Vragen</th>
                  {!viewingBacklog && (
                    <th className="font-medium pb-1.5 text-right tabular-nums">In de backlog</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {structure.map(r => {
                  const waiting = backlogBySection.get(r.section_id)?.stimulus_count ?? 0;
                  return (
                    <tr key={r.section_id ?? 'none'} className="border-t border-outline-variant">
                      <td className="py-1.5 text-on-surface">
                        {r.section_id === null
                          /* Brand orange, not `text-warning` — that resolves to yellow-500. */
                          ? <span className="text-secondary">{r.name_nl}</span>
                          : r.name_nl}
                      </td>
                      <td className="py-1.5 text-right tabular-nums text-on-surface">{r.stimulus_count}</td>
                      <td className="py-1.5 text-right tabular-nums text-on-surface">{r.question_count}</td>
                      {!viewingBacklog && (
                        <td className="py-1.5 text-right tabular-nums text-on-surface-variant">
                          {waiting || '—'}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {rules && (rules.stimulusCount || rules.questionsPerStimulus || rules.options || rules.audioSeconds) && (
            <p className="text-xs text-on-surface-variant m-0 mt-3 pt-3 border-t border-outline-variant">
              {[
                rules.stimulusCount !== null && `${rules.stimulusCount} fragmenten`,
                rules.questionsPerStimulus && `${formatRange(rules.questionsPerStimulus)} vragen per fragment`,
                rules.options && `${formatRange(rules.options)} antwoorden`,
                rules.audioSeconds && `${formatRange(rules.audioSeconds)} sec audio`,
              ].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      )}

      {/* ── Publish gate ──
          Hidden on the backlog. `exams_backlog_never_published` rejects the UPDATE outright,
          so the button could only ever produce a constraint error — and a backlog that *could*
          be published would appear in the funnel as an eleventh oefenexamen full of drafts.
          The issue list still renders below, because those are real authoring problems — but
          an empty bordered box would be worse than nothing, so the whole card goes too. */}
      {(!viewingBacklog || issues.length > 0) && (
      <div className="rounded-2xl border border-outline-variant p-4">
        {!viewingBacklog && (
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-medium text-on-surface m-0">
              {exam.published ? 'Dit examen staat live.' : 'Dit examen is nog een concept.'}
            </p>
            <p className="text-xs text-on-surface-variant m-0 mt-0.5">
              {errors.length === 0
                ? 'De controle vindt geen blokkerende problemen.'
                : `${errors.length} ${errors.length === 1 ? 'probleem' : 'problemen'} blokkeren publicatie.`}
            </p>
          </div>
          <button
            type="button"
            onClick={togglePublished}
            disabled={busy || (!exam.published && errors.length > 0)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
              exam.published
                ? 'border border-outline-variant text-on-surface-variant hover:bg-surface-container'
                : 'bg-primary text-white hover:bg-primary-container'
            }`}
          >
            {busy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Check size={16} aria-hidden />}
            {exam.published ? 'Offline halen' : 'Publiceren'}
          </button>
        </div>
        )}

        {issues.length > 0 && (
          <ul className="list-none m-0 mt-3 p-0 space-y-1.5">
            {groupIssues([...errors, ...warnings]).map(({ issue: i, ids }, n) => (
              <li key={n} className="flex items-start gap-2 text-xs">
                <span className={i.severity === 'error' ? 'text-error' : 'text-warning'} style={{ marginTop: 1 }}>
                  {i.severity === 'error'
                    ? <TriangleAlert size={13} strokeWidth={2.4} aria-hidden />
                    : <AlertTriangle size={13} strokeWidth={2.4} aria-hidden />}
                </span>
                <span className="text-on-surface-variant">
                  <span className="font-medium text-on-surface">
                    {ids.length > 1 ? `${ids.length} ${i.entity}` : i.entity}
                  </span>
                  {ids.length > 0 && (
                    <span className="tabular-nums"> #{ids.join(', #')}</span>
                  )} — {i.issue}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      )}

      {/* ── Pull items in from the backlog ──
          The answer to "the exams should pull from the existing questions": everything authored for
          this (level, skill) but not yet assigned, one click from landing in this exam. Hidden when
          viewing the backlog itself, and hidden when it is empty rather than showing an empty box on
          every exam. */}
      {!viewingBacklog && (backlogStimuli.length > 0 || backlogTasks.length > 0) && (
        <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
          <div className="flex items-center gap-2 mb-1">
            <Inbox size={16} className="text-on-surface-variant" aria-hidden />
            <h2 className="text-base font-headline font-bold text-on-surface m-0">
              Uit de backlog{' '}
              <span className="font-normal text-on-surface-variant">
                ({backlogStimuli.length + backlogTasks.length})
              </span>
            </h2>
          </div>
          <p className="text-xs text-on-surface-variant m-0 mb-3">
            Klaar gezette items voor dit onderdeel. Toevoegen verplaatst het item hierheen — het
            staat daarna niet meer in de backlog.
          </p>

          <ul className="list-none m-0 p-0 space-y-2">
            {backlogStimuli.map(s => (
              <li
                key={`bs-${s.id}`}
                className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface px-3.5 py-2.5"
              >
                <span className="text-sm text-on-surface truncate min-w-0">
                  {s.title || `${s.kind} stimulus`}
                </span>
                <span className="text-xs text-on-surface-variant whitespace-nowrap ml-auto">
                  {s.kind} · {s.questions.length} {s.questions.length === 1 ? 'vraag' : 'vragen'}
                </span>
                <button
                  type="button"
                  disabled={busy || pulling === s.id}
                  onClick={() => {
                    setPulling(s.id);
                    void moveItem('stimuli', s.id, exam.id, (stimuli.at(-1)?.sort_order ?? 0) + 1);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-container disabled:opacity-50"
                >
                  {pulling === s.id
                    ? <Loader2 size={13} className="animate-spin" aria-hidden />
                    : <Plus size={13} aria-hidden />}
                  Toevoegen
                </button>
              </li>
            ))}

            {backlogTasks.map(t => (
              <li
                key={`bt-${t.id}`}
                className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface px-3.5 py-2.5"
              >
                <span className="text-sm text-on-surface truncate min-w-0">
                  {t.title || `${t.task_type} opdracht`}
                </span>
                <span className="text-xs text-on-surface-variant whitespace-nowrap ml-auto">
                  {t.task_type}
                  {t.image_usage !== 'none' && ` · ${t.image_usage}`}
                </span>
                <button
                  type="button"
                  disabled={busy || pulling === t.id}
                  onClick={() => {
                    setPulling(t.id);
                    void moveItem('open_tasks', t.id, exam.id, (tasks.at(-1)?.sort_order ?? 0) + 1);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-container disabled:opacity-50"
                >
                  {pulling === t.id
                    ? <Loader2 size={13} className="animate-spin" aria-hidden />
                    : <Plus size={13} aria-hidden />}
                  Toevoegen
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Open tasks (Schrijven / Spreken) ── */}
      {isOpenSkill && (
        <section>
          <h2 className="text-base font-headline font-bold text-on-surface mb-3">Opdrachten</h2>
          {tasks.length === 0 ? (
            <p className="text-sm text-on-surface-variant">
              Nog geen opdrachten. Die worden beheerd bij <span className="font-medium">Opgaven</span>.
            </p>
          ) : (
            <ul className="list-none m-0 p-0 space-y-2">
              {tasks.map(t => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-outline-variant px-3.5 py-2.5"
                >
                  <span className="text-sm text-on-surface">
                    <span className="tabular-nums text-on-surface-variant">{t.sort_order}.</span>{' '}
                    {t.title || `${t.task_type} opdracht`}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                    {t.task_type}
                    {t.image_usage !== 'none' && ` · ${t.image_usage}`}
                    <MoveControl
                      targets={targets}
                      open={moving === `open_tasks:${t.id}`}
                      busy={busy}
                      // Open tasks carry no `user_question_results`; their answers live in
                      // `open_submissions`, which references `exam_id` with ON DELETE SET NULL and is
                      // not invalidated by a move. So there is nothing to warn about here.
                      recorded={0}
                      sourcePublished={exam.published}
                      onToggle={() => setMoving(moving === `open_tasks:${t.id}` ? null : `open_tasks:${t.id}`)}
                      onMove={id => void moveItem('open_tasks', t.id, id, nextSortOrderIn(id))}
                    />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* ── Fragmenten (Lezen / Luisteren) — read-only ──
          This screen assigns; it does not author. Writing a fragment or a question happens in
          Vragen & opdrachten (owner's decision, 2026-08-07), so there is no "nieuw", no editor
          and no delete here — only the ⇄ control and a link into the authoring surface. Two
          screens able to create the same content meant two places to break the same rules. */}
      {!isOpenSkill && (
        <section>
          <div className="flex items-center justify-between gap-4 mb-3">
            <h2 className="text-base font-headline font-bold text-on-surface m-0">
              Fragmenten <span className="text-on-surface-variant font-normal">({stimuli.length})</span>
            </h2>
            <div className="flex items-center gap-2">
              {exam.skill === 'luisteren' && stimuli.some(s => s.kind === 'audio' && !s.audio_url) && (
                <button
                  type="button"
                  onClick={generateMissingAudio}
                  disabled={genBusy}
                  className="inline-flex items-center gap-1.5 border border-outline-variant px-3.5 py-2 rounded-xl text-sm font-medium hover:bg-surface-container transition-colors disabled:opacity-50"
                >
                  {genBusy ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <AudioLines size={15} aria-hidden />}
                  Genereer ontbrekende audio
                </button>
              )}
              <Link
                href={`/${locale}/admin/questions?niveau=${exam.level}&onderdeel=${exam.skill}`}
                className="inline-flex items-center gap-1.5 border border-outline-variant px-3.5 py-2 rounded-xl text-sm font-medium no-underline text-on-surface hover:bg-surface-container transition-colors"
              >
                <Plus size={15} aria-hidden />
                Nieuw item schrijven
              </Link>
            </div>
          </div>

          {genNote && <p className="text-xs text-on-surface-variant mb-3">{genNote}</p>}

          {stimuli.length === 0 && (
            <p className="text-sm text-on-surface-variant">
              Nog geen fragmenten. Schrijf ze in Vragen &amp; opdrachten en haal ze hier uit de
              backlog, of verplaats ze vanuit een ander examen.
            </p>
          )}

          <ul className="list-none m-0 p-0 space-y-2">
            {stimuli.map(s => {
              const open = openId === s.id;
              return (
                // No `overflow-hidden`: it clipped the "verplaats naar" popover to the row, so the
                // lower half of the exam list was unreachable. The children round their own corners.
                <li key={s.id} className="rounded-xl border border-outline-variant">
                  <div className="flex items-center gap-2 px-3.5 py-2.5">
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : s.id)}
                      className="flex items-center gap-2.5 flex-1 text-left min-w-0"
                      aria-expanded={open}
                    >
                      <ChevronDown
                        size={15}
                        aria-hidden
                        style={{
                          transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
                          transition: 'transform .16s ease',
                          flexShrink: 0,
                        }}
                        className="text-on-surface-variant"
                      />
                      <span className="text-sm text-on-surface truncate">
                        <span className="tabular-nums text-on-surface-variant">{s.sort_order}.</span>{' '}
                        {s.title || `${s.kind} stimulus`}
                      </span>
                      <span className="text-xs text-on-surface-variant whitespace-nowrap ml-auto flex items-center gap-1.5">
                        {stimulusIssues(s.id).length > 0 && (
                          <span
                            className="text-warning inline-flex"
                            title={stimulusIssues(s.id).map(i => i.issue).join(' · ')}
                          >
                            <AlertTriangle size={13} strokeWidth={2.4} aria-hidden />
                            <span className="sr-only">
                              {stimulusIssues(s.id).map(i => i.issue).join('. ')}
                            </span>
                          </span>
                        )}
                        {s.kind} · {s.questions.length} {s.questions.length === 1 ? 'vraag' : 'vragen'}
                      </span>
                    </button>

                    <MoveControl
                      targets={targets}
                      open={moving === `stimuli:${s.id}`}
                      busy={busy}
                      recorded={recordedAnswers[String(s.id)] ?? 0}
                      sourcePublished={exam.published}
                      onToggle={() => setMoving(moving === `stimuli:${s.id}` ? null : `stimuli:${s.id}`)}
                      onMove={id => void moveItem('stimuli', s.id, id, nextSortOrderIn(id))}
                    />
                    {/* Editing and deleting live in Vragen & opdrachten. */}
                    <Link
                      href={`/${locale}/admin/questions?niveau=${exam.level}&onderdeel=${exam.skill}&fragment=${s.id}`}
                      aria-label="Fragment bewerken in Vragen en opdrachten"
                      title="Bewerken in Vragen & opdrachten"
                      className="text-on-surface-variant hover:text-primary transition-colors p-1"
                    >
                      <Pencil size={14} aria-hidden />
                    </Link>
                  </div>

                  {open && (
                    <div className="border-t border-outline-variant px-3.5 py-3 bg-surface-container-low space-y-3">
                      {s.intro && <p className="text-xs text-on-surface-variant m-0 italic">{s.intro}</p>}

                      {s.kind === 'text' && s.body_html && (
                        <div
                          className="text-xs text-on-surface leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: s.body_html }}
                        />
                      )}
                      {s.kind === 'image' && s.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.image_url} alt={s.image_alt ?? ''} className="rounded-lg max-w-xs" />
                      )}
                      {s.kind === 'audio' && (
                        s.audio_url
                          ? <audio controls src={s.audio_url} className="w-full max-w-sm" />
                          : <p className="text-xs text-error m-0">Nog geen audio gegenereerd.</p>
                      )}

                      <ul className="list-none m-0 p-0 space-y-1.5">
                        {s.questions.map(q => {
                          const correct = q.question_options.find(o => o.is_correct);
                          return (
                            <li key={q.id} className="flex items-start justify-between gap-3">
                              <span className="text-xs text-on-surface">
                                <span className="tabular-nums text-on-surface-variant">{q.sort_order}.</span>{' '}
                                {q.prompt}
                                <span className="text-on-surface-variant">
                                  {' '}· {q.question_options.length} opties
                                  {q.option_layout !== 'text' && ` · ${q.option_layout}`}
                                  {correct ? ` · juist ${correct.label}` : ' · GEEN JUIST ANTWOORD'}
                                </span>
                              </span>
                              <Link
                                href={`/${locale}/admin/questions/${q.id}/edit`}
                                className="text-xs font-medium text-primary hover:underline whitespace-nowrap"
                              >
                                Bewerken
                              </Link>
                            </li>
                          );
                        })}
                      </ul>

                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}


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
    </div>
  );
}



/**
 * "Verplaats naar" — the assignment control, on every stimulus and every open task.
 *
 * ## Warn, then allow
 * Moving an item out of a **published** exam is permitted, but not silently. `user_question_results`
 * rows point at the questions, so after the move an already-recorded score is a score of an exam
 * that no longer contains those items. The count is shown first and the docent confirms; the answers
 * are never deleted. (The alternative — refusing outright — was considered and rejected: fixing a
 * misfiled item in a live exam is a normal thing to need to do.)
 */
function MoveControl({
  targets,
  open,
  busy,
  recorded,
  sourcePublished,
  onToggle,
  onMove,
}: {
  targets: AssignTarget[];
  open: boolean;
  busy: boolean;
  recorded: number;
  sourcePublished: boolean;
  onToggle: () => void;
  onMove: (targetId: number) => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const needsConfirm = sourcePublished && recorded > 0 && !confirmed;

  if (targets.length === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label="Verplaats naar een ander examen"
        title="Verplaats naar een ander examen"
        className="p-1 text-on-surface-variant transition-colors hover:text-primary"
      >
        <ArrowRightLeft size={14} aria-hidden />
      </button>

      {open && (
        <div
          className="absolute right-0 z-20 mt-1 max-h-[19rem] w-64 overflow-y-auto rounded-xl border border-outline-variant bg-surface p-2"
          style={{ boxShadow: 'var(--shadow-card-md)' }}
        >
          {needsConfirm ? (
            <div className="space-y-2 p-1.5">
              <p className="m-0 flex items-start gap-1.5 text-xs leading-relaxed text-on-surface">
                <TriangleAlert size={13} className="mt-0.5 shrink-0 text-warning" aria-hidden />
                <span>
                  Dit examen staat live en er zijn{' '}
                  <strong className="font-semibold tabular-nums">{recorded}</strong> antwoorden op
                  gegeven. Die blijven bewaard, maar horen daarna bij een examen zonder deze vragen.
                </span>
              </p>
              <button
                type="button"
                onClick={() => setConfirmed(true)}
                className="w-full rounded-lg bg-surface-container px-2.5 py-1.5 text-xs font-medium text-on-surface transition-colors hover:bg-surface-container-high"
              >
                Toch verplaatsen
              </button>
            </div>
          ) : (
            <ul className="m-0 list-none p-0">
              {targets.map(t => (
                <li key={t.id}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onMove(t.id)}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-on-surface transition-colors hover:bg-surface-container disabled:opacity-50"
                  >
                    <span className="flex-1">{t.label}</span>
                    <span className="tabular-nums text-on-surface-variant">{t.itemCount}</span>
                    {t.published && (
                      <span className="text-[0.6rem] font-bold uppercase tracking-wider text-success">
                        live
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
