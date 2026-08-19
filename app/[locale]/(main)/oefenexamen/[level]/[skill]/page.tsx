import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { SectionHeader, SkillIcon } from '@/components/site';
import {
  LEVELS,
  SKILLS,
  formatCount,
  getFormat,
  getSkillAtLevel,
  isFreeExam,
  isLevel,
  levelLabel,
} from '@/data/skills';
import { fetchExamsForSkill } from '@/lib/exams';
import JsonLd from '@/components/JsonLd';
import { langTag, TEACHER_ID } from '@/lib/site';
import { absUrl, breadcrumbs, courseId, omitEmpty, PROVIDER_REF } from '@/lib/schema';

type Props = { params: Promise<{ locale: string; level: string; skill: string }> };

const BASE = 'https://inburgeringoefenen.nl';

export async function generateStaticParams() {
  return routing.locales.flatMap(locale =>
    LEVELS.flatMap(level => SKILLS.map(skill => ({ locale, level, skill: skill.slug })))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, level: rawLevel, skill: slug } = await params;
  if (!isLevel(rawLevel)) return {};
  const level = rawLevel;
  const skill = getSkillAtLevel(level, slug);
  if (!skill) return {};

  const t = await getTranslations({ locale, namespace: 'oefenexamen' });
  const tSkills = await getTranslations({ locale, namespace: 'skills' });
  const name = tSkills(`${skill.key}.name`);
  const vars = { skill: name, skill_lower: name.toLowerCase(), level: levelLabel(level) };
  const path = `oefenexamen/${level}/${skill.slug}`;

  return {
    title: t('meta_title', vars),
    description: t('meta_description', vars),
    // B1 has no content yet. Letting Google index forty empty "Binnenkort" grids would
    // spend crawl budget on pages that answer nothing and invite a thin-content read of
    // the whole section; they go back in the index when the docent publishes.
    robots: { index: level === 'a2', follow: true },
    alternates: {
      canonical: `${BASE}/${locale}/${path}`,
      languages: {
        nl: `${BASE}/nl/${path}`,
        en: `${BASE}/en/${path}`,
        ar: `${BASE}/ar/${path}`,
        'x-default': `${BASE}/nl/${path}`,
      },
    },
    openGraph: {
      title: t('meta_title', vars),
      description: t('meta_description', vars),
      type: 'website',
      url: `${BASE}/${locale}/${path}`,
      siteName: 'Inburgering Oefenen',
    },
  };
}

