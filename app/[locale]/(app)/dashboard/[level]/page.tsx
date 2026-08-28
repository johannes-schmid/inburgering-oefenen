import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ownsModule, planFromMetadata } from '@/lib/entitlements';
import { fetchPortalProgress, fetchPublishedExamNumbers } from '@/lib/portal-progress';
import { fetchPortalMenu } from '@/lib/portal-menu';
import { formatCount, isLevel, levelLabel, skillsAtLevel } from '@/data/skills';
import { totalExamsForLevel } from '@/lib/pricing';
import SkillIcon from '@/components/site/SkillIcon';
import AppShell from '../../components/AppShell';
import ModuleSkillGrid from '../_components/ModuleSkillGrid';

type Props = { params: Promise<{ locale: string; level: string }> };

export const metadata: Metadata = {
  title: 'Mijn niveau | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

/**
 * One level's own overview — the page the rail lands on.
 *
 * The portal navigation became two columns on 2026-08-27: the rail picks a module and this is
 * where picking one takes you. It exists because a module tile that jumped straight to Lezen
 * would make Lezen mean "A2" in the one place that must not be ambiguous, and because the
 * question a candidate actually arrives with is "where am I on A2 and what do I do next" —
 * which no per-onderdeel page can answer.
 *
 * It is **not** a second copy of `/dashboard`. That page still exists and still shows every
 * module at once, which is the right answer for somebody who owns two levels and KNM. This one
 * is scoped to a level, so it can afford the thing the multi-module page cannot: a single,
 * unambiguous next action at the top.
 */
export default async function LevelOverviewPage({ params }: Props) {
  const { locale, level: rawLevel } = await params;
  if (!isLevel(rawLevel)) notFound();
  const level = rawLevel;

  const t = await getTranslations('portal');
  const tSkills = await getTranslations('skills');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/dashboard/${level}`);

  const meta = user.user_metadata ?? {};
  const hasPaidPlan = planFromMetadata(meta) !== 'free';
  const [progress, published, menu] = await Promise.all([
    fetchPortalProgress(user.id),
    fetchPublishedExamNumbers(),
    fetchPortalMenu(),
  ]);

  const levelProgress = progress[level];
  const skills = skillsAtLevel(level);
  const done = skills.reduce((n, s) => n + levelProgress[s.slug].examsDone, 0);
  const total = totalExamsForLevel(level);

  /**
   * The one thing to do next: the lowest-numbered unsat, published exam in a module you own.
   *
   * Onderdelen are searched in their canonical order rather than by "least progressed", because
   * a next action that jumps around as you work reads as a slot machine — and because DUO's own
   * order is the one the candidate already has in their head. An onderdeel you have not bought
   * is skipped: proposing a locked exam as your next step is an upsell disguised as advice.
   *
   * It can legitimately be null — everything sat, or nothing published yet — and the page then
   * simply leads with the grid.
   */
  const next = skills
    .filter(s => ownsModule(meta, level, s.slug))
    .map(s => {
      const p = levelProgress[s.slug];
      const pub = published[level][s.slug];
      const number = Array.from({ length: s.examCount }, (_, i) => i + 1)
        .find(n => !p.exams[n] && pub.has(n));
      return number ? { skill: s, number } : null;
    })
    .find((x): x is { skill: (typeof skills)[number]; number: number } => x !== null);

  return (
    <AppShell
      locale={locale}
      email={user.email ?? ''}
      avatarUrl={String(meta.avatar_url ?? meta.picture ?? '')}
      active="overview-module"
      activeGroup={level}
      menu={menu}
    >
      <div className="px-5 py-7 sm:px-8 sm:py-10">
        <div className="max-w-5xl mx-auto">

          <header className="mb-7">
            <p
              className="text-xs font-extrabold uppercase mb-2"
              style={{ color: 'var(--color-secondary)', letterSpacing: '0.14em' }}
            >
              {t('level_section', { level: levelLabel(level) })}
            </p>
            <h1
              className="font-headline font-extrabold text-on-surface mb-2"
              style={{ fontSize: 'clamp(1.5rem,3.2vw,1.95rem)', letterSpacing: '-0.03em', textWrap: 'balance' }}
            >
              {t('module_title', { level: levelLabel(level) })}
            </h1>
            <p className="text-sm text-on-surface-variant" style={{ lineHeight: 1.7 }}>
              {t('module_intro', { done, total })}
            </p>
          </header>

          {next && (
            <a
              href={`/${locale}/oefenexamen/${level}/${next.skill.slug}/${next.number}`}
              className="no-underline flex items-center gap-4 mb-7 rounded-2xl px-5 py-4"
              style={{ background: 'var(--color-primary)', color: '#fff', boxShadow: 'var(--shadow-ambient)' }}
            >
              <SkillIcon skill={next.skill.slug} size="md" variant="bare" onDark />
              <div className="min-w-0 flex-1">
                <p
                  className="text-[0.62rem] font-extrabold uppercase"
                  style={{ letterSpacing: '0.14em', color: 'rgba(255,255,255,0.55)' }}
                >
                  {t('module_next')}
                </p>
                <p
                  className="font-headline font-extrabold"
                  style={{ fontSize: '1.02rem', letterSpacing: '-0.02em' }}
                >
                  {tSkills(`${next.skill.key}.name`)} · {t('exam_row_title', { number: next.number })}
                </p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {t('card_meta', {
                    items: formatCount(next.skill.itemCount),
                    minutes: formatCount(next.skill.durationMinutes),
                  })}
                </p>
              </div>
              <span
                className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold flex-shrink-0"
                style={{ background: 'var(--color-secondary-container, #fe762c)', color: '#fff' }}
              >
                {t('module_next_cta')}
                <ArrowRight size={14} strokeWidth={2.4} />
              </span>
            </a>
          )}

          <ModuleSkillGrid
            locale={locale}
            level={level}
            progress={levelProgress}
            published={published}
            hasPaidPlan={hasPaidPlan}
          />
        </div>
      </div>
    </AppShell>
  );
}
