import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { ownsKnm } from '@/lib/entitlements';
import { emptyLevelledProgress, fetchPortalProgress, fetchPublishedExamNumbers } from '@/lib/portal-progress';
import { FEATURES } from '@/lib/features';
import { KNM, KNM_THEMES, isFreeExamOf } from '@/data/skills';
import { KNM_WORD_TOTAL, countWordsKnown, fetchThemesDone } from '@/lib/lessons/track-routes';
import { calculateSlaagkans } from '@/lib/exam-readiness';
import AppShell from '../../components/AppShell';
import PortalCrumbs from '../../components/PortalCrumbs';
import { buildExamSlots } from '../_components/exam-slots';
import {
  ExamLane, Lanes, LearnLane, SkillHead, WeaknessCard, passChanceLevel, type LearnRow,
} from '../_components/GlasSkill';
import { fetchPortalMenu } from '@/lib/portal-menu';
import { fetchKnmThemeWeakness } from '@/lib/vaardigheden-server';

/**
 * KNM's module in het portaal — de niveauloze tweeling van `dashboard/[level]/[skill]`, en dus
 * dezelfde Glas-pagina: **"S1 · twee banen"** (§G5). Een statische route, zodat `/dashboard/knm`
 * niet als `/dashboard/[level]` met niveau "knm" wordt gelezen.
 *
 * Twee dingen verschillen, en ze volgen uit wat KNM ís:
 *
 * - **De leerbaan is twee rijen, niet vijf blokken**: de woordkaarten en de zeven lesmodules.
 *   KNM toetst kennis en geen grammatica; een derde rij verzinnen zou een stap beloven die niet
 *   bestaat. Beide zitten achter hun feature flag.
 * - **De uitsplitsing gaat per thema** (`fetchKnmThemeWeakness`), niet per vaardigheid. Zolang
 *   er nergens genoeg antwoorden zijn is hij `null` en staan de feiten van de module in de kop.
 */
type Props = { params: Promise<{ locale: string }> };

export const metadata: Metadata = {
  title: 'KNM oefenexamens | Inburgering Oefenen',
  robots: { index: false, follow: false },
};


export default async function KnmExamsPage({ params }: Props) {
  const { locale } = await params;

  const t = await getTranslations('portal');
  const tSkills = await getTranslations('skills');
  const tKnm = await getTranslations('knm');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  /** Browsable anonymously; the wall is the oefenexamen itself. See `dashboard/page.tsx`. */
  const isGuest = !user;
  const meta = user?.user_metadata ?? {};

  const owns = ownsKnm(meta);
  const [progress, published, menu, themeWeakness, counts] = await Promise.all([
    user ? fetchPortalProgress(user.id) : Promise.resolve(emptyLevelledProgress()),
    fetchPublishedExamNumbers(),
    fetchPortalMenu(),
    fetchKnmThemeWeakness(user?.id ?? null),
    /* Een gast heeft geen voortgang; dan blijft de teller op nul zonder query. */
    user ? Promise.all([countWordsKnown(user.id), fetchThemesDone(user.id).then(d => d.size)]) : Promise.resolve([0, 0] as const),
  ]);
  const [wordsKnown, themesDone] = counts;

  const p = progress.knm;
  const pub = published.knm;

  /** De slaagkans: dezelfde regels als bij de taalonderdelen, op de beste score per examen. */
  const examScores = Object.values(p.exams)
    .map(e => e.bestPct)
    .filter((x): x is number => x != null);
  const kans = calculateSlaagkans(examScores);
  const kansLevel = passChanceLevel(examScores.length, kans.band);

  /** De leerbaan van KNM: woorden, dan de thema's. Alleen wat aanstaat komt in de rij. */
  const steps: { done: number; total: number; title: string; href: string; mark: LearnRow['mark'] }[] = [
    ...(FEATURES.woordkaarten
      ? [{ done: wordsKnown, total: KNM_WORD_TOTAL, title: tKnm('woorden_title'), href: `/${locale}/dashboard/woordkaarten`, mark: 'woorden' as const }]
      : []),
    ...(FEATURES.leren
      ? [{ done: themesDone, total: KNM_THEMES.length, title: tKnm('leren_title'), href: `/${locale}/leren`, mark: 'leren' as const }]
      : []),
  ];
  const learnRows: LearnRow[] = steps.map(s => {
    const complete = s.total > 0 && s.done >= s.total;
    return {
      key: s.href,
      mark: s.mark,
      title: s.title,
      sub: complete
        ? t('glas.block_done')
        : s.done === 0 ? t('glas.block_not_started') : `${Math.round((s.done / s.total) * 100)}%`,
      count: `${s.done}/${s.total}`,
      progress: s.total > 0 ? s.done / s.total : null,
      href: s.href,
      state: complete ? 'd' : 'open',
    };
  });

  const { cards, factLine } = await buildExamSlots({
    locale, level: null, skill: KNM, progress: p, published: pub, isGuest, owns,
  });
  const freeNumbers = new Set(
    Array.from({ length: KNM.examCount }, (_, i) => i + 1).filter(n => isFreeExamOf(null, n)),
  );

  const examsSub = [
    t('exams_made', { done: p.examsDone, total: KNM.examCount }),
    p.averagePct != null ? t('card_average', { pct: p.averagePct }) : null,
  ].filter(Boolean).join(' · ');

  return (
    <AppShell
      locale={locale}
      email={user?.email ?? ''}
      avatarUrl={String(meta.avatar_url ?? meta.picture ?? '')}
      active="overview-module"
      activeGroup="knm"
      menu={menu}
      isGuest={isGuest}
    >
      <div className="g-page">
        {/* Overzicht › KNM. Geen niveaukruimel ertussen: KNM heeft er geen. */}
        <PortalCrumbs
          glas
          trail={[
            { label: t('crumb_overview'), href: `/${locale}/dashboard` },
            { label: tSkills('knm.name') },
          ]}
        />

        <div className="g-sk">
          <SkillHead
            category="knm"
            title={tSkills('knm.name')}
            tagline={tSkills('knm.tagline')}
            facts={factLine}
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
              sub={t('glas.learn_modules', { n: learnRows.length })}
              rows={learnRows}
              empty={t('leerroute_empty')}
              continueLabel={t('mod_continue')}
            />
            <ExamLane
              title={t('stat_exams')}
              sub={examsSub}
              cards={cards}
              freeNumbers={freeNumbers}
              owns={owns}
              isGuest={isGuest}
              factLine={factLine}
              /* KNM heeft geen los overzicht van zijn tien examens — deze baan ís het. */
              allHref={null}
            />
          </Lanes>

          {themeWeakness && (
            <WeaknessCard
              title={themeWeakness.rows.some(r => r.pct !== null) ? t('weak_head') : t('weak_head_empty')}
              data={themeWeakness}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
