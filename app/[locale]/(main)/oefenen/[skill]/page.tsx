import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { SKILLS, getSkill } from '@/data/skills';
import { getFreePractice, hasFreePractice } from '@/data/free-practice';
import FreePracticeEngine from './FreePracticeEngine';
import JsonLd from '@/components/JsonLd';
import { langTag } from '@/lib/site';
import { absUrl, breadcrumbs, courseId, PROVIDER_REF } from '@/lib/schema';
import { DEFAULT_LEVEL } from '@/data/skills';

type Props = { params: Promise<{ locale: string; skill: string }> };

const BASE = 'https://inburgeringoefenen.nl';

export async function generateStaticParams() {
  return routing.locales.flatMap(locale =>
    SKILLS.filter(s => hasFreePractice(s.slug)).map(s => ({ locale, skill: s.slug }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, skill: slug } = await params;
  const skill = getSkill(slug);
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
    alternates: {
      canonical: `${BASE}/${locale}/oefenen/${skill.slug}`,
      languages: {
        nl: `${BASE}/nl/oefenen/${skill.slug}`,
        en: `${BASE}/en/oefenen/${skill.slug}`,
        ar: `${BASE}/ar/oefenen/${skill.slug}`,
        'x-default': `${BASE}/nl/oefenen/${skill.slug}`,
      },
    },
    openGraph: {
      title: titles[locale] ?? titles.nl,
      description: descriptions[locale] ?? descriptions.nl,
      type: 'website',
      url: `${BASE}/${locale}/oefenen/${skill.slug}`,
      siteName: 'Inburgering Oefenen',
    },
  };
}

export default async function FreePracticePage({ params }: Props) {
  const { locale, skill: slug } = await params;
  const skill = getSkill(slug);
  if (!skill) notFound();

  // A real exam component whose taster is not written yet (Schrijven / Spreken):
  // send the visitor back to the picker rather than showing a dead end.
  const set = getFreePractice(skill.slug);
  if (!set) redirect(`/${locale}/oefenen`);

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

  return (
    <main className="bg-surface min-h-screen">
      <JsonLd data={jsonLd} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-24">
        <FreePracticeEngine
          skill={skill.slug}
          skillName={tSkills(`${skill.key}.name`)}
          items={set.items}
          locale={locale}
        />
      </div>
    </main>
  );
}
