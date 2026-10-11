import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { Breadcrumb, GradientHero, SectionHeader } from '@/components/site';
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

  const LINK = 'inline-flex items-center gap-1 font-semibold no-underline rounded-sm hover:opacity-75 active:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2';

  return (
    <>
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: t('breadcrumb') }]} />

      <GradientHero className="pb-20">
        <div className="max-w-3xl">
          <h1
            className="font-headline font-extrabold text-white m-0"
            style={{ fontSize: 'clamp(2rem, 4.4vw, 3.1rem)', letterSpacing: '-0.03em', lineHeight: 1.05, textWrap: 'balance' }}
          >
            {t('heading')}
          </h1>
          <p className="text-white/75 text-[1.0625rem] leading-[1.7] m-0 mt-5 max-w-[60ch]" style={{ textWrap: 'pretty' }}>
            {t('lede')}
          </p>
          <p className="text-white/55 text-sm m-0 mt-4">{t('updated')}</p>
        </div>
      </GradientHero>

      <section className="py-16 sm:py-20 bg-surface">
        <div className="max-w-3xl mx-auto px-6">
          <SectionHeader align="left" title={t('resp_title')} />
          <p className="m-0 text-[0.9375rem] leading-[1.7] text-on-surface-variant max-w-[65ch]">{t('resp_body')}</p>
          <Link href="/docent" className={`${LINK} mt-3 text-sm`} style={{ color: '#a24000' }}>
            {t('resp_link')}
            <ArrowRight className="size-3.5 rtl-flip" aria-hidden />
          </Link>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-surface-container-low">
        <div className="max-w-3xl mx-auto px-6">
          <SectionHeader align="left" title={t('ai_title')} />
          <dl className="m-0 flex flex-col gap-3">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="rounded-2xl px-5 py-4 bg-surface-container-lowest" style={{ boxShadow: 'var(--shadow-ambient)' }}>
                <dt className="font-headline font-bold text-primary text-[1rem]">{t(`ai_${n}_title`)}</dt>
                <dd className="m-0 mt-1 text-sm leading-relaxed text-on-surface-variant">{t(`ai_${n}_body`)}</dd>
              </div>
            ))}
          </dl>
          <p className="m-0 mt-5 text-sm text-on-surface-variant">
            {t('privacy_note')}{' '}
            <Link href="/privacybeleid" className={LINK} style={{ color: '#a24000' }}>{t('privacy_link')}</Link>
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-surface">
        <div className="max-w-3xl mx-auto px-6">
          <SectionHeader align="left" title={t('notdo_title')} />
          <ul className="m-0 p-0 list-none flex flex-col gap-3">
            {[1, 2, 3].map(n => (
              <li key={n} className="text-[0.9375rem] leading-[1.7] text-on-surface-variant ps-5 relative max-w-[65ch]">
                <span aria-hidden className="absolute start-0 top-[0.7rem] size-2 rounded-full bg-primary" />
                {t(`notdo_${n}`)}
              </li>
            ))}
          </ul>

          <div className="mt-12 rounded-2xl p-6 sm:p-8" style={{ background: 'rgba(254,118,44,0.22)' }}>
            <h2 className="m-0 font-headline font-extrabold text-primary text-xl tracking-tight">{t('errors_title')}</h2>
            <p className="m-0 mt-2 text-[0.9375rem] leading-relaxed text-on-secondary-container">{t('errors_body')}</p>
            <Link href="/contact" className={`${LINK} mt-3 text-sm text-primary`}>
              {t('errors_link')}
              <ArrowRight className="size-3.5 rtl-flip" aria-hidden />
            </Link>
          </div>

          <p className="m-0 mt-8 text-xs text-on-surface-variant">{t('eu_note')}</p>
        </div>
      </section>
    </>
  );
}
