import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { GraduationCap, ClipboardList, School, PenLine } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { Breadcrumb, GradientHero, EyebrowBadge, FeatureCard } from '@/components/site';
import JsonLd from '@/components/JsonLd';
import { ORG_ID, SITE_URL, TEACHER_ID } from '@/lib/site';
import { DEFAULT_LEVEL, formatCount, getFormat, getSkillAtLevel } from '@/data/skills';

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
      title: t('meta_title'),
      description: t('meta_description'),
      type: 'profile',
      // The localised URL, not the locale-less `/docent`, which resolves for nobody.
      url: ALTERNATES[locale as 'nl' | 'en' | 'ar'] ?? ALTERNATES.nl,
      locale: locale === 'nl' ? 'nl_NL' : locale === 'ar' ? 'ar_AR' : 'en_GB',
      images: [{ url: 'https://inburgeringoefenen.nl/images/marieke-schipper.jpg' }],
    },
  };
}

/**
 * **This page owns the `Person` node.** It used to *redefine* both `#teacher` and
 * `#organization`, which the homepage also defines — and it disagreed with itself: the
 * organisation was called "KNM Oefenvragen" here and "Inburgering Oefenen" there. Two
 * definitions of one `@id` is a contradiction no validator reports; a search engine settles it
 * by picking one, so which facts win is luck.
 *
 * So: the docent page defines the docent (it is the profile page for her, and the homepage now
 * references `TEACHER_ID`), and the organisation is referenced, never restated.
 *
 * Built per locale rather than as a module constant, because the URLs are localised.
 */
function buildJsonLd(locale: string) {
  const url = ALTERNATES[locale as 'nl' | 'en' | 'ar'] ?? ALTERNATES.nl;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        '@id': `${url}#profilepage`,
        url,
        name: 'Marieke Schipper — NT2-docent',
        inLanguage: locale === 'nl' ? 'nl-NL' : locale === 'ar' ? 'ar' : 'en',
        mainEntity: { '@id': TEACHER_ID },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          '@id': `${url}#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/${locale}` },
            { '@type': 'ListItem', position: 2, name: 'Over de docent' },
          ],
        },
      },
      {
        '@type': 'Person',
        '@id': TEACHER_ID,
        name: 'Marieke Schipper',
        jobTitle: 'NT2-docent',
        description: 'Gecertificeerde NT2-docent met meer dan 10 jaar ervaring in het onderwijs, inburgering en de voorbereiding op het inburgeringsexamen en het NT2-staatsexamen.',
        image: `${SITE_URL}/images/marieke-schipper.jpg`,
        knowsAbout: [
          'inburgeringsexamen',
          'KNM — Kennis van de Nederlandse Maatschappij',
          'NT2 — Nederlands als tweede taal',
          'NT2 staatsexamen',
          'Inburgering Nederland',
        ],
        hasCredential: [{
          '@type': 'EducationalOccupationalCredential',
          name: 'NT2-bevoegdheid',
          credentialCategory: 'Onderwijsbevoegdheid',
          recognizedBy: { '@type': 'Organization', name: 'DUO — Dienst Uitvoering Onderwijs' },
        }],
        worksFor: { '@id': ORG_ID },
        url,
      },
    ],
  };
}

