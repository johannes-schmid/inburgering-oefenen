import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ownsModule } from '@/lib/entitlements';
import { getSkillAtLevel, isLevel } from '@/data/skills';
import { fetchPortalMenu } from '@/lib/portal-menu';
import { fetchCourse, fetchLesson, fetchLessonWords } from '@/lib/lessons/lessons-server';
import { conceptPath, coursePath, lessonPath, nextLesson } from '@/lib/lessons/lessons';
import LessonStream from '@/components/lessons/LessonStream';
import type { LessonItem } from '@/components/lessons/item-helpers';
import AppShell from '../../../../../components/AppShell';

type Props = { params: Promise<{ locale: string; level: string; skill: string; lesSlug: string }> };

export const metadata: Metadata = {
  title: 'Les | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

/**
 * Eén les: uitleg en opgaven in één stroom.
 *
 * ── DE BLOKKENLIJST STAAT OP DE PAGINA, NIET IN DE CHROME ────────────────────
 * De portaalchrome draagt al twee assen — welke module (de rail) en waar daarbinnen (het
 * paneel). Een derde as erin duwen is precies wat de refactor van 27-08 heeft weggehaald. De
 * cursusnavigatie hoort dus bij de cursus, in de linkerkolom van deze pagina.
 *
 * ── EEN `pending` LES IS BEREIKBAAR, EN ZEGT DAT ─────────────────────────────
 * `fetchLesson` geeft ook een nog niet nagekeken les terug: precies dát maakt reviewen
 * mogelijk. Hij staat in geen blok, in geen voortgang en in geen menu, en de pagina draagt een
 * banner. Zonder die banner zou de docent niet kunnen zien waar ze naar kijkt.
 */
export default async function LessonPage({ params }: Props) {
  const { locale, level: rawLevel, skill: slug, lesSlug } = await params;
  if (!isLevel(rawLevel)) notFound();
  const level = rawLevel;
  const skill = getSkillAtLevel(level, slug);
  if (!skill) notFound();

  const t = await getTranslations('lessons');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=${lessonPath(level, skill.slug, lesSlug)}`);

  const lesson = await fetchLesson(level, skill.slug, lesSlug);
  if (!lesson) notFound();

  const meta = user.user_metadata ?? {};
  const owned = ownsModule(meta, level, skill.slug);
  if (!owned && !lesson.is_free) {
    redirect(`/${locale}/dashboard/pakketten?onderdeel=${level}:${skill.slug}&vanaf=leren-${lesSlug}`);
  }

  const [blocks, wordsByItem, menu] = await Promise.all([
    fetchCourse(level, skill.slug, user.id),
    fetchLessonWords(lesson.items),
    fetchPortalMenu(),
  ]);

  // De woorden op hun item hangen, zodat de renderer één databron heeft. Zie `item-helpers.ts`.
  const items: LessonItem[] = lesson.items.map(item =>
    item.kind === 'woordenlijst'
      ? { ...item, words: wordsByItem.get(item.id) ?? [] }
      : item) as LessonItem[];

  const next = nextLesson(blocks);
  const following = next && next.lesson.slug !== lesson.slug ? next : null;

  const labels = {
    check: t('check'),
    correct: t('correct'),
    wrong: t('wrong'),
    why: t('why'),
    again: t('again'),
    showAnswer: t('show_answer'),
    modelAnswer: t('model_answer'),
    compare: t('compare'),
    // `t.raw` en niet `t`: deze string draagt {done} en {total}, en die getallen zijn pas
    // in de client bekend. next-intl weigert een bericht met onopgevulde placeholders en gaf
    // de sleutel in kapitalen terug ("LESSONS.STREAM_PROGRESS") midden op de pagina. De
    // client vult ze met `.replace()`.
    progress: t.raw('stream_progress') as string,
    yourAnswer: t('mark_pick'),
  };

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
        <div className="mx-auto flex max-w-5xl flex-col gap-7 lg:flex-row lg:gap-9">

          {/* De blokkenlijst. Op mobiel onder de les: daar is de les het doel en de navigatie
              de uitweg, niet andersom. */}
          <nav className="order-2 w-full shrink-0 lg:order-1 lg:w-56" aria-label={t('course_nav')}>
            <a
              href={`/${locale}${coursePath(level, skill.slug)}`}
              className="mb-3 block text-xs font-bold text-on-surface-variant no-underline hover:underline"
            >
              ← {t('back_to_course')}
            </a>
            <ol className="block-nav">
              {blocks.map(block => {
                const isOpen = block.id === lesson.block.id;
                return (
                  <li key={block.id}>
                    <div className={`block-nav-head${isOpen ? ' is-open' : ''}`}>
                      <span><span className="bl-letter">{block.letter}</span> {block.name_nl}</span>
                      <span className="block-nav-count">
                        {block.lessons.filter(l => l.progress?.state === 'done').length}/{block.lessons.length}
                      </span>
                    </div>
                    {isOpen && block.lessons.length > 0 && (
                      <ol className="mt-1 flex list-none flex-col gap-1 p-0">
                        {block.lessons.map(les => (
                          <li key={les.id}>
                            <a
                              href={`/${locale}${lessonPath(level, skill.slug, les.slug)}`}
                              className={`les-row${les.slug === lesson.slug ? ' is-current' : ''}`}
                              aria-current={les.slug === lesson.slug ? 'page' : undefined}
                            >
                              {les.progress?.state === 'done'
                                ? <Check size={14} strokeWidth={3} className="les-done" />
                                : <span className="w-[14px] shrink-0" aria-hidden />}
                              <span className="truncate">{les.title}</span>
                            </a>
                          </li>
                        ))}
                      </ol>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>

          <main className="order-1 min-w-0 flex-1 lg:order-2">
            {lesson.review_status !== 'validated' && (
              <p className="pending-banner">{t('pending_banner')}</p>
            )}

            <header className="mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                {t('block_crumb', { letter: lesson.block.letter, block: lesson.block.name_nl })}
              </span>
              <h1
                className="mt-1.5 font-headline font-extrabold text-on-surface"
                style={{ fontSize: 'clamp(1.45rem,3vw,1.85rem)', letterSpacing: '-0.03em' }}
              >
                {lesson.title}
              </h1>
              {lesson.what_you_learn && (
                <p className="mt-2.5 text-on-surface-variant" style={{ lineHeight: 1.7 }}>
                  {lesson.what_you_learn}
                </p>
              )}
              {lesson.concepts.length > 0 && (
                <p className="mt-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  {t('teaches')}{' '}
                  {lesson.concepts.map((c, i) => (
                    <span key={c.id}>
                      {i > 0 && ' · '}
                      <a href={`/${locale}${conceptPath(level, c.slug)}`} className="text-secondary">
                        {c.name_nl}
                      </a>
                    </span>
                  ))}
                </p>
              )}
            </header>

            <LessonStream lessonId={lesson.id} items={items} labels={labels} />

            {following && (
              <a
                href={`/${locale}${lessonPath(level, skill.slug, following.lesson.slug)}`}
                className="mt-8 flex items-center gap-3 rounded-2xl px-4 py-3.5 no-underline"
                style={{
                  background: 'var(--color-surface-container-lowest)',
                  boxShadow: 'var(--shadow-ambient)',
                }}
              >
                <span className="min-w-0">
                  <span className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    {t('next_lesson')}
                  </span>
                  <span className="block font-extrabold text-on-surface truncate">
                    {following.lesson.title}
                  </span>
                </span>
                <ArrowRight size={18} strokeWidth={2.5} className="ms-auto shrink-0 text-secondary rtl-flip" />
              </a>
            )}
          </main>
        </div>
      </div>
    </AppShell>
  );
}
