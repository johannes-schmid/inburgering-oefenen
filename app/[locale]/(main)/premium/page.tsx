import { Fragment } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, Check, Headphones, Info, Play, X } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import Field from '@/components/glas/Field';
import PageField from '@/components/glas/PageField';
import SectionHeading from '@/components/glas/SectionHeading';
import ScoreRing from '@/components/glas/ScoreRing';
import { glasButton } from '@/components/glas/Button';
import PayBadges from '../_components/glas/PayBadges';
import FaqList from '../_components/glas/FaqList';
import PricingViewTracker from '@/components/PricingViewTracker';
import JsonLd from '@/components/JsonLd';
import { DEFAULT_LEVEL, KNM, LEVELS, formatCount, getFormat, getSkillAtLevel } from '@/data/skills';
import { ONA_CARD_COUNT } from '@/data/ona/cards';
import { isOnaAvailable, isOnaReviewed } from '@/lib/ona/access';
import { FREE_GRADED_PER_SKILL } from '@/lib/grading-limits';
import { FEATURES } from '@/lib/features';
import {
  MODULE_PRICE_CENTS,
  BUNDLE_PRICE_CENTS,
  BUNDLE_LIST_PRICE_CENTS,
  BUNDLE_SAVING_CENTS,
  euro,
  knmModule,
  modulesForLevel,
  onaModule,
} from '@/lib/pricing';
import PlanBuilder, { type BuilderAddOn, type BuilderLevel } from './PlanBuilder';
import WhatYouGet from './WhatYouGet';
import { langTag } from '@/lib/site';
import { breadcrumbs, courseId, PROVIDER_REF } from '@/lib/schema';

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
  nl: 'https://inburgeringoefenen.nl/nl/premium',
  en: 'https://inburgeringoefenen.nl/en/premium',
  ar: 'https://inburgeringoefenen.nl/ar/%D8%A7%D9%84%D8%A8%D8%A7%D9%82%D8%A9-%D8%A7%D9%84%D9%85%D9%85%D9%8A%D8%B2%D8%A9',
  'x-default': 'https://inburgeringoefenen.nl/nl/premium',
} as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'premium' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    alternates: {
      canonical: ALTERNATES[locale as 'nl' | 'en' | 'ar'] ?? ALTERNATES.nl,
      languages: ALTERNATES,
    },
  };
}

/* ─── De schermen in de telefoon ────────────────────────────────────────────────────────────────
   Nagebouwd uit de echte componentvormen van het portaal — de scorering, de antwoordrij, de
   criteriumbalk, de woordkaart. Ze staan achter `aria-hidden`: het is een plaatje van het product,
   wat iemand moet weten staat in de lijst ernaast. Elk getal is illustratieve schermstand. */
function ScoreMockup() {
  const lezen = getSkillAtLevel(DEFAULT_LEVEL, 'lezen')!;
  return (
    <div className="g-pm-mock g-pm-mock-score">
      <span className="g-mono">Lezen · oefenexamen 3</span>
      <ScoreRing correct={21} total={25} passPct={null} size={150} label="21 van 25 goed" caption="goed" className="mt-3" />
      <div className="g-pm-row mt-3">
        <div><b>Tijd</b><small>van de {formatCount(lezen.durationMinutes)} minuten</small></div>
        <span className="g-score-v g-tnum">52</span>
      </div>
      <div className="g-pm-row">
        <div><b>Fouten bekijken</b><small>4 vragen met uitleg</small></div>
        <span className="size-8 rounded-full bg-navy text-white flex items-center justify-center"><ArrowRight className="size-4" /></span>
      </div>
    </div>
  );
}

function LessonMockup() {
  return (
    <div className="g-pm-mock">
      <span className="g-mono">Les · module Luisteren</span>
      <div className="g-head text-[15px] font-bold mt-1.5">Een gesprek bij de balie</div>
      <div className="g-pm-row mt-3 !justify-start">
        <span className="size-9 rounded-full bg-navy text-white flex items-center justify-center shrink-0"><Play className="size-4 rtl-flip" fill="currentColor" /></span>
        <span className="flex-1 min-w-0">
          <b>Twee stemmen, net als in het examen</b>
          <span className="block h-1.5 rounded-full bg-mist-2 mt-2 overflow-hidden"><span className="block h-full w-[42%] bg-navy rounded-full" /></span>
        </span>
        <span className="g-tnum text-xs text-ink-2">2:34</span>
      </div>
      <p className="m-0 mt-3 rounded-g-sm bg-klei-tint px-3 py-2 text-[12px] leading-relaxed text-ink">
        <b className="block text-klei g-head text-[12px]">Uitleg van de docent</b>
        &ldquo;In dit soort gesprekken hoor je bijna altijd eerst een <strong>tijd</strong>{' '}of een <strong>dag</strong>. Schrijf die meteen op — daar gaat de vraag vaak over.&rdquo;
      </p>
    </div>
  );
}

