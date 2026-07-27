import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import TOPICS, { getTopicBySlug } from '@/data/oefenvragen-topics';
import QuizWidget from './QuizWidget';
import { Breadcrumb, GradientHero, EyebrowBadge, Card } from '@/components/site';

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  return routing.locales.flatMap(locale =>
    TOPICS.map(t => ({ locale, slug: t.slug }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const topic = getTopicBySlug(slug);
  if (!topic) return {};
  return {
    title: `KNM Oefenvragen ${topic.name} — Oefen gericht op dit thema | Inburgering Oefenen`,
    description: `Oefen KNM-vragen over ${topic.name}: ${topic.sublabel}. ${topic.questions.length} vragen met uitleg van een gecertificeerde NT2-docent.`,
    alternates: {
      canonical: `https://inburgeringoefenen.nl/${locale}/oefenvragen/${slug}`,
      languages: {
        nl: `https://inburgeringoefenen.nl/nl/oefenvragen/${slug}`,
        en: `https://inburgeringoefenen.nl/en/oefenvragen/${slug}`,
        ar: `https://inburgeringoefenen.nl/ar/oefenvragen/${slug}`,
        'x-default': `https://inburgeringoefenen.nl/nl/oefenvragen/${slug}`,
      },
    },
  };
}

const OTHER_TOPICS = [
  { slug: 'werk-en-inkomen', icon: '💼', label: 'Werk' },
  { slug: 'wonen-en-samenleven', icon: '🏠', label: 'Wonen' },
  { slug: 'gezondheid', icon: '🏥', label: 'Gezondheid' },
  { slug: 'onderwijs-en-kinderen', icon: '🎓', label: 'Onderwijs' },
  { slug: 'overheid-en-regels', icon: '🏛️', label: 'Instanties' },
  { slug: 'politiek-en-instellingen', icon: '⚖️', label: 'Politiek' },
  { slug: 'geschiedenis-herdenking', icon: '📜', label: 'Geschiedenis' },
];

export default async function OefenTopicPage({ params }: Props) {
  const { locale, slug } = await params;
  const topic = getTopicBySlug(slug);
  if (!topic) notFound();

  const t = await getTranslations({ locale, namespace: 'oefenvragen' });
  const others = OTHER_TOPICS.filter(t => t.slug !== slug);

  const quizStrings = {
    question: t.raw('quiz_question') as string,
    next: t('quiz_next'),
    finish: t('quiz_finish'),
    scoreTitle: t('quiz_score_title'),
    scoreDesc: t.raw('quiz_score_desc') as string,
    retry: t('quiz_retry'),
    proef: t('quiz_proef'),
  };

  const quizJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    '@id': `https://inburgeringoefenen.nl/${locale}/oefenvragen/${slug}#quiz`,
    name: `KNM Oefenvragen ${topic.name}`,
    description: topic.intro,
    educationalLevel: 'beginner',
    learningResourceType: 'quiz',
    teaches: topic.name,
    numberOfQuestions: topic.questions.length,
    url: `https://inburgeringoefenen.nl/${locale}/oefenvragen/${slug}`,
    inLanguage: 'nl-NL',
    author: { '@id': 'https://inburgeringoefenen.nl/#teacher' },
    publisher: { '@id': 'https://inburgeringoefenen.nl/#organization' },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(quizJsonLd) }} />
      <Breadcrumb
        items={[
          { label: t('breadcrumb_home'), href: '/' },
          { label: t('breadcrumb_index'), href: '/oefenvragen' },
          { label: topic.name },
        ]}
      />

      <GradientHero className="pb-10" containerClass="max-w-3xl">
        <div className="flex items-center gap-3 mb-4">
          <span style={{ fontSize: '2rem' }}>{topic.icon}</span>
          <EyebrowBadge tone="dark">
            {t('free_questions', { n: topic.questions.length })}
          </EyebrowBadge>
        </div>
        <h1 className="font-headline font-extrabold text-white mb-3" style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
          KNM Oefenvragen {topic.name}
        </h1>
        <p className="leading-relaxed max-w-lg" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {t('free_questions', { n: topic.questions.length })} KNM-oefenvragen over {topic.sublabel}.
        </p>
      </GradientHero>

      <main className="bg-surface">
        {/* Intro card */}
        <div className="max-w-3xl mx-auto px-6 pt-10 pb-2">
          <Card shadow="sm" className="border border-outline-variant/30">
            <h2 className="font-headline font-bold text-lg text-primary mb-2">{t('topic_about')} {topic.name}</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {topic.intro} Oefen gericht met de vragen hieronder en lees de uitleg goed door bij elke vraag.
            </p>
            <p className="text-xs text-on-surface-variant mt-3">
              {t('topic_practice_all')}{' '}
              <Link href="/dashboard" className="text-secondary underline">{t('topic_practice_exam_link')}</Link>
              {' '}{t('topic_practice_or')}{' '}
              <Link href="/oefenvragen" className="text-secondary underline">{t('topic_practice_all_link')}</Link>.
            </p>
          </Card>
        </div>

        {/* Quiz */}
        <div id="quiz" className="quiz-wrap">
          <QuizWidget questions={topic.questions} topicTotal={topic.total} strings={quizStrings} slug={slug} />

          {/* Other topics */}
          <div className="mt-10 pt-8" style={{ borderTop: '1px solid rgba(196,198,210,0.3)' }}>
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">{t('other_topics')}</p>
            <div className="flex flex-wrap gap-2">
              {others.map(ot => (
                <a key={ot.slug} href={`/oefenvragen/${ot.slug}`} className="inline-flex items-center gap-1.5 px-3 py-2 bg-surface-container-lowest rounded-xl text-sm text-on-surface-variant font-medium hover:bg-surface-container hover:text-on-surface transition-colors" style={{ boxShadow: 'var(--shadow-card)', textDecoration: 'none' }}>
                  {ot.icon} {ot.label}
                </a>
              ))}
              <Link href="/dashboard" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-on-secondary-container bg-secondary-container" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)' }}>
                {t('proef_pill')}
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
