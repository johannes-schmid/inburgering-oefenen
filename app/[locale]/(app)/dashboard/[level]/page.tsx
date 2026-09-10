import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { fetchPortalProgress, fetchPublishedExamNumbers } from '@/lib/portal-progress';
import { fetchPortalMenu } from '@/lib/portal-menu';
import { isLevel, levelLabel, skillsAtLevel, type SkillSlug } from '@/data/skills';
import { totalExamsForLevel } from '@/lib/pricing';
import { fetchLessonCounts, moduleKey } from '@/lib/lessons/lessons-server';
import { averageReadiness, readiness } from '@/lib/lessons/readiness';
import { fetchNextLesson, type NextLesson } from '@/lib/portal-next';
import AppShell from '../../components/AppShell';
import { ArrowRight } from 'lucide-react';
import { tally } from '@/lib/lessons/sporen';
import ModuleSkillGrid from '../_components/ModuleSkillGrid';

type Props = { params: Promise<{ locale: string; level: string }> };

export const metadata: Metadata = {
  title: 'Mijn niveau | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

/**
 * Eén niveau: hoe klaar ben je, per onderdeel, en waarom.
 *
 * Het bestond al als de pagina waar de zijbalk op landt. Het is niet een tweede `/dashboard` —
 * dat toont modules, dit toont de vier onderdelen ván één module.
 *
 * Op 03-09 is het teruggebracht tot de kop en die vier onderdelen. De conceptentabel en het
 * lijstje "wat je nu moet doen" stonden er onder en herhaalden wat de vier regels al zeggen; de
 * concepten hebben hun eigen pagina in de zijbalk, en de volgende stap staat nu op de regel van
 * het onderdeel waar hij bij hoort.
 *
 * De gemiddelde ring in de kop laat onderdelen zonder cijfer weg uit de deler. Spreken dat nog
 * niet bestaat mag A2 niet naar beneden trekken: dat zou onze roadmap presenteren als de
 * voortgang van de kandidaat.
 */
export default async function LevelOverviewPage({ params }: Props) {
  const { locale, level: rawLevel } = await params;
  if (!isLevel(rawLevel)) notFound();
  const level = rawLevel;

  const t = await getTranslations('portal');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/dashboard/${level}`);

  const meta = user.user_metadata ?? {};
  const [progress, published, menu, lessons] = await Promise.all([
    fetchPortalProgress(user.id),
    fetchPublishedExamNumbers(),
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

  const levelLessons = skills.reduce(
    (acc, s) => {
      const c = lessons.get(moduleKey(level, s.slug)) ?? { done: 0, total: 0 };
      return { done: acc.done + c.done, total: acc.total + c.total };
    },
    { done: 0, total: 0 },
  );
  const lessonPct = levelLessons.total > 0
    ? Math.round((levelLessons.done / levelLessons.total) * 100)
    : null;
  const lessonsSub = levelLessons.total === 0
    ? t('mod_no_lessons')
    : t('mod_lessons', { done: levelLessons.done, total: levelLessons.total });

  /* De eerstvolgende les per onderdeel — de kaart zegt nu "Volgende: …" en dat is per onderdeel
     iets anders. Vier keer één module, parallel; `fetchNextLesson` stopt zelf bij een module die
     niet van de kandidaat is. */

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
      <div className="px-5 py-7 sm:px-8 sm:py-10">
        <div className="max-w-5xl mx-auto">

          <header className="ov-head">
            <h1>{t('module_title', { level: levelLabel(level) })}</h1>
            <p>{t('module_intro', { done, total })}</p>
          </header>

          <div className="ov-grid">
            <div className="ov-rows">
              <ModuleSkillGrid
                locale={locale}
                level={level}
                progress={levelProgress}
                lessons={lessons}
                next={nextPerSkill}
              />
            </div>

            {/* De cijfers die niet op een onderdeelkaart passen, in dezelfde kolom als op
                `/dashboard`. De kop met de ring stond hier eerst over de volle breedte; dat was
                een tweede kop boven een pagina die al een titel heeft, en de drie tegels erin
                zeiden precies wat hier nu compact staat. */}
            <aside className="ov-side">
              <section className="ov-card ov-total">
                <span className="ov-kick">{t('readiness_label')}</span>
                {/* Geen tweede label naast het getal: de kop van de pagina noemt het niveau al. */}
                <div className="ov-total-top">
                  <b>{average === null ? '—' : `${average}%`}</b>
                </div>
                <span className="ov-rail" aria-hidden><i style={{ width: `${average ?? 0}%` }} /></span>
                {/* Deze regel is een feitelijke claim en gaat nooit weg om een kaart op te
                    ruimen: het is onze inschatting, geen voorspelling van de DUO-uitslag. */}
                <p className="ov-note">{t('readiness_note')}</p>
              </section>

              {/* Hier stond een kaart naar de regelbibliotheek. Vervallen op 10-09: de regels
                  van een examen staan in stap 2 van díe cursus, en een kaart op het
                  niveauscherm wees naar een vijfde spoor dat niet meer bestaat. */}

              <section className="ov-card">
                <dl className="ov-stats">
                  <div className="ov-stat">
                    <dt>{t('mod_learn')}</dt>
                    <dd>
                      <b>{lessonPct === null ? '—' : `${lessonPct}%`}</b>
                      <span>{lessonsSub}</span>
                    </dd>
                  </div>
                  <div className="ov-stat">
                    <dt>{t('mod_practice')}</dt>
                    <dd>
                      <b>{Math.round((done / total) * 100)}%</b>
                      <span>{t('mod_exams', { done, total })}</span>
                    </dd>
                  </div>
                </dl>
              </section>
            </aside>
          </div>

        </div>
      </div>

    </AppShell>
  );
}
