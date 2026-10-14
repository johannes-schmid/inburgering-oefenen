import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, Clock } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { localeHref } from '@/i18n/paths';
import { parseSkillParam, skillParam } from '@/i18n/skill-slugs';
import { Link } from '@/i18n/navigation';
import ExamSlotCard from '@/components/glas/ExamSlotCard';
import SectionHeading from '@/components/glas/SectionHeading';
import ExamMark from '@/components/horizon/ExamMark';
import CategoryMark from '@/components/horizon/CategoryMark';
import FaqList from '../../../_components/glas/FaqList';
import { OxCrumbs, OxHeader, OxLink, OxTextLink, OxUnlockBand } from '../../_glas/parts';
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
import { langTag } from '@/lib/site';
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

  /* "Oefenexamen" zonder nummer, voor linksboven op de slotkaart: de vertaling van `exam_label`
     met een leeg nummer, zodat er geen vierde sleutel voor hetzelfde woord bij komt. */
  const examWord = t('exam_label', { number: '' }).trim();
  const playerHref = (n: number) => ({
    pathname: '/oefenexamen/[level]/[skill]/[number]' as const,
    params: { level, skill: skillParam(skill.slug, locale), number: String(n) },
  });

  return (
    <>
      {jsonLd && <JsonLd data={jsonLd} />}

      {/* ── KOP ── Gracht met sluier, onder de pil door. Track-merk en onderdeelmerk naast elkaar:
          dit is "dit onderdeel op dit niveau". De feiten vallen weg waar DUO's formaat op dit niveau
          ongeteld is (B1 Luisteren) — een 0 zou een claim zijn. De docentregel staat hier één keer:
          dit is de pagina waar de bezoeker gevraagd wordt te vertrouwen vóór hij betaalt. */}
      <OxHeader
        crumbs={
          <OxCrumbs
            label={tB('home')}
            items={[
              { label: tB('home'), href: localeHref(locale, '') },
              { label: tB('oefenexamen'), href: localeHref(locale, 'oefenen') },
              { label: tB('level', { level: levelLabel(level) }), href: localeHref(locale, `oefenexamen/${level}`) },
              { label: name },
            ]}
          />
        }
        marks={<><ExamMark track={level} size={56} /><CategoryMark category={skill.slug} size={56} /></>}
        title={t('heading', vars)}
        lead={tSkills(`${skill.key}.tagline`)}
        facts={{
          exams: tSkills('exams_count', { count: skill.examCount }),
          items: skill.itemCount,
          minutes: skill.durationMinutes,
          itemsLabel: tSkills('items_label'),
          minutesLabel: tSkills('duration_label'),
        }}
        trust={tHome('hero_badge')}
      />

      {/* ── HET ROOSTER ── één `ExamSlotCard` per slot (glas.html §07, §12 "Publiek slotraster").
          De publieke pagina kent drie standen en ze blijven visueel verschillend:
          niet gepubliceerd → `nog` (klok, gestippeld, géén link) · gepubliceerd en gratis met een
          account → `gratis` · gepubliceerd en alleen in de module → `pakket` (slot). Er is hier geen
          gebruiker, dus geen `gehaald`/`bezig`: dat is het portaalraster. Een slot linkt naar de
          speler; die stuurt een gast naar /register en een niet-koper naar /premium. */}
      <section aria-labelledby="slots-heading" className="g-sec">
        <div className="g-wrap">
          <SectionHeading id="slots-heading" title={tSkills('exams_count', { count: skill.examCount })} size="h2" className="mb-6" />

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
              const free = isFreeExam(level, number);
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
                  href={playerHref(number)}
                  ariaLabel={`${t('exam_label', { number })} · ${free ? t('free') : t('locked')}`}
                />
              );
            })}
          </div>

          <div className="mt-8">
            <OxUnlockBand
              title={t('unlock_all_title')}
              body={t('unlock_all_body')}
              cta={t('unlock_all_cta')}
              href={localeHref(locale, `premium`)}
            />
          </div>
        </div>
      </section>

      {/* ── DE UITLEG — wat het examen is, hoe je hier oefent, veelgestelde vragen ── */}
      <section className="g-sec g-sec-tier">
        <div className="g-wrap grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12 items-start">
          <article className="g-ox-read">
            <h2>{t('how_title', { skill: name, skill_lower: name.toLowerCase() })}</h2>
            {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
            <h2>{t('how_ours_title')}</h2>
            <p>{ours}</p>
          </article>
          <div>
            <SectionHeading title={t('faq_title')} size="h2" className="mb-5" />
            <FaqList items={faq.map(f => ({ question: f.q, answer: f.a }))} />
          </div>
        </div>
      </section>

      {/* ── VERWIJZINGEN ── de andere onderdelen, omhoog naar het niveau, en de kennisbank in. */}
      <section aria-labelledby="other-heading" className="g-sec">
        <div className="g-wrap">
          <SectionHeading id="other-heading" title={t('other_skills')} size="h2" className="mb-6" />
          <ul className="g-ox-links">
            {SKILLS.filter(s => s.slug !== skill.slug).map(other => (
              <li key={other.slug}>
                <OxLink
                  href={localeHref(locale, `oefenexamen/${level}/${other.slug}`)}
                  category={other.slug}
                  title={tSkills(`${other.key}.name`)}
                  sub={tSkills('exams_count', { count: getFormat(level, other.slug).examCount })}
                />
              </li>
            ))}
          </ul>
          <div className="g-ox-more">
            {/* Omhoog naar het niveau-overzicht (25-09) — zonder deze link alleen uit de voettekst bereikbaar. */}
            <OxTextLink href={localeHref(locale, `oefenexamen/${level}`)}>{t('all_of_level', { level: levelLabel(level) })}</OxTextLink>
            <Link href="/inburgering" className="g-tlink">
              {t('guide_link')}
              <ArrowRight className="rtl-flip" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