export default async function SkillOverviewPage({ params }: Props) {
  const { locale, level: rawLevel, skill: slug } = await params;
  if (!isLevel(rawLevel)) notFound();
  const level = rawLevel;
  const skill = getSkillAtLevel(level, slug);
  if (!skill) notFound();

  const t = await getTranslations({ locale, namespace: 'oefenexamen' });
  const tSkills = await getTranslations({ locale, namespace: 'skills' });

  const name = tSkills(`${skill.key}.name`);
  const vars = { skill: name, skill_lower: name.toLowerCase(), level: levelLabel(level) };

  const tB = await getTranslations({ locale, namespace: 'breadcrumbs' });

  const exams = await fetchExamsForSkill(level, skill.slug);
  const publishedByNumber = new Map(exams.map(e => [e.number, e]));
  const slots = Array.from({ length: skill.examCount }, (_, i) => i + 1);
  const anyPublished = exams.length > 0;

  /* ── Structured data ──────────────────────────────────────────────────────
   * **This page owns the `Course` node for its onderdeel.** The homepage also describes these
   * four courses; it now references `courseId(...)` instead of restating them, because two
   * full `Course` nodes for one `url` with different descriptions is a contradiction that no
   * validator reports and a search engine settles by picking one.
   *
   * Emitted for A2 only. `generateMetadata` returns `robots: { index: false }` for B1 — forty
   * empty "Binnenkort" slots — and shipping rich data for a page we ask Google to ignore says
   * the opposite of the meta tag on the same page.
   *
   * `omitEmpty` matters here: B1's `itemCount` and `durationMinutes` are `null` (unverified,
   * see `data/skills.ts`), and in JSON-LD an absent property means "not stated" while `0` is a
   * claim. Applied even though only A2 renders today, so filling B1 in cannot silently publish
   * a zero.
   */
  const path = `oefenexamen/${level}/${skill.slug}`;
  const url = absUrl(locale, path);
  const jsonLd = level !== 'a2' ? null : {
    '@context': 'https://schema.org',
    '@graph': [
      omitEmpty({
        '@type': 'Course',
        '@id': courseId(locale, level, skill.slug),
        url,
        name: t('meta_title', vars),
        description: t('meta_description', vars),
        provider: PROVIDER_REF,
        instructor: { '@id': TEACHER_ID },
        inLanguage: langTag(locale),
        teaches: 'Nederlands als tweede taal',
        educationalLevel: levelLabel(level),
        timeRequired: skill.durationMinutes ? `PT${skill.durationMinutes}M` : null,
        hasCourseInstance: {
          '@type': 'CourseInstance',
          courseMode: 'online',
          courseWorkload: skill.durationMinutes ? `PT${skill.durationMinutes}M` : undefined,
        },
        // Exam 1 of every A2 onderdeel is free with an account; 2–10 need the module. So the
        // course as a whole is neither free nor paid, and `hasPart` is where that is stated
        // honestly rather than by picking one flag for all ten.
        hasPart: {
          '@type': 'ItemList',
          numberOfItems: skill.examCount,
          itemListElement: slots.map(n => ({
            '@type': 'ListItem',
            position: n,
            name: t('exam_label', { number: n }),
          })),
        },
      }),
      breadcrumbs(locale, tB('home'), [
        { name: tB('oefenexamen'), path: 'oefenen' },
        { name, path },
      ]),
    ],
  };

  return (
    <>
      {jsonLd && <JsonLd data={jsonLd} />}
      {/* ── HEADER ── */}
      <section className="px-6 pt-16 pb-12" style={{ background: 'var(--gradient-brand)' }}>
        <div className="max-w-5xl mx-auto">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-white/85 mb-5" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <SkillIcon skill={skill.slug} size="sm" variant="bare" onDark />
            {tSkills('exams_count', { count: skill.examCount })}
          </span>
          <h1 className="font-headline font-extrabold text-white tracking-tight mb-4" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.03em' }}>
            {t('heading', vars)}
          </h1>
          <p className="text-lg leading-relaxed max-w-2xl" style={{ color: 'rgba(255,255,255,0.85)' }}>
            {tSkills(`${skill.key}.tagline`)}
          </p>

          {/* Dropped entirely where DUO's format for this level is unverified. Two em dashes
              under "VRAGEN" and "MINUTEN" is honest but reads as a broken template, and the
              stats return by themselves once exam_formats has real numbers. */}
          {(skill.itemCount !== null || skill.durationMinutes !== null) && (
            <dl className="flex flex-wrap gap-8 mt-8">
              {skill.itemCount !== null && (
                <div className="border-l-2 pl-4" style={{ borderColor: 'rgba(255,255,255,0.40)' }}>
                  <dd className="text-white font-extrabold text-xl font-headline tracking-tight">{skill.itemCount}</dd>
                  <dt className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
                    {tSkills('items_label')}
                  </dt>
                </div>
              )}
              {skill.durationMinutes !== null && (
                <div className="border-l-2 pl-4" style={{ borderColor: 'rgba(255,255,255,0.40)' }}>
                  <dd className="text-white font-extrabold text-xl font-headline tracking-tight">{skill.durationMinutes}</dd>
                  <dt className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
                    {tSkills('duration_label')}
                  </dt>
                </div>
              )}
            </dl>
          )}
        </div>
      </section>

      {/* ── EXAM GRID ── */}
      <section className="py-16 px-6 bg-surface">
        <div className="max-w-5xl mx-auto">
          {!anyPublished && (
            <div className="rounded-2xl p-7 mb-8 bg-surface-container-lowest" style={{ boxShadow: 'var(--shadow-card-md)', borderLeft: '3px solid var(--color-secondary-container)' }}>
              <h2 className="font-headline font-bold text-on-surface text-base mb-1.5">{t('not_ready_title')}</h2>
              <p className="text-sm text-on-surface-variant leading-relaxed">{t('not_ready_body')}</p>
            </div>
          )}

          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0 m-0">
            {slots.map(number => {
              const exam = publishedByNumber.get(number);
              const free = isFreeExam(level, number);
              const available = Boolean(exam);

              return (
                <li key={number}>
                  {available ? (
                    <a
                      href={`/${locale}/oefenexamen/${level}/${skill.slug}/${number}`}
                      className={`exam-card${free ? '' : ' locked'} flex flex-col gap-3 p-6 rounded-2xl bg-surface-container-lowest no-underline`}
                      style={{ boxShadow: 'var(--shadow-card-md)' }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/70">
                          {t('exam_label', { number })}
                        </span>
                        <span
                          className="text-[0.68rem] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                          style={free
                            ? { background: '#f0fdf4', color: '#15803d' }
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
                    </a>
                  ) : (
                    <div
                      className="flex flex-col gap-3 p-6 rounded-2xl bg-surface-container-low opacity-60"
                      style={{ boxShadow: 'var(--shadow-card)' }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">
                          {t('exam_label', { number })}
                        </span>
                      </div>
                      <p className="font-headline font-bold text-on-surface-variant text-base leading-snug">
                        {tSkills('coming_soon')}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Upsell */}
          <div
            className="flex items-center justify-between flex-wrap gap-6 p-8 rounded-2xl mt-10"
            style={{ background: '#002b6d' }}
          >
            <div>
              <p className="font-headline font-bold text-lg text-white mb-1">{t('unlock_all_title')}</p>
              <p className="text-sm leading-relaxed max-w-xl" style={{ color: 'rgba(255,255,255,0.70)' }}>
                {t('unlock_all_body')}
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

      {/* ── CROSS-LINKS ── */}
      <section className="py-16 px-6 bg-surface-container-low">
        <div className="max-w-5xl mx-auto">
          <SectionHeader eyebrow="" title={t('other_skills')} subtitle="" mb="mb-8" />
          <div className="grid sm:grid-cols-3 gap-4">
            {SKILLS.filter(s => s.slug !== skill.slug).map(other => (
              <a
                key={other.slug}
                href={`/${locale}/oefenexamen/${level}/${other.slug}`}
                className="exam-card flex items-center gap-4 p-5 rounded-2xl bg-surface-container-lowest no-underline"
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                <SkillIcon skill={other.slug} size="md" />
                <div>
                  <p className="font-headline font-semibold text-on-surface text-sm">{tSkills(`${other.key}.name`)}</p>
                  <p className="text-xs text-on-surface-variant">{tSkills('exams_count', { count: getFormat(level, other.slug).examCount })}</p>
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
