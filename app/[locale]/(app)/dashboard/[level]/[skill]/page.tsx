import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { ownsModule } from '@/lib/entitlements';
import { emptyLevelledProgress, fetchPortalProgress, fetchPublishedExamNumbers } from '@/lib/portal-progress';
import { getSkillAtLevel, isLevel } from '@/data/skills';
import { fetchSkillWeakness } from '@/lib/vaardigheden-server';
import { fetchCourse } from '@/lib/lessons/lessons-server';
import { fetchConcepts, fetchMastery, fetchTeachersForCourse } from '@/lib/lessons/concepts-server';
import { readiness } from '@/lib/lessons/readiness';
import { buildLeerroute } from '@/lib/lessons/leerroute';
import { fetchWordCounts } from '@/lib/lessons/words-server';
import { wordsPath } from '@/lib/lessons/words';
import { calculateSlaagkans } from '@/lib/exam-readiness';
import { LESSONS_COMING_SOON } from '@/lib/features';
import SkillStatBar from '../../_components/SkillStatBar';
import TrackCard from '../../_components/TrackCard';
import { blockProgress, lessonPath, masteryPct, type ConceptKind } from '@/lib/lessons/lessons';
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

  /**
   * "Je vaardigheden": dezelfde kaart voor alle vier de onderdelen.
   *
   * Schrijven en Spreken lezen hun rubriekcriteria, Lezen en Luisteren de concepten achter hun
   * foute antwoorden — zie `lib/vaardigheden-server.ts`. Dit gaf eerst alleen bij de twee
   * rubriekonderdelen iets terug; nu bij alle vier, zodra de items van een examen getagd zijn.
   *
   * `null` tot er iets te zeggen valt, zodat er geen lege-staatblok staat op een pagina die de
   * kandidaat net heeft geopend.
   */
  const weakness = await fetchSkillWeakness(user?.id ?? null, level, skill.slug);

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
   * De concepten van dit onderdeel, met hun beheersing en hun les.
   *
   * Dit voedde ook de top-3 in de kopkaart; sinds 14-09 toont die de vaardigheden uit
   * `fetchSkillWeakness` en is dit alleen nog de invoer van de leerroute. Alleen concepten die in
   * dít onderdeel voorkomen (`fetchConcepts` filtert op `concept_onderdelen`), want
   * "signaalwoorden" beheersen in Lezen zegt niets over Schrijven — daar moet je ze maken.
   */
  const concepts = user ? await fetchConcepts(level, skill.slug) : [];
  const mastery = await fetchMastery(user?.id ?? null, concepts.map(c => c.id));
  const teachers = await fetchTeachersForCourse(level, skill.slug, concepts.map(c => c.id));

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
            category={skill.slug as Category}
            title={tSkills(`${skill.key}.name`)}
            tagline={tSkills(`${skill.key}.tagline`)}
            weakness={weakness}
            slaagkans={kans.slaagkans}
            band={kans.band}
            examsCount={examScores.length}
            avgScore={kans.avgScore}
          />

          {/* De rubrieknotitie stond hier onder de kopkaart en is er op 15-09 af gehaald
              (eigenaar). Hij zei in vier regels wat de uitsplitsing ernaast met criteria toont,
              en hij stond op élk bezoek, ook bij een kandidaat die zijn tiende opdracht inlevert.
              Hij blijft wel op `oefenexamens/page.tsx`: dáár kies je een examen zonder de
              criteria in beeld, en dan is "dit wordt met de hand nagekeken" nieuwe informatie. */}

            {/* De examens staan boven de leerroute (eigenaar, 15-09): de kandidaat komt voor
                het volgende oefenexamen, en de drie leerkaarten duwden die strook onder de fold
                op een laptop. De leerroute blijft eronder als het antwoord op "en hoe word ik
                daar beter in". */}
            <ExamStrip
              locale={locale}
              level={level}
              skill={skill}
              progress={p}
              published={pub}
              isGuest={isGuest}
              owns={ownsThisSkill}
            />

            {/* De leerroute. De volgorde is dragend: woorden, dan regels, dan het examen zelf.
                Elke stap krijgt één getal van 0–100 uit lessen én oefenvragen samen — zie
                `lib/lessons/leerroute.ts`. Een stap waar de docent nog geen concept van heeft
                vrijgegeven rendert als lege kaart met een streepje, niet als 0%. */}
            {/* Het witte paneel van de examenstrook eromheen (eigenaar, 15-09): twee blokken
                die op dezelfde pagina dezelfde rol spelen — een kop met kaarten eronder — horen
                dezelfde doos te hebben. De kop staat daarom ín het paneel. */}
            <section className="panel mb-7">
              {/* Dezelfde kop als de examenstrook: de naam in de kopletter met de toelichting
                  ernaast, niet het kapitaalkopje. Twee panelen naast elkaar met twee soorten
                  koppen lezen als twee soorten blokken (eigenaar, 15-09). */}
              <div className="lr-head">
                <h2>{t('leerroute_title')}</h2>
                <p>{t('leerroute_sub')}</p>
              </div>
              {/* Dezelfde kaart als de modules en de onderdelen, drie op een rij. Het merkteken
                  is de leerroute-mark op het navy paneel, en de voet draagt de feiten van de
                  stap in plaats van een examenstelling — die heeft een leerspoor niet. */}
              <div className={'ov-cards is-three'}>
                {leerroute.map(m => {
                  /* De lesstappen staan op "Binnenkort" zolang `LESSONS_COMING_SOON` aanstaat —
                     zie lib/features.ts. De woordenstap valt erbuiten: die is wél klaar. */
                  const soon = LESSONS_COMING_SOON && m.kind !== 'woordenschat';
                  return (
                  <TrackCard
                    key={m.kind}
                    layer="onderdeel"
                    mark={<CategoryMark category={LEER_MARK[m.kind]} size={56} tone="dark" />}
                    /* Geen "STAP 1": de kop erboven zegt al dat dit een volgorde is, en de
                       kaarten stáán in die volgorde (eigenaar, 15-09). */
                    sub={null}
                    title={m.title ?? t(`leerroute_${m.kind}_title`)}
                    state={soon ? 'soon' : m.score === null ? 'open' : 'active'}
                    note={soon ? t('leerroute_soon') : m.hasContent ? null : t('leerroute_empty')}
                    pct={soon ? null : m.score}
                    progressLabel={null}
                    /* Geen feitenregel meer op de kaart (eigenaar, 15-09). "Woorden gekend
                       59 / 126" en "Lessen afgerond 2 / 20" zeggen in cijfers wat de balk
                       eronder als breedte al zegt, en ze staan wél op het scherm waar je
                       naartoe gaat. De voet draagt nu alleen de knop. */
                    meta={[]}
                    /* Elke stap wijst naar zijn eigen overzicht, niet naar één les diep erin:
                       daar staat wat er is en waar je verdergaat. */
                    cta={soon ? null : m.kind === 'woordenschat' ? t('leerroute_cta_words') : t('leerroute_cta_modules')}
                    href={
                      soon || !m.hasContent
                        ? null
                        : m.kind === 'woordenschat'
                          ? `/${locale}${wordsPath(level, skill.slug)}`
                          : `/${locale}${spoorPath(level, skill.slug, SPOOR_OF_KIND[m.kind])}`
                    }
                    soonLabel={t('tag_soon')}
                  />
                  );
                })}
              </div>
            </section>




        </div>
      </div>

    </AppShell>
  );
}
