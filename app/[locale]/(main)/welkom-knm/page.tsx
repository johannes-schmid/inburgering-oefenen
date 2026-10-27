import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, Check } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import PageField from '@/components/glas/PageField';
import SectionHeading from '@/components/glas/SectionHeading';
import { glasButton } from '@/components/glas/Button';
import PayBadges from '../_components/glas/PayBadges';
import FaqList from '../_components/glas/FaqList';
import HomeTracks from '../_components/glas/HomeTracks';
import { DEFAULT_LEVEL, getFormat } from '@/data/skills';
import { MODULE_PRICE_CENTS, BUNDLE_PRICE_CENTS, euro } from '@/lib/pricing';
import { KNM_MIGRATION_CODE, KNM_MIGRATION_PCT, knmMigrationPriceCents } from '@/lib/knm-migration';
import CategoryMark from '@/components/horizon/CategoryMark';
import CodeChip from './CodeChip';

type Props = { params: Promise<{ locale: string }> };

const DUO_COSTS_URL = 'https://www.inburgeren.nl/inburgeren-betalen/index.jsp';

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/* Een campagnepagina voor de knmoefenen.nl-lijst: noindex, want hij beantwoordt geen zoekvraag en
 * mag /premium niet beconcurreren. Hij staat daarom ook niet in de sitemap. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'welkom_knm' });
  return {
    title: t('meta_title'),
    description: t('meta_description', { pct: KNM_MIGRATION_PCT, code: KNM_MIGRATION_CODE }),
    robots: { index: false, follow: true },
  };
}

/**
 * /welkom-knm — waar de knop in de overstapmail naartoe gaat (lib/email/templates/knmMigration.ts).
 *
 * De lezer kent ons als KNM Oefenen, en de meesten betaalden daar nooit. Dus: eerst dat je hier
 * op dezelfde manier oefent, nu ook voor je taalexamen; gratis beginnen is de hoofdknop. Daarna
 * wat er staat (de trackband van de homepage), dan de prijzen mét de code al verrekend, zodat
 * niemand zelf hoeft te rekenen. "Kies je pakket" gaat naar het pakkettenscherm met `?code=`.
 */
