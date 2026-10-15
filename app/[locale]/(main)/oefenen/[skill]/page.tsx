import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { localizedPath } from '@/i18n/paths';
import { parseSkillParam, skillParam } from '@/i18n/skill-slugs';
import { SKILLS, getSkill } from '@/data/skills';
import { hasFreePractice } from '@/data/free-practice';
import { fetchA2FreePractice } from '@/lib/free-practice';
import FreePracticeEngine from './FreePracticeEngine';
import JsonLd from '@/components/JsonLd';
import { langTag } from '@/lib/site';
import { absUrl, alternatesFor, breadcrumbs, courseId, PROVIDER_REF, ogImageFor } from '@/lib/schema';
import { DEFAULT_LEVEL, KNM_SLUG, getSkillAtLevel } from '@/data/skills';
import { SectionHeading, CategoryMark, glasButton } from '@/components/glas';
import { ArrowRight } from 'lucide-react';
import { localeHref } from '@/i18n/paths';
import Crumbs from '../../_components/glas/Crumbs';

type Props = { params: Promise<{ locale: string; skill: string }> };

export async function generateStaticParams() {
  return routing.locales.flatMap(locale =>
    SKILLS.filter(s => hasFreePractice(s.slug)).map(s => ({ locale, skill: skillParam(s.slug, locale) }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, skill: raw } = await params;
  const skill = getSkill(parseSkillParam(raw) ?? '');
  if (!skill) return {};

  // Skills whose taster is not written yet redirect to the picker — keep those
  // URLs out of the index so the title never mismatches what is rendered.
  if (!hasFreePractice(skill.slug)) return { robots: { index: false, follow: true } };

  const tSkills = await getTranslations({ locale, namespace: 'skills' });
  const name = tSkills(`${skill.key}.name`);

  const titles: Record<string, string> = {
    nl: `Gratis ${name} oefenen — 10 oefenvragen A2 met uitleg | Inburgering Oefenen`,
    en: `Practise ${name} for free — 10 A2 questions with explanations | Inburgering Oefenen`,
    ar: `تدرّب على ${name} مجاناً — ١٠ أسئلة A2 مع الشرح | Inburgering Oefenen`,
  };
  const descriptions: Record<string, string> = {
    nl: `Oefen gratis 10 vragen ${name.toLowerCase()} voor het inburgeringsexamen A2. Bij elke vraag krijg je direct uitleg van een gecertificeerde NT2-docent. Geen account nodig.`,
    en: `Practise 10 free ${name.toLowerCase()} questions for the Dutch A2 integration exam. Every question comes with an explanation from a certified NT2 teacher. No account needed.`,
    ar: `تدرّب مجاناً على ١٠ أسئلة ${name} لامتحان الاندماج الهولندي A2، مع شرح من معلمة NT2 معتمدة بعد كل سؤال. بدون حساب.`,
  };

  return {
    title: titles[locale] ?? titles.nl,
    description: descriptions[locale] ?? descriptions.nl,
    robots: { index: true, follow: true },
    alternates: alternatesFor(locale, `oefenen/${skill.slug}`),
    openGraph: {
      images: ogImageFor(locale),
      title: titles[locale] ?? titles.nl,
      description: descriptions[locale] ?? descriptions.nl,
      type: 'website',
      url: absUrl(locale, `oefenen/${skill.slug}`),
      siteName: 'Inburgering Oefenen',
    },
  };
}

export default async function FreePracticePage({ params }: Props) {
  const { locale, skill: raw } = await params;
  const slug = parseSkillParam(raw);
  const skill = slug && getSkill(slug);
  if (!skill) notFound();


  /* The items come from A2 exam 1 of this onderdeel, with the twenty static items in
   * `data/free-practice.ts` as the fallback — see `lib/free-practice.ts` for why the fallback
   * exists. A real exam component with neither (Schrijven / Spreken) sends the visitor back to
   * the picker rather than showing a dead end. */
  const set = await fetchA2FreePractice(skill.slug);
  /* `encodeURI`: het Arabische pad is niet ASCII, en een rauwe Location-header met Arabisch
   * erin gooit een 500 in plaats van een 307. */
  if (!set) redirect(encodeURI(localizedPath('/oefenen', locale)));

  const tSkills = await getTranslations({ locale, namespace: 'skills' });
  const tB = await getTranslations({ locale, namespace: 'breadcrumbs' });
  const tOefenen = await getTranslations({ locale, namespace: 'oefenen' });
  const name = tSkills(`${skill.key}.name`);

  /* ── Structured data ──────────────────────────────────────────────────────
   * A `Quiz`, which is what this page actually is: ten questions with an explanation each.
   *
   * `numberOfQuestions` is counted off the set rather than written as 10 — the copy and the
   * schema must not be able to disagree about how many questions a visitor gets.
   *
   * `isAccessibleForFree: true` is the honest and the useful claim here: no account, no
   * payment, and the score is shown after an e-mail step that has a skip link. Only reached
   * when a taster exists — the other skills redirect above, so this code never runs for them.
   */
  const url = absUrl(locale, `oefenen/${skill.slug}`);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Quiz',
        '@id': `${url}#quiz`,
        url,
        name: tOefenen('schema_quiz_name', { skill: name }),
        description: tOefenen('schema_quiz_description', { skill: name.toLowerCase() }),
        numberOfQuestions: set.items.length,
        educationalLevel: 'A2',
        educationalAlignment: {
          '@type': 'AlignmentObject',
          alignmentType: 'educationalLevel',
          educationalFramework: 'Common European Framework of Reference for Languages',
          targetName: 'A2',
        },
        learningResourceType: 'Quiz',
        isAccessibleForFree: true,
        inLanguage: langTag(locale),
        // The exam itself is in Dutch whatever language the interface is in.
        teaches: 'Nederlands als tweede taal',
        provider: PROVIDER_REF,
        about: { '@id': courseId(locale, DEFAULT_LEVEL, skill.slug) },
      },
      breadcrumbs(locale, tB('home'), [
        { name: tB('oefenen'), path: 'oefenen' },
        { name, path: `oefenen/${skill.slug}` },
      ]),
    ],
  };

  /* ── De pagina om de proef heen (15-10) ──────────────────────────────────
   * Zelfde opbouw als de KNM-themapagina's (`/oefenvragen/[slug]`): een Gracht-kop met kruimelpad,
   * merk, h1 en lead, zodat de zoekterm ("lezen oefenen inburgering a2") in de h1 en de eerste
   * alinea staat in plaats van alleen in de titel van de proefkaart. Die kaart wordt daarom een h2.
   * Naast de kaart staat wat het examen zelf is — alleen getallen uit `SEO/facts.md` §1, via
   * `data/skills.ts` — en eronder de volgende stap en de andere proeven. */
  const sp = await getTranslations({ locale, namespace: 'oefenen.skillpage' });
  const format = getSkillAtLevel(DEFAULT_LEVEL, skill.slug);
  const hasCopy = skill.slug === 'lezen' || skill.slug === 'luisteren';
  const others = SKILLS.filter(s => s.slug !== skill.slug && hasFreePractice(s.slug));

  return (
    <main className="bg-mist min-h-screen">
      <JsonLd data={jsonLd} />

      <FreePracticeEngine
        skill={skill.slug}
        skillName={tSkills(`${skill.key}.name`)}
        items={set.items}
        locale={locale}
        headingLevel={2}
        pageHeader={
          <div key="kop">
            <Crumbs
              items={[
                { label: tB('home'), href: '/' },
                { label: tB('oefenen'), href: '/oefenen' },
                { label: name },
              ]}
              className="mb-6"
            />
            <div className="g-fpx-mark">
              <CategoryMark category={skill.slug} size={48} />
              <span className="g-bdg g-bdg-glas g-tnum">{sp('badge', { count: set.items.length })}</span>
            </div>
            <SectionHeading
              as="h1"
              size="h1"
              title={hasCopy ? sp(`title_${skill.slug}`) : tOefenen('heading', { count: set.items.length, skill: name })}
              muted={sp('title_muted')}
              onField
            />
            {hasCopy && (
              <p className="g-lead g-fpx-lead">{sp(`lead_${skill.slug}`, { count: set.items.length })}</p>
            )}
          </div>
        }
        aside={hasCopy && format?.itemCount && format.durationMinutes ? (
          <aside key="feiten" className="g-fpx-about" aria-labelledby="fpx-about-h">
            <h2 id="fpx-about-h" className="g-head g-head-3">{sp(`about_heading_${skill.slug}`)}</h2>
            <p>{sp(`about_body_${skill.slug}`)}</p>
            <dl className="g-fpx-facts">
              <div><dt>{sp('fact_questions')}</dt><dd className="g-tnum">{format.itemCount}</dd></div>
              <div><dt>{sp('fact_time')}</dt><dd className="g-tnum">{sp('fact_minutes', { n: format.durationMinutes })}</dd></div>
              <div><dt>{sp('fact_where')}</dt><dd>{sp('fact_computer')}</dd></div>
              <div><dt>{sp('fact_options')}</dt><dd>{sp('fact_options_value')}</dd></div>
            </dl>
            <p className="g-fpx-src">{sp('fact_source')}</p>
          </aside>
        ) : null}
        after={
          <div key="daarna" className="g-fpx-after">
            {format?.itemCount && (
              <section className="g-fpx-next" aria-labelledby="fpx-next-h">
                <div>
                  <h2 id="fpx-next-h" className="g-head g-head-3">{sp('next_heading')}</h2>
                  <p>{sp('next_body', { count: set.items.length, skill: name, total: format.itemCount })}</p>
                </div>
                <a
                  href={localeHref(locale, `oefenexamen/${DEFAULT_LEVEL}/${skill.slug}`)}
                  className={glasButton({ variant: 'navy', size: 'md' })}
                >
                  {sp('next_cta', { skill: name })}
                  <ArrowRight className="rtl-flip" aria-hidden />
                </a>
              </section>
            )}

            <nav aria-labelledby="fpx-others-h">
              <h2 id="fpx-others-h" className="g-head g-head-3 g-fpx-others-h">{sp('others_heading')}</h2>
              <div className="g-chips">
                {others.map(o => (
                  <a key={o.slug} href={localeHref(locale, `oefenen/${o.slug}`)} className="g-chip g-chip-wit">
                    <CategoryMark category={o.slug} size={28} />
                    {tSkills(`${o.key}.name`)}
                  </a>
                ))}
                <a href={localeHref(locale, `oefenen/${KNM_SLUG}`)} className="g-chip g-chip-wit">
                  <CategoryMark category="knm" size={28} />
                  KNM
                </a>
                <a href={localeHref(locale, 'oefenen')} className="g-chip g-chip-wit g-fpx-chip-plain">
                  {sp('others_all')}
                  <ArrowRight className="rtl-flip" aria-hidden />
                </a>
              </div>
            </nav>
          </div>
        }
      />
    </main>
  );
}
