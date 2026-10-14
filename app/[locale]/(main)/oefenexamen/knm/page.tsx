import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, Clock } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import ExamSlotCard from '@/components/glas/ExamSlotCard';
import SectionHeading from '@/components/glas/SectionHeading';
import ExamMark from '@/components/horizon/ExamMark';
import CategoryMark from '@/components/horizon/CategoryMark';
import { OxCrumbs, OxHeader, OxLink, OxUnlockBand } from '../_glas/parts';
import { KNM, KNM_THEMES, SKILLS, DEFAULT_LEVEL, getFormat, isFreeKnmExam } from '@/data/skills';
import { fetchExamsForSkill } from '@/lib/exams';
import JsonLd from '@/components/JsonLd';
import { langTag } from '@/lib/site';
import {PROVIDER_REF, TEACHER_REF, absUrl, alternatesFor, breadcrumbs, omitEmpty, ogImageFor } from '@/lib/schema';
import { localeHref } from '@/i18n/paths';

/**
 * The public overview for KNM's ten oefenexamens — the funnel and SEO surface, the same job
 * `oefenexamen/[level]/[skill]` does for the four taalonderdelen.
 *
 * **It is a static sibling of `[level]`, and that is what makes the URL work.** KNM carries no
 * CEFR level (`exams.level IS NULL`), so `/oefenexamen/knm/3` has to mean exam 3 of KNM and
 * not skill "3" of level "knm". A static segment shadows its dynamic sibling in the App
 * Router, so this directory wins and `[level]` never sees the request — the same mechanism
 * that reserves `/knm/woordenlijst` against `/knm/[thema]`.
 *
 * It is deliberately a separate file rather than a `level | 'knm'` union threaded through the
 * levelled page. That page interpolates the level into its copy, its canonical, its
 * breadcrumbs and its `Course` id in eight places; a nullable level there would be eight
 * conditionals in a file whose whole subject is "this onderdeel at this level".
 */

type Props = { params: Promise<{ locale: string }> };

const PATH = 'oefenexamen/knm';

export async function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'oefenexamen' });

  return {
    title: t('knm_meta_title'),
    description: t('knm_meta_description'),
    // Indexed on the same condition the levelled page uses: do we know what this exam looks
    // like? KNM's format is filled in (`exam_formats` for (NULL, 'knm')) and its ten exams are
    // published, so the honest answer is yes.
    robots: { index: KNM.itemCount !== null, follow: true },
    alternates: alternatesFor(locale, PATH),
    openGraph: {
      images: ogImageFor(locale),
      title: t('knm_meta_title'),
      description: t('knm_meta_description'),
      type: 'website',
      url: absUrl(locale, PATH),
      siteName: 'Inburgering Oefenen',
    },
  };
}

