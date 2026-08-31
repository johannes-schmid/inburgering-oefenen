import { getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { formatCount, skillsAtLevel, type Level } from '@/data/skills';
import { CategoryMark, SkylineTopper, type TopperTint } from '@/components/horizon';
import type { PortalProgress, PublishedExamNumbers } from '@/lib/portal-progress';
import { moduleKey } from '@/lib/lessons/lessons-server';
import { readiness } from '@/lib/lessons/readiness';
import ExamSegments, { segmentState, type SegmentState } from '../components/ExamSegments';
import ReadinessRing from './ReadinessRing';

/**
 * De vier onderdelen van één niveau, als modulekaarten van het ontwerpsysteem (§7.2).
 *
 * Twee dingen zijn hier op 29-08 veranderd. De kaart is de **skyline-topper met het merkteken
 * eroverheen** geworden — dezelfde vorm als de modulekaart op het overzicht en als `SkillCard` op
 * de homepage, want een portaal dat zijn eigen doosjes tekent leest als een ander product. En de
 * twee balken (lessen, examens) zijn vervangen door één **examenklaar-ring**: dat waren twee
 * getallen waar de kandidaat er één van wil — *ben ik er klaar voor?* De regel eronder zegt
 * waaróm, en de tien slots blijven staan omdat hun vijf toestanden niet uit een percentage af te
 * lezen zijn.
 */
export default async function ModuleSkillGrid({
  locale,
  level,
  progress,
  published,
  hasPaidPlan,
  lessons,
  weakest,
}: {
  locale: string;
  level: Level;
  progress: PortalProgress;
  published: PublishedExamNumbers;
  hasPaidPlan: boolean;
  /** Lestellingen per moduleKey — `fetchLessonCounts`. */
  lessons: Map<string, { done: number; total: number }>;
  /** Het zwakste concept per onderdeel, als er één te noemen is. */
  weakest: Map<string, string>;
}) {
  const t = await getTranslations('portal');
  const tSkills = await getTranslations('skills');

  const segmentLabels: Record<SegmentState, string> = {
    passed: t('seg_passed'),
    sat: t('seg_sat'),
    available: t('seg_available'),
    locked: t('seg_locked'),
    unpublished: t('seg_unpublished'),
  };

  return (
    <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
      {skillsAtLevel(level).map((skill, i) => {
        const p = progress[skill.slug];
        const pub = published[level][skill.slug];
        const les = lessons.get(moduleKey(level, skill.slug)) ?? { done: 0, total: 0 };
        const r = readiness({
          lessonsDone: les.done,
          lessonsTotal: les.total,
          examsDone: p.examsDone,
          examCount: skill.examCount,
          averagePct: p.averagePct,
        });
        const states = Array.from({ length: skill.examCount }, (_, i) =>
          segmentState(i + 1, p, pub, hasPaidPlan),
        );
        const weak = weakest.get(skill.slug);
        const empty = les.total === 0 && p.examsDone === 0;
        const tint = (['gradient', 'reverse', 'primary', 'container'] as const)[i % 4] as TopperTint;

        return (
          <a
            key={skill.slug}
            href={`/${locale}/dashboard/${level}/${skill.slug}`}
            className="mod-card no-underline flex flex-col overflow-hidden"
          >
            <SkylineTopper height={56} houses={6} seed={i * 3} tint={tint} band={false} />
            <div className="px-5 -mt-6 relative">
              <CategoryMark category={skill.slug} size={44} className="shadow-[var(--shadow-ambient)]" />
            </div>

            <div className="flex flex-1 flex-col p-5 pt-3">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h2
                    className="font-headline font-extrabold text-on-surface"
                    style={{ fontSize: '1.075rem', letterSpacing: '-0.015em' }}
                  >
                    {tSkills(`${skill.key}.name`)}
                  </h2>
                  <p className="text-xs text-outline mt-0.5">
                    {t('card_meta', {
                      items: formatCount(skill.itemCount),
                      minutes: formatCount(skill.durationMinutes),
                    })}
                  </p>
                </div>
                <ReadinessRing
                  pct={r.pct}
                  size={56}
                  label={r.pct === null ? t('readiness_unknown_aria') : t('readiness_aria', { pct: r.pct })}
                />
              </div>

              {/* Eén regel, en hij zegt het belangrijkste dat over dit onderdeel te zeggen valt:
                  het zwakste concept, of — als er nog niets gebeurd is — dat het nog moet
                  beginnen. Nooit een zwak punt bij een onderdeel waar nog niets geprobeerd is. */}
              <p
                className="text-[0.8rem] mt-3"
                style={{ lineHeight: 1.55, color: weak ? 'var(--color-secondary)' : 'var(--color-on-surface-variant)' }}
              >
                {weak ? t('skill_weak', { name: weak }) : empty ? t('skill_no_lessons') : t('skill_no_data')}
              </p>

              <div className="mt-4 pt-4 border-t-0">
                <div className="flex items-baseline justify-between mb-2">
                  {/* Bij een lege cursus staat het al in de regel hierboven; twee keer "nog geen
                      lessen" onder elkaar leest als een renderfout. */}
                  <span className="text-xs font-bold text-on-surface-variant">
                    {les.total === 0 ? '' : t('mod_lessons', { done: les.done, total: les.total })}
                  </span>
                  <span className="text-xs font-bold text-on-surface-variant">
                    {t('mod_exams', { done: p.examsDone, total: skill.examCount })}
                    {p.averagePct != null && (
                      <span className="ms-2 font-extrabold" style={{ color: 'var(--color-primary)' }}>
                        {t('card_average', { pct: p.averagePct })}
                      </span>
                    )}
                  </span>
                </div>
                <ExamSegments count={skill.examCount} states={states} labels={segmentLabels} />
              </div>

              <span className="mt-4 inline-flex items-center gap-1.5 text-[0.78rem] font-extrabold text-primary">
                {t('mod_continue')}
                <ArrowRight size={13} strokeWidth={2.6} className="rtl-flip" />
              </span>
            </div>
          </a>
        );
      })}
    </div>
  );
}
