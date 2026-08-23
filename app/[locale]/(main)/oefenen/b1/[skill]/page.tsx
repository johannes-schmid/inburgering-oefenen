import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { getSkill } from '@/data/skills';
import { b1TasterSkills, fetchB1FreePractice, hasB1FreePractice } from '@/lib/free-practice-b1';
import FreePracticeEngine from '../../[skill]/FreePracticeEngine';
import JsonLd from '@/components/JsonLd';
import { langTag } from '@/lib/site';
import { absUrl, breadcrumbs, courseId, PROVIDER_REF } from '@/lib/schema';

type Props = { params: Promise<{ locale: string; skill: string }> };

const BASE = 'https://inburgeringoefenen.nl';

/**
 * The free B1 taster.
 *
 * ## Why this is a nested route and A2's is not
 *
 * A2's taster lives at `/oefenen/[skill]` with no level in the path, and those four URLs are
 * indexed and ranking. Moving them to `/oefenen/a2/[skill]` for symmetry with
 * `/oefenexamen/[level]/[skill]` would cost a redirect hop and some equity on the entry point
 * of the whole funnel, to buy nothing a visitor can see (owner's decision, 2026-08-23). So the
 * tree is deliberately asymmetric: **A2 is the unprefixed default, B1 is nested.** If a third
 * level ever appears — it should not; `Level` is `'a2' | 'b1'` on purpose — it nests too.
 *
 * ## Why there is no `hasFreePractice`-style redirect here
 *
 * A2's page `redirect()`s to the picker for a skill whose set is not written. Here the set is
 * *derived from a published exam*, so "absent" has a second cause: the docent unpublished B1
 * Lezen exam 1. A redirect would quietly send that visitor to a picker still advertising the
 * card they just clicked. `notFound()` is the honest answer, and `generateStaticParams` only
 * ever emits the onderdelen that have a source exam, so the 404 is the unpublished case.
 */
export async function generateStaticParams() {
  return routing.locales.flatMap(locale => b1TasterSkills().map(skill => ({ locale, skill })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, skill: slug } = await params;
  const skill = getSkill(slug);
  if (!skill || !hasB1FreePractice(skill.slug)) return { robots: { index: false, follow: true } };

  const tSkills = await getTranslations({ locale, namespace: 'skills' });
  const name = tSkills(`${skill.key}.name`);
  const path = `oefenen/b1/${skill.slug}`;

  const titles: Record<string, string> = {
    nl: `Gratis ${name} oefenen — 10 oefenvragen B1 met uitleg | Inburgering Oefenen`,
    en: `Practise ${name} for free — 10 B1 questions with explanations | Inburgering Oefenen`,
    ar: `تدرّب على ${name} مجاناً — ١٠ أسئلة B1 مع الشرح | Inburgering Oefenen`,
  };
  const descriptions: Record<string, string> = {
    nl: `Oefen gratis 10 vragen ${name.toLowerCase()} op niveau B1 voor het inburgeringsexamen. Bij elke vraag krijg je direct uitleg van een gecertificeerde NT2-docent. Geen account nodig.`,
    en: `Practise 10 free B1 ${name.toLowerCase()} questions for the Dutch integration exam. Every question comes with an explanation from a certified NT2 teacher. No account needed.`,
    ar: `تدرّب مجاناً على ١٠ أسئلة ${name} بمستوى B1 لامتحان الاندماج الهولندي، مع شرح من معلمة NT2 معتمدة بعد كل سؤال. بدون حساب.`,
  };

  return {
    title: titles[locale] ?? titles.nl,
    description: descriptions[locale] ?? descriptions.nl,
    robots: { index: true, follow: true },
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
      title: titles[locale] ?? titles.nl,
      description: descriptions[locale] ?? descriptions.nl,
      type: 'website',
      url: `${BASE}/${locale}/${path}`,
      siteName: 'Inburgering Oefenen',
    },
  };
}

export default async function B1FreePracticePage({ params }: Props) {
  const { locale, skill: slug } = await params;
  const skill = getSkill(slug);
  if (!skill || !hasB1FreePractice(skill.slug)) notFound();

  const items = await fetchB1FreePractice(skill.slug);
  if (!items) notFound();

  const tSkills = await getTranslations({ locale, namespace: 'skills' });
  const tB = await getTranslations({ locale, namespace: 'breadcrumbs' });
  const tOefenen = await getTranslations({ locale, namespace: 'oefenen' });
  const name = tSkills(`${skill.key}.name`);
  const path = `oefenen/b1/${skill.slug}`;
  const url = absUrl(locale, path);

  /* Same `Quiz` node as A2's taster, with the level swapped. `numberOfQuestions` is counted
   * off the set rather than written as 10, so the copy and the schema cannot disagree. */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Quiz',
        '@id': `${url}#quiz`,
        url,
        name: tOefenen('schema_quiz_name_b1', { skill: name }),
        description: tOefenen('schema_quiz_description_b1', { skill: name.toLowerCase() }),
        numberOfQuestions: items.length,
        educationalLevel: 'B1',
        educationalAlignment: {
          '@type': 'AlignmentObject',
          alignmentType: 'educationalLevel',
          educationalFramework: 'Common European Framework of Reference for Languages',
          targetName: 'B1',
        },
        learningResourceType: 'Quiz',
        isAccessibleForFree: true,
        inLanguage: langTag(locale),
        teaches: 'Nederlands als tweede taal',
        provider: PROVIDER_REF,
        about: { '@id': courseId(locale, 'b1', skill.slug) },
      },
      breadcrumbs(locale, tB('home'), [
        { name: tB('oefenen'), path: 'oefenen' },
        { name: `${name} B1`, path },
      ]),
    ],
  };

  return (
    <main className="bg-surface min-h-screen">
      <JsonLd data={jsonLd} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-24">
        <FreePracticeEngine
          skill={skill.slug}
          skillName={`${name} B1`}
          items={items}
          locale={locale}
          level="b1"
        />
      </div>
    </main>
  );
}
