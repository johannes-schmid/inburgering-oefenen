import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { SKILLS, getSkill } from '@/data/skills';
import { getFreePractice, hasFreePractice } from '@/data/free-practice';
import FreePracticeEngine from './FreePracticeEngine';

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

  return (
    <main className="bg-surface min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-24">
        <FreePracticeEngine
          skill={skill.slug}
          skillName={tSkills(`${skill.key}.name`)}
          skillIcon={skill.icon}
          items={set.items}
          locale={locale}
        />
      </div>
    </main>
  );
}
