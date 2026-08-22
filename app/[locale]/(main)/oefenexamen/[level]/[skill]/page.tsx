import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { SectionHeader, SkillIcon } from '@/components/site';
import { DotField, HorizonBand, HorizonHero, ValidationChip } from '@/components/horizon';
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
    /*
     * B1 stays out of the index — but the reason changed on 2026-08-21 and is worth stating,
     * because the old one ("B1 has no content yet") is no longer true.
     *
     * B1 Lezen, Schrijven and Spreken now have ten published oefenexamens each. That content is
     * machine-authored and awaiting the docent's review in /admin — the same model the A2
     * dataset shipped under. Asking Google to index it before she has been through it would put
     * unreviewed material in front of search traffic and stake the "echt door een docent
     * gevalideerd" claim on it. So this is now a *review* gate, not an emptiness gate.
     *
     * B1 Luisteren has no content at all (no DUO reference material — see `data/skills.ts`),
     * so it is doubly excluded.
     *
     * When the docent signs B1 off, this becomes the place to change, together with
     * `app/sitemap.ts` (which lists `DEFAULT_LEVEL` only) and the `Course` node below.
     */
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
  // Reuses the homepage's own wording for the validation claim rather than adding a fourth
  // translation of the same sentence — three copies of a claim is three places it can drift.
  const tHome = await getTranslations({ locale, namespace: 'home' });

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
   * Emitted for A2 only. `generateMetadata` returns `robots: { index: false }` for B1 while its
   * content waits on the docent's review, and shipping rich data for a page we ask Google to
   * ignore says the opposite of the meta tag on the same page.
   *
   * `omitEmpty` matters here: B1 Luisteren's `itemCount` and `durationMinutes` are still `null`
   * (no DUO reference material — see `data/skills.ts`), and in JSON-LD an absent property means
   * "not stated" while `0` is a claim. Lezen, Schrijven and Spreken were filled in on
   * 2026-08-21, so this now guards one onderdeel rather than a whole level — which is exactly
   * when a guard like this is easiest to drop by accident.
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
      {/* The exam-set header. `HorizonHero` in children mode rather than the structured form,
          because this one carries its own stats list under the lede. */}
      <HorizonHero houses={14} skylineHeight={84} containerClass="max-w-5xl pt-16 pb-16">
        <div>
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
      </HorizonHero>

      {/* ── EXAM GRID ── */}
      <section className="py-16 px-6 bg-surface">
        <div className="max-w-5xl mx-auto">
          {/* §7.4: the validation chip sits on every exam-set header. This is the page where the
              claim is load-bearing — it is what the visitor is being asked to trust before paying. */}
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
              const free = isFreeExam(level, number);
              const available = Boolean(exam);

              return (
                <li key={number}>
                  {available ? (
                    <a
                      href={`/${locale}/oefenexamen/${level}/${skill.slug}/${number}`}
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
                      {/* The band marks the one slot that is open to everyone. Three
                          not-openable reasons have to stay visually distinct (unpublished /
                          paid-only / free-and-open), so the distinction is carried by the band and
                          the chip together, never by one signal doing both jobs. */}
                      {free && <HorizonBand height={3} className="absolute left-0 right-0 bottom-0" />}
                    </a>
                  ) : (
                    /* §7.2b: never grey a not-yet-shipped surface out with `opacity` — it makes
                       the text fail contrast and reads as broken rather than as forthcoming. The
                       whole tile drops to the neutral ramp instead, and the dot field says
                       "nothing here yet" the way it does in every other empty state. */
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

          {/* Into the TOFU section. The overviews are the site's strongest pages; the kennisgidsen
              need the link far more than these pages need the outbound one. */}
          <p className="mt-8 text-sm">
            <Link href="/inburgering" className="font-semibold" style={{ color: '#a24000' }}>
              {t('guide_link')} →
            </Link>
          </p>
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
