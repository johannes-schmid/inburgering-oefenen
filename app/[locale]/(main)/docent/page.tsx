import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { GraduationCap, ClipboardList, School, PenLine } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { Breadcrumb, GradientHero, EyebrowBadge, FeatureCard } from '@/components/site';

type Props = { params: Promise<{ locale: string }> };

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Canonical and hreflang, per locale, from one map.
 *
 * The canonical used to be hardcoded to the `/nl` URL for all three locales, which tells Google the
 * English and Arabic pages are duplicates of the Dutch one — so neither can ever rank, and the
 * hreflang block right below it said the opposite. The pathnames are localised (i18n/routing.ts),
 * so the right URL cannot be built by interpolating the locale; it has to come from this map.
 */
const ALTERNATES = {
  nl: 'https://inburgeringoefenen.nl/nl/docent',
  en: 'https://inburgeringoefenen.nl/en/teacher',
  ar: 'https://inburgeringoefenen.nl/ar/%D8%A7%D9%84%D9%85%D8%B9%D9%84%D9%85%D8%A9',
  'x-default': 'https://inburgeringoefenen.nl/nl/docent',
} as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'docent' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    alternates: {
      canonical: ALTERNATES[locale as 'nl' | 'en' | 'ar'] ?? ALTERNATES.nl,
      languages: ALTERNATES,
    },
    openGraph: {
      title: 'Marieke Schipper — Gecertificeerde KNM-docent',
      description: 'NT2-docent met 10+ jaar ervaring in inburgeringsexamen voorbereiding.',
      type: 'profile',
      url: 'https://inburgeringoefenen.nl/docent',
      locale: 'nl_NL',
      images: [{ url: 'https://inburgeringoefenen.nl/images/marieke-schipper.jpg' }],
    },
  };
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'ProfilePage',
      '@id': 'https://inburgeringoefenen.nl/docent#profilepage',
      url: 'https://inburgeringoefenen.nl/docent',
      name: 'Marieke Schipper — Gecertificeerde KNM-docent',
      inLanguage: 'nl-NL',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://inburgeringoefenen.nl/' },
          { '@type': 'ListItem', position: 2, name: 'Over de docent', item: 'https://inburgeringoefenen.nl/docent' },
        ],
      },
    },
    {
      '@type': 'Person',
      '@id': 'https://inburgeringoefenen.nl/#teacher',
      name: 'Marieke Schipper',
      jobTitle: 'NT2-docent',
      description: 'Gecertificeerde NT2-docent met meer dan 10 jaar ervaring in inburgering en KNM-examenvoorbereiding.',
      image: 'https://inburgeringoefenen.nl/images/marieke-schipper.jpg',
      knowsAbout: ['KNM examen', 'Kennis van de Nederlandse Maatschappij', 'NT2 staatsexamen', 'Inburgering Nederland'],
      hasCredential: [{ '@type': 'EducationalOccupationalCredential', name: 'NT2-bevoegdheid', credentialCategory: 'Onderwijsbevoegdheid', recognizedBy: { '@type': 'Organization', name: 'DUO — Dienst Uitvoering Onderwijs' } }],
      worksFor: { '@id': 'https://inburgeringoefenen.nl/#organization' },
      url: 'https://inburgeringoefenen.nl/docent',
    },
    {
      '@type': 'EducationalOrganization',
      '@id': 'https://inburgeringoefenen.nl/#organization',
      name: 'KNM Oefenvragen',
      url: 'https://inburgeringoefenen.nl/',
      description: 'Platform voor KNM-examenvoorbereiding met gecertificeerde docent',
      areaServed: 'NL',
    },
  ],
};

