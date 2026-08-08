import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { SKILLS, formatCount, formatRules, getFormat, levelLabel } from '@/data/skills';
import { levelFromSearch } from '@/lib/admin/nav';
import { isBacklog } from '@/lib/admin/backlog';
import { fetchExamSetup } from '@/lib/admin/exam-setup-server';
import ExamSetupButton from './_components/ExamSetupButton';

export const revalidate = 0;

type ExamRow = {
  id: number;
  level: string;
  skill: string;
  number: number;
  title: string | null;
  is_free: boolean;
  published: boolean;
};

/**
 * The 40 exam slots — 4 skills × 10 — and how full each one is.
 *
 * This replaced a KNM grid that assumed a flat pool of questions carrying an `exam` integer, with
 * hardcoded "40 questions / 7 categories" warnings; the completeness rules now live in
 * `exam_publish_issues()` per exam rather than in the component.
 *
 * A question still cannot be unassigned — it belongs to a stimulus, which belongs to an exam — so
 * the pool to assign from is the **backlog**: exam number 0 of the same (level, skill), linked
 * beside each skill's heading and deliberately not a card in the grid. See lib/admin/backlog.ts.
 */
export default async function ExamsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ niveau?: string }>;
}) {
  const { locale } = await params;
  // One level per screen, chosen in the sidebar. Both levels stacked meant 80 slots on one page
  // and the A2 work the docent came for pushed below a fold of empty B1 cards.
  const level = levelFromSearch((await searchParams).niveau);
  const supabase = await createClient();

  const [examsRes, questionsRes, tasksRes, stimuliRes] = await Promise.all([
    supabase.from('exams').select('id, level, skill, number, title, is_free, published').order('level').order('skill').order('number'),
    supabase.from('questions').select('exam_id'),
    supabase.from('open_tasks').select('exam_id'),
    // section_id and the section name come along so the card can show the tekstsoort mix —
    // "is examen 3 the right shape?" is not answerable from a total.
    supabase.from('stimuli').select('exam_id, section_id, sections(name_nl)'),
  ]);

  const exams = (examsRes.data ?? []) as ExamRow[];
  const tally = (rows: { exam_id: number }[] | null) => {
    const acc: Record<number, number> = {};
    for (const r of rows ?? []) acc[r.exam_id] = (acc[r.exam_id] ?? 0) + 1;
    return acc;
  };
  /**
   * The onderdeel's setup, per skill — what the "Opzet" button edits.
   *
   * Fetched here rather than in the exam builder: these rows are keyed by (level, skill), so this
   * page is the surface whose scope actually matches them. Four parallel reads, admin-only.
   */
  const setups = Object.fromEntries(
    await Promise.all(SKILLS.map(async s => [s.slug, await fetchExamSetup(level, s.slug)] as const)),
  );

  const questionCount = tally(questionsRes.data as { exam_id: number }[] | null);
  const taskCount = tally(tasksRes.data as { exam_id: number }[] | null);
  const stimulusCount = tally(stimuliRes.data as { exam_id: number }[] | null);

  /**
   * Per exam, how many fragments of each tekstsoort.
   *
   * Uncategorised fragments are counted under a named bucket rather than dropped: a fragment
   * with no tekstsoort is the gap the docent most needs to see, and silently omitting it would
   * make an exam look tidier than it is.
   */
  type StimulusRow = { exam_id: number; section_id: number | null; sections: { name_nl: string } | null };
  const categories: Record<number, Record<string, number>> = {};
  for (const r of (stimuliRes.data ?? []) as unknown as StimulusRow[]) {
    const name = r.sections?.name_nl ?? 'Geen tekstsoort';
    categories[r.exam_id] ??= {};
    categories[r.exam_id][name] = (categories[r.exam_id][name] ?? 0) + 1;
  }

  return (
    <div>
      <div className="mb-8">
        <p className="font-headline text-xs font-bold uppercase tracking-[0.08em] text-secondary">
          Niveau {levelLabel(level)}
        </p>
        <h1 className="text-2xl font-headline font-bold text-on-surface">Examens</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Tien oefenexamens per vaardigheid. Klik een examen om de stimuli en opgaven te beheren.
        </p>
      </div>

      <div className="space-y-12">
        <div>
          <div className="space-y-9">
        {SKILLS.map(skill => {
          const forSkill = exams.filter(e => e.level === level && e.skill === skill.slug);
          // The backlog is an exam row but not an oefenexamen: it must never be an eleventh card in
          // this grid. See lib/admin/backlog.ts.
          const rows = forSkill.filter(e => !isBacklog(e.number));
          const backlog = forSkill.find(e => isBacklog(e.number));
          const open = skill.scoring === 'open';
          const backlogItems = backlog
            ? (open ? (taskCount[backlog.id] ?? 0) : (questionCount[backlog.id] ?? 0))
            : 0;
          // `null` where DUO's format for this level has not been verified — the progress bar
          // and the "complete" check below both fall back to "unknown" rather than to zero,
          // which would mark every empty B1 exam as finished.
          const { itemCount } = getFormat(level, skill.slug);
          // The authoring rules for this pair; `stimulusCount` is null where DUO's shape has
          // not been worked out, and renders as an em dash rather than a zero.
          const rules = formatRules(level, skill.slug);

          return (
            <section key={skill.slug}>
              <div className="flex items-baseline justify-between gap-4 mb-3">
                <h3 className="text-base font-headline font-bold text-on-surface capitalize">
                  {skill.slug}
                  {/* The backlog sits beside the title rather than in the grid: it is where items
                      are worked on, not a slot that can be published. */}
                  {backlog && (
                    <Link
                      href={`/${locale}/admin/exams/${backlog.id}`}
                      className="ml-3 inline-flex items-center gap-1.5 rounded-full border border-outline-variant px-2.5 py-0.5 align-middle text-[0.7rem] font-semibold normal-case text-on-surface-variant no-underline transition-colors hover:border-primary/50 hover:text-on-surface"
                    >
                      Backlog
                      <span className="tabular-nums opacity-70">{backlogItems}</span>
                    </Link>
                  )}
                </h3>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-on-surface-variant m-0">
                    {formatCount(itemCount)} {open ? 'opdrachten' : 'vragen'} per examen ·{' '}
                    {formatCount(getFormat(level, skill.slug).durationMinutes)} min
                    {/* Only stated when the ten agree — see `ExamDefaults`. */}
                    {setups[skill.slug].defaults.passThresholdPct !== null &&
                      ` · geslaagd vanaf ${setups[skill.slug].defaults.passThresholdPct}%`}
                  </p>
                  <ExamSetupButton level={level} skill={skill.slug} setup={setups[skill.slug]} />
                </div>
              </div>

              <ul className="grid gap-3 list-none m-0 p-0 sm:grid-cols-2 lg:grid-cols-5">
                {rows.map(exam => {
                  const items = open ? (taskCount[exam.id] ?? 0) : (questionCount[exam.id] ?? 0);
                  const complete = itemCount !== null && items >= itemCount;

                  return (
                    <li key={exam.id}>
                      <Link
                        href={`/${locale}/admin/exams/${exam.id}`}
                        className="block rounded-xl border border-outline-variant p-3.5 no-underline hover:border-primary/50 hover:bg-surface-container-low transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-sm font-bold text-on-surface">#{exam.number}</span>
                          <span
                            className={`text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              exam.published
                                ? 'bg-success/15 text-success'
                                : 'bg-surface-container text-on-surface-variant'
                            }`}
                          >
                            {exam.published ? 'live' : 'concept'}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant m-0 tabular-nums">
                          {items} / {formatCount(itemCount)} {open ? 'opdrachten' : 'vragen'}
                        </p>
                        {!open && (
                          <p className="text-xs text-on-surface-variant m-0 tabular-nums">
                            {stimulusCount[exam.id] ?? 0} / {formatCount(rules.stimulusCount)} fragmenten
                          </p>
                        )}
                        <div className="mt-2 h-1 rounded-full bg-surface-container overflow-hidden">
                          <div
                            className={`h-full rounded-full ${complete ? 'bg-success' : 'bg-secondary'}`}
                            style={{ width: itemCount === null ? '0%' : `${Math.min(100, (items / itemCount) * 100)}%` }}
                          />
                        </div>

                        {/* The tekstsoort mix. There is deliberately no target per tekstsoort —
                            nobody has verified how many gesprekken versus mededelingen a DUO exam
                            holds — so this reports the spread and the docent judges it. An
                            uncategorised fragment is shown in the warning colour rather than
                            omitted: it is the gap most worth seeing. */}
                        {!open && Object.keys(categories[exam.id] ?? {}).length > 0 && (
                          <ul className="mt-2 flex flex-wrap gap-1 list-none m-0 p-0">
                            {Object.entries(categories[exam.id])
                              .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
                              .map(([name, n]) => (
                                <li
                                  key={name}
                                  className={`rounded-full px-2 py-0.5 text-[0.65rem] tabular-nums ${
                                    // Brand tokens, not `text-warning`: that resolves to
                                    // yellow-500, which on its own 10% tint is unreadable.
                                    name === 'Geen tekstsoort'
                                      ? 'bg-[#fcecdd] text-[#a24000] font-semibold'
                                      : 'bg-surface-container text-on-surface-variant'
                                  }`}
                                >
                                  {name === 'Geen tekstsoort' ? 'geen' : name.toLowerCase()} {n}
                                </li>
                              ))}
                          </ul>
                        )}
                        {exam.is_free && (
                          <p className="text-[0.6rem] font-bold uppercase tracking-wider text-secondary mt-2 mb-0">
                            gratis
                          </p>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
          </div>
        </div>
      </div>
    </div>
  );
}
