import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { ArrowRight, Mail } from 'lucide-react';
import ContactForm from './ContactForm';
import PageField from '@/components/glas/PageField';
import SectionHeading from '@/components/glas/SectionHeading';
import { alternatesFor } from '@/lib/schema';

type Props = { params: Promise<{ locale: string }> };

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    /* Twee fouten stonden hier tot 15-09, en ze hieven elkaar niet op.
     *
     * De canonical wees in alle drie de talen naar `/nl/contact` — dat vertelt Google dat de
     * Engelse en Arabische pagina geen eigen pagina zijn, precies de fout die `/docent` en
     * `/premium` eerder al hebben rechtgezet. En de Arabische hreflang wees naar `/ar/contact`,
     * terwijl de slug daar `/ar/تواصل-معنا` is; die URL 308't, en een hreflang naar een redirect
     * telt niet mee. `alternatesFor` leidt nu beide af uit `routing.ts`. */
    alternates: alternatesFor(locale, 'contact'),
  };
}

export default function ContactPage() {
  return (
    <>
      <PageField variant="gracht" className="g-pagehead">
        <div className="g-narrow">
          <span className="g-stateicon g-glass g-glass-strong" aria-hidden="true"><Mail /></span>
          <SectionHeading as="h1" size="h1" title="Neem contact op" onField className="mt-5" />
          <p className="g-lead mt-5">Heb je een vraag over het examen, een technisch probleem of iets anders? Stuur ons een bericht en we reageren zo snel mogelijk.</p>
        </div>
      </PageField>

      <section className="g-sec !pt-10">
        <div className="g-wrap">
          <div className="g-narrow grid gap-3">
            <div className="bg-wit rounded-g-xl p-6 sm:p-9">
              <ContactForm />
            </div>

            <div className="bg-mist-2 rounded-g-lg px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div>
                <p className="m-0 font-headline font-bold text-navy text-sm">Al een account bij Inburgering Oefenen?</p>
                <p className="m-0 mt-0.5 text-ink-2 text-sm leading-relaxed">Ga direct naar je studieportaal voor je oefenresultaten en woordkaarten.</p>
              </div>
              <Link href="/dashboard" className="g-tlink shrink-0 whitespace-nowrap">
                Naar studieportaal
                <ArrowRight className="rtl-flip" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
