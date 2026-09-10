import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ownsModule } from '@/lib/entitlements';
import { getSkillAtLevel, isLevel } from '@/data/skills';
import { fetchPortalMenu } from '@/lib/portal-menu';
import { closeTrail, skillTrail } from '@/lib/portal-crumbs';
import { LessonProgressScope } from '@/components/lessons/LessonProgressScope';
import LessonNowCard from '@/components/lessons/LessonNowCard';
import LessonStage from '@/components/lessons/LessonStage';
import PortalCrumbs from '../../../../../components/PortalCrumbs';
import { fetchCourse, fetchLesson, fetchLessonWords } from '@/lib/lessons/lessons-server';
import { fetchNarration, narrationCueNames } from '@/lib/lessons/narration';
import { stepCount, visualFor } from '@/data/lesson-visuals';
import { conceptPath, coursePath, lessonPath } from '@/lib/lessons/lessons';
import { sporenFromBlocks } from '@/lib/lessons/sporen-server';
import { findModule, modulePath, spoorPath } from '@/lib/lessons/sporen';
import LessonStream from '@/components/lessons/LessonStream';
import LessonNarration from '@/components/lessons/LessonNarration';
import { NarrationScope } from '@/components/lessons/NarrationScope';
import type { LessonItem } from '@/components/lessons/item-helpers';
import AppShell from '../../../../../components/AppShell';
import { modulePanel } from '../../../../../components/nav';

type Props = { params: Promise<{ locale: string; level: string; skill: string; lesSlug: string }> };