function WoordenlijstMockup() {
  return (
    <div className="g-pm-mock text-center">
      <span className="g-mono">Woordenlijst · module Lezen</span>
      <div className="g-head text-[24px] font-extrabold tracking-[-0.03em] mt-3">de aanvraag</div>
      <p className="m-0 mt-1 text-xs text-ink-2">the application · الطلب</p>
      <div className="flex items-center justify-center gap-2 mt-3">
        <span className="g-bdg g-bdg-zacht !h-6"><Headphones />Beluister</span>
        <span className="text-xs text-ink-2 g-tnum">Kaart 7 van 24</span>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4">
        <span className="rounded-g-sm bg-wit py-2 text-xs font-bold text-ink-2">Nog even oefenen</span>
        <span className="rounded-g-sm bg-goed-tint py-2 text-xs font-bold text-goed-ink">Ik ken dit woord</span>
      </div>
    </div>
  );
}

function FeedbackMockup() {
  return (
    <div className="g-pm-mock">
      <span className="g-mono">Lezen · vraag 8</span>
      <div className="g-head text-[14px] font-bold text-ink mt-1.5 mb-3">Wanneer moet je het formulier terugsturen?</div>
      <div className="g-answers">
        <div className="g-ans g-ans-dim !py-2 !text-[13px]"><span className="g-ans-k !size-6">A</span><span className="g-ans-text">Binnen een week</span></div>
        <div className="g-ans g-ans-ok !py-2 !text-[13px]"><span className="g-ans-k !size-6">B</span><span className="g-ans-text">Voor 1 maart</span><span className="g-ans-tag"><Check /></span></div>
        <div className="g-ans g-ans-nok !py-2 !text-[13px]"><span className="g-ans-k !size-6">C</span><span className="g-ans-text">Na de vakantie</span><span className="g-ans-tag"><X /></span></div>
      </div>
      <p className="m-0 mt-3 flex gap-2 rounded-g-sm bg-mist px-3 py-2 text-[12px] leading-relaxed text-ink-2">
        <Info className="size-3.5 mt-0.5 shrink-0 text-navy" />
        De datum staat in de laatste regel van de brief: &ldquo;Stuur het formulier terug vóór 1 maart.&rdquo; De week uit antwoord A gaat over iets anders.
      </p>
    </div>
  );
}

