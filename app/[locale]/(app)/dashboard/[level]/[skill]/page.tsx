import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { ownsModule } from '@/lib/entitlements';
import { emptyLevelledProgress, fetchPortalProgress, fetchPublishedExamNumbers } from '@/lib/portal-progress';
import { getSkillAtLevel, isLevel } from '@/data/skills';
import CriterionProgress from '@/components/exam/CriterionProgress';
import { fetchCriterionSeries } from '@/lib/criterion-progress';
import { fetchCourse } from '@/lib/lessons/lessons-server';
import { fetchConcepts, fetchMastery, fetchTeachersForCourse } from '@/lib/lessons/concepts-server';
import { readiness } from '@/lib/lessons/readiness';
import { buildLeerroute } from '@/lib/lessons/leerroute';
import { fetchWordCounts } from '@/lib/lessons/words-server';
import { wordsPath } from '@/lib/lessons/words';
import { calculateSlaagkans } from '@/lib/exam-readiness';
import SkillStatBar from '../../_components/SkillStatBar';
import TrackCard from '../../_components/TrackCard';
import { type SwRow } from '../../_components/StrengthWeakness';
import { blockProgress, lessonPath, type ConceptKind } from '@/lib/lessons/lessons';
import { spoorPath, type SpoorSlug } from '@/lib/lessons/sporen';
import { skillTrail } from '@/lib/portal-crumbs';
import PortalCrumbs from '../../../components/PortalCrumbs';
import { sporenFromBlocks } from '@/lib/lessons/sporen-server';
import { CategoryMark, type Category } from '@/components/horizon';
import AppShell from '../../../components/AppShell';
import ExamStrip from '../../_components/ExamStrip';
import { fetchPortalMenu } from '@/lib/portal-menu';

type Props = { params: Promise<{ locale: string; level: string; skill: string }> };

/**
 * De mark per stap van de leerroute.
 *
 * `ConceptKind` heet `strategie` in de database en **Examentraining** op het scherm: de eerste
 * is wat het is, de tweede is wat je erin doet. Deze map is de enige plek waar die twee namen
 * aan elkaar zitten, zodat een naamswijziging op het scherm geen migratie is.
 */
/**
 * Van conceptsoort naar leerspoor.
 *
 * `strategie` heet in de URL en op het scherm `examentraining`: het eerste is het woord van de
 * database, het tweede dat van de kandidaat. Deze regel is de enige plek waar ze elkaar raken.
 */
const SPOOR_OF_KIND = {
  grammatica: 'taalregels',
  strategie: 'examentraining',
} as const satisfies Record<Exclude<ConceptKind, 'woordenschat'>, SpoorSlug>;

const LEER_MARK = {
  woordenschat: 'woorden',
  grammatica: 'grammatica',
  strategie: 'examentraining',
} as const satisfies Record<ConceptKind, Category>;

