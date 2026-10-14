import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import TOPICS, { getTopicBySlug } from '@/data/oefenvragen-topics';
import QuizWidget from './QuizWidget';
import { ArrowRight } from 'lucide-react';
import PageField from '@/components/glas/PageField';
import SectionHeading from '@/components/glas/SectionHeading';
import { glasButton } from '@/components/glas/Button';
import CategoryMark, { type Category } from '@/components/horizon/CategoryMark';
import Crumbs from '../../_components/glas/Crumbs';
import { alternatesFor } from '@/lib/schema';

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
    /* `alternatesFor` leidt canonical én hreflang af uit `routing.ts`, zodat ze de vertaalde
     * slug van deze taal krijgen in plaats van de taalcode vóór het Nederlandse pad. */
    alternates: alternatesFor(locale, `oefenvragen/${slug}`),
  };
}

const OTHER_TOPICS = [
  { slug: 'werk-en-inkomen', label: 'Werk' },
  { slug: 'wonen-en-samenleven', label: 'Wonen' },
  { slug: 'gezondheid', label: 'Gezondheid' },
  { slug: 'onderwijs-en-kinderen', label: 'Onderwijs' },
  { slug: 'overheid-en-regels', label: 'Instanties' },
  { slug: 'politiek-en-instellingen', label: 'Politiek' },
  { slug: 'geschiedenis-herdenking', label: 'Geschiedenis' },
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

      {/* De kop op Gracht met het merk van het thema in plaats van een emoji. */}
      <PageField variant="gracht" className="-mt-[var(--nav-h)] !pt-[calc(var(--nav-h)+40px)] sm:!pt-[calc(var(--nav-h)+56px)]">
        <Crumbs
          items={[
            { label: t('breadcrumb_home'), href: '/' },
            { label: t('breadcrumb_index'), href: '/oefenvragen' },
            { label: topic.name },
          ]}
          className="mb-6"
        />
        <div className="flex items-center gap-3 mb-4">
          <CategoryMark category={topicMark(slug)} size={48} />
          <span className="g-bdg g-bdg-glas">{t('free_questions', { n: topic.questions.length })}</span>
        </div>
        <SectionHeading as="h1" size="h1" title="KNM Oefenvragen" muted={topic.name} onField />
        <p className="g-lead mt-4">
          {t('free_questions', { n: topic.questions.length })} KNM-oefenvragen over {topic.sublabel}.
        </p>
      </PageField>

      <main className="g-sec !pt-10">
        <div className="g-wrap max-w-[820px] g-stack">
          <section className="g-blog-card" aria-labelledby="topic-about">
            <h2 id="topic-about" className="g-head g-head-3">{t('topic_about')} {topic.name}</h2>
            <p className="m-0 mt-2 text-[0.9375rem] leading-relaxed text-ink-2">
              {topic.intro} Oefen gericht met de vragen hieronder en lees de uitleg goed door bij elke vraag.
            </p>
            <p className="m-0 mt-3 text-sm text-ink-2">
              {t('topic_practice_all')}{' '}
              <Link href="/dashboard" className="g-ilink">{t('topic_practice_exam_link')}</Link>
              {' '}{t('topic_practice_or')}{' '}
              <Link href="/oefenvragen" className="g-ilink">{t('topic_practice_all_link')}</Link>.
            </p>
          </section>

          <div id="quiz">
            <QuizWidget questions={topic.questions} topicTotal={topic.total} strings={quizStrings} slug={slug} />
          </div>

          <nav className="mt-6" aria-labelledby="other-topics">
            <h2 id="other-topics" className="g-mono mb-3">{t('other_topics')}</h2>
            <div className="g-chips">
              {others.map(ot => (
                <a key={ot.slug} href={`/oefenvragen/${ot.slug}`} className="g-chip g-chip-wit !no-underline">
                  <CategoryMark category={topicMark(ot.slug)} size={28} />
                  {ot.label}
                </a>
              ))}
              <Link href="/dashboard" className={glasButton({ variant: 'navy', size: 'sm' })}>
                {t('proef_pill')}
                <ArrowRight className="rtl-flip" aria-hidden="true" />
              </Link>
            </div>
          </nav>
        </div>
      </main>
    </>
  );
}

/* Het merk van een KNM-onderwerp: de drie thema's met een eigen merk, anders de KNM-zuilen. */
function topicMark(slug: string): Category {
  if (slug.startsWith('werk')) return 'werk';
  if (slug.startsWith('wonen')) return 'wonen';
  if (slug.startsWith('gezondheid')) return 'gezondheid';
  return 'knm';
}
