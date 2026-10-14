import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import PageField from '@/components/glas/PageField';
import SectionHeading from '@/components/glas/SectionHeading';
import { glasButton } from '@/components/glas/Button';
import Crumbs from '../_components/glas/Crumbs';
import { alternatesFor } from '@/lib/schema';

type Props = { params: Promise<{ locale: string }> };

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'redactie' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    alternates: alternatesFor(locale, 'redactie'),
  };
}

/**
 * Het redactiebeleid: waar AI meedoet, wie wat nakijkt en wie verantwoordelijk is.
 *
 * Drie lezers. De kandidaat die wil weten of hij de opgaven kan vertrouwen. Google, dat sinds
 * 01-10 vraagt om het "hoe" van een pagina uit te leggen als een lezer zich dat zou afvragen. En
 * de AI-verordening: artikel 50 lid 4 eist een melding bij AI-tekst over onderwerpen van
 * algemeen belang, tenzij een mens hem heeft nagekeken en iemand de redactionele
 * verantwoordelijkheid draagt. Deze pagina legt vast wie dat is. De ongereviewde EN/AR-
 * vertalingen vallen niet onder die uitzondering en dragen daarom bovenaan hun eigen melding.
 *
 * Elke regel hier is een feitelijke uitspraak over hoe het product werkt. Verandert een
 * pijplijn (een ander gradermodel, een gids die niet meer wordt nagekeken), dan verandert deze
 * tekst in dezelfde commit.
 */
export default async function RedactiePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'redactie' });

  return (
    <>
      <PageField variant="gracht" className="g-pagehead">
        <Crumbs items={[{ label: 'Home', href: '/' }, { label: t('breadcrumb') }]} />
        <div className="g-narrow">
          <SectionHeading as="h1" size="h1" title={t('heading')} onField />
          <p className="g-lead mt-5">{t('lede')}</p>
          <p className="g-pagehead-meta">{t('updated')}</p>
        </div>
      </PageField>

      <section className="g-sec" aria-labelledby="redactie-resp">
        <div className="g-wrap"><div className="g-narrow">
          <SectionHeading id="redactie-resp" title={t('resp_title')} size="h2" />
          <p className="g-body mt-4">{t('resp_body')}</p>
          <Link href="/docent" className="g-tlink mt-4">
            {t('resp_link')}
            <ArrowRight className="rtl-flip" aria-hidden />
          </Link>
        </div></div>
      </section>

      <section className="g-sec g-sec-tier" aria-labelledby="redactie-ai">
        <div className="g-wrap"><div className="g-narrow">
          <SectionHeading id="redactie-ai" title={t('ai_title')} size="h2" className="mb-6" />
          <dl className="g-cardlist m-0">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n}>
                <dt>{t(`ai_${n}_title`)}</dt>
                <dd>{t(`ai_${n}_body`)}</dd>
              </div>
            ))}
          </dl>
          <p className="m-0 mt-5 text-sm text-ink-2">
            {t('privacy_note')}{' '}
            <Link href="/privacybeleid" className="g-ilink">{t('privacy_link')}</Link>
          </p>
        </div></div>
      </section>

      <section className="g-sec" aria-labelledby="redactie-notdo">
        <div className="g-wrap"><div className="g-narrow">
          <SectionHeading id="redactie-notdo" title={t('notdo_title')} size="h2" className="mb-6" />
          <ul className="g-dotlist">
            {[1, 2, 3].map(n => (
              <li key={n}>{t(`notdo_${n}`)}</li>
            ))}
          </ul>

          <div className="g-callout mt-12">
            <div>
              <h2>{t('errors_title')}</h2>
              <p>{t('errors_body')}</p>
            </div>
            <Link href="/contact" className={glasButton({ variant: 'navy' })}>
              {t('errors_link')}
              <ArrowRight className="rtl-flip" aria-hidden />
            </Link>
          </div>

          <p className="m-0 mt-8 text-xs leading-relaxed text-ink-2">{t('eu_note')}</p>
        </div></div>
      </section>
    </>
  );
}
