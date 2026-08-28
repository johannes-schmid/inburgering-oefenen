import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { KNM_SLUG } from '@/data/skills';
import { fetchDbFreePractice, hasDbFreePractice } from '@/lib/free-practice-db';
import FreePracticeEngine from '../[skill]/FreePracticeEngine';
import JsonLd from '@/components/JsonLd';
import { langTag } from '@/lib/site';
import { absUrl, breadcrumbs, PROVIDER_REF } from '@/lib/schema';

type Props = { params: Promise<{ locale: string }> };

const BASE = 'https://inburgeringoefenen.nl';
const PATH = 'oefenen/knm';

/**
 * The free KNM taster — ten questions from KNM oefenexamen 1, which is `is_free`.
 *
 * ## Why this is a static route and not `/oefenen/[skill]`
 *
 * KNM carries **no level**, at any depth: `/oefenexamen/knm`, `/dashboard/knm` and this page
 * are static siblings of the levelled segments. It is not `/oefenen/[skill]` because that route
 * resolves through `getSkill()`, which is the four taalonderdelen — widening it to
 * `getOnderdeel()` would also make `/oefenen/knm` resolvable at `/oefenen/b1/knm`, a level KNM
 * does not have.
 *
 * **A static segment does not save you from a redirect**, which is matched before the App
 * Router. The A2-implicit rules in `next.config.ts` are an explicit allowlist of the four legacy
 * slugs for exactly that reason — `knm` is not in it, so nothing rewrites this path. That trap
 * has already swallowed both other KNM pages once.
 *
 * ## Why `notFound()` rather than a redirect to the picker
 *
 * The set is derived from a published exam, so "absent" means the docent unpublished KNM
 * oefenexamen 1. A redirect would quietly send that visitor to a picker still advertising the
 * card they just clicked; a 404 is the honest answer. The picker gates its card on the same
 * `hasDbFreePractice`, so the link and the page cannot disagree about whether it exists.
 */
export async function generateStaticParams() {
  return hasDbFreePractice(null, KNM_SLUG) ? routing.locales.map(locale => ({ locale })) : [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<string, string> = {
    nl: 'Gratis KNM oefenen — 10 oefenvragen met uitleg | Inburgering Oefenen',
    en: 'Practise KNM for free — 10 questions with explanations | Inburgering Oefenen',
    ar: 'تدرّب على KNM مجاناً — ١٠ أسئلة مع الشرح | Inburgering Oefenen',
  };
  const descriptions: Record<string, string> = {
    nl: 'Oefen gratis 10 vragen Kennis van de Nederlandse Maatschappij voor het inburgeringsexamen. Bij elke vraag krijg je direct uitleg van een gecertificeerde NT2-docent. Geen account nodig.',
    en: 'Practise 10 free Knowledge of Dutch Society (KNM) questions for the integration exam. Every question comes with an explanation from a certified NT2 teacher. No account needed.',
    ar: 'تدرّب مجاناً على ١٠ أسئلة في معرفة المجتمع الهولندي لامتحان الاندماج، مع شرح من معلمة NT2 معتمدة بعد كل سؤال. بدون حساب.',
  };

  return {
    title: titles[locale] ?? titles.nl,
    description: descriptions[locale] ?? descriptions.nl,
    robots: { index: true, follow: true },
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
      title: titles[locale] ?? titles.nl,
      description: descriptions[locale] ?? descriptions.nl,
      type: 'website',
      url: `${BASE}/${locale}/${PATH}`,
      siteName: 'Inburgering Oefenen',
    },
  };
}

export default async function KnmFreePracticePage({ params }: Props) {
  const { locale } = await params;

  const items = await fetchDbFreePractice(null, KNM_SLUG);
  if (!items) notFound();

  const tSkills = await getTranslations({ locale, namespace: 'skills' });
  const tB = await getTranslations({ locale, namespace: 'breadcrumbs' });
  const tOefenen = await getTranslations({ locale, namespace: 'oefenen' });
  const name = tSkills('knm.name');
  const url = absUrl(locale, PATH);

  /* The same `Quiz` node as the two levelled tasters, minus `educationalLevel` and its
   * `AlignmentObject`: KNM is examined at no CEFR level, and in JSON-LD a guessed `A2` would be
   * a false claim about which candidates it serves rather than a missing property. It points at
   * the `Course` node that `/oefenexamen/knm` owns. */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Quiz',
        '@id': `${url}#quiz`,
        url,
        name: tOefenen('schema_quiz_name_knm'),
        description: tOefenen('schema_quiz_description_knm'),
        numberOfQuestions: items.length,
        learningResourceType: 'Quiz',
        isAccessibleForFree: true,
        inLanguage: langTag(locale),
        teaches: 'Kennis van de Nederlandse Maatschappij',
        provider: PROVIDER_REF,
        about: { '@id': `${absUrl(locale, 'oefenexamen/knm')}#course` },
      },
      breadcrumbs(locale, tB('home'), [
        { name: tB('oefenen'), path: 'oefenen' },
        { name, path: PATH },
      ]),
    ],
  };

  return (
    <main className="bg-surface min-h-screen">
      <JsonLd data={jsonLd} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-24">
        <FreePracticeEngine
          skill={KNM_SLUG}
          skillName={name}
          items={items}
          locale={locale}
          level={null}
        />
      </div>
    </main>
  );
}
