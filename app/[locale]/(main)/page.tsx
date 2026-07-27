import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import FaqAccordion from '@/components/FaqAccordion';
import { SectionHeader, TeacherCard, FeatureCard, SkillCard } from '@/components/site';
import { SKILLS } from '@/data/skills';

type Props = { params: Promise<{ locale: string }> };

const BASE = 'https://inburgeringoefenen.nl';

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    keywords: 'inburgeringsexamen oefenen, inburgering A2 oefenen, lezen A2 oefenen, luisteren A2 oefenen, schrijven A2 oefenen, spreken A2 oefenen, oefenexamen inburgering, DUO oefenexamen A2, NT2-docent',
    robots: { index: true, follow: true },
    alternates: {
      canonical: `${BASE}/${locale}`,
      languages: {
        nl: `${BASE}/nl`,
        en: `${BASE}/en`,
        ar: `${BASE}/ar`,
        'x-default': `${BASE}/nl`,
      },
    },
    openGraph: {
      title: t('meta_title'),
      description: t('meta_description'),
      type: 'website',
      url: `${BASE}/${locale}`,
      locale: locale === 'nl' ? 'nl_NL' : locale === 'ar' ? 'ar_AR' : 'en_GB',
      siteName: 'Inburgering Oefenen',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('meta_title'),
      description: t('meta_description'),
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  const tSkills = await getTranslations({ locale, namespace: 'skills' });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${BASE}/#website`,
        name: 'Inburgering Oefenen',
        url: `${BASE}/`,
        description: t('meta_description'),
        inLanguage: 'nl-NL',
      },
      {
        '@type': 'EducationalOrganization',
        '@id': `${BASE}/#organization`,
        name: 'Inburgering Oefenen',
        url: `${BASE}/`,
        description: 'Oefenexamens voor de vier taalonderdelen van het inburgeringsexamen A2, gemaakt door een gecertificeerde NT2-docent',
        teaches: ['Nederlands als tweede taal', 'Inburgeringsexamen A2'],
        educationalLevel: 'A2',
        areaServed: 'NL',
        inLanguage: 'nl-NL',
      },
      {
        '@type': 'Person',
        '@id': `${BASE}/#teacher`,
        name: 'Marieke Schipper',
        jobTitle: 'NT2-docent',
        knowsAbout: ['inburgeringsexamen A2', 'NT2', 'Nederlands als tweede taal', 'NT2 staatsexamen'],
        image: `${BASE}/images/marieke-schipper.jpg`,
        description: 'NT2-docent met 10+ jaar ervaring in basis- en voortgezet onderwijs, inburgering en NT2-staatsexamen voorbereiding',
        hasCredential: [
          {
            '@type': 'EducationalOccupationalCredential',
            name: 'NT2-docent certificering',
            credentialCategory: 'certificate',
            recognizedBy: { '@type': 'Organization', name: 'DUO — Dienst Uitvoering Onderwijs' },
          },
        ],
        sameAs: [`${BASE}/docent`],
      },
      // One Course per exam component, so each skill can surface independently in search
      ...SKILLS.map(skill => ({
        '@type': 'Course',
        name: `${tSkills(`${skill.key}.name`)} A2 — oefenexamens`,
        description: tSkills(`${skill.key}.tagline`),
        provider: { '@id': `${BASE}/#organization` },
        instructor: { '@id': `${BASE}/#teacher` },
        hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'online' },
        educationalLevel: 'A2',
        inLanguage: 'nl',
        isAccessibleForFree: true,
        url: `${BASE}/${locale}/oefenexamen/${skill.slug}`,
      })),
      {
        '@type': 'FAQPage',
        '@id': `${BASE}/#faq`,
        mainEntity: [1, 2, 3, 4, 5, 6].map(n => ({
          '@type': 'Question',
          name: t(`faq_q${n}`),
          acceptedAnswer: { '@type': 'Answer', text: t(`faq_a${n}`) },
        })),
      },
    ],
  };

  const stats = [
    { value: t('stat_1_value'), label: t('stat_1_label') },
    { value: t('stat_2_value'), label: t('stat_2_label') },
    { value: t('stat_3_value'), label: t('stat_3_label') },
  ];

  const faqs = [1, 2, 3, 4, 5, 6].map(n => ({ q: `faq_q${n}`, a: `faq_a${n}`, link: n === 1 }));

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
        <picture>
          <source srcSet="/images/hero.webp" type="image/webp" />
          <img
            src="/images/hero-compressed.jpg"
            alt="Binnenhof Den Haag"
            className="absolute inset-0 w-full h-full object-cover"
            width={1400}
            height={933}
            style={{ objectPosition: 'center 40%' }}
            fetchPriority="high"
            decoding="async"
          />
        </picture>

        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(100deg, #002B6D 0%, #002B6D 32%, rgba(0,43,109,0.92) 45%, rgba(0,43,109,0.65) 58%, rgba(0,43,109,0.25) 75%, rgba(0,43,109,0.05) 90%, transparent 100%)' }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.18) 0%, transparent 25%)' }}
        />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-28 items-center">

            {/* Left: Copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-6" style={{ background: 'rgba(255,255,255,0.20)', borderColor: 'rgba(255,255,255,0.30)', backdropFilter: 'blur(4px)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white" aria-hidden="true"><path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
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
                <a
                  href="#onderdelen"
                  className="hero-cta-primary inline-flex items-center gap-2 px-7 py-3.5 bg-white font-bold rounded-xl no-underline"
                  style={{ color: '#002B6D', boxShadow: '0 8px 24px rgba(0,0,0,0.22)' }}
                >
                  {t('cta_primary')}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </a>
                <a
                  href={`/${locale}/docent`}
                  className="hero-cta-secondary inline-flex items-center gap-2 px-7 py-3.5 text-white font-semibold rounded-xl border no-underline"
                  style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.30)' }}
                >
                  {t('cta_secondary')}
                </a>
              </div>

              <div className="flex flex-wrap gap-8">
                {stats.map(({ value, label }) => (
                  <div key={label} className="border-l-2 pl-4" style={{ borderColor: 'rgba(255,255,255,0.40)' }}>
                    <div className="text-white font-extrabold text-2xl font-headline tracking-tight">{value}</div>
                    <div className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: floating exam-item previews (Lezen + Spreken) */}
            <div className="hidden lg:block relative" style={{ width: '360px', height: '520px' }}>

              {/* Lezen item card */}
              <div
                className="absolute"
                style={{ top: 0, left: 0, width: '320px', transform: 'rotate(-2.5deg)', animation: 'heroFloat1 4s ease-in-out infinite' }}
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
                    <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Lezen · 20 / 25</span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ color: '#15803d', background: '#f0fdf4' }}>Folder</span>
                  </div>
                  <div style={{ height: '0.5rem', background: '#e0e3e5', borderRadius: '9999px', overflow: 'hidden', marginBottom: '1rem' }}>
                    <div style={{ height: '100%', width: '80%', background: 'linear-gradient(to right, #a24000, #fe762c)', borderRadius: '9999px' }} />
                  </div>
                  <p className="text-xs text-on-surface-variant mb-2 leading-snug">
                    Op internet staat een folder met informatie over EHBO-cursussen.
                  </p>
                  <p className="text-sm font-semibold text-on-surface mb-4 leading-snug">
                    Ronald wil zoveel mogelijk verschillende dingen leren over EHBO. Welke cursus kan hij het beste kiezen?
                  </p>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 p-3 rounded-xl opacity-40" style={{ background: '#f2f4f6' }}>
                      <span className="w-6 h-6 min-w-6 rounded-lg flex items-center justify-center text-xs font-bold text-on-surface-variant" style={{ background: '#eceef0' }}>A</span>
                      <span className="text-sm text-on-surface-variant">cursus EHBO I</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl opacity-40" style={{ background: '#f2f4f6' }}>
                      <span className="w-6 h-6 min-w-6 rounded-lg flex items-center justify-center text-xs font-bold text-on-surface-variant" style={{ background: '#eceef0' }}>B</span>
                      <span className="text-sm text-on-surface-variant">cursus EHBO II</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                      <span className="w-6 h-6 min-w-6 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: '#dcfce7', color: '#15803d' }}>C</span>
                      <span className="text-sm font-semibold" style={{ color: '#15803d' }}>cursus EHBO III ✓</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Spreken recorder card */}
              <div
                className="absolute"
                style={{ bottom: 0, right: 0, width: '250px', transform: 'rotate(2.8deg)', animation: 'heroFloat2 4.6s ease-in-out infinite' }}
              >
                <div
                  className="rounded-2xl p-5"
                  style={{
                    background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.50)',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.32), 0 4px 12px rgba(0,0,0,0.14)',
                  }}
                >
                  <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Spreken · 9 / 16</span>
                  <p className="text-sm font-semibold text-on-surface mt-3 mb-4 leading-snug">
                    In welk gebouw hebt u liever les? Vertel ook waarom.
                  </p>
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: '#002b6d' }}>
                    <span className="w-5 h-5 rounded-full flex-shrink-0" style={{ background: '#fe762c' }} aria-hidden="true" />
                    <div className="flex items-end gap-[3px] h-5 flex-1" aria-hidden="true">
                      {[7, 12, 18, 10, 15, 20, 9, 14, 6, 16, 11, 8].map((h, i) => (
                        <span key={i} style={{ width: 3, height: h, background: 'rgba(255,255,255,0.55)', borderRadius: 2 }} />
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-white/80 tabular-nums">0:38</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── THE FOUR EXAM COMPONENTS ── */}
      <section id="onderdelen" className="py-24 px-6 bg-surface scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            eyebrow={t('skills_badge')}
            title={t('skills_heading')}
            subtitle={t('skills_subheading')}
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SKILLS.map(skill => (
              <SkillCard
                key={skill.slug}
                skill={skill}
                name={tSkills(`${skill.key}.name`)}
                tagline={tSkills(`${skill.key}.tagline`)}
                examsLabel={tSkills('exams_count', { count: skill.examCount })}
                itemsLabel={tSkills('items_count', { count: skill.itemCount })}
                durationLabel={tSkills('duration', { minutes: skill.durationMinutes })}
                freeNote={t('skill_free_note')}
                cta={t('skill_cta')}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── TEACHER-MADE, NOT AI-MADE ── */}
      <section id="geen-ai" className="py-24 px-6 bg-surface-container-low">
        <div className="max-w-5xl mx-auto">
          <SectionHeader
            eyebrow={t('ai_badge')}
            title={t('ai_heading')}
            subtitle={t('ai_subheading')}
          />

          <div className="grid md:grid-cols-2 gap-5">
            {/* Us */}
            <div className="rounded-2xl p-7 bg-surface-container-lowest" style={{ boxShadow: 'var(--shadow-card-md)', borderTop: '3px solid #15803d' }}>
              <h3 className="font-headline font-bold text-on-surface text-base mb-4">{t('ai_us_title')}</h3>
              <ul className="flex flex-col gap-3 list-none p-0 m-0">
                {[t('ai_us_1'), t('ai_us_2'), t('ai_us_3')].map(item => (
                  <li key={item} className="flex gap-3 text-sm text-on-surface-variant leading-relaxed">
                    <span className="flex-shrink-0 mt-0.5" style={{ color: '#15803d' }} aria-hidden="true">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Them */}
            <div className="rounded-2xl p-7 bg-surface-container-lowest" style={{ boxShadow: 'var(--shadow-card)', borderTop: '3px solid var(--color-outline-variant)' }}>
              <h3 className="font-headline font-bold text-on-surface-variant text-base mb-4">{t('ai_them_title')}</h3>
              <ul className="flex flex-col gap-3 list-none p-0 m-0">
                {[t('ai_them_1'), t('ai_them_2'), t('ai_them_3')].map(item => (
                  <li key={item} className="flex gap-3 text-sm text-on-surface-variant leading-relaxed opacity-80">
                    <span className="flex-shrink-0 mt-0.5 text-outline" aria-hidden="true">✕</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── TEACHER / TRUST ── */}
      <section id="docent" className="py-24 px-6 bg-surface">
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

            <div className="flex flex-col gap-4">
              <FeatureCard icon="📝" iconBg="rgba(0,43,109,0.06)" title={t('trust_1_title')} description={t('trust_1_text')} />
              <FeatureCard icon="🎯" iconBg="rgba(76,175,122,0.08)" title={t('trust_2_title')} description={t('trust_2_text')} />
              <FeatureCard icon="💻" iconBg="rgba(0,43,109,0.06)" title={t('trust_3_title')} description={t('trust_3_text')} />
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-6 bg-surface-container-low">
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
              link: link ? { href: '#onderdelen', label: t('faq_a1_link') } : undefined,
            }))}
          />
        </div>
      </section>

      <style>{`
        @keyframes heroFloat1 {
          0%, 100% { transform: rotate(-2.5deg) translateY(0px); }
          50%       { transform: rotate(-2.5deg) translateY(-8px); }
        }
        @keyframes heroFloat2 {
          0%, 100% { transform: rotate(2.8deg) translateY(0px); }
          50%       { transform: rotate(2.8deg) translateY(-6px); }
        }
        .skill-card {
          transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s ease;
        }
        .skill-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0,43,109,0.12) !important;
        }
        .skill-card:active {
          transform: translateY(-1px);
        }
        .skill-card:hover .skill-card-cta {
          text-decoration: underline;
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
        @media (prefers-reduced-motion: reduce) {
          [style*="heroFloat"] { animation: none !important; }
          .skill-card, .hero-cta-primary, .hero-cta-secondary { transition: none; }
        }
      `}</style>
    </>
  );
}