export default async function WelkomKnmPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'welkom_knm' });

  const vars = { pct: KNM_MIGRATION_PCT, code: KNM_MIGRATION_CODE };
  const checkout = {
    pathname: '/register' as const,
    query: { next: `/${locale}/dashboard/pakketten?code=${KNM_MIGRATION_CODE}` },
  };

  const tiers = [
    { key: 'free', name: t('price_free_name'), body: t('price_free_body'), now: 0, was: null },
    {
      key: 'module',
      name: t('price_module_name'),
      body: t('price_module_body', { exams: getFormat(DEFAULT_LEVEL, 'lezen').examCount }),
      now: knmMigrationPriceCents(MODULE_PRICE_CENTS),
      was: MODULE_PRICE_CENTS,
    },
    {
      key: 'bundle',
      name: t('price_bundle_name'),
      body: t('price_bundle_body'),
      now: knmMigrationPriceCents(BUNDLE_PRICE_CENTS),
      was: BUNDLE_PRICE_CENTS,
    },
  ];

  return (
    <>
      <PageField variant="dageraad" className="g-under-nav">
        <div className="g-wk-hero">
          <div className="g-wk-hero-copy">
            <p className="g-wk-eyebrow">
              <img src="/images/knm-oefenen-logo.svg" width={34} height={34} alt="" />
              <span>{t.rich('hero_eyebrow', { b: (c) => <b>{c}</b> })}</span>
            </p>
            <h1 className="g-head g-head-1 g-on-field">
              <span className="g-head-muted">{t('hero_line1')}</span> {t('hero_line2')}
            </h1>
            <p className="g-wk-lead">{t('hero_lead')}</p>
            <div className="g-wk-deal">
              <div className="g-wk-deal-row">
                <span className="g-wk-deal-pct">{t('hero_discount', vars)}</span>
                <CodeChip code={KNM_MIGRATION_CODE} copyLabel={t('code_copy')} copiedLabel={t('code_copied')} />
              </div>
              <p className="g-wk-deal-body">
                {t('hero_discount_body', { now: euro(knmMigrationPriceCents(MODULE_PRICE_CENTS)) })}
              </p>
            </div>
            <div className="g-wk-actions">
              <Link href="/register" className={glasButton({ variant: 'navy', size: 'lg' })}>
                {t('hero_free')}
                <ArrowRight className="rtl-flip" aria-hidden="true" />
              </Link>
              <a href="#prijzen" className={glasButton({ variant: 'ghost', size: 'lg' })}>
                {t('hero_prices')}
              </a>
            </div>
          </div>

          {/* Dezelfde scène als de hero van de homepage: wat er nieuw is (de taalonderdelen), niet
              nog een KNM-vraag die ze al kennen. */}
          <div className="g-hero-scene" aria-hidden="true" dir="ltr" lang="nl">
            <div className="g-phone g-glass g-glass-strong">
              <span className="g-phone-notch" />
              <div className="g-phone-big">
                <span>Je examen over</span>
                <b className="g-tnum">12 dagen</b>
              </div>
              <div className="g-phone-row">
                <CategoryMark category="luisteren" size={36} />
                <span><b>Luisteren A2 · vraag 4</b>Ga verder waar je was.</span>
              </div>
              <div className="g-phone-row">
                <span className="g-phone-ok"><Check /></span>
                <span><b>Schrijven nagekeken</b>Je feedback staat klaar.</span>
              </div>
            </div>
            <div className="g-phone-pill g-glass g-glass-strong">
              <span className="g-phone-num">2</span>
              <span><b>Lezen A2 · oefenexamen 2</b>Klaar. Hierna: Schrijven.</span>
            </div>
          </div>
        </div>
      </PageField>

      <HomeTracks locale={locale} />

      <section id="prijzen" className="g-sec g-sec-tier g-wk-prices" aria-labelledby="wk-price-heading">
        <div className="g-wrap">
          <SectionHeading id="wk-price-heading" title={t('price_heading')} muted={t('price_muted', vars)} className="mb-10" />
          <ul className="g-wk-tiers">
            {tiers.map(tier => (
              <li key={tier.key} className="g-wk-tier">
                <h3 className="g-wk-tier-name">{tier.name}</h3>
                <p className="g-wk-tier-amt">
                  {tier.was !== null && (
                    <>
                      <span className="g-sr">{t('price_was')}</span>
                      <s className="g-wk-tier-was">{euro(tier.was)}</s>
                      <span className="g-sr">{t('price_now', vars)}</span>
                    </>
                  )}
                  <span className="g-wk-tier-now">{tier.now === 0 ? "€0" : euro(tier.now)}</span>
                  {tier.was !== null && <small>{t('price_per_month')}</small>}
                </p>
                <p className="g-wk-tier-body">{tier.body}</p>
              </li>
            ))}
          </ul>
          <div className="g-wk-buy">
            <Link href={checkout} className={glasButton({ variant: 'navy', size: 'lg' })}>
              {t('price_cta')}
              <ArrowRight className="rtl-flip" aria-hidden="true" />
            </Link>
            <PayBadges label={t('trust_line')} />
          </div>
          <p className="g-wk-fine">
            {t.rich('price_fine', {
              duo: (chunks) => <a href={DUO_COSTS_URL} target="_blank" rel="noopener noreferrer">{chunks}</a>,
            })}
          </p>
        </div>
      </section>

      <section className="g-sec" aria-labelledby="wk-faq-heading">
        <div className="g-wrap g-wk-faq">
          <h2 id="wk-faq-heading" className="g-head g-head-3 mb-6">{t('faq_heading')}</h2>
          <FaqList
            firstOpen
            items={[
              { question: t('faq_q_same'), answer: t('faq_a_same') },
              { question: t('faq_q1'), answer: t('faq_a1') },
              { question: t('faq_q2'), answer: t('faq_a2', vars) },
              { question: t('faq_q3'), answer: t('faq_a3') },
            ]}
          />
        </div>
      </section>
    </>
  );
}
