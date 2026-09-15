import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { ownsKnm } from '@/lib/entitlements';
import { emptyLevelledProgress, fetchPortalProgress, fetchPublishedExamNumbers } from '@/lib/portal-progress';
import { FEATURES } from '@/lib/features';
import { KNM, KNM_THEMES, formatCount } from '@/data/skills';
import { KNM_WOORDKAARTEN } from '@/data/woordkaarten';
import { calculateSlaagkans } from '@/lib/exam-readiness';
import { CategoryMark, type Category } from '@/components/horizon';
import AppShell from '../../components/AppShell';
import PortalCrumbs from '../../components/PortalCrumbs';
import SkillStatBar from '../_components/SkillStatBar';
import TrackCard from '../_components/TrackCard';
import ExamStrip from '../_components/ExamStrip';
import { fetchPortalMenu } from '@/lib/portal-menu';
import { fetchKnmThemeWeakness } from '@/lib/vaardigheden-server';

/**
 * KNM's module in het portaal — de niveauloze tweeling van `dashboard/[level]/[skill]`.
 *
 * Een statische route, zodat `/dashboard/knm` niet als `/dashboard/[level]` met niveau "knm"
 * wordt gelezen. (`next.config.ts` leidt `/dashboard/<taalonderdeel>` om naar zijn A2-pad; die
 * regel noemt de vier slugs met naam, dus `knm` valt hierdoorheen naar deze pagina.)
 *
 * **De vorm is die van een taalonderdeel, en dat is de wijziging van 15-09** (besluit eigenaar).
 * Dit scherm was een lijst van tien rijen met een zijkolom ernaast, terwijl elk taalonderdeel
 * inmiddels dezelfde drie lagen draagt: de diagnose bovenaan (`SkillStatBar`), dan de leerroute
 * als kaarten, dan de examens als strook. Eén module die zich anders gedraagt dan de andere vijf
 * laat de kandidaat opnieuw uitzoeken waar hij is.
 *
 * Twee dingen verschillen, en ze volgen uit wat KNM ís:
 *
 * - **De leerroute is twee stappen, niet drie.** Woorden en de zeven lesmodules; er is geen
 *   taalregelblok, want KNM toetst kennis en geen grammatica. Een derde kaart erbij verzinnen
 *   zou een stap beloven die niet bestaat.
 * - **De uitsplitsing gaat per thema, niet per vaardigheid.** KNM heeft geen concepten, dus
 *   `fetchSkillWeakness` geeft er niets voor terug; zijn as is het thema
 *   (`sections.theme_id`), en `fetchKnmThemeWeakness` telt de zeven officiële thema's uit
 *   dezelfde antwoorden. Zelfde rijvorm, zelfde drempel, zelfde plek op de kaart. Zolang er
 *   nergens genoeg antwoorden zijn is hij `null` en nemen de feiten van de module die plek in.
 *
 * Beide leersurfaces zitten achter hun feature flag, zodat een omgeving met de vlaggen uit de
 * examens alleen toont in plaats van twee kaarten naar niets.
 */
type Props = { params: Promise<{ locale: string }> };

