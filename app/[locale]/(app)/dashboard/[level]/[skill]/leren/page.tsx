import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, Check, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ownsModule } from '@/lib/entitlements';
import { getSkillAtLevel, isLevel, levelLabel } from '@/data/skills';
import { fetchPortalMenu } from '@/lib/portal-menu';
import { fetchCourse } from '@/lib/lessons/lessons-server';
import { blockProgress, courseProgressPct, lessonPath, nextLesson } from '@/lib/lessons/lessons';
import { HorizonBand } from '@/components/horizon';
import SkillIcon from '@/components/site/SkillIcon';
import AppShell from '../../../../components/AppShell';

type Props = { params: Promise<{ locale: string; level: string; skill: string }> };

export const metadata: Metadata = {
  title: 'Lessen | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

/**
 * De cursus van één onderdeel: de blokken A–E met hun lessen.
 *
 * Dit is de tegenhanger van de examenlijst op `/dashboard/[level]/[skill]`. Ze staan naast
 * elkaar en niet door elkaar, want ze antwoorden op verschillende vragen: "waar sta ik met de
 * tien examens" tegenover "wat moet ik nog leren".
 *
 * **Een cursus zonder vrijgegeven lessen bestaat niet.** `fetchCourse` geeft alleen
 * `validated` lessen, dus zolang de docent niets heeft nagekeken is dit een 404 in plaats van
 * een pagina met vijf lege blokken. Dat is de reviewgate en hij is echt — anders dan bij de
 * A2-examendataset, waar `review_status` vóór de review op `validated` werd gezet.
 */
export default async function CoursePage({ params }: Props) {
  const { locale, level: rawLevel, skill: slug } = await params;
  if (!isLevel(rawLevel)) notFound();
  const level = rawLevel;
  const skill = getSkillAtLevel(level, slug);
  if (!skill) notFound();

  const t = await getTranslations('lessons');
  const tPortal = await getTranslations('portal');
  const tSkills = await getTranslations('skills');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/dashboard/${level}/${skill.slug}/leren`);

  const blocks = await fetchCourse(level, skill.slug, user.id);
  // Geen vrijgegeven les = geen cursus. Zie de doc-comment hierboven.
  if (blocks.every(b => b.lessons.length === 0)) notFound();

  const meta = user.user_metadata ?? {};
  // Per onderdeel, niet "bezit iets op dit niveau": iemand met alleen Luisteren mag hier geen
  // cursus zien die de speler hem daarna weigert. Dezelfde fout als de zijbalk van 27-08.
  const owned = ownsModule(meta, level, skill.slug);
  const menu = await fetchPortalMenu();

  const pct = courseProgressPct(blocks);
  const next = nextLesson(blocks);

  return (
    <AppShell
      locale={locale}
      email={user.email ?? ''}
      avatarUrl={String(meta.avatar_url ?? meta.picture ?? '')}
      active={skill.slug}
      activeGroup={level}
      menu={menu}
    >
      <div className="px-5 py-7 sm:px-8 sm:py-10">
        <div className="max-w-3xl mx-auto">

          <header className="mb-7">
            <a
              href={`/${locale}/dashboard/${level}/${skill.slug}`}
              className="text-xs font-bold text-on-surface-variant no-underline hover:underline"
            >
              ← {tSkills(`${skill.key}.name`)}
            </a>
            <div className="flex items-start gap-3.5 mt-3">
              <SkillIcon skill={skill.slug} size="lg" />
              <div className="min-w-0">
                <h1
                  className="font-headline font-extrabold text-on-surface"
                  style={{ fontSize: 'clamp(1.5rem,3.2vw,1.95rem)', letterSpacing: '-0.03em' }}
                >
                  {t('course_title', { skill: tSkills(`${skill.key}.name`), level: levelLabel(level) })}
                </h1>
                <p className="text-sm text-on-surface-variant mt-1" style={{ lineHeight: 1.65 }}>
                  {t('course_lede')}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-baseline justify-between gap-3 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  {t('course_progress', {
                    done: blocks.reduce((n, b) => n + blockProgress(b).done, 0),
                    total: blocks.reduce((n, b) => n + b.lessons.length, 0),
                  })}
                </span>
                <span className="text-sm font-extrabold text-secondary">{pct}%</span>
              </div>
              <HorizonBand progress={pct} rounded height={8} />
            </div>

            {next && (
              <a
                href={`/${locale}${lessonPath(level, skill.slug, next.lesson.slug)}`}
                className="mt-5 flex items-center gap-3 rounded-2xl px-4 py-3.5 no-underline"
                style={{
                  background: 'var(--color-surface-container-lowest)',
                  boxShadow: 'var(--shadow-ambient)',
                }}
              >
                <span className="cb-letter">{next.block.letter}</span>
                <span className="min-w-0">
                  <span className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    {t('continue')}
                  </span>
                  <span className="block font-extrabold text-on-surface truncate">{next.lesson.title}</span>
                </span>
                <ArrowRight size={18} strokeWidth={2.5} className="ms-auto shrink-0 text-secondary rtl-flip" />
              </a>
            )}
          </header>

          <ol className="flex flex-col gap-3 list-none p-0 m-0">
            {blocks.map(block => {
              const bp = blockProgress(block);
              return (
                <li key={block.id} className="course-block">
                  <div className="cb-head">
                    <span className="cb-letter">{block.letter}</span>
                    <h2 className="cb-title">{block.name_nl}</h2>
                    <span className="cb-count">
                      {t('block_count', { done: bp.done, total: bp.total })}
                    </span>
                  </div>
                  {block.intro && <p className="cb-intro">{block.intro}</p>}

                  {block.lessons.length === 0
                    ? <p className="cb-intro m-0">{t('block_empty')}</p>
                    : (
                      <ul className="cb-lessons">
                        {block.lessons.map(les => {
                          // Gratis lessen zijn de etalage; de rest zit achter de module. Een
                          // niet-gekochte les wordt gerenderd als aanbod en niet weggelaten —
                          // anders lijkt de cursus korter dan hij is.
                          const openable = owned || les.is_free;
                          const href = openable
                            ? `/${locale}${lessonPath(level, skill.slug, les.slug)}`
                            : `/${locale}/dashboard/pakketten?onderdeel=${level}:${skill.slug}&vanaf=leren-${les.slug}`;
                          const done = les.progress?.state === 'done';
                          return (
                            <li key={les.id}>
                              <a href={href} className="les-row">
                                {done
                                  ? <Check size={15} strokeWidth={3} className="les-done" />
                                  : !openable
                                    ? <Lock size={13} strokeWidth={2.5} className="text-outline shrink-0" />
                                    : <span className="w-[15px] shrink-0" aria-hidden />}
                                <span className="truncate">{les.title}</span>
                                {les.minutes != null && (
                                  <span className="les-min">{t('minutes', { n: les.minutes })}</span>
                                )}
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    )}

                  {block.outcomes.length > 0 && (
                    <div className="outcomes">
                      <span className="mini-label">{t('outcomes_head')}</span>
                      <ul>
                        {block.outcomes.map((o, i) => (
                          <li key={i}><Check size={14} strokeWidth={3} /> {o.text}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>

          {!owned && (
            <p className="mt-6 text-sm text-on-surface-variant" style={{ lineHeight: 1.65 }}>
              {tPortal('locked_note')}
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