export default function DocentPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Over de docent' }]} />

      <GradientHero className="pb-16">
        <div className="flex flex-col md:flex-row gap-16 items-start">
          <div className="flex-1">
            <EyebrowBadge tone="dark" className="mb-5">Gecertificeerde KNM-docent</EyebrowBadge>
            <h1 className="font-headline font-extrabold text-white mb-5" style={{ fontSize: 'clamp(1.9rem,4vw,3rem)', letterSpacing: '-0.02em', lineHeight: '1.15' }}>
              <span className="block">Marieke Schipper —</span>
              <span style={{ color: '#fe762c' }}>NT2-docent</span>
            </h1>
            <p className="text-white/70 text-lg mb-8 leading-relaxed max-w-xl">
              Meer dan 10 jaar begeleidt Marieke inburgeraars door het Nederlandse onderwijs- en examenstelsel. Haar KNM-oefenvragen zijn gebaseerd op directe ervaring in de klas — niet op theorie.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/" className="inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container px-6 py-3 rounded-xl font-bold text-sm hover:-translate-y-px transition-transform active:scale-95 no-underline" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)' }}>
                <span>Oefen met haar vragen</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
              <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors no-underline" style={{ border: '1px solid rgba(255,255,255,0.2)' }}>
                Contact opnemen
              </Link>
            </div>
          </div>

          {/* Teacher photo */}
          <div className="flex-shrink-0">
            <div style={{ position: 'relative', width: '200px', height: '240px', borderRadius: '18px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.2)', boxShadow: '0 16px 48px rgba(0,0,0,0.3)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/marieke-schipper.jpg" alt="Marieke Schipper — gecertificeerde NT2-docent" width={200} height={240} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,43,109,0.3) 0%,transparent 50%)' }} />
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}>✓ NT2-gecertificeerd</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}>✓ 10+ jaar ervaring</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: 'rgba(254,118,44,0.25)', color: '#fe762c' }}>✓ Inburgering A2</span>
            </div>
          </div>
        </div>
      </GradientHero>

      {/* Stats */}
      <div className="bg-surface-container-low py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { value: '10+', label: 'Jaar docentervaring' },
              { value: '100+', label: 'Studenten geholpen' },
              { value: '108', label: 'KNM-oefenvragen ontwikkeld' },
            ].map((s) => (
              <div key={s.label} className="bg-surface-container-lowest rounded-2xl p-7 text-center" style={{ boxShadow: 'var(--shadow-card-md)' }}>
                <div className="font-headline font-extrabold text-primary mb-1" style={{ fontSize: '2.4rem', letterSpacing: '-0.04em', lineHeight: 1 }}>{s.value}</div>
                <div className="text-sm text-on-surface-variant">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* About + Timeline */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
            <div>
              <EyebrowBadge tone="primary" className="mb-5">Achtergrond &amp; expertise</EyebrowBadge>
              <h2 className="font-headline font-bold text-on-surface mb-5" style={{ fontSize: 'clamp(1.5rem,2.5vw,2rem)', letterSpacing: '-0.01em' }}>
                Van de klas naar het oefenplatform
              </h2>
              <div className="flex flex-col gap-4 text-on-surface-variant text-sm leading-relaxed">
                <p>Marieke begon haar loopbaan in het basisonderwijs en stapte later over naar het voortgezet onderwijs. Haar passie voor taalontwikkeling bracht haar uiteindelijk naar het vakgebied van NT2 — Nederlands als tweede taal — en inburgering.</p>
                <p>In haar dagelijkse werk begeleidt ze mensen die de Nederlandse taal leren als volwassene. Ze ziet dagelijks welke vragen inburgeraars lastig vinden, waar de examens op focussen, en hoe je het beste kunt oefenen. Dat inzicht vertaalt ze naar dit platform.</p>
                <p>&quot;Het KNM-examen is niet moeilijk als je weet wat je kunt verwachten. De meeste studenten zakken omdat ze niet genoeg oefenen met het <strong className="text-on-surface not-italic font-semibold">echte formaat</strong> — meerkeuzevragen over situaties uit het dagelijkse leven in Nederland.&quot;</p>
                <p className="text-on-surface-variant/60 text-xs">— Marieke Schipper</p>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h3 className="font-headline font-bold text-on-surface text-base mb-6">Loopbaanlijn</h3>
              <div className="flex flex-col gap-0">
                {[
                  { year: '2014', title: 'Start in het basisonderwijs', desc: 'Eerste jaren als leerkracht, focus op taalontwikkeling bij jonge leerlingen.' },
                  { year: '2016', title: 'NT2-bevoegdheid behaald', desc: 'Certificering als NT2-docent via erkende opleiding — toegang tot werken met volwassen anderstaligen.' },
                  { year: '2018', title: 'Inburgering & KNM-focus', desc: 'Start begeleiding van inburgeraars specifiek gericht op het KNM-examen en NT2-staatsexamen.' },
                  { year: '2024', title: 'KNM Oefenvragen platform', desc: 'Ontwikkeling van 108 KNM-oefenvragen voor dit platform, gebaseerd op examenervaringen uit de klas.' },
                ].map((item, i, arr) => (
                  <div key={item.year} className="grid pb-8" style={{ gridTemplateColumns: '80px 1fr', gap: '20px', position: 'relative' }}>
                    {i < arr.length - 1 && (
                      <div style={{ position: 'absolute', left: '89px', top: '8px', bottom: 0, width: '1px', background: 'linear-gradient(to bottom,#c4c6d2,transparent)' }} />
                    )}
                    <div className="text-xs font-bold text-secondary text-right pt-0.5" style={{ letterSpacing: '0.04em' }}>{item.year}</div>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '-26px', top: '6px', width: '12px', height: '12px', borderRadius: '50%', background: '#fe762c', boxShadow: '0 0 0 3px rgba(254,118,44,0.15)' }} />
                      <h3 className="text-sm font-bold text-on-surface mb-1 font-headline">{item.title}</h3>
                      <p className="text-xs text-on-surface-variant leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Credentials */}
      <section className="py-20 bg-surface-container-low">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <EyebrowBadge tone="primary" className="mb-4">Certificeringen &amp; bevoegdheden</EyebrowBadge>
            <h2 className="font-headline font-bold text-on-surface mt-4" style={{ fontSize: 'clamp(1.5rem,2.5vw,2rem)', letterSpacing: '-0.01em' }}>Erkende kwalificaties</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <FeatureCard
              icon={GraduationCap}
              title="NT2-bevoegdheid"
              description="Erkende bevoegdheid voor lesgeven in Nederlands als tweede taal aan volwassenen, uitgegeven via DUO."
            />
            <FeatureCard
              icon={ClipboardList}
              title="KNM-examen expertise"
              description="Uitgebreide kennis van het KNM-examenformaat (45 vragen, 40 minuten) en de weging per thema."
            />
            <FeatureCard
              icon={School}
              title="Bevoegd basisonderwijs & VO"
              description="Volledig bevoegde leerkracht voor basis- en voortgezet onderwijs. Brede didactische achtergrond."
            />
          </div>
        </div>
      </section>

      {/* ── Approach section ── */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <EyebrowBadge tone="primary" className="mb-5">Aanpak &amp; methode</EyebrowBadge>
              <h2 className="font-headline font-bold text-on-surface mb-5 mt-4" style={{ fontSize: 'clamp(1.5rem,2.5vw,2rem)', letterSpacing: '-0.01em' }}>
                Zo bereid je je voor op het KNM-examen
              </h2>
              <p className="text-on-surface-variant mb-6 leading-relaxed text-sm">
                Marieke&apos;s aanpak is gebaseerd op drie pijlers: <strong className="text-on-surface">herhaling</strong>, <strong className="text-on-surface">begrip</strong> en <strong className="text-on-surface">situationeel denken</strong>. Het KNM-examen test niet puur kennis van feiten — het test of jij begrijpt hoe de Nederlandse maatschappij werkt.
              </p>
              <div className="flex flex-col gap-4">
                {[
                  { n: 1, title: 'Oefen met echte examenvragen', desc: 'Gebruik vragen die qua formaat en moeilijkheidsgraad overeenkomen met het echte examen.' },
                  { n: 2, title: 'Leer van je fouten', desc: 'Na elk fout antwoord lees je de uitleg. Begrijpen waarom het fout is, voorkomt herhaling.' },
                  { n: 3, title: 'Focus op zwakke thema\'s', desc: 'De meeste studenten maken fouten in Werk & Inkomen en Wonen & Rechten. Besteed hier extra aandacht aan.' },
                ].map(s => (
                  <div key={s.n} className="flex gap-4 items-start">
                    <div className="flex items-center justify-center text-white font-headline font-extrabold text-xs flex-shrink-0 mt-0.5" style={{ width: 28, height: 28, minWidth: 28, background: '#002b6d', borderRadius: 7 }}>{s.n}</div>
                    <div>
                      <p className="text-sm font-bold text-on-surface mb-1 font-headline">{s.title}</p>
                      <p className="text-sm text-on-surface-variant">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8" style={{ boxShadow: 'var(--shadow-card-lg)' }}>
              <blockquote className="font-headline font-semibold text-on-surface mb-6" style={{ fontSize: '1.1rem', lineHeight: 1.65, letterSpacing: '-0.01em' }}>
                &ldquo;Taal leren is niet alleen een leerproces — het is een persoonlijke en verrijkende ervaring. Ik help inburgeraars met geduld en een persoonlijke aanpak om zelfverzekerd hun examen te halen.&rdquo;
              </blockquote>
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ border: '2px solid #eceef0' }}>
                  <img src="/images/marieke-schipper.jpg" alt="Marieke Schipper" width={48} height={48} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface font-headline">Marieke Schipper</p>
                  <p className="text-xs text-on-surface-variant">NT2-docent</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div style={{ background: 'var(--gradient-brand)' }} className="py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <PenLine size={44} strokeWidth={1.6} className="mx-auto mb-5 text-white" aria-hidden="true" />
          <h2 className="font-headline font-extrabold text-white mb-4" style={{ fontSize: 'clamp(1.8rem,3vw,2.4rem)', letterSpacing: '-0.02em' }}>
            Oefen nu met Marieke&apos;s vragen
          </h2>
          <p className="text-white/60 max-w-md mx-auto mb-8 leading-relaxed">
            20 gratis KNM-oefenvragen, samengesteld op basis van haar jarenlange klaservaring. Geen account nodig.
          </p>
          <Link href="/" className="inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container px-8 py-4 rounded-xl font-bold hover:-translate-y-px transition-transform active:scale-95 no-underline" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)' }}>
            <span>Start gratis oefenen</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
        </div>
      </div>
    </>
  );
}