export const metadata: Metadata = {
  title: 'KNM oefenexamens | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

/** De 366 woordkaarten liggen statisch in de repo; dit is hun aantal, niet een query. */
const WORD_TOTAL = KNM_WOORDKAARTEN.themes.reduce((n, th) => n + th.words.length, 0);

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
  const [progress, published] = await Promise.all([
    user ? fetchPortalProgress(user.id) : Promise.resolve(emptyLevelledProgress()),
    fetchPublishedExamNumbers(),
  ]);

  const p = progress.knm;
  const pub = published.knm;

  const menu = await fetchPortalMenu();

  /*
   * De voortgang van de twee leersurfaces, allebei uit hun eigen tabel.
   *
   * `user_word_card_progress.status` is `'known'` zodra de kandidaat de kaart kent — dezelfde
   * waarde die `WoordkaartenView` schrijft; `user_leren_progress.completed` is het vinkje van een
   * thema. Een gast heeft geen van beide, en dan blijft de teller op nul zonder query.
   */
  const [wordsKnown, themesDone] = user
    ? await Promise.all([countWordsKnown(user.id), countThemesDone(user.id)])
    : [0, 0];

  /**
   * De slaagkans-meter, dezelfde als bij de taalonderdelen.
   *
   * `calculateSlaagkans` weegt het gemiddelde tegen een prior van 50 en wordt pas na vijf examens
   * volledig zeker — één examen van 90% mag niet als "90% slaagkans" lezen. De scores zijn de
   * *beste* per examen: een verprutste eerste poging die daarna is rechtgezet hoort de kandidaat
   * niet te blijven achtervolgen.
   */
  const examScores = Object.values(p.exams)
    .map(e => e.bestPct)
    .filter((x): x is number => x != null);
  const kans = calculateSlaagkans(examScores);

  /**
   * De uitsplitsing per thema — wat bij een taalonderdeel de vaardigheden zijn.
   *
   * `null` tot er van minstens één thema genoeg antwoorden zijn; dan neemt de feitenlijst die
   * kolom in. Zie `fetchKnmThemeWeakness`.
   */
  const themeWeakness = await fetchKnmThemeWeakness(user?.id ?? null);

  /** De leerroute van KNM: woorden, dan de thema's. Alleen wat aanstaat komt in de rij. */
  const steps = [
    FEATURES.woordkaarten && {
      key: 'woorden',
      mark: 'woorden' as const,
      title: tKnm('woorden_title'),
      pct: WORD_TOTAL > 0 ? Math.round((wordsKnown / WORD_TOTAL) * 100) : null,
      cta: t('leerroute_cta_words'),
      href: `/${locale}/dashboard/woordkaarten`,
    },
    FEATURES.leren && {
      key: 'leren',
      mark: 'knm' as const,
      title: tKnm('leren_title'),
      pct: Math.round((themesDone / KNM_THEMES.length) * 100),
      cta: t('leerroute_cta_modules'),
      href: `/${locale}/leren`,
    },
  ].filter(Boolean) as {
    key: string; mark: Category; title: string; pct: number | null; cta: string; href: string;
  }[];

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
      <div className="px-5 py-7 sm:px-8 sm:py-10">
        <div className="max-w-5xl mx-auto">

          {/* Overzicht › KNM. Geen niveaukruimel ertussen: KNM heeft er geen, en "Niveau KNM"
              is een categoriefout op het scherm (zie `moduleGroupLabel`). */}
          <PortalCrumbs
            trail={[
              { label: t('crumb_overview'), href: `/${locale}/dashboard` },
              { label: tSkills('knm.name') },
            ]}
          />

          {/* Dezelfde kopbalk als elk taalonderdeel: de naam, de slaagkansmeter, en rechts waar
              je zakt — bij KNM per thema. Zonder die cijfers staan daar de feiten van de
              module. */}
          <SkillStatBar
            category="knm"
            title={tSkills('knm.name')}
            tagline={tSkills('knm.tagline')}
            weakness={themeWeakness}
            facts={
              <div className="sb-panel">
                {/* Geen kicker: de kop van de kaart zegt al KNM, en een tweede keer die naam
                    boven vier feiten leest als een kolomtitel die er niet is. */}
                <dl className="sb-facts">
                  <div>
                    <dt>{t('stat_exams')}</dt>
                    <dd>{t('stat_exams_value', { done: p.examsDone, total: KNM.examCount })}</dd>
                  </div>
                  <div>
                    <dt>{t('stat_items')}</dt>
                    <dd>{formatCount(KNM.itemCount)}</dd>
                  </div>
                  <div>
                    <dt>{t('stat_duration')}</dt>
                    <dd>{t('stat_duration_value', { minutes: formatCount(KNM.durationMinutes) })}</dd>
                  </div>
                  <div>
                    <dt>{t('stat_average')}</dt>
                    <dd>{p.averagePct != null ? `${p.averagePct}%` : '—'}</dd>
                  </div>
                </dl>
              </div>
            }
            slaagkans={kans.slaagkans}
            band={kans.band}
            examsCount={examScores.length}
            avgScore={kans.avgScore}
          />

          {/* De examens staan boven de leerroute (eigenaar, 15-09): de kandidaat komt voor
              het volgende oefenexamen. Zelfde volgorde als bij de taalonderdelen. */}
          <ExamStrip
            locale={locale}
            /* `null` is KNM: geen niveau in de URL en geen niveau in de module-id. */
            level={null}
            skill={KNM}
            progress={p}
            published={pub}
            isGuest={isGuest}
            owns={owns}
          />

          {/* Het witte paneel van de examenstrook eromheen (eigenaar, 15-09): twee blokken die
              op dezelfde pagina dezelfde rol spelen — een kop met kaarten eronder — horen
              dezelfde doos te hebben. De kop staat daarom ín het paneel. */}
          {steps.length > 0 && (
            <section className="panel mb-7">
              {/* Dezelfde kop als de examenstrook: de naam in de kopletter met de toelichting
                  ernaast, niet het kapitaalkopje. Twee panelen naast elkaar met twee soorten
                  koppen lezen als twee soorten blokken (eigenaar, 15-09). */}
              <div className="lr-head">
                <h2>{t('leerroute_title')}</h2>
                <p>{t('leerroute_sub')}</p>
              </div>
              {/* Twee stappen, dus twee kolommen. `is-three` zou hier een lege derde kolom
                  laten staan, en een lege plek in een genummerde route leest als een stap die
                  ontbreekt. */}
              <div className="ov-cards is-two">
                {steps.map(s => (
                  <TrackCard
                    key={s.key}
                    layer="onderdeel"
                    mark={<CategoryMark category={s.mark} size={56} tone="dark" />}
                    /* Geen "STAP 1": de kop erboven zegt al dat dit een volgorde is. */
                    sub={null}
                    title={s.title}
                    state="active"
                    note={null}
                    pct={s.pct}
                    progressLabel={null}
                    /* Geen feitenregel: de balk eronder zegt hetzelfde als breedte, en het
                       getal staat op het scherm waar de knop naartoe gaat. */
                    meta={[]}
                    cta={s.cta}
                    href={s.href}
                    soonLabel={t('tag_soon')}
                  />
                ))}
              </div>
            </section>
          )}



        </div>
      </div>
    </AppShell>
  );
}

/**
 * Hoeveel van de 366 woordkaarten de kandidaat kent.
 *
 * Een telling, geen rijen: `head: true` haalt alleen `count` op, zodat de 366 kaarten niet door
 * de pagina reizen voor één getal. Een fout betekent nul — dit is een cijfer op een kaart, geen
 * reden om het scherm te laten vallen.
 */
async function countWordsKnown(userId: string): Promise<number> {
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from('user_word_card_progress')
      .select('word_card_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'known');
    return count ?? 0;
  } catch {
    return 0;
  }
}

/** Hoeveel van de zeven thema's afgerond zijn. Zelfde afweging als hierboven. */
async function countThemesDone(userId: string): Promise<number> {
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from('user_leren_progress')
      .select('thema_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('completed', true);
    return count ?? 0;
  } catch {
    return 0;
  }
}
