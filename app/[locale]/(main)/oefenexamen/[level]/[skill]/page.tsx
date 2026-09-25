import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { localeHref } from '@/i18n/paths';
import { parseSkillParam, skillParam } from '@/i18n/skill-slugs';
import { Link } from '@/i18n/navigation';
import { SectionHeader } from '@/components/site';
import { CategoryMark, DotField, HorizonBand, HorizonHero, ValidationChip } from '@/components/horizon';
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
import {PROVIDER_REF, TEACHER_REF, absUrl, alternatesFor, breadcrumbs, courseId, omitEmpty, ogImageFor } from '@/lib/schema';

type Props = { params: Promise<{ locale: string; level: string; skill: string }> };

export async function generateStaticParams() {
  return routing.locales.flatMap(locale =>
    LEVELS.flatMap(level => SKILLS.map(skill => ({ locale, level, skill: skillParam(skill.slug, locale) })))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, level: rawLevel, skill: raw } = await params;
  if (!isLevel(rawLevel)) return {};
  const level = rawLevel;
  const skill = getSkillAtLevel(level, parseSkillParam(raw) ?? '');
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
     * The review gate is lifted: B1 is indexed (owner's confirmation, 2026-08-23 — the docent
     * has been through the thirty B1 oefenexamens). The three B1 gates came down together, and
     * they are the three places to change if a level is ever pulled back: this `robots`, the
     * `Course` node below, and the `LEVELS` loop in `app/sitemap.ts`.
     *
     * **What replaced it is not "index everything".** An onderdeel whose format at this level is
     * unverified — `itemCount === null`, which is B1 Luisteren and only B1 Luisteren — has no
     * content and no counted shape, so its overview is forty "Binnenkort" slots. That is the
     * page this gate now excludes, and it excludes it by asking the honest question ("do we know
     * what this exam looks like?") rather than by naming the level. Filling in B1 Luisteren's
     * counts therefore opens its page in the same commit, which is the coupling to want: the
     * counts and the content arrive together or not at all.
     */
    robots: { index: skill.itemCount !== null, follow: true },
    alternates: alternatesFor(locale, path),
    openGraph: {
      images: ogImageFor(locale),
      title: t('meta_title', vars),
      description: t('meta_description', vars),
      type: 'website',
      url: absUrl(locale, path),
      siteName: 'Inburgering Oefenen',
    },
  };
}

