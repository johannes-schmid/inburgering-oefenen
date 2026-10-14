import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { ownsModule } from '@/lib/entitlements';
import { emptyLevelledProgress, fetchPortalProgress, fetchPublishedExamNumbers } from '@/lib/portal-progress';
import { getSkillAtLevel, isFreeExamOf, isLevel, levelLabel } from '@/data/skills';
import { fetchSkillWeakness } from '@/lib/vaardigheden-server';
import { fetchCourse } from '@/lib/lessons/lessons-server';
import { wordsPath } from '@/lib/lessons/words';
import { calculateSlaagkans } from '@/lib/exam-readiness';
import { lessonStepSoon } from '@/lib/features';
import { blockProgress, lessonPath, nextLesson } from '@/lib/lessons/lessons';
import { spoorPath } from '@/lib/lessons/sporen';
import { skillTrail } from '@/lib/portal-crumbs';
import { fetchGrammarStep } from '@/lib/lessons/grammar-server';
import { grammarStepPath } from '@/lib/lessons/grammar';
import { euro, MODULE_PRICE_CENTS } from '@/lib/pricing';
import { fetchPortalMenu } from '@/lib/portal-menu';
import PortalCrumbs from '../../../components/PortalCrumbs';
import AppShell from '../../../components/AppShell';
import { buildExamSlots } from '../../_components/exam-slots';
import {
  ExamLane, Lanes, LearnLane, SkillHead, UnlockCard, WeaknessCard, passChanceLevel, type LearnRow,
} from '../../_components/GlasSkill';

type Props = { params: Promise<{ locale: string; level: string; skill: string }> };

