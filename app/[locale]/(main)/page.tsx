import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import HeroWordCard from '@/components/HeroWordCard';
import FaqAccordion from '@/components/FaqAccordion';
import { SectionHeader, TeacherCard, FeatureCard, ReviewCard } from '@/components/site';
import AbTestCta from '@/components/AbTestCta';

type Props = { params: Promise<{ locale: string }> };

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    keywords: 'KNM oefenvragen, KNM examen oefenen, KNM oefenen, KNM examen oefenen 2026, gratis KNM oefenen, KNM oefenexamen, inburgering KNM oefenen, inburgering examen, kennis van de Nederlandse maatschappij',
    robots: { index: true, follow: true },
    alternates: {
      canonical: `https://inburgeringoefenen.nl/${locale}`,
      languages: {
        nl: 'https://inburgeringoefenen.nl/nl',
        en: 'https://inburgeringoefenen.nl/en',
        ar: 'https://inburgeringoefenen.nl/ar',
        'x-default': 'https://inburgeringoefenen.nl/nl',
      },
    },
    openGraph: {
      title: 'KNM Examen Oefenen 2026 — 450+ Gevalideerde Vragen | Gecertificeerde Docent',
      description: 'Oefen gratis met 450+ gevalideerde KNM-vragen en 10 proefexamens van een gecertificeerde NT2-docent. Direct feedback, geen account nodig.',
      type: 'website',
      url: 'https://inburgeringoefenen.nl/',
      locale: 'nl_NL',
      siteName: 'KNM Oefenen',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'KNM Examen Oefenen 2026 — 450+ Gevalideerde Vragen | Gecertificeerde Docent',
      description: 'Oefen gratis met 450+ gevalideerde KNM-vragen en 10 proefexamens van een gecertificeerde NT2-docent. Direct feedback, geen account nodig.',
    },
  };
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://inburgeringoefenen.nl/#website',
      name: 'KNM Oefenen',
      url: 'https://inburgeringoefenen.nl/',
      description: 'Gratis KNM oefenvragen van een gecertificeerde inburgeringsdocent',
      inLanguage: 'nl-NL',
    },
    {
      '@type': 'EducationalOrganization',
      '@id': 'https://inburgeringoefenen.nl/#organization',
      name: 'KNM Oefenvragen',
      url: 'https://inburgeringoefenen.nl/',
      description: 'Platform voor KNM-examenvoorbereiding met gecertificeerde docent',
      teaches: 'Kennis van de Nederlandse Maatschappij',
      educationalLevel: 'Inburgering',
      areaServed: 'NL',
      inLanguage: 'nl-NL',
    },
    {
      '@type': 'Person',
      '@id': 'https://inburgeringoefenen.nl/#teacher',
      name: 'Marieke Schipper',
      jobTitle: 'NT2-docent & KNM-specialist',
      knowsAbout: ['KNM examen', 'inburgering Nederland', 'NT2 staatsexamen', 'kennis van de Nederlandse maatschappij'],
      image: 'https://inburgeringoefenen.nl/images/marieke-schipper.jpg',
      description: 'NT2-docent met 10+ jaar ervaring in basis- en voortgezet onderwijs, inburgering en NT2-staatsexamen voorbereiding',
      hasCredential: [
        {
          '@type': 'EducationalOccupationalCredential',
          name: 'NT2-docent certificering',
          credentialCategory: 'certificate',
          recognizedBy: { '@type': 'Organization', name: 'DUO — Dienst Uitvoering Onderwijs' },
        },
      ],
      sameAs: ['https://inburgeringoefenen.nl/docent'],
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://inburgeringoefenen.nl/#faq',
      mainEntity: [
        { '@type': 'Question', name: 'Wat is het KNM-examen?', acceptedAnswer: { '@type': 'Answer', text: 'Het KNM-examen (Kennis van de Nederlandse Maatschappij) is een onderdeel van het inburgeringsexamen. In dit examen toets je je kennis over de Nederlandse samenleving, geschiedenis, cultuur, rechten en wetten.' } },
        { '@type': 'Question', name: 'Hoeveel vragen heeft het KNM-examen?', acceptedAnswer: { '@type': 'Answer', text: 'Het officiële KNM-examen bestaat uit 45 meerkeuzevragen met drie antwoordopties (A, B of C).' } },
        { '@type': 'Question', name: 'Hoe lang duurt het KNM-examen?', acceptedAnswer: { '@type': 'Answer', text: 'Je hebt 40 minuten de tijd om het KNM-examen te maken. Gemiddeld duurt het invullen 25–30 minuten.' } },
        { '@type': 'Question', name: 'Hoe bereid ik me voor op het KNM-examen?', acceptedAnswer: { '@type': 'Answer', text: 'De beste voorbereiding is veel oefenen met echte examenvragen, zoals die op dit platform.' } },
        { '@type': 'Question', name: 'Wat is een voldoende score voor het KNM-examen?', acceptedAnswer: { '@type': 'Answer', text: 'Voor een voldoende moet je minimaal 27 van de 45 vragen goed beantwoorden (60%).' } },
        { '@type': 'Question', name: 'Hoe vaak mag ik het KNM-examen doen?', acceptedAnswer: { '@type': 'Answer', text: 'In principe mag je het KNM-examen meerdere keren doen. Er zijn echter kosten verbonden aan elk examenmoment.' } },
      ],
    },
    {
      '@type': 'AggregateRating',
      '@id': 'https://inburgeringoefenen.nl/#rating',
      itemReviewed: { '@id': 'https://inburgeringoefenen.nl/#organization' },
      ratingValue: '4.8',
      bestRating: '5',
      worstRating: '1',
      ratingCount: '4',
      reviewCount: '4',
    },
    {
      '@type': 'Course',
      name: 'KNM Examen Oefenen 2026',
      description: '450+ gevalideerde KNM-oefenvragen en 10 proefexamens van een gecertificeerde NT2-docent',
      provider: { '@id': 'https://inburgeringoefenen.nl/#organization' },
      instructor: { '@id': 'https://inburgeringoefenen.nl/#teacher' },
      hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'online' },
      educationalLevel: 'adult education',
      inLanguage: 'nl',
      isAccessibleForFree: true,
      url: 'https://inburgeringoefenen.nl/',
    },
  ],
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });

  const topics = [
    { slug: 'werk-en-inkomen', emoji: '💼', title: 'Werk en Inkomen', free: 6, total: 75 },
    { slug: 'wonen-en-samenleven', emoji: '🏠', title: 'Wonen', free: 5, total: 80 },
    { slug: 'gezondheid', emoji: '🏥', title: 'Gezondheid en Gezondheidszorg', free: 5, total: 55 },
    { slug: 'onderwijs-en-kinderen', emoji: '🎓', title: 'Onderwijs en Opvoeding', free: 4, total: 50 },
    { slug: 'overheid-en-regels', emoji: '🏛️', title: 'Instanties', free: 11, total: 56 },
    { slug: 'politiek-en-instellingen', emoji: '⚖️', title: 'Staatsinrichting en Rechtsstaat', free: 8, total: 51 },
    { slug: 'geschiedenis-herdenking', emoji: '📜', title: 'Geschiedenis en Geografie', free: 5, total: 51 },
  ];

  const reviews = [
    { initials: 'FA', name: 'Fatima Amrani', color: 'bg-secondary/10 text-secondary', stars: 5, textKey: 'review_1_text', locationKey: 'review_1_location' },
    { initials: 'AP', name: 'Andrei Popescu', color: 'bg-green-100 text-green-700', stars: 5, textKey: 'review_2_text', locationKey: 'review_2_location' },
    { initials: 'LM', name: 'Leila Mansouri', color: 'bg-secondary/10 text-secondary', stars: 5, textKey: 'review_3_text', locationKey: 'review_3_location' },
    { initials: 'DK', name: 'Dmitri Kovalev', color: 'bg-purple-50 text-purple-600', stars: 4, textKey: 'review_4_text', locationKey: 'review_4_location' },
  ] as const;

  const faqs = [
    { q: 'faq_q1', a: 'faq_a1', link: true },
    { q: 'faq_q2', a: 'faq_a2', link: false },
    { q: 'faq_q3', a: 'faq_a3', link: false },
    { q: 'faq_q4', a: 'faq_a4', link: false },
    { q: 'faq_q5', a: 'faq_a5', link: false },
    { q: 'faq_q6', a: 'faq_a6', link: false },
  ] as const;

  return (
    <>
      <link rel="preload" as="image" href="/images/hero.webp" type="image/webp" fetchPriority="high" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── HERO ── */}
      <section
        id="hero"
        className="relative overflow-hidden -mt-20"
        style={{ minHeight: '680px', paddingTop: 'calc(5rem + 5rem)', paddingBottom: '6rem' }}
      >
        {/* Background image */}
        <picture>
          <source srcSet="/images/hero.webp" type="image/webp" />
          <img
            src="/images/hero-compressed.jpg"
            alt="Binnenhof Den Haag — het hart van de Nederlandse democratie"
            className="absolute inset-0 w-full h-full object-cover"
            width={1400}
            height={933}
            style={{ objectPosition: 'center 40%' }}
            fetchPriority="high"
            decoding="async"
          />
        </picture>

        {/* Blue gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(100deg, #002B6D 0%, #002B6D 32%, rgba(0,43,109,0.92) 45%, rgba(0,43,109,0.65) 58%, rgba(0,43,109,0.25) 75%, rgba(0,43,109,0.05) 90%, transparent 100%)' }}
        />
        {/* Top darkening for nav contrast */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.18) 0%, transparent 25%)' }}
        />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-28 items-center">

            {/* Left: Copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-6" style={{ background: 'rgba(255,255,255,0.20)', borderColor: 'rgba(255,255,255,0.30)', backdropFilter: 'blur(4px)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
                <span className="text-white font-bold text-xs uppercase tracking-widest">{t('hero_badge')}</span>
              </div>

              <h1
                className="font-headline font-extrabold text-white leading-tight tracking-tight mb-6"
                style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)' }}
              >
                <span className="block">{t('hero_line1')}</span>
                <span className="italic" style={{ color: 'rgba(255,255,255,0.90)' }}>{t('hero_line2')}</span>
              </h1>

              <p className="text-lg max-w-lg mb-8 leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {t('hero_subheading')}
              </p>

              <div className="flex flex-wrap gap-3 mb-10">
                <AbTestCta
                  className="hero-cta-primary inline-flex items-center gap-2 px-7 py-3.5 bg-white font-bold rounded-xl shadow-xl no-underline"
                  style={{ color: '#002B6D', boxShadow: '0 8px 24px rgba(0,0,0,0.22)' }}
                  label={<>{t('cta_primary')}<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></>}
                />
                <a
                  href="#social-proof"
                  className="hero-cta-secondary inline-flex items-center gap-2 px-7 py-3.5 text-white font-semibold rounded-xl border no-underline"
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    borderColor: 'rgba(255,255,255,0.30)',
                  }}
                >
                  {t('cta_secondary')}
                </a>
              </div>

              <div className="flex flex-wrap gap-8">
                <div className="border-l-2 pl-4" style={{ borderColor: 'rgba(255,255,255,0.40)' }}>
                  <div className="text-white font-extrabold text-2xl font-headline tracking-tight">450+</div>
                  <div className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>{t('stat_1_label')}</div>
                </div>
                <div className="border-l-2 pl-4" style={{ borderColor: 'rgba(255,255,255,0.40)' }}>
                  <div className="text-white font-extrabold text-2xl font-headline tracking-tight">100+</div>
                  <div className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>{t('stat_2_label')}</div>
                </div>
                <div className="border-l-2 pl-4" style={{ borderColor: 'rgba(255,255,255,0.40)' }}>
                  <div className="text-white font-extrabold text-2xl font-headline tracking-tight">{t('stat_3_value')}</div>
                  <div className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>{t('stat_3_label')}</div>
                </div>
              </div>
            </div>

            {/* Right: Floating cards */}
            <div className="hidden lg:block relative" style={{ width: '360px', height: '520px' }}>

              {/* Question card */}
              <div
                className="absolute"
                style={{
                  top: 0, left: 0, width: '310px',
                  transform: 'rotate(-2.5deg)',
                  animation: 'heroFloat1 4s ease-in-out infinite',
                }}
              >
                <div
                  className="rounded-2xl p-6 relative z-10"
                  style={{
                    background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.50)',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.32), 0 4px 12px rgba(0,0,0,0.14)',
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Vraag 15 van 20</span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ color: '#15803d', background: '#f0fdf4' }}>Gezondheid</span>
                  </div>
                  <div style={{ height: '0.5rem', background: '#e0e3e5', borderRadius: '9999px', overflow: 'hidden', marginBottom: '1rem' }}>
                    <div style={{ height: '100%', width: '75%', background: 'linear-gradient(to right, #a24000, #fe762c)', borderRadius: '9999px' }} />
                  </div>
                  <p className="text-sm font-semibold text-on-surface mb-4 leading-snug">
                    Er is een noodsituatie met levensgevaar. Welk nummer belt u?
                  </p>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 p-3 rounded-xl opacity-40" style={{ background: '#f2f4f6' }}>
                      <span className="w-6 h-6 min-w-6 rounded-lg flex items-center justify-center text-xs font-bold text-on-surface-variant" style={{ background: '#eceef0' }}>A</span>
                      <span className="text-sm text-on-surface-variant">114</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl opacity-40" style={{ background: '#f2f4f6' }}>
                      <span className="w-6 h-6 min-w-6 rounded-lg flex items-center justify-center text-xs font-bold text-on-surface-variant" style={{ background: '#eceef0' }}>B</span>
                      <span className="text-sm text-on-surface-variant">0900-8844</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                      <span className="w-6 h-6 min-w-6 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: '#dcfce7', color: '#15803d' }}>C</span>
                      <span className="text-sm font-semibold" style={{ color: '#15803d' }}>112 ✓</span>
                    </div>
                  </div>
                </div>
                <div
                  className="absolute -bottom-3 right-5 z-20 text-white text-xs font-bold px-3 py-1.5 rounded-full"
                  style={{ background: '#22c55e', boxShadow: '0 4px 12px rgba(34,197,94,0.45)' }}
                >
                  Juist antwoord! 🎉
                </div>
              </div>

              {/* Word card widget — client component */}
              <div
                className="absolute"
                style={{
                  bottom: 0, right: 0, width: '230px',
                  transform: 'rotate(2.8deg)',
                  animation: 'heroFloat2 4.6s ease-in-out infinite',
                }}
              >
                <HeroWordCard />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section id="social-proof" className="py-24 px-6 bg-surface-container-low">
        <div className="max-w-7xl mx-auto">

          <SectionHeader
            eyebrow={t('social_badge')}
            title={t('social_heading')}
            subtitle={t('social_subheading')}
            mb="mb-16"
          />

          <div className="grid lg:grid-cols-2 gap-8 items-start">

            <TeacherCard
              variant="full"
              experience={t('teacher_experience')}
              quote={t('teacher_quote')}
              credentials={[t('teacher_cred_1'), t('teacher_cred_2'), t('teacher_cred_3')]}
              link={{ href: 'https://www.duo.nl/particulier/staatsexamen-nt2/hoe-het-staatsexamen-nt2-werkt.jsp', label: 'Meer over de NT2-bevoegdheid via DUO' }}
            />

            {/* Trust signals */}
            <div className="flex flex-col gap-4">
              <FeatureCard icon="📚" iconBg="rgba(0,43,109,0.06)" title={t('trust_1_title')} description={t('trust_1_text')} />
              <FeatureCard icon="🎯" iconBg="rgba(76,175,122,0.08)" title={t('trust_2_title')} description={t('trust_2_text')} />
              <FeatureCard icon="💻" iconBg="rgba(0,43,109,0.06)" title={t('trust_3_title')} description={t('trust_3_text')} />
            </div>

          </div>
        </div>
      </section>

      {/* ── OEFENVRAGEN ── */}
      <section id="oefenvragen" className="py-24 px-6 bg-surface">
        <div className="max-w-7xl mx-auto">

          <SectionHeader
            eyebrow={t('topics_badge')}
            title={t('topics_heading')}
            subtitle={t('topics_subheading')}
          />

          {/* Topic grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {topics.map(({ slug, emoji, title, free, total }) => (
              <Link
                key={slug}
                href={`/oefenvragen/${slug}` as Parameters<typeof Link>[0]['href']}
                className="topic-card-hover bg-surface-container-lowest rounded-2xl p-5 flex flex-col gap-3 no-underline"
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
              >
                <span className="text-2xl">{emoji}</span>
                <div>
                  <p className="font-headline font-semibold text-sm text-on-surface leading-snug mb-1">{title}</p>
                  <p className="text-xs text-on-surface-variant">
                    {free} gratis · <span className="font-semibold" style={{ color: '#a24000' }}>{total} totaal</span>
                  </p>
                </div>
                <span className="text-xs font-semibold mt-auto" style={{ color: '#a24000' }}>{t('topic_cta')}</span>
              </Link>
            ))}
          </div>

          {/* Proefexamen banner — always the full 40-question mock exam */}
          <Link
            href="/proefexamen"
            className="proef-banner-link flex items-center justify-between flex-wrap gap-6 p-8 rounded-2xl no-underline"
            style={{ background: '#002b6d' }}
          >
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: 'rgba(255,255,255,0.10)' }}>⏱️</div>
              <div>
                <p className="font-headline font-bold text-lg text-white mb-1">{t('exam_banner_heading')}</p>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.70)' }}>{t('exam_banner_text')}</p>
              </div>
            </div>
            <span
              className="inline-flex items-center gap-2 px-6 py-3 font-bold rounded-xl text-sm flex-shrink-0"
              style={{ background: '#fe762c', color: '#5f2200', boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.12)' }}
            >
              {t('exam_banner_cta')}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
          </Link>

        </div>
      </section>

      {/* ── REVIEWS ── */}
      <section id="reviews" className="py-24 px-6 bg-surface-container-low">
        <div className="max-w-7xl mx-auto">

          <SectionHeader
            eyebrow={t('reviews_badge')}
            title={t('reviews_heading')}
            subtitle={t('reviews_subheading')}
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {reviews.map(({ initials, name, color, stars, textKey, locationKey }) => (
              <ReviewCard
                key={name}
                rating={stars}
                quote={t(textKey)}
                name={name}
                location={t(locationKey)}
                initials={initials}
                avatarClass={color}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-6 bg-surface">
        <div className="max-w-3xl mx-auto">

          <SectionHeader
            eyebrow={t('faq_badge')}
            title={t('faq_heading')}
            subtitle={t('faq_subheading')}
          />

          <FaqAccordion
            items={faqs.map(({ q, a, link }) => ({
              question: t(q),
              answer: t(a),
              link: link ? { href: '/hoe-werkt-het-knm-examen', label: t('faq_a1_link') } : undefined,
            }))}
          />

        </div>
      </section>

      {/* Global keyframes + CSS hover effects for server-rendered cards */}
      <style>{`
        @keyframes heroFloat1 {
          0%, 100% { transform: rotate(-2.5deg) translateY(0px); }
          50%       { transform: rotate(-2.5deg) translateY(-8px); }
        }
        @keyframes heroFloat2 {
          0%, 100% { transform: rotate(2.8deg) translateY(0px); }
          50%       { transform: rotate(2.8deg) translateY(-6px); }
        }
        .topic-card-hover {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .topic-card-hover:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0,43,109,0.10) !important;
        }
        .review-card-hover {
          transition: transform 0.2s ease;
        }
        .review-card-hover:hover {
          transform: translateY(-2px);
        }
        .hero-cta-primary {
          transition: transform 0.15s ease;
        }
        .hero-cta-primary:hover {
          transform: translateY(-2px);
        }
        .hero-cta-secondary {
          transition: background 0.15s ease;
        }
        .hero-cta-secondary:hover {
          background: rgba(255,255,255,0.25) !important;
        }
        .proef-banner-link {
          transition: opacity 0.15s ease;
        }
        .proef-banner-link:hover {
          opacity: 0.95;
        }
      `}</style>
    </>
  );
}
