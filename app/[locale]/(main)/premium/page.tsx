import { Fragment } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ArrowDown, ArrowRight, Check, Headphones, Info, Play, X } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import CategoryMark from '@/components/horizon/CategoryMark';
import ExamMark from '@/components/horizon/ExamMark';
import Field from '@/components/glas/Field';
import PageField from '@/components/glas/PageField';
import SectionHeading from '@/components/glas/SectionHeading';
import { glasButton } from '@/components/glas/Button';
import PayBadges from '../_components/glas/PayBadges';
import FaqList from '../_components/glas/FaqList';
import PricingViewTracker from '@/components/PricingViewTracker';
import JsonLd from '@/components/JsonLd';
import { DEFAULT_LEVEL, SKILLS, formatCount, getSkill, getSkillAtLevel } from '@/data/skills';
import { FEATURES } from '@/lib/features';
import {
  MODULE_PRICE_CENTS,
  BUNDLE_PRICE_CENTS,
  BUNDLE_LIST_PRICE_CENTS,
  BUNDLE_SAVING_CENTS,
  euro,
  modulesForLevel,
  totalExamsForLevel,
} from '@/lib/pricing';
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

/* ─── De paneeltjes bij "wat er in een module zit" ───────────────────────────────────────────────
   Glas (§04): glas óp een veld, met de echte componentvormen van het portaal — de antwoordrij, de
   criteriumbalk, de woordkaart. Ze staan achter `aria-hidden`: het is een plaatje van het product,
   wat iemand moet weten staat in de tekst eronder. Elk getal is illustratieve schermstand. */
function ExamensMockup() {
  const lezen = getSkillAtLevel(DEFAULT_LEVEL, 'lezen')!;
  return (
    <div dir="ltr" lang="nl" className="g-glass g-glass-strong g-pm-mock">
      {[
        { n: 1, s: '84%' },
        { n: 2, s: '91%' },
        { n: 3, s: null },
      ].map(ex => (
        <div key={ex.n} className="g-pm-row">
          <div>
            <b>Lezen · oefenexamen {ex.n}</b>
            <small>{formatCount(lezen.itemCount)} vragen · {formatCount(lezen.durationMinutes)} min</small>
          </div>
          {ex.s ? (
            <span className="flex items-center gap-2">
              <span className="g-score-v g-tnum">{ex.s}</span>
              <span className="g-bdg g-bdg-goed !h-6 !px-2"><Check /></span>
            </span>
          ) : (
            <span className="size-8 rounded-full bg-navy text-white flex items-center justify-center"><ArrowRight className="size-4 rtl-flip" /></span>
          )}
        </div>
      ))}
    </div>
  );
}

