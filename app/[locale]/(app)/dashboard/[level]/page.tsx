import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, BookOpen, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ownsModule, planFromMetadata } from '@/lib/entitlements';
import { fetchPortalProgress, fetchPublishedExamNumbers } from '@/lib/portal-progress';
import { fetchPortalMenu } from '@/lib/portal-menu';
import { isLevel, levelLabel, skillsAtLevel, type SkillSlug } from '@/data/skills';
import { totalExamsForLevel } from '@/lib/pricing';
import { fetchLessonCounts, moduleKey } from '@/lib/lessons/lessons-server';
import { fetchConcepts, fetchMastery } from '@/lib/lessons/concepts-server';
import { conceptPath, conceptsPath, isMastered } from '@/lib/lessons/lessons';
import { averageReadiness, readiness } from '@/lib/lessons/readiness';
import { fetchNextLesson, nextExamFor } from '@/lib/portal-next';
import AppShell from '../../components/AppShell';
import ModuleSkillGrid from '../_components/ModuleSkillGrid';
import PortalHero from '../_components/PortalHero';

type Props = { params: Promise<{ locale: string; level: string }> };

export const metadata: Metadata = {
  title: 'Mijn niveau | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

/**
 * Eén niveau: hoe klaar ben je, per onderdeel, en waarom.
 *
 * Het bestond al als de pagina waar de zijbalk op landt. Wat er op 29-08 bij kwam is de
 * leerlaag: de ring per onderdeel (`readiness()`), de concepten die over onderdelen heen
 * terugkomen, en één lijstje met de eerstvolgende stappen. Het is niet een tweede
 * `/dashboard` — dat toont modules, dit toont de vier onderdelen ván één module.
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
  const tSkills = await getTranslations('skills');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/dashboard/${level}`);

  const meta = user.user_metadata ?? {};
  const hasPaidPlan = planFromMetadata(meta) !== 'free';
  const [progress, published, menu, lessons, concepts] = await Promise.all([
    fetchPortalProgress(user.id),
    fetchPublishedExamNumbers(),
    fetchPortalMenu(),
    fetchLessonCounts(user.id),
    fetchConcepts(level),
  ]);
  const mastery = await fetchMastery(user.id, concepts.map(c => c.id));

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

  /**
   * Het zwakste concept per onderdeel, voor de regel onder elke kaart.
   *
   * Alleen concepten waar iets van bekend is en die nog niet beheerst zijn — precies wat
   * `weakestFirst` doet, maar hier per onderdeel gegroepeerd omdat de kaart per onderdeel is.
   * Een nooit-begonnen concept is geen zwak punt maar de hele cursus.
   */
  const weakest = new Map<string, string>();
  for (const skill of skills) {
    /* Alleen als er in dít onderdeel iets gebeurd is. Beheersing telt op het concept, over de
       onderdelen heen — dat is het ontwerp — maar een zwak punt melden bij een onderdeel waar
       de kandidaat nog geen les en geen examen heeft gedaan verwijt hem iets wat hij daar nooit
       geprobeerd heeft. */
    const les = lessons.get(moduleKey(level, skill.slug)) ?? { done: 0, total: 0 };
    if (les.done === 0 && levelProgress[skill.slug].examsDone === 0) continue;
    const candidates = concepts
      .filter(c => c.onderdelen.includes(skill.slug))
      .map(c => ({ c, m: mastery.get(c.id) }))
      .filter(x => x.m && x.m.seen > 0 && !isMastered(x.m))
      .sort((a, b) => a.m!.mastery_pct - b.m!.mastery_pct);
    if (candidates[0]) weakest.set(skill.slug, candidates[0].c.name_nl);
  }

  /** De concepten die in meer dan één onderdeel terugkomen, zwakste eerst. */
  const shared = concepts
    .filter(c => c.onderdelen.length > 1)
    .map(c => ({ c, m: mastery.get(c.id) ?? null }))
    .sort((a, b) => (a.m?.mastery_pct ?? 101) - (b.m?.mastery_pct ?? 101))
    .slice(0, 5);

  const nextExam = nextExamFor(meta, progress, published, [level]);
  const nextLes = await fetchNextLesson(
    user.id,
    meta,
    skills.map(s => ({ level, skill: s.slug as SkillSlug })),
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

          <PortalHero
            kicker={t('level_section', { level: levelLabel(level) })}
            title={t('module_title', { level: levelLabel(level) })}
            lede={t('module_intro', { done, total })}
            seed={level === 'a2' ? 0 : 5}
            ring={{
              pct: average,
              label: t('readiness_label'),
              note: t('readiness_note'),
              aria: average === null ? t('readiness_unknown_aria') : t('readiness_aria', { pct: average }),
            }}
            tiles={[
              { label: t('mod_learn'), value: lessonPct === null ? '—' : `${lessonPct}%`, sub: lessonsSub },
              { label: t('mod_practice'), value: `${Math.round((done / total) * 100)}%`, sub: t('mod_exams', { done, total }) },
            ]}
          />

          <ModuleSkillGrid
            locale={locale}
            level={level}
            progress={levelProgress}
            published={published}
            hasPaidPlan={hasPaidPlan}
            lessons={lessons}
            weakest={weakest}
          />

          <div className="grid gap-4 sm:gap-5 lg:grid-cols-[1.5fr_1fr] mt-9">
            <section className="panel">
              <h2 className="mini-head">{t('concepts_head')}</h2>
              {shared.length === 0 ? (
                <p className="text-[0.82rem] text-on-surface-variant" style={{ lineHeight: 1.6 }}>
                  {t('concepts_empty')}
                </p>
              ) : (
                <table className="ctable">
                  <thead>
                    <tr>
                      <th>{t('concept_col')}</th>
                      <th>{t('concept_in')}</th>
                      <th className="num">{t('concept_mastery')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shared.map(({ c, m }) => (
                      <tr key={c.id}>
                        <td>
                          <a href={`/${locale}${conceptPath(level, c.slug)}`} className="clink">{c.name_nl}</a>
                        </td>
                        <td className="sub">
                          {c.onderdelen.map(o => tSkills(`${o}.name`)).join(' · ')}
                        </td>
                        <td className="num">
                          {/* Geen percentage verzinnen waar niets gemeten is: een streepje
                              betekent "nog niet geoefend" en 0% zou "fout gedaan" betekenen. */}
                          <span className={`mpill${m === null ? ' none' : m.mastery_pct < 60 ? ' weak' : isMastered(m) ? ' good' : ''}`}>
                            {m === null ? '—' : `${m.mastery_pct}%`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <a href={`/${locale}${conceptsPath(level)}`} className="more">
                {t('concepts_all')} <ArrowRight size={13} strokeWidth={2.6} className="rtl-flip" />
              </a>
            </section>

            <section className="panel flat">
              <h2 className="mini-head">{t('todo_head')}</h2>
              <ol className="todo">
                {nextLes && (
                  <li>
                    <a href={`/${locale}${nextLes.href}`}>
                      <span className="ic"><BookOpen size={13} strokeWidth={2.5} /></span>
                      <span className="min-w-0">
                        <span className="nm">{nextLes.title}</span>
                        <span className="sub">
                          {tSkills(`${nextLes.skill}.name`)} · {nextLes.blockName}
                        </span>
                      </span>
                    </a>
                  </li>
                )}
                {nextExam && (
                  <li>
                    <a href={`/${locale}/oefenexamen/${level}/${nextExam.skill.slug}/${nextExam.number}`}>
                      <span className="ic exam"><FileText size={13} strokeWidth={2.5} /></span>
                      <span className="min-w-0">
                        <span className="nm">
                          {tSkills(`${nextExam.skill.key}.name`)} · {t('exam_row_title', { number: nextExam.number })}
                        </span>
                        <span className="sub">{t('next_exam')}</span>
                      </span>
                    </a>
                  </li>
                )}
                {!nextLes && !nextExam && (
                  <li className="empty">{t('next_exam_empty')}</li>
                )}
              </ol>
            </section>
          </div>
        </div>
      </div>

      <style>{`



        .ctable { width:100%; border-collapse:collapse; font-size:0.82rem; }
        .ctable th { text-align:start; font-size:0.62rem; letter-spacing:0.13em; text-transform:uppercase; color:var(--color-on-surface-variant); font-weight:800; padding:0 8px 8px; }
        .ctable th.num, .ctable td.num { text-align:end; }
        .ctable td { padding:9px 8px; color:var(--color-on-surface); }
        /* Geen 1px-lijn als scheiding (§2): de rijen wisselen van ondergrond. */
        .ctable tbody tr:nth-child(odd) { background:var(--color-surface-container-low); }
        .ctable td.sub { color:var(--color-on-surface-variant); font-size:0.74rem; }
        .clink { color:inherit; text-decoration:none; font-weight:600; }
        .clink:hover { text-decoration:underline; }
        .mpill { display:inline-block; min-width:52px; text-align:center; border-radius:999px; padding:3px 9px; font-size:0.7rem; font-weight:800; background:var(--color-surface-container-high); color:var(--color-on-surface-variant); font-variant-numeric:tabular-nums; }
        .mpill.weak { background:#fcecdd; color:var(--color-secondary); }
        .mpill.good { background:rgba(0,43,109,0.08); color:var(--color-primary); }
        .mpill.none { background:transparent; }
        .more { display:inline-flex; align-items:center; gap:6px; margin-top:12px; font-size:0.76rem; font-weight:800; color:var(--color-primary); text-decoration:none; }
        .more:hover { text-decoration:underline; }

        .todo { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:6px; }
        .todo a { display:flex; align-items:center; gap:11px; padding:10px 11px; border-radius:12px; text-decoration:none; background:var(--color-surface-container-lowest); }
        .todo a:hover { box-shadow:var(--shadow-ambient); }
        .todo .ic { display:grid; place-items:center; width:26px; height:26px; border-radius:8px; flex-shrink:0; background:var(--color-secondary-container); color:#fff; }
        .todo .ic.exam { background:var(--color-primary); }
        .todo .nm { display:block; font-size:0.83rem; font-weight:700; color:var(--color-on-surface); }
        .todo .sub { display:block; font-size:0.72rem; color:var(--color-on-surface-variant); }
        .todo .empty { font-size:0.82rem; color:var(--color-on-surface-variant); line-height:1.6; }

        @media (prefers-reduced-motion: reduce) {
        }
      `}</style>
    </AppShell>
  );
}