export const metadata: Metadata = {
  title: 'Oefenexamens | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

/**
 * The ten oefenexamens of one onderdeel, inside the portal.
 *
 * This is the logged-in twin of the public `(main)/oefenexamen/[skill]` overview. They are not
 * duplicates by accident: the public page is the SEO and funnel surface and must render for
 * anonymous visitors, while this one shows scores, attempt counts and lock state, all of which
 * require a session.
 *
 * A slot has three reasons it may not be openable, and they are deliberately distinct in the
 * UI: no content authored yet, or paid-plan-only, or already passed (still re-sittable). A
 * single "locked" state for all three tells the candidate nothing.
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

  // Per-onderdeel ownership, not "has any paid plan". The dashboard overview already read it this
  // way, so the two screens disagreed: the card said the module was owned and its ten slots all
  // showed locked.
  const ownsThisSkill = ownsModule(meta, level, skill.slug);
  const [progress, published] = await Promise.all([
    user ? fetchPortalProgress(user.id) : Promise.resolve(emptyLevelledProgress()),
    fetchPublishedExamNumbers(),
  ]);

  const p = progress[level][skill.slug];
  const pub = published[level][skill.slug];
  const isRubric = skill.scoring === 'open';

  // Only the two rubric skills have criteria to chart. `fetchCriterionSeries` returns [] until the
  // candidate has a graded answer, and CriterionProgress renders nothing for an empty series — so
  // this is quiet rather than an empty-state box on a page the candidate has just opened.
  const criterionSeries = isRubric && user
    ? await fetchCriterionSeries(user.id, skill.slug as 'schrijven' | 'spreken')
    : [];

  const menu = await fetchPortalMenu();

  // De lescursus van dit onderdeel. Een leeg resultaat betekent dat de docent nog niets heeft
  // vrijgegeven; dan komt er geen kaart in plaats van een kaart die naar een 404 wijst.
  const blocks = await fetchCourse(level, skill.slug, user?.id ?? null);
  const lessonsDone = blocks.reduce((n, b) => n + blockProgress(b).done, 0);
  const lessonsTotal = blocks.reduce((n, b) => n + b.lessons.length, 0);

  /**
   * Examenklaar: één getal uit de twee assen die dit scherm draagt.
   *
   * Zie `lib/lessons/readiness.ts` — het is ONS getal, geen slaagkans, en de kop zegt dat
   * erbij. Het staat hier omdat dit de pagina is waar de kandidaat beslist of hij nog een les
   * doet of het examen aandurft.
   */
  const r = readiness({
    lessonsDone,
    lessonsTotal,
    examsDone: p.examsDone,
    examCount: skill.examCount,
    averagePct: p.averagePct,
  });

  /**
   * Sterk & zwak, per concept van dit onderdeel.
   *
   * Alleen concepten die in dít onderdeel voorkomen (`fetchConcepts` filtert op
   * `concept_onderdelen`), want "signaalwoorden" beheersen in Lezen zegt niets over Schrijven
   * — daar moet je ze maken. De zwakste eerst, dan wat nog geen data heeft; `DocentPanel`
   * beslist zelf hoeveel rijen het paneel draagt.
   */
  const concepts = user ? await fetchConcepts(level, skill.slug) : [];
  const mastery = await fetchMastery(user?.id ?? null, concepts.map(c => c.id));
  const teachers = await fetchTeachersForCourse(level, skill.slug, concepts.map(c => c.id));
  const swRows: SwRow[] = concepts
    .map(c => ({
      concept: c,
      mastery: mastery.get(c.id) ?? null,
      lessonHref: teachers.has(c.id) ? lessonPath(level, skill.slug, teachers.get(c.id)!.slug) : null,
    }))
    .sort((a, b) => (a.mastery?.mastery_pct ?? 101) - (b.mastery?.mastery_pct ?? 101));

  /**
   * De leerroute: woordenschat → grammatica → examentraining.
   *
   * De drie stappen zijn `ConceptKind`, niet een indeling die hier wordt verzonnen — zie
   * `lib/lessons/leerroute.ts`. De oefenhelft van de derde stap is de `practice`-helft van
   * `readiness()`, zodat er één formule voor "hoe goed sta je op de tien examens" bestaat.
   */
  const wordCounts = await fetchWordCounts(level, skill.slug, user?.id ?? null);
  /* De lessentelling komt uit de sporen en niet uit de `teaches`-relatie, zodat de kaart
     hetzelfde getal noemt als het spoorscherm waar hij naartoe wijst. */
  const sporen = await sporenFromBlocks(blocks, level, skill.slug, user?.id ?? null);
  const leerroute = buildLeerroute({
    concepts, mastery, teachers, blocks, examPractice: r.practice, wordCounts,
    spoorLessons: {
      grammatica: sporen.find(s => s.slug === 'taalregels'),
      strategie: sporen.find(s => s.slug === 'examentraining'),
    },
    /* De middelste stap heet in élke cursus Taalregels: zie `Spoor.name`. */
  });

  /**
   * De slaagkans-meter, dezelfde als op KNM.
   *
   * `calculateSlaagkans` weegt het gemiddelde tegen een prior van 50 en wordt pas na vijf
   * examens volledig zeker — één examen van 90% mag niet als "90% slaagkans" lezen. De scores
   * zijn de *beste* score per examen, want dat is wat de kandidaat aankan; een verprutste
   * eerste poging die hij daarna heeft rechtgezet hoort hem niet te blijven achtervolgen.
   */
  /**
   * De leerroute is drie kaarten, en er komt niets naast (besluit eigenaar, 10-09).
   *
   * Woorden → de taalregels die dit examen vraagt → het examen zelf. Er stonden hier eerst een
   * vierde kaart *Alle taalregels* en daarna een bibliotheek als eigen menu-item; beide zijn
   * vervallen. Alle regels van dít onderdeel staan nu ín stap 2, als eigen modules — zie
   * `fetchRuleModules`. Een verzameling om in te grasduinen is navigatie, geen stap in een
   * genummerde route, en naast een genummerde route wordt hij als stap gelezen.
   */

  const examScores = Object.values(p.exams)
    .map(e => e.bestPct)
    .filter((x): x is number => x != null);
  const kans = calculateSlaagkans(examScores);

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
      <div className="px-5 py-7 sm:px-8 sm:py-10">
        <div className="max-w-5xl mx-auto">

          {/* De kop is één regel. De navy paginakop is er op 02-09 af gehaald (besluit van
              de eigenaar): op dit scherm staat de diagnose bovenaan, en een kop met tegels
              die dezelfde cijfers nog eens noemt duwde die diagnose onder de fold. De
              zijbalk vertelt al waar je bent, dus de terugknop is hier ook weg. */}
          <PortalCrumbs
            trail={skillTrail({
              locale, level, skill: skill.slug, last: true,
              overviewLabel: t('crumb_overview'),
              skillName: slug => tSkills(`${slug}.name`),
            })}
          />

          {/* De kop is één balk over de volle breedte: links de naam, rechts de slaagkans en de
              drie concepten waar je nu het meeste laat liggen (mockup van de eigenaar, 08-09).
              Dat vervangt zowel de losse kop als de zijkolom van deze pagina — die zeiden dit,
              maar in twee blokken en met de diagnose onder de fold. */}
          <SkillStatBar
            locale={locale}
            level={level}
            skill={skill.slug}
            title={tSkills(`${skill.key}.name`)}
            tagline={tSkills(`${skill.key}.tagline`)}
            rows={swRows}
            slaagkans={kans.slaagkans}
            band={kans.band}
            examsCount={examScores.length}
            avgScore={kans.avgScore}
          />

          {isRubric && <p className="rubric-note mt-4">{t('rubric_note')}</p>}

            {/* De leerroute. De volgorde is dragend: woorden, dan regels, dan het examen zelf.
                Elke stap krijgt één getal van 0–100 uit lessen én oefenvragen samen — zie
                `lib/lessons/leerroute.ts`. Een stap waar de docent nog geen concept van heeft
                vrijgegeven rendert als lege kaart met een streepje, niet als 0%. */}
            <section className="mb-7">
              <h2 className="mini-head">{t('leerroute_head')}</h2>
              {/* Dezelfde kaart als de modules en de onderdelen, drie op een rij. Het merkteken
                  is de leerroute-mark op het navy paneel, en de voet draagt de feiten van de
                  stap in plaats van een examenstelling — die heeft een leerspoor niet. */}
              <div className={'ov-cards is-three'}>
                {leerroute.map((m, i) => (
                  <TrackCard
                    key={m.kind}
                    layer="onderdeel"
                    mark={<CategoryMark category={LEER_MARK[m.kind]} size={56} tone="dark" />}
                    sub={t('leerroute_step', { n: i + 1, total: leerroute.length })}
                    title={m.title ?? t(`leerroute_${m.kind}_title`)}
                    state={m.score === null ? 'open' : 'active'}
                    note={m.hasContent ? null : t('leerroute_empty')}
                    pct={m.score}
                    progressLabel={null}
                    meta={[
                      /* De woordkaarten zijn het enige harde getal dat Woordenschat heeft zolang
                         de docent er geen concept van heeft vrijgegeven, dus die staat vooraan. */
                      ...(m.words
                        ? [{
                            icon: 'parts' as const,
                            label: `${t('leerroute_fact_words')} ${t('leerroute_fact_of', { done: m.words.known, total: m.words.total })}`,
                          }]
                        : []),
                      /* De lessen zodra er lessen zijn, de concepten zodra er concepten zijn —
                         twee aparte vragen, en ze samen op `conceptCount` hangen liet de
                         Uitspraak-kaart van Spreken zonder lessentelling staan terwijl er zes
                         lessen onder zaten. Blok B leunt daar op strategieconcepten, en die
                         tellen mee in stap 3. Zelfde fout als `hasContent` had. */
                      ...(m.lessonsTotal > 0
                        ? [{
                            icon: 'parts' as const,
                            label: `${t('leerroute_fact_lessons')} ${t('leerroute_fact_of', { done: m.lessonsDone, total: m.lessonsTotal })}`,
                          }]
                        : []),
                      /* Géén conceptentelling op de regelstap. `conceptCount` telt de regels
                         van dit onderdeel (20 bij Luisteren), de stap telt lessen (23: vijf
                         eigen plus achttien regellessen). Twee getallen naast elkaar over
                         bijna-hetzelfde lezen als een fout, niet als twee feiten — en drie
                         regels hebben nog geen les, dus ze zullen ook nooit gelijk zijn. */
                      ...(m.conceptCount > 0 && m.kind !== 'grammatica'
                        ? [{
                            icon: 'exams' as const,
                            label: `${t('leerroute_fact_concepts')} ${t('leerroute_fact_of', { done: m.conceptsStrong, total: m.conceptCount })}`,
                          }]
                        : []),
                    ]}
                    /* Elke stap wijst naar zijn eigen overzicht, niet naar één les diep erin:
                       daar staat wat er is en waar je verdergaat. */
                    cta={m.kind === 'woordenschat' ? t('leerroute_cta_words') : t('leerroute_cta_modules')}
                    href={
                      !m.hasContent
                        ? null
                        : m.kind === 'woordenschat'
                          ? `/${locale}${wordsPath(level, skill.slug)}`
                          : `/${locale}${spoorPath(level, skill.slug, SPOOR_OF_KIND[m.kind])}`
                    }
                    soonLabel={t('tag_soon')}
                  />
                ))}
              </div>
            </section>

            {criterionSeries.length > 0 && <CriterionProgress series={criterionSeries} className="mb-6" />}

            <ExamStrip
              locale={locale}
              level={level}
              skill={skill}
              progress={p}
              published={pub}
              isGuest={isGuest}
              owns={ownsThisSkill}
            />

        </div>
      </div>

    </AppShell>
  );
}