export default async function SkillOverviewPage({ params }: Props) {
  const { locale, level: rawLevel, skill: raw } = await params;
  if (!isLevel(rawLevel)) notFound();
  const level = rawLevel;
  const skill = getSkillAtLevel(level, parseSkillParam(raw) ?? '');
  if (!skill) notFound();


  const t = await getTranslations({ locale, namespace: 'oefenexamen' });
  const tSkills = await getTranslations({ locale, namespace: 'skills' });

  const name = tSkills(`${skill.key}.name`);
  const vars = { skill: name, skill_lower: name.toLowerCase(), level: levelLabel(level) };

  const tB = await getTranslations({ locale, namespace: 'breadcrumbs' });
  // Reuses the homepage's own wording for the validation claim rather than adding a fourth
  // translation of the same sentence — three copies of a claim is three places it can drift.
  const tHome = await getTranslations({ locale, namespace: 'home' });

  /* De uitleg onder het rooster (25-09). De pagina had 270 woorden en geen "inburgering" in
     de titel, terwijl knmoefenen.nl met 500–650 woorden uitleg per landingspagina rankt. De
     tekst komt uit `messages/*.json` onder `oefenexamen.how.<onderdeel>`; de getallen erin
     uit `data/skills.ts`, nooit uit de copy zelf. `p_counts` valt weg zolang het formaat
     ongeteld is (B1 Luisteren) en `p_a2_only` beschrijft wat alleen voor A2 is geverifieerd
     (`SEO/facts.md` §1: pen en papier, de vier vraagsoorten van Spreken). */
  const tHow = await getTranslations({ locale, namespace: `oefenexamen.how.${skill.slug}` });
  const howVars = { level: levelLabel(level), items: skill.itemCount ?? 0, minutes: skill.durationMinutes ?? 0 };
  const paragraphs = [
    tHow('p1'),
    ...(skill.itemCount !== null && skill.durationMinutes !== null ? [tHow('p_counts', howVars)] : []),
    ...(level === 'a2' && tHow.has('p_a2_only') ? [tHow('p_a2_only')] : []),
  ];
  const ours = tHow('p3', howVars);
  const faq = ([1, 2, 3] as const).map(n => ({ q: tHow(`q${n}`), a: tHow(`a${n}`) }));

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
   * Emitted wherever the page is indexed, and gated on exactly the same condition — shipping
   * rich data for a page we ask Google to ignore says the opposite of the meta tag on the same
   * page, so these two must not be able to disagree. Since 2026-08-23 that means both levels,
   * minus B1 Luisteren, whose format is unverified (`itemCount === null`).
   *
   * `omitEmpty` matters here: B1 Luisteren's `itemCount` and `durationMinutes` are still `null`
   * (no DUO reference material — see `data/skills.ts`), and in JSON-LD an absent property means
   * "not stated" while `0` is a claim. Lezen, Schrijven and Spreken were filled in on
   * 2026-08-21, so this now guards one onderdeel rather than a whole level — which is exactly
   * when a guard like this is easiest to drop by accident.
   */
  const path = `oefenexamen/${level}/${skill.slug}`;
  const url = absUrl(locale, path);
  const jsonLd = skill.itemCount === null ? null : {
    '@context': 'https://schema.org',
    '@graph': [
      omitEmpty({
        '@type': 'Course',
        '@id': courseId(locale, level, skill.slug),
        url,
        name: t('meta_title', vars),
        description: t('meta_description', vars),
        provider: PROVIDER_REF,
        instructor: TEACHER_REF,
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
        { name: tB('level', { level: levelLabel(level) }), path: `oefenexamen/${level}` },
        { name, path },
      ]),
      ...(faq.length ? [{
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        mainEntity: faq.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      }] : []),
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
            <CategoryMark category={skill.slug} size={22} tone="dark" />
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
                      href={localeHref(locale, `oefenexamen/${level}/${skill.slug}/${number}`)}
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
              href={localeHref(locale, `premium`)}
              className="inline-flex items-center gap-2 px-6 py-3 font-bold rounded-xl text-sm no-underline flex-shrink-0"
              style={{ background: '#fe762c', color: '#5f2200', boxShadow: 'var(--shadow-btn-orange)' }}
            >
              {t('unlock_all_cta')}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </a>
          </div>
        </div>
      </section>

      {/* ── DE UITLEG — wat het examen is, hoe je hier oefent, veelgestelde vragen ── */}
      <section className="py-16 px-6 bg-surface-container-low">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-headline font-extrabold text-on-surface tracking-tight mb-4" style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2rem)', letterSpacing: '-0.02em' }}>
            {t('how_title', { skill: name, skill_lower: name.toLowerCase() })}
          </h2>
          {paragraphs.map((p, i) => (
            <p key={i} className="text-base leading-[1.7] text-on-surface-variant mb-4">{p}</p>
          ))}
          <h2 className="font-headline font-extrabold text-on-surface tracking-tight mt-10 mb-4" style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2rem)', letterSpacing: '-0.02em' }}>
            {t('how_ours_title')}
          </h2>
          <p className="text-base leading-[1.7] text-on-surface-variant mb-10">{ours}</p>

          <SectionHeader eyebrow="" title={t('faq_title')} subtitle="" mb="mb-6" />
          <div className="faq-folds">
            {faq.map(f => (
              <details key={f.q} className="faq-fold">
                <summary>{f.q}</summary>
                <p className="text-sm leading-relaxed text-on-surface-variant m-0 pt-2">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CROSS-LINKS ── */}
      <section className="py-16 px-6 bg-surface">
        <div className="max-w-5xl mx-auto">
          <SectionHeader eyebrow="" title={t('other_skills')} subtitle="" mb="mb-8" />
          <div className="grid sm:grid-cols-3 gap-4">
            {SKILLS.filter(s => s.slug !== skill.slug).map(other => (
              <a
                key={other.slug}
                href={localeHref(locale, `oefenexamen/${level}/${other.slug}`)}
                className="exam-card flex items-center gap-4 p-5 rounded-2xl bg-surface-container-lowest no-underline"
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                <CategoryMark category={other.slug} size={44} />
                <div>
                  <p className="font-headline font-semibold text-on-surface text-sm">{tSkills(`${other.key}.name`)}</p>
                  <p className="text-xs text-on-surface-variant">{tSkills('exams_count', { count: getFormat(level, other.slug).examCount })}</p>
                </div>
              </a>
            ))}
          </div>

          {/* Into the TOFU section. The overviews are the site's strongest pages; the kennisgidsen
              need the link far more than these pages need the outbound one. */}
          {/* Omhoog naar het niveau-overzicht (25-09) — de pagina voor "inburgering examen
              oefenen a2", die zonder deze link alleen uit de voettekst bereikbaar is. */}
          <p className="mt-8 text-sm">
            <a href={localeHref(locale, `oefenexamen/${level}`)} className="font-semibold" style={{ color: '#a24000' }}>
              {t('all_of_level', { level: levelLabel(level) })} →
            </a>
          </p>
          <p className="mt-3 text-sm">
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