export default async function KnmOverviewPage({ params }: Props) {
  const { locale } = await params;

  const t = await getTranslations({ locale, namespace: 'oefenexamen' });
  const tSkills = await getTranslations({ locale, namespace: 'skills' });
  const tB = await getTranslations({ locale, namespace: 'breadcrumbs' });
  const tHome = await getTranslations({ locale, namespace: 'home' });

  const name = tSkills('knm.name');
  const exams = await fetchExamsForSkill(null, 'knm');
  const publishedByNumber = new Map(exams.map(e => [e.number, e]));
  const slots = Array.from({ length: KNM.examCount }, (_, i) => i + 1);
  const anyPublished = exams.length > 0;

  const url = absUrl(locale, PATH);
  /**
   * KNM's own `Course` node, owned by this page — the same one-`@id`-one-owning-page rule the
   * four onderdelen follow.
   *
   * **No `educationalLevel`.** For the taalonderdelen that property carries `A2` or `B1`; KNM
   * has neither, and in JSON-LD an absent property means "not stated" while a guessed `A2`
   * would be a false claim about which candidates the course serves.
   */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      omitEmpty({
        '@type': 'Course',
        '@id': `${url}#course`,
        url,
        name: t('knm_meta_title'),
        description: t('knm_meta_description'),
        provider: PROVIDER_REF,
        instructor: TEACHER_REF,
        inLanguage: langTag(locale),
        teaches: 'Kennis van de Nederlandse Maatschappij',
        timeRequired: `PT${KNM.durationMinutes}M`,
        hasCourseInstance: {
          '@type': 'CourseInstance',
          courseMode: 'online',
          courseWorkload: `PT${KNM.durationMinutes}M`,
        },
        hasPart: {
          '@type': 'ItemList',
          numberOfItems: KNM.examCount,
          itemListElement: slots.map(n => ({
            '@type': 'ListItem',
            position: n,
            name: t('exam_label', { number: n }),
          })),
        },
      }),
      breadcrumbs(locale, tB('home'), [
        { name: tB('oefenexamen'), path: 'oefenen' },
        { name, path: PATH },
      ]),
    ],
  };

  const examWord = t('exam_label', { number: '' }).trim();

  return (
    <>
      <JsonLd data={jsonLd} />

      {/* ── KOP ── KNM heeft geen niveau; dat staat vooraan, want het is de vraag die iemand van
          een A2- of B1-pagina meebrengt. */}
      <OxHeader
        crumbs={
          <OxCrumbs
            label={tB('home')}
            items={[
              { label: tB('home'), href: localeHref(locale, '') },
              { label: tB('oefenexamen'), href: localeHref(locale, 'oefenen') },
              { label: name },
            ]}
          />
        }
        marks={<ExamMark track="knm" size={72} />}
        title={t('knm_heading')}
        lead={tSkills('knm.tagline')}
        note={t('knm_no_level')}
        facts={{
          exams: tSkills('exams_count', { count: KNM.examCount }),
          items: KNM.itemCount,
          minutes: KNM.durationMinutes,
          itemsLabel: tSkills('items_label'),
          minutesLabel: tSkills('duration_label'),
        }}
        trust={tHome('hero_badge')}
      />

      {/* ── HET ROOSTER ── dezelfde drie publieke standen als bij de taalonderdelen:
          `nog` (niet gepubliceerd, geen link) · `gratis` (examen 1, met een account) · `pakket`. */}
      <section aria-labelledby="slots-heading" className="g-sec">
        <div className="g-wrap">
          <SectionHeading id="slots-heading" title={tSkills('exams_count', { count: KNM.examCount })} size="h2" className="mb-6" />

          {!anyPublished && (
            <div className="g-ox-empty mb-6">
              <Clock aria-hidden="true" />
              <div>
                <h2>{t('not_ready_title')}</h2>
                <p>{t('not_ready_body')}</p>
              </div>
            </div>
          )}

          <div className="g-slots">
            {slots.map(number => {
              const exam = publishedByNumber.get(number);
              const free = isFreeKnmExam(number);
              if (!exam) {
                return <ExamSlotCard key={number} number={number} state="nog" numberLabel={examWord} title={tSkills('coming_soon')} />;
              }
              return (
                <ExamSlotCard
                  key={number}
                  number={number}
                  state={free ? 'gratis' : 'pakket'}
                  numberLabel={examWord}
                  pillLabel={t('free')}
                  title={exam.title || `${name} ${number}`}
                  sub={free ? t('start') : t('locked')}
                  href={{ pathname: '/oefenexamen/knm/[number]', params: { number: String(number) } }}
                  ariaLabel={`${t('exam_label', { number })} · ${free ? t('free') : t('locked')}`}
                />
              );
            })}
          </div>

          <div className="mt-8">
            {/* KNM's eigen strings, niet de gedeelde `unlock_all_*`: die zeggen "alle 40
                oefenexamens", de catalogus van een níveau, en daar zit KNM niet in. */}
            <OxUnlockBand
              title={t('knm_unlock_title')}
              body={t('knm_unlock_body')}
              cta={t('unlock_all_cta')}
              href={localeHref(locale, `premium`)}
            />
          </div>
        </div>
      </section>

      {/* ── DE THEMA'S ── de inhoudsopgave van het examen en de weg naar de kennisgidsen. */}
      <section aria-labelledby="themes-heading" className="g-sec g-sec-tier">
        <div className="g-wrap">
          <SectionHeading id="themes-heading" title={t('knm_themes_title')} size="h2" className="mb-6" />
          <ul className="g-ox-links">
            {KNM_THEMES.map(theme => (
              <li key={theme.id}>
                <Link
                  href={{ pathname: '/knm/[thema]', params: { thema: theme.guideSlug } }}
                  className="g-ox-link"
                >
                  <CategoryMark category="knm" size={44} />
                  <span className="min-w-0 flex-1"><b>{theme.title}</b></span>
                  <ArrowRight aria-hidden="true" className="g-ox-link-go rtl-flip" />
                </Link>
              </li>
            ))}
          </ul>

          <SectionHeading title={t('other_skills')} size="h2" className="mt-14 mb-6" />
          <ul className="g-ox-links g-ox-links-4">
            {SKILLS.map(other => (
              <li key={other.slug}>
                <OxLink
                  href={localeHref(locale, `oefenexamen/${DEFAULT_LEVEL}/${other.slug}`)}
                  category={other.slug}
                  title={tSkills(`${other.key}.name`)}
                  sub={tSkills('exams_count', { count: getFormat(DEFAULT_LEVEL, other.slug).examCount })}
                />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