function LessonMockup() {
  return (
    <div dir="ltr" lang="nl" className="g-glass g-glass-strong g-pm-mock">
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
    <div dir="ltr" lang="nl" className="g-glass g-glass-strong g-pm-mock text-center">
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
    <div dir="ltr" lang="nl" className="g-glass g-glass-strong g-pm-mock">
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
    <div dir="ltr" lang="nl" className="g-glass g-glass-strong g-pm-mock">
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
  // This page sells A2: its prices, its bundle copy and its free offer are all A2's, and B1
  // has no published content to advertise. Explicitly A2 rather than "all modules".
  const a2Modules = modulesForLevel(DEFAULT_LEVEL);
  const examsPerModule = a2Modules[0].examCount;
  const totalExams = totalExamsForLevel(DEFAULT_LEVEL);

  /* Lessons and the word list are part of every module, but their A2 content is not
     authored yet — `lib/features.ts` still has them off. Mark those rows honestly rather
     than advertising something that does not exist; the tags disappear when the flags flip. */
  const soon = (enabled: boolean) =>
    enabled ? null : <span className="g-pm-soon">{tP('module_soon')}</span>;

  /* `'partial'` in the single-module column: true only for the module you actually buy —
     explanations apply to Lezen/Luisteren, rubric feedback to Schrijven/Spreken. A plain
     checkmark there would promise both for one €12,95 module. */
  type Cell = boolean | 'partial';
  const allFeatures: { label: string; soon?: boolean; free: Cell; module: Cell; bundle: Cell }[] = [
    { label: tP('feat_1'),                          free: true,  module: true,  bundle: true  },
    { label: tP('feat_2'),                          free: false, module: true,  bundle: true  },
    { label: tP('feat_3'),                          free: false, module: false, bundle: true  },
    { label: tP('feat_4'),                          free: true,  module: true,  bundle: true  },
    { label: tP('feat_5'),                          free: false, module: 'partial', bundle: true },
    { label: tP('feat_6'),                          free: false, module: 'partial', bundle: true },
    { label: tP('feat_7'),  soon: !FEATURES.leren,        free: false, module: true,  bundle: true  },
    { label: tP('feat_8'),  soon: !FEATURES.woordkaarten, free: false, module: true,  bundle: true  },
    { label: tP('feat_9'),                          free: false, module: true,  bundle: true  },
    { label: tP('feat_10'),                         free: false, module: true,  bundle: true  },
    { label: tP('feat_11'),                         free: true,  module: true,  bundle: true  },
    { label: tP('feat_12'),                         free: false, module: false, bundle: true  },
  ];

  /* Groen vinkje of grijs streepje (G3): "niet inbegrepen" is geen fout, dus nooit een rood kruis. */
  const cell = (state: Cell) => {
    if (state === 'partial') return <span className="g-pm-partial">{tP('cell_partial')}</span>;
    return state
      ? <span className="g-yes" role="img" aria-label={tP('cell_yes')}><Check aria-hidden="true" /></span>
      : <span className="g-nope" role="img" aria-label={tP('cell_no')} />;
  };

  /* ── Structured data ──────────────────────────────────────────────────────
   * `Product` + `AggregateOffer`: this page's whole job is to state what the modules cost,
   * and it was the one commercial page on the site with no structured data at all.
   *
   * Every figure is read from `lib/pricing.ts`. Retyping €9,95 here would create a second
   * source of truth for a price, and a stale `Offer` is a false price claim that Google shows
   * in the SERP long after the page itself was corrected.
   *
   * There is deliberately **no `aggregateRating` and no `review`**. The product has no
   * customers yet; three fabricated testimonials and a 4.8 rating came across in the KNM fork
   * and were removed. Review markup goes back when the reviews are real.
   *
   * `priceValidUntil` is omitted rather than guessed — these are open-ended subscriptions, and
   * an invented expiry date makes Google drop the offer once it passes.
   */
  const pageUrl = ALTERNATES[locale as 'nl' | 'en' | 'ar'] ?? ALTERNATES.nl;
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
    // The recurring nature is the offer's most material term, so it is stated as data and
    // not only in the copy: €9,95 read as a one-off price would misrepresent the product.
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price: (m.priceCents / 100).toFixed(2),
      priceCurrency: 'EUR',
      billingDuration: 1,
      billingIncrement: 1,
      unitCode: 'MON',
    },
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
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price: (BUNDLE_PRICE_CENTS / 100).toFixed(2),
      priceCurrency: 'EUR',
      billingDuration: 1,
      billingIncrement: 1,
      unitCode: 'MON',
    },
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

  const portalLabel = tP('hero_ghost').replace(/\s*[→←]\s*$/, '');
  const moduleFeatures = (mod: (typeof a2Modules)[number]) => [
    tP('module_exams', { count: mod.examCount }),
    mod.hasRubricFeedback
      ? tP('module_items_open', { count: formatCount(mod.itemCount) })
      : tP('module_items', { count: formatCount(mod.itemCount) }),
    <>{tP('feat_7')}{soon(FEATURES.leren)}</>,
    <>{tP('feat_8')}{soon(FEATURES.woordkaarten)}</>,
    mod.hasRubricFeedback ? tP('module_feedback') : tP('module_explanation'),
  ];

  /* De drie plankolommen van de vergelijking (glas.html §12). De aanbevolen kolom — alle vier —
     loopt als één navy baan van boven naar beneden: navy kop, getinte cellen, afgeronde voet. */
  const lastRow = allFeatures.length - 1;

  return (
    <>
      <JsonLd data={jsonLd} />
      <PricingViewTracker />

      {/* ── 1. DE KOP ──
          Gracht zonder gloed: de oranje wijzer van deze pagina staat in de vergelijking, op de kolom
          die we aanraden. Rechts staan de twee prijzen die de pagina verkoopt, uit `lib/pricing.ts`. */}
      <PageField variant="gracht" className="g-under-nav">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] items-center">
          <div>
            <h1 className="g-head g-head-1">{tP('hero_heading')}</h1>
            <p className="g-lead mt-5">{tP('hero_sub', { price })}</p>
            <ul className="g-checks flex-col !gap-2.5 mt-6 !text-[0.9375rem] !text-ink">
              {[
                tP('hero_bullet1', { price }),
                tP('hero_bullet2', { exams: examsPerModule }),
                tP('hero_bullet3'),
                tP('hero_bullet4', { bundle, list }),
                tP('hero_bullet5'),
              ].map(b => (
                <li key={b} className="!items-start"><Check aria-hidden="true" className="mt-1" />{b}</li>
              ))}
            </ul>
            <div className="g-ctas">
              <a href="#modules" className={glasButton({ variant: 'navy', size: 'lg' })}>
                {tP('hero_cta')}
                <ArrowDown aria-hidden="true" />
              </a>
              <Link href="/dashboard" className={glasButton({ variant: 'ghost', size: 'lg' })}>
                {portalLabel}
              </Link>
            </div>
            <p className="m-0 mt-4 text-sm text-ink-2">{tP('hero_price_note')}</p>
          </div>

          <div className="g-glass g-glass-strong g-pm-hero-card" aria-hidden="true">
            <div className="g-pm-hero-row">
              <div className="g-pm-marks">
                <CategoryMark category="lezen" size={40} />
              </div>
              <div>
                <b className="g-tnum">{price}</b>
                <small>{tP('col_module')} · {tP('module_price_note')}</small>
              </div>
            </div>
            <div className="g-pm-hero-row">
              <ExamMark track="a2" size={40} />
              <div>
                <b className="g-tnum">{bundle}</b>
                <small>{tP('bundle_label')} · {tP('bundle_price_note')}</small>
              </div>
            </div>
            <ul className="g-checks !text-[0.8125rem] px-1">
              <li><Check aria-hidden="true" />{tP('trust_line')}</li>
            </ul>
          </div>
        </div>
      </PageField>

      {/* ── 2. DE MODULES ── vier prijskaarten (§08 "Prijskaart"), daaronder de bundel op Nacht — het
          ene donkere blok van de pagina — naast de gratis kaart. Onder elke knop naar de checkout
          staan de betaalmerken. */}
      <section id="modules" className="g-sec g-sec-tier scroll-mt-24" aria-labelledby="pm-modules-heading">
        <div className="g-wrap">
          <SectionHeading id="pm-modules-heading" title={tP('pricing_heading')} aside={tP('pricing_sub', { price })} className="mb-10" />

          <div className="g-pm-mods">
            {a2Modules.map(mod => {
              const skill = getSkill(mod.skill)!;
              return (
                <div key={mod.slug} className="g-price g-pm-mod">
                  <CategoryMark category={mod.skill} size={44} />
                  <h3>{tS(`${skill.key}.name`)}</h3>
                  <p>{tS(`${skill.key}.tagline`)}</p>
                  <div className="g-price-amt g-tnum">{euro(mod.priceCents)}<small>{tP('module_price_note')}</small></div>
                  <ul>
                    {moduleFeatures(mod).map((f, i) => (
                      <li key={i}><Check aria-hidden="true" /><span>{f}</span></li>
                    ))}
                  </ul>
                  <Link href={{ pathname: '/register', query: { module: mod.slug } }} className={glasButton({ variant: 'ghost' })}>
                    {tP('module_cta')}
                  </Link>
                  <PayBadges />
                </div>
              );
            })}
          </div>

          <div className="g-pm-pair">
            <Field variant="nacht-stil" className="g-price">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="g-mono !text-white/65">{tP('bundle_label')}</span>
                <span className="g-ptag">{tP('bundle_badge')}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {SKILLS.map(s => <CategoryMark key={s.slug} category={s.slug} size={36} tone="dark" />)}
                <span className="text-xs text-white/65 ms-1">{tP('bundle_scope')}</span>
              </div>
              <div className="flex items-end gap-x-3 gap-y-1 flex-wrap">
                <div className="g-price-amt g-tnum">{bundle}<small>{tP('bundle_price_note')}</small></div>
                <span className="text-sm text-white/55 line-through mb-1">{tP('bundle_was', { list })}</span>
              </div>
              <p className="m-0 text-sm font-semibold text-oranje-zacht">{tP('bundle_saving', { saving })}</p>
              <ul className="g-pm-bundle-f">
                {[
                  tP('bundle_f1', { exams: totalExams }),
                  tP('bundle_f2'),
                  tP('bundle_f3'),
                  tP('bundle_f4'),
                  tP('bundle_f5'),
                ].map(f => (
                  <li key={f}><Check aria-hidden="true" /><span>{f}</span></li>
                ))}
              </ul>
              <Link href={{ pathname: '/register', query: { module: 'all' } }} className={glasButton({ variant: 'wit', size: 'lg', className: 'self-start mt-2' })}>
                {tP('bundle_cta')}
                <ArrowRight className="rtl-flip" aria-hidden="true" />
              </Link>
              <PayBadges label={tP('trust_line')} />
            </Field>

            <div className="g-price g-solid">
              <span className="g-mono">{tP('free_label')}</span>
              <div className="g-price-amt g-tnum">€0<small>{tP('free_price_note')}</small></div>
              <ul>
                {[tP('free_f1'), tP('free_f2')].map(f => (
                  <li key={f}><Check aria-hidden="true" /><span>{f}</span></li>
                ))}
                {[tP('free_f3'), tP('free_f4')].map(f => (
                  <li key={f} className="text-ink-2">
                    <span className="g-nope shrink-0 mt-[11px]" role="img" aria-label={tP('cell_no')} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/oefenen" className={glasButton({ variant: 'ghost', className: 'self-start mt-auto' })}>
                {tP('compare_free_cta')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. WAT ER IN EEN MODULE ZIT ── vier uitlegkaarten met een paneeltje op een veld. Elk getal in
          de paneeltjes is illustratieve schermstand, geen claim; de formaatgetallen komen uit
          `data/skills.ts`. */}
      <section className="g-sec" aria-labelledby="pm-features-heading">
        <div className="g-wrap">
          <SectionHeading id="pm-features-heading" title={tP('features_heading')} aside={tP('features_sub')} className="mb-10" />
          <div className="g-pm-feats">
            {[
              { mockup: <ExamensMockup />,      title: tP('feature1_title'),      desc: tP('feature1_desc'),      soon: false },
              { mockup: <LessonMockup />,       title: tP('feature_audio_title'), desc: tP('feature_audio_desc'), soon: !FEATURES.leren },
              { mockup: <WoordenlijstMockup />, title: tP('feature2_title'),      desc: tP('feature2_desc'),      soon: !FEATURES.woordkaarten },
              { mockup: <FeedbackMockup />,     title: tP('feature3_title'),      desc: tP('feature3_desc'),      soon: false },
              { mockup: <RubricMockup />,       title: tP('feature4_title'),      desc: tP('feature4_desc'),      soon: false },
            ].map(f => (
              <div key={f.title} className="g-pm-feat">
                <Field variant="nevel" className="g-pm-feat-vis" aria-hidden="true">{f.mockup}</Field>
                <div className="g-pm-feat-tx">
                  <h3>{f.title}{f.soon ? soon(false) : null}</h3>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}

            {/* De docent achter de opgaven (§08 "Docent"). */}
            <div className="g-pm-feat">
              <div className="g-docent !grid-cols-1 sm:!grid-cols-[140px_minmax(0,1fr)] !rounded-none h-full">
                <img src="/images/amber-van-der-zalm-264.webp" alt="Amber van der Zalm" width={264} height={264} className="!min-h-[200px]" />
                <div className="g-docent-t" dir="ltr" lang="nl">
                  <p className="g-docent-line !text-[1.0625rem]">
                    &ldquo;AI helpt bij het opstellen, maar elke opgave gaat eerst langs mij. De beoordelingsrubric voor Schrijven en Spreken komt ook van mij, en ik controleer de beoordelingen.&rdquo;
                  </p>
                  <div className="g-docent-who">
                    <b>Gemaakt door Amber van der Zalm — gecertificeerde NT2-docent</b>
                  </div>
                  <ul className="g-metachips list-none p-0 m-0">
                    <li className="g-metachip bg-mist">10 jaar in het onderwijs</li>
                    <li className="g-metachip bg-mist g-tnum">{totalExams} oefenexamens</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. DE VERGELIJKING ── glas.html §12: drie plankolommen, de aanbevolen kolom één navy baan,
          groen vinkje of grijs streepje — "niet inbegrepen" is geen fout, dus nooit een rood kruis.
          Op smal schuift de tabel horizontaal; de rijen blijven naast elkaar leesbaar. */}
      <section className="g-sec g-sec-tier" aria-labelledby="pm-compare-heading">
        <div className="g-wrap">
          <SectionHeading id="pm-compare-heading" title={tP('plans_compare')} size="h1" className="mb-8" />
          <div className="g-ptab-scroll">
            <div className="g-ptab">
              <div className="g-phd"><span className="g-sr">{tP('plans_compare')}</span></div>
              <div className="g-phd g-c">
                <b>{tP('col_free')}</b>
                <span className="g-amt g-tnum">€0</span>
                <Link href="/oefenen" className={glasButton({ variant: 'ghost', size: 'sm' })}>{tP('compare_free_cta')}</Link>
              </div>
              <div className="g-phd g-c">
                <b>{tP('col_module')}</b>
                <span className="g-amt g-tnum">{price}<small>{tP('module_price_note')}</small></span>
                <a href="#modules" className={glasButton({ variant: 'ghost', size: 'sm' })}>{tP('module_cta')}</a>
              </div>
              <div className="g-phd g-c g-hl g-top">
                <span className="g-bdg g-bdg-glasd !h-6 !text-[11.5px]">{tP('bundle_badge')}</span>
                <b>{tP('col_bundle')}</b>
                <span className="g-amt g-tnum">{bundle}<small>{tP('bundle_price_note')}</small></span>
                <Link href={{ pathname: '/register', query: { module: 'all' } }} className={glasButton({ variant: 'oranje', size: 'sm' })}>
                  {tP('bundle_cta')}
                </Link>
              </div>
              {allFeatures.map((f, i) => {
                const r2 = i % 2 === 0 ? ' g-r2' : '';
                return (
                  <Fragment key={f.label}>
                    <div className={`g-f${r2}`}>
                      <span>{f.label}{f.soon ? soon(false) : null}</span>
                    </div>
                    <div className={`g-c${r2}`}>{cell(f.free)}</div>
                    <div className={`g-c${r2}`}>{cell(f.module)}</div>
                    <div className={`g-c g-hl g-e${r2}${i === lastRow ? ' g-bot' : ''}`}>{cell(f.bundle)}</div>
                  </Fragment>
                );
              })}
            </div>
          </div>
          <PayBadges label={tP('trust_line')} className="mt-4 justify-end" />
        </div>
      </section>

      {/* ── 5. FAQ EN DE LAATSTE KNOP ── */}
      <section className="g-sec" aria-labelledby="pm-faq-heading">
        <div className="g-wrap grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] items-start">
          <div>
            <h2 id="pm-faq-heading" className="g-sr">FAQ</h2>
            <FaqList
              items={[
                { question: tP('faq_q1'), answer: tP('faq_a1', { price }) },
                { question: tP('faq_q2'), answer: tP('faq_a2', { bundle, list, saving }) },
                { question: tP('faq_q3'), answer: tP('faq_a3') },
                { question: tP('faq_q4'), answer: tP('faq_a4') },
                { question: tP('faq_q5'), answer: tP('faq_a5') },
                { question: tP('faq_q6'), answer: tP('faq_a6') },
              ]}
            />
          </div>

          <div className="g-price g-solid lg:sticky lg:top-[calc(var(--nav-h)+24px)]">
            <h2 className="g-head g-head-3 !text-navy">{tP('final_cta_heading')}</h2>
            <p className="m-0 text-sm text-ink-2">{tP('final_cta_sub')}</p>
            <Link href={{ pathname: '/register', query: { module: 'all' } }} className={glasButton({ variant: 'navy', className: 'w-full' })}>
              {tP('bundle_cta')} — {bundle}
            </Link>
            <a href="#modules" className={glasButton({ variant: 'ghost', className: 'w-full' })}>
              {tP('module_cta')} — {price}
            </a>
            <PayBadges label={tP('trust_note').replace(/^·\s*/, '')} />
          </div>
        </div>
      </section>
    </>
  );
}
