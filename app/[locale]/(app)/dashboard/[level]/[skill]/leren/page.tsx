import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArrowLeft, ArrowRight, Check, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ownsModule } from '@/lib/entitlements';
import { getSkillAtLevel, isLevel, levelLabel } from '@/data/skills';
import { fetchPortalMenu } from '@/lib/portal-menu';
import { fetchCourse } from '@/lib/lessons/lessons-server';
import { blockProgress, courseProgressPct, lessonPath, nextLesson } from '@/lib/lessons/lessons';
import { spoorPath, type SpoorSlug } from '@/lib/lessons/sporen';
import { grammarStepPath } from '@/lib/lessons/grammar';
import AppShell from '../../../../components/AppShell';
import CategoryMark, { type Category } from '@/components/horizon/CategoryMark';
import '@/app/glas-leerlaag.css';

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
      <div className="g-leer gl-shell">
        <div className="gl-course">

          {/* De terugknop blijft: dit is de enige portaalpagina zonder eigen rij in de zijbalk,
              dus zonder die link is de weg terug naar het onderdeel weg. */}
          <a href={`/${locale}/dashboard/${level}/${skill.slug}`} className="gl-back">
            <ArrowLeft size={15} strokeWidth={2.4} className="rtl-flip" aria-hidden />
            {tSkills(`${skill.key}.name`)}
          </a>

          <header className="gl-course-head">
            <div className="gl-course-title">
              <CategoryMark category={skill.slug as Category} size={64} />
              <div>
                <h1 className="g-head gl-title">{t('course_title', { skill: tSkills(`${skill.key}.name`), level: levelLabel(level) })}</h1>
                <p className="gl-learn">{t('course_lede')}</p>
              </div>
            </div>
            <section className="gl-total" aria-label={tPortal('mod_learn')}>
              <span className="g-mono">{tPortal('mod_learn')}</span>
              <b className="g-tnum">{pct}<small>%</small></b>
              <span className="gl-rail" aria-hidden><i style={{ transform: `scaleX(${pct / 100})` }} /></span>
              <p>
                {t('course_progress', {
                  done: blocks.reduce((n, b) => n + blockProgress(b).done, 0),
                  total: blocks.reduce((n, b) => n + b.lessons.length, 0),
                })}
              </p>
            </section>
          </header>

          {next && (
            <a href={`/${locale}${lessonPath(level, skill.slug, next.lesson.slug)}`} className="gl-next gl-continue">
              <span className="gl-L">{next.block.letter}</span>
              <span className="gl-next-copy">
                <span className="g-mono">{t('continue')}</span>
                <b>{next.lesson.title}</b>
              </span>
              <span className="gl-next-go" aria-hidden><ArrowRight size={18} strokeWidth={2.4} className="rtl-flip" /></span>
            </a>
          )}

          <ol className="gl-blocks">
            {blocks.map(block => {
              const bp = blockProgress(block);
              const complete = bp.total > 0 && bp.done === bp.total;
              return (
                <li key={block.id} className="gl-block">
                  <div className="gl-block-head">
                    <span className={`gl-L${complete ? ' is-done' : ''}`}>{block.letter}</span>
                    <h2>{block.name_nl}</h2>
                    <span className="g-mono g-tnum">{t('block_count', { done: bp.done, total: bp.total })}</span>
                  </div>
                  {block.intro && <p className="gl-block-intro">{block.intro}</p>}

                  {/* Naar het spoor waar dit blok in modules is opgedeeld. Blok A heeft er
                      geen: dat zijn de woordkaartenthema's. */}
                  {SPOOR_OF_BLOCK[block.letter] && (
                    <a
                      href={block.letter === 'B'
                        ? `/${locale}${grammarStepPath(level, skill.slug)}`
                        : `/${locale}${spoorPath(level, skill.slug, SPOOR_OF_BLOCK[block.letter]!)}`}
                      className="g-tlink gl-block-link"
                    >
                      {tPortal('leerroute_cta_modules')}
                      <ArrowRight size={14} strokeWidth={2.4} className="rtl-flip" aria-hidden />
                    </a>
                  )}

                  {block.lessons.length === 0
                    ? <p className="gl-block-intro">{t('block_empty')}</p>
                    : (
                      <ul className="gl-lessons">
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
                              <a href={href} className={`gl-les${done ? ' is-done' : ''}${openable ? '' : ' is-locked'}`}>
                                <span className="gl-les-ic" aria-hidden>
                                  {done
                                    ? <Check size={12} strokeWidth={3} />
                                    : !openable ? <Lock size={12} strokeWidth={2.5} /> : null}
                                </span>
                                <span className="gl-les-t">{les.title}</span>
                                {les.minutes != null && (
                                  <span className="g-mono gl-les-m">{t('minutes', { n: les.minutes })}</span>
                                )}
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    )}

                  {block.outcomes.length > 0 && (
                    <div className="gl-outcomes">
                      <span className="g-mono">{t('outcomes_head')}</span>
                      <ul>
                        {block.outcomes.map((o, i) => (
                          <li key={i}><Check size={14} strokeWidth={3} aria-hidden /> {o.text}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>

          {!owned && <p className="gl-note">{tPortal('locked_note')}</p>}
        </div>
      </div>
    </AppShell>
  );
}
