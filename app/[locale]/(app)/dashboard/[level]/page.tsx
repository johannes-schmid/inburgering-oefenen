import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { fetchPortalProgress } from '@/lib/portal-progress';
import { fetchPortalMenu } from '@/lib/portal-menu';
import { isLevel, levelLabel, skillsAtLevel, type SkillSlug } from '@/data/skills';
import { totalExamsForLevel } from '@/lib/pricing';
import { fetchLessonCounts, moduleKey } from '@/lib/lessons/lessons-server';
import { averageReadiness, readiness } from '@/lib/lessons/readiness';
import { fetchNextLesson, type NextLesson } from '@/lib/portal-next';
import { CategoryMark } from '@/components/glas';
import AppShell from '../../components/AppShell';
import GlasModuleCard from '../_components/GlasModuleCard';

type Props = { params: Promise<{ locale: string; level: string }> };

export const metadata: Metadata = {
  title: 'Mijn niveau | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

/**
 * Eén niveau: de vier onderdelen ván één module, in dezelfde kaart als de modules op
 * `/dashboard` (Glas, `.mod`) — de kandidaat die hierheen klikt ziet hetzelfde object een niveau
 * dieper. Rechts dezelfde rustige widgets: examenklaar, en leren tegen oefenen.
 *
 * De gemiddelde "examenklaar" laat onderdelen zonder cijfer weg uit de deler: Spreken dat nog
 * niet bestaat mag A2 niet naar beneden trekken.
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
  const [progress, menu, lessons] = await Promise.all([
    fetchPortalProgress(user.id),
    fetchPortalMenu(),
    fetchLessonCounts(user.id),
  ]);

  const levelProgress = progress[level];
  const skills = skillsAtLevel(level);
  const done = skills.reduce((n, s) => n + levelProgress[s.slug].examsDone, 0);
  const total = totalExamsForLevel(level);

  const perSkill = skills.map(skill => {
    const les = lessons.get(moduleKey(level, skill.slug)) ?? { done: 0, total: 0 };
    return {
      skill,
      les,
      readiness: readiness({
        lessonsDone: les.done,
        lessonsTotal: les.total,
        examsDone: levelProgress[skill.slug].examsDone,
        examCount: skill.examCount,
        averagePct: levelProgress[skill.slug].averagePct,
      }),
    };
  });
  const average = averageReadiness(perSkill.map(x => x.readiness));

  const levelLessons = perSkill.reduce(
    (acc, s) => ({ done: acc.done + s.les.done, total: acc.total + s.les.total }),
    { done: 0, total: 0 },
  );
  const lessonPct = levelLessons.total > 0
    ? Math.round((levelLessons.done / levelLessons.total) * 100)
    : null;
  const lessonsSub = levelLessons.total === 0
    ? t('mod_no_lessons')
    : t('mod_lessons', { done: levelLessons.done, total: levelLessons.total });

  /* De eerstvolgende les per onderdeel; `fetchNextLesson` stopt zelf bij een module die niet
     van de kandidaat is. */
  const nextPerSkill = new Map<SkillSlug, NextLesson | null>(
    await Promise.all(
      skills.map(async s => {
        const n = await fetchNextLesson(user.id, meta, [{ level, skill: s.slug as SkillSlug }]);
        return [s.slug as SkillSlug, n] as const;
      }),
    ),
  );

  return (
    <AppShell
      locale={locale}
      email={user.email ?? ''}
      avatarUrl={String(meta.avatar_url ?? meta.picture ?? '')}
      active="overview-module"
      activeGroup={level}
      menu={menu}
    >
      <div className="g-page">
        <header className="g-ph">
          <h1>{t('module_title', { level: levelLabel(level) })}</h1>
          <p>{t('module_intro', { done, total })}</p>
        </header>

        <div className="g-dgrid">
          <div className="g-mods">
            {perSkill.map(({ skill, les, readiness: r }) => {
              const p = levelProgress[skill.slug];
              const step = nextPerSkill.get(skill.slug) ?? null;
              return (
                <GlasModuleCard
                  key={skill.slug}
                  mark={<CategoryMark category={skill.slug} size={52} />}
                  title={tSkills(`${skill.key}.name`)}
                  line={step
                    ? t('ov_next', { lesson: step.title })
                    : les.total === 0 ? t('ov_next_empty') : t('ov_next_none')}
                  /* Gemeten of niet: een balk op 0% bij iemand die nog niets deed leest als
                     voortgang die hij kwijt is. */
                  pct={r.pct}
                  foot={t('mod_exams', { done: p.examsDone, total: skill.examCount })}
                  cta={t('mod_continue')}
                  href={`/${locale}/dashboard/${level}/${skill.slug}`}
                />
              );
            })}
          </div>

          <aside>
            <section className="g-wid" aria-labelledby="wid-ready">
              <span className="g-mono" id="wid-ready">{t('readiness_label')}</span>
              <div className="g-wid-big">{average === null ? '—' : <>{average}<span>%</span></>}</div>
              <span className="g-prog" aria-hidden><i style={{ width: `${average ?? 0}%` }} /></span>
              {/* Een feitelijke claim die nooit weggaat om een kaart op te ruimen: het is onze
                  inschatting, geen voorspelling van de DUO-uitslag. */}
              <p>{t('readiness_note')}</p>
            </section>

            <section className="g-wid">
              <dl className="g-kv">
                <dt>{t('mod_learn')}</dt>
                <dd>{lessonPct === null ? '—' : `${lessonPct}%`}</dd>
              </dl>
              <p>{lessonsSub}</p>
              <dl className="g-kv">
                <dt>{t('mod_practice')}</dt>
                <dd>{total > 0 ? `${Math.round((done / total) * 100)}%` : '—'}</dd>
              </dl>
              <p>{t('mod_exams', { done, total })}</p>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