export default async function DocentPage({ params }: Props) {
  const { locale } = await params;
  const lezen = getSkillAtLevel(DEFAULT_LEVEL, 'lezen')!;
  const luisteren = getSkillAtLevel(DEFAULT_LEVEL, 'luisteren')!;
  const schrijven = getSkillAtLevel(DEFAULT_LEVEL, 'schrijven')!;
  const spreken = getSkillAtLevel(DEFAULT_LEVEL, 'spreken')!;

  return (
    <>
      <JsonLd data={buildJsonLd(locale)} />

      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Over de docent' }]} />

      <GradientHero className="pb-16">
        <div className="flex flex-col md:flex-row gap-16 items-start">
          <div className="flex-1">
            <EyebrowBadge tone="dark" className="mb-5">Gecertificeerde NT2-docent</EyebrowBadge>
            <h1 className="font-headline font-extrabold text-white mb-5" style={{ fontSize: 'clamp(1.9rem,4vw,3rem)', letterSpacing: '-0.02em', lineHeight: '1.15' }}>
              <span className="block">Marieke Schipper —</span>
              <span style={{ color: '#fe762c' }}>NT2-docent</span>
            </h1>
            <p className="text-white/70 text-lg mb-8 leading-relaxed max-w-xl">
              Meer dan 10 jaar begeleidt Marieke inburgeraars door het Nederlandse onderwijs- en examenstelsel. De oefenexamens op dit platform zijn gebaseerd op directe ervaring in de klas — niet op theorie.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/oefenen" className="inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container px-6 py-3 rounded-xl font-bold text-sm hover:-translate-y-px transition-transform active:scale-95 no-underline" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)' }}>
                <span>Begin met oefenen</span>
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
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: 'rgba(254,118,44,0.25)', color: '#fe762c' }}>✓ Inburgering &amp; NT2</span>
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
              // Was "108 KNM-oefenvragen ontwikkeld". Nothing in the product substantiates
              // that number any more, and SEO/facts.md's rule is that an unsourceable figure is
              // cut rather than replaced with a guess. This one is read off the taxonomy.
              { value: String(getFormat(DEFAULT_LEVEL, 'lezen').examCount), label: 'Oefenexamens per onderdeel' },
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
                {/* Deliberately not a quotation. The sentence this replaces was a quote about the
                    KNM exam attributed to a real person; rewriting words inside quotation marks
                    puts a claim in her mouth that she never made. As prose it is the platform
                    speaking, which is what it always was. */}
                <p>Het inburgeringsexamen valt of staat bij bekendheid met het formaat. Wie weet hoe een tekst bij een vraag hoort, hoe lang een fragment duurt en wat er bij Schrijven en Spreken van je gevraagd wordt, verliest geen tijd meer aan de vorm en kan zich op de taal concentreren.</p>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h3 className="font-headline font-bold text-on-surface text-base mb-6">Loopbaanlijn</h3>
              <div className="flex flex-col gap-0">
                {[
                  { year: '2014', title: 'Start in het basisonderwijs', desc: 'Eerste jaren als leerkracht, focus op taalontwikkeling bij jonge leerlingen.' },
                  { year: '2016', title: 'NT2-bevoegdheid behaald', desc: 'Certificering als NT2-docent via erkende opleiding — toegang tot werken met volwassen anderstaligen.' },
                  { year: '2018', title: 'Inburgering & NT2-focus', desc: 'Start begeleiding van inburgeraars, gericht op het inburgeringsexamen en het NT2-staatsexamen.' },
                  { year: '2024', title: 'Oefenplatform inburgering', desc: 'Opzet van dit platform: oefenexamens voor de vier taalonderdelen en gidsen over het hele inburgeringstraject.' },
                ].map((item, i, arr) => (
                  <div key={item.year} className="grid pb-8" style={{ gridTemplateColumns: '80px 1fr', gap: '20px', position: 'relative' }}>
                    {i < arr.length - 1 && (
                      <div style={{ position: 'absolute', left: '89px', top: '8px', bottom: 0, width: '1px', background: 'linear-gradient(to bottom,#c4c6d2,transparent)' }} />
                    )}
                    {/* paddingRight clears the timeline dot, which is absolutely positioned at left:-26px in
                        the next column and was painting over the year's last digit — every year read
                        "201" at both breakpoints. */}
                    <div className="text-xs font-bold text-secondary text-right pt-0.5" style={{ letterSpacing: '0.04em', paddingRight: '10px' }}>{item.year}</div>
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
            {/* The counts and durations come from data/skills.ts, and are attributed to DUO's own
                practice exams rather than stated as an official norm — DUO publishes no item
                count anywhere. See SEO/facts.md §1. */}
            <FeatureCard
              icon={ClipboardList}
              title="Kennis van het examenformaat"
              description={`Kent het formaat van alle vier de taalonderdelen: Lezen ${formatCount(lezen.itemCount)} vragen in ${formatCount(lezen.durationMinutes)} minuten, Luisteren ${formatCount(luisteren.itemCount)} in ${formatCount(luisteren.durationMinutes)}, Schrijven ${formatCount(schrijven.itemCount)} opdrachten in ${formatCount(schrijven.durationMinutes)} en Spreken ${formatCount(spreken.itemCount)} vragen in ${formatCount(spreken.durationMinutes)} — zoals in DUO's eigen oefenexamens.`}
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
                Zo bereid je je voor op het inburgeringsexamen
              </h2>
              <p className="text-on-surface-variant mb-6 leading-relaxed text-sm">
                Marieke&apos;s aanpak is gebaseerd op drie pijlers: <strong className="text-on-surface">herhaling</strong>, <strong className="text-on-surface">begrip</strong> en <strong className="text-on-surface">situationeel denken</strong>. Het examen test niet of je losse woordjes kent — het test of je Nederlands begrijpt en gebruikt in alledaagse situaties.
              </p>
              <div className="flex flex-col gap-4">
                {[
                  { n: 1, title: 'Oefen met echte examenvragen', desc: 'Gebruik vragen die qua formaat en moeilijkheidsgraad overeenkomen met het echte examen.' },
                  { n: 2, title: 'Leer van je fouten', desc: 'Na elk fout antwoord lees je de uitleg. Begrijpen waarom het fout is, voorkomt herhaling.' },
                  { n: 3, title: 'Focus op je zwakste onderdeel', desc: 'Je portaal laat per onderdeel zien hoe je ervoor staat. Oefen het onderdeel waar je het minst scoort, niet het onderdeel dat je het leukst vindt.' },
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
            Tien gratis oefenvragen Lezen en tien Luisteren, met uitleg bij elke vraag. Geen account nodig.
          </p>
          <Link href="/oefenen" className="inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container px-8 py-4 rounded-xl font-bold hover:-translate-y-px transition-transform active:scale-95 no-underline" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)' }}>
            <span>Start gratis oefenen</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
        </div>
      </div>
    </>
  );
}
