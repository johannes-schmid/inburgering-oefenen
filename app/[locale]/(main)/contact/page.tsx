import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import ContactForm from './ContactForm';

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
    alternates: {
      canonical: `https://inburgeringoefenen.nl/nl/contact`,
      languages: {
        nl: 'https://inburgeringoefenen.nl/nl/contact',
        en: 'https://inburgeringoefenen.nl/en/contact',
        ar: 'https://inburgeringoefenen.nl/ar/contact',
        'x-default': 'https://inburgeringoefenen.nl/nl/contact',
      },
    },
  };
}

export default function ContactPage() {
  return (
    <>
      <section className="bg-primary pt-32 pb-16 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 mb-6">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold font-headline text-white mb-4 leading-tight">Neem contact op</h1>
          <p className="text-white/70 text-lg leading-relaxed">Heb je een vraag over het examen, een technisch probleem of iets anders? Stuur ons een bericht en we reageren zo snel mogelijk.</p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div style={{ maxWidth: '36rem', marginLeft: 'auto', marginRight: 'auto' }}>
          <div className="rounded-3xl p-8 md:p-10" style={{ background: '#fff', boxShadow: '0 4px 16px rgba(0,43,109,0.06),0 16px 48px rgba(0,43,109,0.08)' }}>
            <ContactForm />
          </div>

          <div className="mt-6 rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-center gap-4 justify-between" style={{ background: 'rgba(0,43,109,0.04)', border: '1px solid rgba(0,43,109,0.10)' }}>
            <div>
              <p className="font-semibold text-primary text-sm">Al een account bij Inburgering Oefenen?</p>
              <p className="text-on-surface-variant text-sm">Ga direct naar je studieportaal voor je oefenresultaten en woordkaarten.</p>
            </div>
            <Link href="/dashboard" className="shrink-0 inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-container transition-colors no-underline whitespace-nowrap">
              <span>Naar studieportaal</span>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
