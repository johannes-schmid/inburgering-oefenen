import { getTranslations } from 'next-intl/server';
import { ArrowRight, Lock } from 'lucide-react';
import { formatCount, skillsAtLevel, type Level } from '@/data/skills';
import SkillIcon from '@/components/site/SkillIcon';
import type { PortalProgress, PublishedExamNumbers } from '@/lib/portal-progress';
import ExamSegments, { segmentState, type SegmentState } from '../components/ExamSegments';

/**
 * One level's four onderdelen as cards, with their ten slots.
 *
 * Extracted from `/dashboard` when `/dashboard/[level]` arrived (2026-08-27): the module
 * overview shows exactly this grid, and two copies of a card that encodes five distinct slot
 * states is the kind of duplication that drifts within a month. The portal overview keeps its
 * per-level heading around it; the module page does not need one, because the whole page is
 * that level.
 */
export default async function ModuleSkillGrid({
  locale,
  level,
  progress,
  published,
  hasPaidPlan,
}: {
  locale: string;
  level: Level;
  progress: PortalProgress;
  published: PublishedExamNumbers;
  hasPaidPlan: boolean;
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
      {skillsAtLevel(level).map(skill => {
        const p = progress[skill.slug];
        const pub = published[level][skill.slug];
        const states = Array.from({ length: skill.examCount }, (_, i) =>
          segmentState(i + 1, p, pub, hasPaidPlan),
        );
        const nothingPublished = pub.size === 0;

        return (
          <a
            key={skill.slug}
            href={`/${locale}/dashboard/${level}/${skill.slug}`}
            className="skill-card no-underline flex flex-col"
          >
            <div className="flex items-start gap-3 mb-4">
              <SkillIcon skill={skill.slug} size="md" />
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
              <span className="skill-card-arrow" aria-hidden="true">
                <ArrowRight size={17} strokeWidth={2.2} />
              </span>
            </div>

            <p className="text-[0.82rem] text-on-surface-variant mb-5" style={{ lineHeight: 1.6 }}>
              {tSkills(`${skill.key}.tagline`)}
            </p>

            <div className="mt-auto">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xs font-bold text-on-surface-variant">
                  {t('card_progress', { done: p.examsDone, total: skill.examCount })}
                </span>
                {p.averagePct != null && (
                  <span
                    className="text-xs font-extrabold"
                    style={{ color: 'var(--color-primary)', fontVariantNumeric: 'tabular-nums' }}
                  >
                    {t('card_average', { pct: p.averagePct })}
                  </span>
                )}
              </div>

              <ExamSegments count={skill.examCount} states={states} labels={segmentLabels} />

              <p className="text-xs mt-3 flex items-center gap-1.5" style={{ color: 'var(--color-outline)' }}>
                {/* Progress wins over "nothing published": once you have sat an exam, telling
                    you none are available reads as data loss. */}
                {p.examsDone === 0 && nothingPublished ? (
                  <>
                    <Lock size={12} strokeWidth={2} />
                    {t('card_none_published')}
                  </>
                ) : p.examsDone === 0 ? (
                  t('card_cta_start')
                ) : p.examsDone >= skill.examCount ? (
                  t('card_cta_all_done')
                ) : (
                  t('card_cta_continue', { number: p.nextExamNumber })
                )}
              </p>
            </div>
          </a>
        );
      })}
    </div>
  );
}
