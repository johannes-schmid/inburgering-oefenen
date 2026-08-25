import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { SectionHeader, SkillIcon } from '@/components/site';
import { DotField, HorizonBand, HorizonHero, ValidationChip } from '@/components/horizon';
import CategoryMark from '@/components/horizon/CategoryMark';
import { KNM, KNM_THEMES, SKILLS, DEFAULT_LEVEL, getFormat, isFreeKnmExam } from '@/data/skills';
import { fetchExamsForSkill } from '@/lib/exams';
import JsonLd from '@/components/JsonLd';
import { langTag, TEACHER_ID } from '@/lib/site';
import { absUrl, breadcrumbs, omitEmpty, PROVIDER_REF } from '@/lib/schema';

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

const BASE = 'https://inburgeringoefenen.nl';
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
    alternates: {
      canonical: `${BASE}/${locale}/${PATH}`,
      languages: {
        nl: `${BASE}/nl/${PATH}`,
        en: `${BASE}/en/${PATH}`,
        ar: `${BASE}/ar/${PATH}`,
        'x-default': `${BASE}/nl/${PATH}`,
      },
    },
    openGraph: {
      title: t('knm_meta_title'),
      description: t('knm_meta_description'),
      type: 'website',
      url: `${BASE}/${locale}/${PATH}`,
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
        instructor: { '@id': TEACHER_ID },
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

  return (
    <>
      <JsonLd data={jsonLd} />

      <HorizonHero houses={14} skylineHeight={84} containerClass="max-w-5xl pt-16 pb-16">
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-white/85 mb-5" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <SkillIcon skill="knm" size="sm" variant="bare" onDark />
            {tSkills('exams_count', { count: KNM.examCount })}
          </span>
          <h1 className="font-headline font-extrabold text-white tracking-tight mb-4" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.03em' }}>
            {t('knm_heading')}
          </h1>
          <p className="text-lg leading-relaxed max-w-2xl" style={{ color: 'rgba(255,255,255,0.85)' }}>
            {tSkills('knm.tagline')}
          </p>
          {/* Stated up front, because it is the question a candidate arriving from an A2 or B1
              page actually has. Everywhere else on this site an exam belongs to a level. */}
          <p className="text-sm leading-relaxed max-w-2xl mt-3" style={{ color: 'rgba(255,255,255,0.65)' }}>
            {t('knm_no_level')}
          </p>

          <dl className="flex flex-wrap gap-8 mt-8">
            <div className="border-l-2 pl-4" style={{ borderColor: 'rgba(255,255,255,0.40)' }}>
              <dd className="text-white font-extrabold text-xl font-headline tracking-tight">{KNM.itemCount}</dd>
              <dt className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
                {tSkills('items_label')}
              </dt>
            </div>
            <div className="border-l-2 pl-4" style={{ borderColor: 'rgba(255,255,255,0.40)' }}>
              <dd className="text-white font-extrabold text-xl font-headline tracking-tight">{KNM.durationMinutes}</dd>
              <dt className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
                {tSkills('duration_label')}
              </dt>
            </div>
          </dl>
        </div>
      </HorizonHero>

      {/* ── EXAM GRID ── */}
      <section className="py-16 px-6 bg-surface">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <ValidationChip>{tHome('hero_badge')}</ValidationChip>
          </div>

          {!anyPublished && (
            <div className="rounded-2xl p-7 mb-8 bg-surface-container-lowest" style={{ boxShadow: 'var(--shadow-card-md)', borderLeft: '3px solid var(--color-secondary-container)' }}>
              <h2 className="font-headline font-bold text-on-surface text-base mb-1.5">{t('not_ready_title')}</h2>
              <p className="text-sm text-on-surface-variant leading-relaxed">{t('not_ready_body')}</p>
            </div>
          )}

          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0 m-0">
            {slots.map(number => {
              const exam = publishedByNumber.get(number);
              const free = isFreeKnmExam(number);
              const available = Boolean(exam);

              return (
                <li key={number}>
                  {available ? (
                    <a
                      href={`/${locale}/oefenexamen/knm/${number}`}
                      className={`exam-card${free ? '' : ' locked'} relative flex flex-col gap-3 p-6 pb-7 rounded-2xl bg-surface-container-lowest overflow-hidden no-underline`}
                      style={{ boxShadow: 'var(--shadow-ambient)' }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/70">
                          {t('exam_label', { number })}
                        </span>
                        <span
                          className="text-[0.68rem] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                          style={free
                            ? { background: 'rgba(254,118,44,0.16)', color: 'var(--color-secondary)' }
                            : { background: 'var(--color-surface-container)', color: 'var(--color-on-surface-variant)' }}
                        >
                          {free ? t('free') : t('locked')}
                        </span>
                      </div>
                      <p className="font-headline font-bold text-on-surface text-base leading-snug">
                        {exam?.title || `${name} ${number}`}
                      </p>
                      <span className="text-sm font-semibold mt-auto" style={{ color: '#a24000' }}>
                        {free ? `${t('start')} →` : `${t('unlock')} →`}
                      </span>
                      {free && <HorizonBand height={3} className="absolute left-0 right-0 bottom-0" />}
                    </a>
                  ) : (
                    <div className="relative flex flex-col gap-3 p-6 rounded-2xl bg-surface-container-low overflow-hidden">
                      <DotField on="dark" size={14} />
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">
                          {t('exam_label', { number })}
                        </span>
                      </div>
                      <p className="relative font-headline font-bold text-on-surface-variant text-base leading-snug">
                        {tSkills('coming_soon')}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <div
            className="flex items-center justify-between flex-wrap gap-6 p-8 rounded-2xl mt-10"
            style={{ background: '#002b6d' }}
          >
            <div>
              {/* KNM's own strings, not the shared `unlock_all_*`. Those say "alle 40
                  oefenexamens", which is a *level's* catalogue and does not include KNM, and
                  they still name the retired "Professioneel Pakket". */}
              <p className="font-headline font-bold text-lg text-white mb-1">{t('knm_unlock_title')}</p>
              <p className="text-sm leading-relaxed max-w-xl" style={{ color: 'rgba(255,255,255,0.70)' }}>
                {t('knm_unlock_body')}
              </p>
            </div>
            <a
              href={`/${locale}/premium`}
              className="inline-flex items-center gap-2 px-6 py-3 font-bold rounded-xl text-sm no-underline flex-shrink-0"
              style={{ background: '#fe762c', color: '#5f2200', boxShadow: 'var(--shadow-btn-orange)' }}
            >
              {t('unlock_all_cta')}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </a>
          </div>
        </div>
      </section>

      {/* ── THE SEVEN THEMES ── */}
      {/* The exam's own table of contents, and the internal-link surface the kennisgidsen and
          the lesson modules need. A KNM exam draws from all seven, so naming them is the most
          useful thing this page can say after the ten slots themselves. */}
      <section className="py-16 px-6 bg-surface-container-low">
        <div className="max-w-5xl mx-auto">
          <SectionHeader eyebrow="" title={t('knm_themes_title')} subtitle="" mb="mb-8" />
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 list-none p-0 m-0">
            {KNM_THEMES.map(theme => (
              <li key={theme.id}>
                <Link
                  href={{ pathname: '/knm/[thema]', params: { thema: theme.guideSlug } }}
                  className="exam-card flex items-center gap-3 p-4 rounded-2xl bg-surface-container-lowest no-underline"
                  style={{ boxShadow: 'var(--shadow-card)' }}
                >
                  <CategoryMark category="knm" size={32} />
                  <span className="font-headline font-semibold text-on-surface text-sm">{theme.title}</span>
                </Link>
              </li>
            ))}
          </ul>

          <SectionHeader eyebrow="" title={t('other_skills')} subtitle="" mb="mb-8" className="mt-14" />
          <div className="grid sm:grid-cols-4 gap-4">
            {SKILLS.map(other => (
              <a
                key={other.slug}
                href={`/${locale}/oefenexamen/${DEFAULT_LEVEL}/${other.slug}`}
                className="exam-card flex items-center gap-4 p-5 rounded-2xl bg-surface-container-lowest no-underline"
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                <SkillIcon skill={other.slug} size="md" />
                <div>
                  <p className="font-headline font-semibold text-on-surface text-sm">{tSkills(`${other.key}.name`)}</p>
                  <p className="text-xs text-on-surface-variant">{tSkills('exams_count', { count: getFormat(DEFAULT_LEVEL, other.slug).examCount })}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        .exam-card {
          transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s ease;
        }
        .exam-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 28px rgba(0,43,109,0.12) !important;
        }
        .exam-card:active { transform: translateY(-1px); }
        @media (prefers-reduced-motion: reduce) { .exam-card { transition: none; } }
      `}</style>
    </>
  );
}
