import { getTranslations } from 'next-intl/server';
import OefenenEngine from './OefenenEngine';
import { fetchAllQuestions, fetchOefenenQuestions } from '@/lib/questions';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'oefenen' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    alternates: {
      canonical: `https://inburgeringoefenen.nl/${locale}/oefenen`,
      languages: {
        nl: 'https://inburgeringoefenen.nl/nl/oefenen',
        en: 'https://inburgeringoefenen.nl/en/oefenen',
        ar: 'https://inburgeringoefenen.nl/ar/oefenen',
        'x-default': 'https://inburgeringoefenen.nl/nl/oefenen',
      },
    },
  };
}

type Props = { params: Promise<{ locale: string }> };

export default async function OefenenPage({}: Props) {
  const curatedSet = await fetchOefenenQuestions();
  // Curated set assigned in admin → use it as-is. Otherwise fall back to a
  // random spread of the full pool so the page never breaks pre-configuration.
  const curated = curatedSet.length > 0;
  const pool = curated ? curatedSet : await fetchAllQuestions();

  return (
    <main className="bg-surface">
      <div className="max-w-3xl mx-auto sm:px-6 pt-6 pb-24">
        <OefenenEngine pool={pool} curated={curated} />
      </div>
    </main>
  );
}