function RubricMockup() {
  return (
    <div className="g-pm-mock">
      <span className="g-mono">Schrijven · opdracht 2</span>
      <div className="mt-2">
        {[
          { c: 'Inhoud', s: 3 },
          { c: 'Woordgebruik', s: 2 },
          { c: 'Grammatica', s: 2 },
        ].map(r => (
          <div key={r.c} className="g-crit">
            <b>{r.c}</b>
            <span className="g-pips">{[1, 2, 3].map(i => <i key={i} className={i <= r.s ? 'g-on' : undefined} />)}<em>{r.s}/3</em></span>
          </div>
        ))}
      </div>
      <p className="m-0 mt-2 rounded-g-sm bg-klei-tint px-3 py-2 text-[12px] leading-relaxed text-ink">
        <b className="block text-klei g-head text-[12px]">Volgens de rubric van de docent</b>
        Je e-mail heeft een goede aanhef en afsluiting. Let op het werkwoord: &ldquo;ik <strong>heb</strong>{' '}gebeld&rdquo;, niet &ldquo;ik ben gebeld&rdquo;.
      </p>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */
export default async function PremiumPage({ params }: Props) {
  const { locale } = await params;
  const tP = await getTranslations({ locale, namespace: 'premium_page' });
  const tS = await getTranslations({ locale, namespace: 'skills' });
  const tB = await getTranslations({ locale, namespace: 'breadcrumbs' });

  const price = euro(MODULE_PRICE_CENTS);
  const bundle = euro(BUNDLE_PRICE_CENTS);
  const list = euro(BUNDLE_LIST_PRICE_CENTS);
  const saving = euro(BUNDLE_SAVING_CENTS);

  /* Een onderdeel staat te koop zodra zijn formaat geteld is — dezelfde vlag die de sitemap en
     `robots` lezen. Vandaag valt alleen B1 Luisteren daarbuiten: de rij blijft zichtbaar, met de
     reden, want een weggelaten rij zou de bundelregel van B1 onverklaarbaar maken. */
  const levels: BuilderLevel[] = LEVELS.map(level => ({
    level,
    title: tP(`level_${level}_title`),
    sub: tP(`level_${level}_sub`),
    modules: modulesForLevel(level).map(m => {
      const items = getFormat(level, m.skill).itemCount === null ? null : m.itemCount;
      return {
        slug: m.slug,
        skill: m.skill,
        name: tS(`${m.skill}.name`),
        meta: items === null
          ? tP('row_meta_unverified', { exams: m.examCount })
          : tP(m.hasRubricFeedback ? 'row_meta_open' : 'row_meta_mcq', { exams: m.examCount, items }),
        available: items !== null,
      };
    }),
  }));

  const addOns: BuilderAddOn[] = [
    { slug: knmModule().slug, track: 'knm', title: 'KNM', meta: tP('addon_knm_meta', { exams: KNM.examCount }) },
    ...(isOnaAvailable()
      ? [{
          slug: onaModule().slug,
          track: 'ona' as const,
          title: 'ONA',
          meta: tP('addon_ona_meta', { cards: ONA_CARD_COUNT }),
          note: isOnaReviewed() ? undefined : tP('addon_ona_draft'),
        }]
      : []),
  ];

  // Gratis met een account: oefenexamen 1 van elk onderdeel dat online staat, plus KNM.
  const freeExams = levels.reduce((n, l) => n + l.modules.filter(m => m.available).length, 0) + 1;

  /* `'partial'` in de kolom "één onderdeel": alleen waar voor het onderdeel dat je koopt. Uitleg
     hoort bij Lezen/Luisteren, feedback per criterium bij Schrijven/Spreken. Een kaal vinkje
     daar zou beide beloven voor één module. Een string is een beperkte gratis variant. */
  type Cell = boolean | 'partial' | string;
  type Row = { label: string; soon?: boolean; free: Cell; module: Cell; bundle: Cell };
  const groups: { title: string; rows: Row[] }[] = [
    {
      title: tP('grp_practice'),
      rows: [
        { label: tP('feat_1'), free: true, module: true, bundle: true },
        { label: tP('feat_2'), free: false, module: true, bundle: true },
        { label: tP('feat_3'), free: false, module: false, bundle: true },
        { label: tP('feat_4'), free: true, module: true, bundle: true },
        { label: tP('feat_11'), free: true, module: true, bundle: true },
      ],
    },
    {
      title: tP('grp_feedback'),
      rows: [
        { label: tP('feat_5'), free: false, module: 'partial', bundle: true },
        { label: tP('feat_6'), free: tP('cell_free_graded', { n: FREE_GRADED_PER_SKILL }), module: 'partial', bundle: true },
      ],
    },
    {
      title: tP('grp_learn'),
      rows: [
        { label: tP('feat_7'), soon: !FEATURES.leren, free: false, module: true, bundle: true },
        { label: tP('feat_8'), soon: !FEATURES.woordkaarten, free: false, module: true, bundle: true },
      ],
    },
    {
      title: tP('grp_progress'),
      rows: [
        { label: tP('feat_9'), free: false, module: true, bundle: true },
        { label: tP('feat_10'), free: false, module: true, bundle: true },
        { label: tP('feat_12'), free: false, module: false, bundle: true },
      ],
    },
  ];

  const soon = (enabled: boolean) =>
    enabled ? null : <span className="g-pm-soon">{tP('module_soon')}</span>;

  /* Groen vinkje of grijs streepje (G3): "niet inbegrepen" is geen fout, dus nooit een rood kruis. */
  const cell = (state: Cell) => {
    if (state === 'partial') return <span className="g-pm-partial">{tP('cell_partial')}</span>;
    if (typeof state === 'string') return <span className="g-pm-partial g-pm-limited">{state}</span>;
    return state
      ? <span className="g-yes" role="img" aria-label={tP('cell_yes')}><Check aria-hidden="true" /></span>
      : <span className="g-nope" role="img" aria-label={tP('cell_no')} />;
  };

  /* ── Structured data ──────────────────────────────────────────────────────
   * `Product` + `AggregateOffer`, elk bedrag uit `lib/pricing.ts`: een tweede getypte prijs zou
   * een tweede bron zijn, en een verouderde `Offer` is een valse prijsclaim die Google nog lang
   * toont. Bewust **geen `aggregateRating` en geen `review`**, en geen `priceValidUntil`: dit zijn
   * doorlopende abonnementen, en een verzonnen einddatum laat Google het aanbod laten vallen.
   */
  const pageUrl = ALTERNATES[locale as 'nl' | 'en' | 'ar'] ?? ALTERNATES.nl;
  const a2Modules = modulesForLevel(DEFAULT_LEVEL);
  const monthly = (cents: number) => ({
    '@type': 'UnitPriceSpecification',
    price: (cents / 100).toFixed(2),
    priceCurrency: 'EUR',
    billingDuration: 1,
    billingIncrement: 1,
    unitCode: 'MON',
  });
  const moduleOffers = a2Modules.map(m => ({
    '@type': 'Offer',
    '@id': `${pageUrl}#offer-${m.slug}`,
    name: tP('schema_offer_module', { skill: tS(`${m.skill}.name`) }),
    price: (m.priceCents / 100).toFixed(2),
    priceCurrency: 'EUR',
    availability: 'https://schema.org/InStock',
    url: pageUrl,
    category: 'subscription',
    eligibleCustomerType: 'https://schema.org/Enduser',
    priceSpecification: monthly(m.priceCents),
    itemOffered: { '@id': courseId(locale, m.level, m.skill) },
  }));
  const bundleOffer = {
    '@type': 'Offer',
    '@id': `${pageUrl}#offer-bundle`,
    name: tP('schema_offer_bundle'),
    price: (BUNDLE_PRICE_CENTS / 100).toFixed(2),
    priceCurrency: 'EUR',
    availability: 'https://schema.org/InStock',
    url: pageUrl,
    category: 'subscription',
    priceSpecification: monthly(BUNDLE_PRICE_CENTS),
    itemOffered: a2Modules.map(m => ({ '@id': courseId(locale, m.level, m.skill) })),
  };
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        '@id': `${pageUrl}#product`,
        name: tP('schema_product_name'),
        description: tP('schema_product_description'),
        url: pageUrl,
        brand: PROVIDER_REF,
        category: 'Educational subscription',
        inLanguage: langTag(locale),
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'EUR',
          lowPrice: (MODULE_PRICE_CENTS / 100).toFixed(2),
          highPrice: (BUNDLE_PRICE_CENTS / 100).toFixed(2),
          offerCount: moduleOffers.length + 1,
          offers: [...moduleOffers, bundleOffer],
        },
      },
      breadcrumbs(locale, tB('home'), [{ name: tB('premium') }], pageUrl),
    ],
  };

  const slides = [
    { key: 'score', screen: <ScoreMockup />, title: tP('slide1_title'), desc: tP('slide1_desc') },
    { key: 'uitleg', screen: <FeedbackMockup />, title: tP('slide2_title'), desc: tP('slide2_desc') },
    { key: 'rubric', screen: <RubricMockup />, title: tP('slide3_title'), desc: tP('slide3_desc') },
    { key: 'les', screen: <LessonMockup />, title: tP('slide4_title'), desc: tP('slide4_desc') },
    { key: 'woorden', screen: <WoordenlijstMockup />, title: tP('slide5_title'), desc: tP('slide5_desc') },
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <PricingViewTracker />

      {/* ── 1. KOP: WAT JE KRIJGT ── de telefoon met vijf echte schermvormen als hero, de kop als h1
          ernaast (Superpower). Geen prijs hier: die staat in de configurator direct eronder. */}
      <PageField variant="gracht" className="g-under-nav g-pm-hero">
        <WhatYouGet
          slides={slides}
          heading={<SectionHeading as="h1" size="h1" onField title={tP('get_title')} muted={tP('get_muted')} />}
          footer={
            <a href="#pakket" className={glasButton({ variant: 'navy', size: 'lg', className: 'self-start' })}>
              {tP('get_cta')}
              <ArrowRight className="rtl-flip" aria-hidden="true" />
            </a>
          }
        />
      </PageField>

      {/* ── 2. CONFIGURATOR ── de kop links, de uitleg rechts (Calendly), daaronder de kaarten:
          gratis, één per niveau, KNM en ONA los erbij, en het totaal op Nacht. Ruim gezet: elk blok
          is één beslissing. */}
      <section className="g-sec g-pb-sec" aria-labelledby="pm-pakket-heading">
        <div className="g-wrap">
          <div id="pakket" className="g-pb-top">
            <SectionHeading id="pm-pakket-heading" size="h1" title={tP('hero_title')} muted={tP('hero_muted')} />
            <div className="g-pb-top-r">
              <p className="g-lead">{tP('hero_lead', { price, bundle, list })}</p>
              <ul className="g-checks mt-4">
                <li><Check aria-hidden="true" />{tP('hero_check1')}</li>
                <li><Check aria-hidden="true" />{tP('hero_check2')}</li>
              </ul>
            </div>
          </div>
          <PlanBuilder locale={locale} levels={levels} addOns={addOns} free={{ examCount: freeExams, graded: FREE_GRADED_PER_SKILL }} />
        </div>
      </section>

      {/* ── 3. DE VERGELIJKING ── glas.html §12, gegroepeerd per soort (Calendly). De aanbevolen kolom
          loopt als één navy baan; groen vinkje of grijs streepje. Op smal schuift de tabel. */}
      <section className="g-sec g-sec-tier" aria-labelledby="pm-compare-heading">
        <div className="g-wrap">
          <SectionHeading id="pm-compare-heading" title={tP('compare_title')} muted={tP('compare_muted')} size="h1" className="mb-8" />
          <div className="g-ptab-scroll">
            <div className="g-ptab">
              <div className="g-phd"><span className="g-sr">{tP('compare_title')}</span></div>
              <div className="g-phd g-c">
                <b>{tP('col_free')}</b>
                <span className="g-amt g-tnum">€0</span>
                <Link href="/register" className={glasButton({ variant: 'ghost', size: 'sm' })}>{tP('free_cta_short')}</Link>
              </div>
              <div className="g-phd g-c">
                <b>{tP('col_module')}</b>
                <span className="g-amt g-tnum">{price}<small>{tP('per_month_short')}</small></span>
                <a href="#pakket" className={glasButton({ variant: 'ghost', size: 'sm' })}>{tP('compare_pick')}</a>
              </div>
              <div className="g-phd g-c g-hl g-top">
                <b>{tP('col_bundle')}</b>
                <span className="g-amt g-tnum">{bundle}<small>{tP('per_month_short')}</small></span>
                <a href="#pakket" className={glasButton({ variant: 'oranje', size: 'sm' })}>{tP('compare_pick')}</a>
              </div>
              {groups.map((g, gi) => (
                <Fragment key={g.title}>
                  <div className="g-pgrp"><span>{g.title}</span></div>
                  <div className="g-pgrp" />
                  <div className="g-pgrp" />
                  <div className="g-pgrp g-hl" />
                  {g.rows.map((f, i) => {
                    const r2 = i % 2 === 1 ? ' g-r2' : '';
                    const last = gi === groups.length - 1 && i === g.rows.length - 1;
                    return (
                      <Fragment key={f.label}>
                        <div className={`g-f${r2}`}><span>{f.label}{f.soon ? soon(false) : null}</span></div>
                        <div className={`g-c${r2}`}>{cell(f.free)}</div>
                        <div className={`g-c${r2}`}>{cell(f.module)}</div>
                        <div className={`g-c g-hl g-e${r2}${last ? ' g-bot' : ''}`}>{cell(f.bundle)}</div>
                      </Fragment>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
          <PayBadges label={tP('trust_line')} className="mt-4 justify-end" />
        </div>
      </section>

      {/* ── 4. FAQ EN DE LAATSTE KNOP ── */}
      <section className="g-sec" aria-labelledby="pm-faq-heading">
        <div className="g-wrap grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] items-start">
          <div>
            <h2 id="pm-faq-heading" className="g-sr">FAQ</h2>
            <FaqList
              items={[
                { question: tP('faq_q1'), answer: tP('faq_a1', { price }) },
                { question: tP('faq_q2'), answer: tP('faq_a2', { bundle, list, saving }) },
                { question: tP('faq_q7'), answer: tP('faq_a7', { price }) },
                { question: tP('faq_q3'), answer: tP('faq_a3') },
                { question: tP('faq_q4'), answer: tP('faq_a4') },
                { question: tP('faq_q5'), answer: tP('faq_a5') },
                { question: tP('faq_q6'), answer: tP('faq_a6') },
              ]}
            />
          </div>

          <Field variant="nacht-stil" className="g-price lg:sticky lg:top-[calc(var(--nav-h)+24px)]">
            <h2 className="g-head g-head-3 !text-white">{tP('final_cta_heading')}</h2>
            <p className="m-0 text-sm text-white/70">{tP('final_cta_sub', { price, bundle })}</p>
            <a href="#pakket" className={glasButton({ variant: 'wit', className: 'w-full' })}>
              {tP('get_cta')}
              <ArrowRight className="rtl-flip" aria-hidden="true" />
            </a>
            <PayBadges label={tP('trust_line')} />
          </Field>
        </div>
      </section>
    </>
  );
}
