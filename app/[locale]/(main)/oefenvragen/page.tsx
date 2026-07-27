import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import TOPICS from '@/data/oefenvragen-topics';
import { Breadcrumb, GradientHero, EyebrowBadge, CTABanner } from '@/components/site';

type Props = { params: Promise<{ locale: string }> };

export async function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'oefenvragen' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    alternates: {
      canonical: 'https://inburgeringoefenen.nl/nl/oefenvragen',
      languages: {
        nl: 'https://inburgeringoefenen.nl/nl/oefenvragen',
        en: 'https://inburgeringoefenen.nl/en/oefenvragen',
        ar: 'https://inburgeringoefenen.nl/ar/oefenvragen',
        'x-default': 'https://inburgeringoefenen.nl/nl/oefenvragen',
      },
    },
  };
}

const totalQuestions = TOPICS.reduce((s, t) => s + t.total, 0);

export default async function OefenIndexPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'oefenvragen' });

  return (
    <>
      <Breadcrumb items={[{ label: t('breadcrumb_home'), href: '/' }, { label: t('breadcrumb_index') }]} />

      <GradientHero className="pb-14">
        <EyebrowBadge tone="dark" className="mb-5">{t('eyebrow')}</EyebrowBadge>
        <h1 className="font-headline font-extrabold text-white mb-4" style={{ fontSize: 'clamp(2rem,4vw,3rem)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
          {t('heading').split('\n').map((line, i) => (
            <span key={i}>{line}{i === 0 && <br />}</span>
          ))}
        </h1>
        <p className="text-lg mb-10 leading-relaxed max-w-xl" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {t('intro')}
        </p>

        <div className="flex flex-wrap gap-6">
          {[
            { icon: '📝', label: t('stat_total'), value: `${totalQuestions} vragen` },
            { icon: '🗂️', label: t('stat_topics'), value: t('stat_topics_val') },
            { icon: '🎓', label: t('stat_teacher'), value: t('stat_teacher_val') },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 16px' }}>
              <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.label}</p>
                <p className="text-white font-bold text-lg font-headline leading-tight">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </GradientHero>

      {/* Topics grid */}
      <div className="bg-surface-container-low py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-headline font-bold text-on-surface text-xl mb-6">{t('choose_topic')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOPICS.map(topic => (
              <a key={topic.slug} href={`/oefenvragen/${topic.slug}`} className="topic-card group" style={{ textDecoration: 'none' }}>
                <div className="topic-icon">{topic.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="topic-name">{topic.name}</p>
                  <p className="topic-count">{topic.sublabel}</p>
                  <p className="text-xs mt-1" style={{ color: '#fe762c', fontWeight: 600 }}>{t('free_questions', { n: topic.questions.length })}</p>
                </div>
                <svg className="topic-arrow" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            ))}
          </div>

          <div className="mt-12">
            <CTABanner
              eyebrow={t('proef_eyebrow')}
              title={t('proef_title')}
              description={t('proef_desc')}
              button={{ label: t('proef_btn'), href: '/dashboard' }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