export const metadata: Metadata = {
  title: 'Oefenexamens | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

/** Welke stap van de leerroute een blok is — voor `lessonStepSoon` (lib/features.ts). */
const KIND_OF_BLOCK = {
  A: 'woordenschat',
  B: 'grammatica',
  C: 'strategie',
  D: 'strategie',
  E: 'strategie',
} as const;
const LETTERS = ['A', 'B', 'C', 'D', 'E'] as const;

/**
 * De onderdeelpagina, in Glas: **"S1 · twee banen"** (DESIGN_SYSTEM §G5, glas.html §09b).
 *
 * Kop met de grote slaagkanskaart; daaronder *1 Leren* (de blokken A–E) → *2 Oefenexamens* (tien
 * vierkantjes en één oranje kaart om te ontgrendelen). Daaronder, als er iets te zeggen valt,
 * waar je punten laat liggen.
 *
 * **Blok B is hier "Taalregels", niet de eigen naam van het blok.** De taalregels van een examen
 * staan één keer in de database (blok B van A2 Lezen, `RULES_HOME`) en worden per onderdeel
 * gelezen; de grammaticastap (`fetchGrammarStep`) telt ze voor dít onderdeel. Rij B wijst
 * daarom naar die stap en draagt zijn telling — zo blijft de route woorden → de regels die dit
 * examen vraagt → examentraining, zoals de eigenaar op 10-09 besloot, alleen nu als vijf blokken.
 *
 * Een slot heeft drie redenen om niet open te gaan — niet gepubliceerd, niet in je pakket, al
 * gehaald — en die blijven drie vormen (`ExamLane`). Een gast mag dit scherm bekijken; de muur
 * staat bij de speler.
 */
export default async function SkillExamsPage({ params }: Props) {
  const { locale, level: rawLevel, skill: slug } = await params;
  if (!isLevel(rawLevel)) notFound();
  const level = rawLevel;
  const skill = getSkillAtLevel(level, slug);
  if (!skill) notFound();

  const t = await getTranslations('portal');
  const tSkills = await getTranslations('skills');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  /** Browsable anonymously; the wall is the oefenexamen itself. See `dashboard/page.tsx`. */
  const isGuest = !user;
  const meta = user?.user_metadata ?? {};

  // Per-onderdeel ownership, not "has any paid plan".
  const ownsThisSkill = ownsModule(meta, level, skill.slug);
  const [progress, published, menu, blocks, grammar, weakness] = await Promise.all([
    user ? fetchPortalProgress(user.id) : Promise.resolve(emptyLevelledProgress()),
    fetchPublishedExamNumbers(),
    fetchPortalMenu(),
    fetchCourse(level, skill.slug, user?.id ?? null),
    fetchGrammarStep(level, skill.slug, user?.id ?? null),
    /* `null` tot er iets te zeggen valt — zie `lib/vaardigheden-server.ts`. */
    fetchSkillWeakness(user?.id ?? null, level, skill.slug),
  ]);

  const p = progress[level][skill.slug];
  const pub = published[level][skill.slug];

  /**
   * De slaagkans: `calculateSlaagkans` weegt het gemiddelde tegen een prior van 50 en wordt pas
   * na vijf examens volledig zeker. De scores zijn de *beste* per examen.
   */
  const examScores = Object.values(p.exams)
    .map(e => e.bestPct)
    .filter((x): x is number => x != null);
  const kans = calculateSlaagkans(examScores);
  const kansLevel = passChanceLevel(examScores.length, kans.band);

  /* ── 1 Leren: de blokken A–E ─────────────────────────────────────────────────────────── */
  const next = nextLesson(blocks);
  const byLetter = new Map(blocks.map(b => [b.letter, b]));
  const learnRows: LearnRow[] = LETTERS.flatMap(letter => {
    const block = byLetter.get(letter);
    const isRules = letter === 'B';
    if (isRules ? !block && grammar.total === 0 : !block || block.lessons.length === 0) return [];

    const tally = isRules
      ? { done: grammar.done, total: grammar.total }
      : blockProgress(block!);
    const soon = lessonStepSoon(level, KIND_OF_BLOCK[letter]);
    /* `withOrder()` zet `is_free` op de eerste les van A, B en C: dat is de etalage. */
    const free = block?.lessons.some(l => l.is_free) ?? false;
    const isNext = next?.block.letter === letter;
    const stepHref = letter === 'A'
      ? wordsPath(level, skill.slug)
      : isRules
        ? grammarStepPath(level, skill.slug)
        : spoorPath(level, skill.slug, 'examentraining');

    const state: LearnRow['state'] = soon
      ? 'soon'
      : tally.total > 0 && tally.done >= tally.total
        ? 'd'
        : isNext
          ? 'c'
          : !ownsThisSkill && !free
            ? 'lk'
            : 'open';

    const sub =
      state === 'soon' ? t('tag_soon')
        : state === 'd' ? t('glas.block_done')
          : state === 'c' ? t('ov_next', { lesson: next!.lesson.title })
            : state === 'lk' ? t('words_locked')
              : !ownsThisSkill && free ? t('glas.block_first_free')
                : tally.done === 0 ? t('glas.block_not_started')
                  : t('mod_lessons', { done: tally.done, total: tally.total });

    /* De huidige rij gaat meteen naar de les waar je verdergaat, als je die mag openen; de
       andere naar het overzicht van hun stap. */
    const continueHref = state === 'c' && (ownsThisSkill || next!.lesson.is_free)
      ? lessonPath(level, skill.slug, next!.lesson.slug)
      : stepHref;

    return [{
      key: letter,
      letter,
      title: isRules ? t('leerroute_grammatica_title') : block!.name_nl,
      sub,
      count: tally.total > 0 ? `${tally.done}/${tally.total}` : null,
      href: state === 'soon' ? null : `/${locale}${continueHref}`,
      state,
    }];
  });
  const allSoon = learnRows.length > 0 && learnRows.every(r => r.state === 'soon');

  /* ── 2 Oefenexamens ──────────────────────────────────────────────────────────────────── */
  const { cards, factLine } = await buildExamSlots({
    locale, level, skill, progress: p, published: pub, isGuest, owns: ownsThisSkill,
  });
  const freeNumbers = new Set(
    Array.from({ length: skill.examCount }, (_, i) => i + 1).filter(n => isFreeExamOf(level, n)),
  );
  const skillName = tSkills(`${skill.key}.name`);
  const moduleName = `${skillName} ${levelLabel(level)}`;

  /* De ene oranje kaart: voor een gast het account, voor wie het onderdeel niet heeft de
     module. Wie hem heeft, krijgt hier niets — het donkere vierkantje wijst al het volgende
     examen aan. */
  const upsell = isGuest
    ? (
      <UnlockCard
        title={t('guest_upsell_title')}
        sub={t('guest_upsell_body')}
        cta={t('guest_create_account')}
        href={`/${locale}/register?next=/dashboard/${level}/${skill.slug}`}
      />
    )
    : !ownsThisSkill && pub.size > 0
      ? (
        <UnlockCard
          title={t('glas.unlock_title')}
          sub={t('glas.unlock_sub', { module: moduleName, price: euro(MODULE_PRICE_CENTS) })}
          cta={t('glas.unlock_cta', { skill: skillName })}
          href={`/${locale}/dashboard/pakketten?onderdeel=${level}:${skill.slug}&vanaf=onderdeel`}
        />
      )
      : null;

  const examsSub = [
    t('exams_made', { done: p.examsDone, total: skill.examCount }),
    p.averagePct != null ? t('card_average', { pct: p.averagePct }) : null,
  ].filter(Boolean).join(' · ');

  return (
    <AppShell
      locale={locale}
      email={user?.email ?? ''}
      avatarUrl={String(meta.avatar_url ?? meta.picture ?? '')}
      active={skill.slug}
      activeGroup={level}
      menu={menu}
      isGuest={isGuest}
    >
      <div className="g-page">
        <PortalCrumbs
          glas
          trail={skillTrail({
            locale, level, skill: skill.slug, last: true,
            overviewLabel: t('crumb_overview'),
            skillName: s => tSkills(`${s}.name`),
          })}
        />

        <div className="g-sk">
          <SkillHead
            category={skill.slug}
            title={skillName}
            tagline={tSkills(`${skill.key}.tagline`)}
            facts={[t('level_section', { level: levelLabel(level) }), factLine].filter(Boolean).join(' · ')}
            kans={{
              level: kansLevel,
              label: t('glas.kans_label'),
              word: t(`glas.kans_${kansLevel}`),
              line: examScores.length > 0
                ? t('slaagkans_note', { count: examScores.length, avg: kans.avgScore })
                : t('slaagkans_note_empty'),
              scale: [t('glas.kans_1'), t('glas.kans_2'), t('glas.kans_3'), t('glas.kans_4')],
            }}
          />

          <Lanes>
            <LearnLane
              title={t('mod_learn')}
              sub={t('leerroute_sub')}
              rows={learnRows}
              empty={allSoon ? t('leerroute_soon') : t('leerroute_empty')}
              continueLabel={t('mod_continue')}
            />
            <ExamLane
              title={t('stat_exams')}
              sub={examsSub}
              cards={cards}
              freeNumbers={freeNumbers}
              owns={ownsThisSkill}
              allHref={`/${locale}/dashboard/${level}/${skill.slug}/oefenexamens`}
              allLabel={t('exams_all')}
              labels={{
                free: t('glas.free'),
                now: t('exams_now'),
                slot: (n, state) => `${t('exam_row_title', { number: n })} · ${state}`,
              }}
              upsell={upsell}
            />
          </Lanes>

          {weakness && (
            <WeaknessCard
              title={weakness.rows.some(r => r.pct !== null) ? t('weak_head') : t('weak_head_empty')}
              data={weakness}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
