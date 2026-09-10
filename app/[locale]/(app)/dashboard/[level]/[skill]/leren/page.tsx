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
import { spoorPath, type SpoorSlug } from '@/lib/lessons/sporen';
import AppShell from '../../../../components/AppShell';

type Props = { params: Promise<{ locale: string; level: string; skill: string }> };

/** Welk blok in welk spoor is opgedeeld. Blok A staat er niet in — zie de doc-comment. */
const SPOOR_OF_BLOCK: Record<string, SpoorSlug | undefined> = {
  B: 'taalregels',
  C: 'examentraining',
  D: 'examentraining',
  E: 'examentraining',
};

export const metadata: Metadata = {
  title: 'Lessen | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

/**
 * De cursus van één onderdeel: de blokken A–E met hun lessen.
 *
 * Sinds 02-09 is dit de *inhoudsopgave* en niet meer de werkplek: de tweede kolom is eraf en
 * de leerroute op het onderdeelscherm wijst naar de sporen (`/spoor/grammatica`,
 * `/spoor/examentraining`), waar de modules elk hun eigen scherm hebben. Wat hier nog uniek
 * staat is blok A — die zes lessen horen bij de woordkaartenthema's en zitten in geen spoor.
 * Elk blok draagt daarom een link naar zijn spoor in plaats van de plek te zijn waar je een
 * les kiest.
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
        <div className="max-w-5xl mx-auto">

          {/* Dezelfde kop als de rest van het portaal: titel en ondertitel, de cijfers rechts.
              De terugknop blijft hier wél staan — dit is de enige portaalpagina zonder eigen rij
              in de zijbalk, dus zonder die link is de weg terug naar het onderdeel weg. */}
          <a href={`/${locale}/dashboard/${level}/${skill.slug}`} className="ov-back">
            ← {tSkills(`${skill.key}.name`)}
          </a>

          <header className="ov-head">
            <h1>{t('course_title', { skill: tSkills(`${skill.key}.name`), level: levelLabel(level) })}</h1>
            <p>{t('course_lede')}</p>
          </header>

          <div className="ov-grid">
            <div className="ov-rows">
            {next && (
              <a
                href={`/${locale}${lessonPath(level, skill.slug, next.lesson.slug)}`}
                className="mb-6 flex items-center gap-3 rounded-2xl px-4 py-3.5 no-underline"
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

                    {/* Naar het spoor waar dit blok in modules is opgedeeld. Blok A heeft er
                        geen: dat zijn de woordkaartenthema's. */}
                    {SPOOR_OF_BLOCK[block.letter] && (
                      <a
                        href={`/${locale}${spoorPath(level, skill.slug, SPOOR_OF_BLOCK[block.letter]!)}`}
                        className="cb-spoor"
                      >
                        {tPortal('leerroute_cta_modules')}
                        <ArrowRight size={14} strokeWidth={2.4} className="rtl-flip" />
                      </a>
                    )}

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

            <aside className="ov-side">
              <section className="ov-card ov-total">
                <span className="ov-kick">{tPortal('mod_learn')}</span>
                <div className="ov-total-top">
                  <b>{pct}%</b>
                </div>
                <span className="ov-rail" aria-hidden><i style={{ width: `${pct}%` }} /></span>
                <p className="ov-note">
                  {t('course_progress', {
                    done: blocks.reduce((n, b) => n + blockProgress(b).done, 0),
                    total: blocks.reduce((n, b) => n + b.lessons.length, 0),
                  })}
                </p>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