export const metadata: Metadata = {
  title: 'Les | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

/**
 * Eén les: uitleg en opgaven in één stroom.
 *
 * ── ER IS GEEN LESSENLIJST MEER, IN DE CHROME NOCH OP DE PAGINA ──────────────
 * Tot 02-09 stond de hele cursus hier in een tweede kolom (`coursePanel`) én nog eens als
 * `block-nav` op mobiel. Dat is er af (beslissing eigenaar): een les hoort bij één module, en
 * de module heeft nu zijn eigen scherm — `/spoor/[spoor]/[module]` — met de lijst, de
 * voortgang en de volgende les erin. De les draagt dus precies twee uitgangen: terug naar zijn
 * module, en door naar de volgende les *binnen* die module.
 *
 * Dat laatste woord is de reden dat dit `nextInModule` gebruikt en niet `nextLesson`: die
 * tweede loopt de hele cursus af en stuurde je aan het eind van Grammatica zonder waarschuwing
 * de examentraining in.
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
  const tPortal = await getTranslations('portal');
  const tSkills = await getTranslations('skills');

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

  const [blocks, wordsByItem, menu, narration] = await Promise.all([
    fetchCourse(level, skill.slug, user.id),
    fetchLessonWords(lesson.items),
    fetchPortalMenu(),
    fetchNarration(lesson.id),
  ]);

  // De woorden op hun item hangen, zodat de renderer één databron heeft. Zie `item-helpers.ts`.
  const items: LessonItem[] = lesson.items.map(item =>
    item.kind === 'woordenlijst'
      ? { ...item, words: wordsByItem.get(item.id) ?? [] }
      : item) as LessonItem[];

  /**
   * In welke module deze les zit — waar "terug" heen gaat, en wat er hierna komt.
   *
   * `null` voor blok A (Woorden): die lessen horen bij de woordkaarten en zitten in geen
   * spoor. Dat is een feit en geen fout, en de terugknop valt dan terug op de cursus.
   */
  /* Zonder naam geen taalregelmodule, en dat is hier ook niet nodig: deze aanroep dient de
     terugknop van de les, en een regelles vindt zijn weg terug via de bibliotheek. */
  const sporen = await sporenFromBlocks(blocks, level, skill.slug, user?.id ?? null);
  const here = findModule(sporen, lesson.id);
  const inModule = here
    ? here.module.lessons.findIndex(l => l.id === lesson.id)
    : -1;
  const following = here && inModule >= 0
    ? here.module.lessons[inModule + 1] ?? null
    : null;
  const backHref = here
    ? modulePath(level, skill.slug, here.spoor.slug, here.module.slug)
    : coursePath(level, skill.slug);
  const backLabel = here ? here.module.name : t('back_to_course');

  /**
   * De tweede kolom: de lessen van de module waar deze les in zit.
   *
   * `null` voor blok A (Woorden) — die lessen zitten in geen spoor, en dan is er geen tweede
   * as om te tonen. De les valt dan terug op de kale chrome, zoals hij die had.
   */
  const panel = here
    ? modulePanel(here.spoor, here.module.slug, {
        kicker: t('module_label'),
        spoorTitle: tPortal(here.spoor.slug === 'taalregels'
          ? 'leerroute_grammatica_title'
          : 'leerroute_strategie_title'),
        spoorHref: spoorPath(level, skill.slug, here.spoor.slug),
        moduleHref: slug => modulePath(level, skill.slug, here.spoor.slug, slug),
        lessonHref: slug => lessonPath(level, skill.slug, slug),
        lockedHref: slug =>
          `/dashboard/pakketten?onderdeel=${level}:${skill.slug}&vanaf=leren-${slug}`,
        nextKicker: t('module_next'),
        currentLessonId: lesson.id,
        owned,
      })
    : null;

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
    ruleKick: t('rule_kick'),
    demoKick: t('demo_kick'),
    learnHead: t('section_learn'),
    learnSub: t('section_learn_sub'),
    practiceHead: t('section_practice'),
    exHead: t('ex_head'),
    exSub: t('ex_sub'),
    /* `t.raw` waar {n}/{total} pas in de client bekend zijn — zelfde reden als bij
       `stream_progress` hierboven. */
    exOf: t.raw('ex_of') as string,
    exGoto: t.raw('ex_goto') as string,
    exPrev: t('ex_prev'),
    exNext: t('ex_next'),
    exNextItem: t('ex_next_item'),
    exSkip: t('ex_skip'),
    tierHeads: [t('tier_0_head'), t('tier_1_head'), t('tier_2_head')] as [string, string, string],
    tierSubs: [t('tier_0_sub'), t('tier_1_sub'), t('tier_2_sub')] as [string, string, string],
    tierOther: t('tier_other_head'),
    visual: {
      kicker: t('visual_kicker'),
      walk: t('visual_walk'),
      walkStop: t('visual_walk_stop'),
      step: t.raw('visual_step') as string,
    },
    /* De microfoon van `naspreken` en `opnemen`. Zie `LessonRecorder.tsx`. */
    recorder: {
      record: t('rec_record'),
      stop: t('rec_stop'),
      again: t('rec_again'),
      recording: t('rec_recording'),
      heard: t('rec_heard'),
      heardNote: t('rec_heard_note'),
      noMic: t('rec_no_mic'),
      noRecorder: t('rec_no_recorder'),
      seconds: t('rec_seconds'),
    },
    sayAfter: t('say_after'),
    sayFocus: t('say_focus'),
    audioTodo: t('audio_todo'),
  };

  /**
   * Het lesplaatje van deze les, en hoeveel stappen het heeft.
   *
   * Het aantal stappen is hier nodig en niet in het plaatje zelf: de speler moet de cue
   * `vis-3` een naam kunnen geven, en dat kan alleen wie weet dat er een stap 3 is.
   */
  const visual = visualFor(lesson.slug);

  /* De namen van de delen, voor de "nu:"-regel op de speler. `cards` komt uit het eerste
     uitlegitem, want dat is waar `card-0` en `card-1` in `LessonStream` uit komen. */
  const firstUitleg = lesson.items.find(i => i.kind === 'uitleg');
  const cueNames = narrationCueNames({
    cards: firstUitleg?.kind === 'uitleg' ? firstUitleg.payload.cards.map(c => c.label) : [],
    demoCount: lesson.items.filter(i => i.kind === 'voorbeeld').length,
    visualSteps: visual ? stepCount(visual) : 0,
    labels: {
      rule: t('narration_at_rule'),
      demo: t.raw('narration_at_demo') as string,
      visual: t('narration_at_visual'),
      visualStep: t.raw('narration_at_visual_step') as string,
      exercises: t('narration_at_exercises'),
    },
  });

  return (
    <AppShell
      locale={locale}
      email={user.email ?? ''}
      avatarUrl={String(meta.avatar_url ?? meta.picture ?? '')}
      active={skill.slug}
      activeGroup={level}
      menu={menu}
      modulePanel={panel}
    >
      <div className="px-5 py-7 sm:px-8 sm:py-10">
        <div className="mx-auto max-w-3xl">

          <NarrationScope hasNarration={narration !== null}>
          <LessonProgressScope>
          <main className="min-w-0">
            {lesson.review_status !== 'validated' && (
              <p className="pending-banner">{t('pending_banner')}</p>
            )}

            <header className="mb-6">
              {/* Het hele pad, want dit is het diepste scherm van het portaal. Het laatste
                  kruimeltje kiest tussen de lessen van dézelfde module — de sprong die je
                  binnen een module het vaakst maakt. */}
              <PortalCrumbs
                trail={closeTrail(
                  [
                    ...skillTrail({
                      locale, level, skill: skill.slug,
                      overviewLabel: tPortal('crumb_overview'),
                      skillName: slug => tSkills(`${slug}.name`),
                    }),
                    ...(here
                      ? [
                          {
                            label: tPortal(here.spoor.slug === 'taalregels'
                              ? 'leerroute_grammatica_title'
                              : 'leerroute_strategie_title'),
                            href: `/${locale}${spoorPath(level, skill.slug, here.spoor.slug)}`,
                          },
                          { label: here.module.name, href: `/${locale}${backHref}` },
                        ]
                      : [{ label: backLabel, href: `/${locale}${backHref}` }]),
                  ],
                  {
                    label: lesson.title,
                    siblings: here?.module.lessons.map(l => ({
                      label: l.title,
                      href: `/${locale}${lessonPath(level, skill.slug, l.slug)}`,
                      current: l.id === lesson.id,
                    })),
                  },
                )}
              />
              {/* ── de leskop ──
                  Een kaartje met de navy tegel uit de mockup: het lesnummer erop, de titel
                  ernaast. Klein en niet over het lesblok, want dat blok laat vóór het spelen
                  al zien wát er straks met de stem meeverspringt. */}
              <div className="les-card">
                {inModule >= 0 && (
                  <span className="lc-tile" aria-hidden>
                    <span className="lc-n">{inModule + 1}</span>
                  </span>
                )}
                <span className="min-w-0">
                  {inModule >= 0 && (
                    <span className="lc-kick">{t('lesson_no', { n: inModule + 1 })}</span>
                  )}
                  <h1>{lesson.title}</h1>
                </span>
              </div>

              {/* ── de opname als blok, en daaronder de tweedeling ──
                  Mockup van de eigenaar (08-09). De opname was een compacte kaart naast de
                  titel; nu is het het vlak waar de les mee begint, want beluisteren ís de
                  eerste stap van deze laag. Daaronder staat links wat de les je brengt en
                  rechts wat er nog van je gevraagd wordt, met de oefenknop erin — de opgaven
                  staan onderaan een lange pagina en die knop is de lift ernaartoe. */}
              {narration && (
                <LessonNarration
                  layout="hero"
                  audioUrl={narration.audioUrl}
                  durationSeconds={narration.durationSeconds}
                  cues={narration.cues}
                  words={narration.words}
                  cueNames={cueNames}
                  reviewed={narration.reviewStatus === 'validated'}
                  labels={{
                    kicker: t('narration_kicker'),
                    play: t('narration_play'),
                    pause: t('narration_pause'),
                    speed: t('narration_speed'),
                    pendingNote: t('narration_pending'),
                    followLabel: t('narration_follow'),
                    followOn: t('narration_follow_on'),
                    followOff: t('narration_follow_off'),
                    nowAt: t.raw('narration_now_at') as string,
                    back10: t('narration_back10'),
                    fwd10: t('narration_fwd10'),
                    chapters: t('narration_chapters'),
                    wave: t('narration_wave'),
                  }}
                >
                  {/* De uitleg staat ín het blok en verspringt met de stem mee. Daarom staat
                      hij niet ook nog in de stroom eronder — zie `withLead`. */}
                  <LessonStage
                    items={items}
                    visual={visual}
                    cueNames={cueNames}
                    labels={{
                      ruleKick: t('rule_kick'),
                      demoKick: t('demo_kick'),
                      prev: t('stage_prev'),
                      next: t('stage_next'),
                      goto: t.raw('stage_goto') as string,
                      visual: labels.visual,
                    }}
                  />
                </LessonNarration>
              )}

              <div className="les-learn">
                <div className="min-w-0">
                  {lesson.what_you_learn && (
                    <>
                      <h2 className="ll-head">{t('learn_head')}</h2>
                      <p className="ll-body">{lesson.what_you_learn}</p>
                    </>
                  )}
                </div>

                <LessonNowCard
                  hasNarration={narration !== null}
                  labels={{
                    head: t('now_head'),
                    learn: t('now_learn'),
                    listen: t('now_listen'),
                    practice: t.raw('now_practice') as string,
                    cta: t('now_cta'),
                    note: t('now_note'),
                  }}
                />
              </div>

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

              {here && inModule >= 0 && (
                <div className="les-prog">
                  <div className="lp-item">
                    <div className="lp-top">
                      <b>{here.module.name}</b>
                      <span>
                        {t('module_place', { n: inModule + 1, total: here.module.total })}
                      </span>
                    </div>
                    <div className="lp-bar clay">
                      <i style={{ width: `${here.module.pct}%` }} />
                    </div>
                  </div>
                  {/* Eén streepje per les van deze module: waar je in de rij staat. Vroeger
                      waren dit de vijf blokken van de hele cursus, en dat was op een
                      lespagina de verkeerde schaal. */}
                  <div className="lp-blocks" aria-hidden>
                    {here.module.lessons.map((l, i) => (
                      <i key={l.id} className={i < inModule ? 'on' : i === inModule ? 'now' : ''} />
                    ))}
                  </div>
                </div>
              )}
            </header>

            <LessonStream
              lessonId={lesson.id}
              items={items}
              visual={visual}
              withLead={narration === null}
              labels={labels}
            />

            {following && (
              <a
                href={`/${locale}${lessonPath(level, skill.slug, following.slug)}`}
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
                    {following.title}
                  </span>
                </span>
                <ArrowRight size={18} strokeWidth={2.5} className="ms-auto shrink-0 text-secondary rtl-flip" />
              </a>
            )}

            {/* De laatste les van de module: de uitweg is het spoor, niet de volgende les van
                een module die de kandidaat nog niet gekozen heeft. */}
            {here && !following && (
              <a
                href={`/${locale}${spoorPath(level, skill.slug, here.spoor.slug)}`}
                className="mod-cont mod-next"
              >
                <span className="min-w-0">
                  <span className="mod-cont-kick">{t('module_done_head')}</span>
                  <span className="mod-cont-title">{t('module_back_to_spoor')}</span>
                </span>
                <ArrowRight size={18} strokeWidth={2.5} className="ms-auto shrink-0 text-secondary rtl-flip" />
              </a>
            )}
          </main>
          </LessonProgressScope>
          </NarrationScope>
        </div>
      </div>
    </AppShell>
  );
}
