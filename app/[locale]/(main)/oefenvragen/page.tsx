import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import TOPICS from '@/data/oefenvragen-topics';
import { ArrowRight, BadgeCheck, LayoutGrid, ListChecks } from 'lucide-react';
import PageField from '@/components/glas/PageField';
import Field from '@/components/glas/Field';
import SectionHeading from '@/components/glas/SectionHeading';
import { glasButton } from '@/components/glas/Button';
import CategoryMark, { type Category } from '@/components/horizon/CategoryMark';
import Crumbs from '../_components/glas/Crumbs';
import { FEATURES } from '@/lib/features';
import { localeHref } from '@/i18n/paths';

type Props = { params: Promise<{ locale: string }> };

export async function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  // The flag kept this out of the nav and the sitemap, but the route still served a 200 with an
  // empty topic list — an indexable page with no content, which is the exact thing the flag exists
  // to prevent. `data/oefenvragen-topics.ts` is a typed-empty stub until A2 topics are authored.
  //
  // `encodeURI`: het Arabische pad (`/ar/تدرب`) mag niet rauw in een Location-header — die neemt
  // alleen Latin-1, en de statische render van `/ar/oefenvragen` brak de build erop.
  // A redirect rather than `notFound()`, for two reasons: `notFound()` here streams a 200 shell and
  // resolves to the not-found page client-side, which is a soft 404 — the worst of both; and any
  // inbound link to this KNM-era URL is better spent on the live funnel than on an error. Flip
  // FEATURES.oefenvragen when the topics exist.
  if (!FEATURES.oefenvragen) redirect(encodeURI(localeHref(locale, `oefenen`)));

  const t = await getTranslations({ locale, namespace: 'oefenvragen' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    alternates: {
      canonical: 'https://inburgeringoefenen.nl/nl/oefenvragen',
      languages: {
        nl: 'https://inburgeringoefenen.nl/nl/oefenvragen',
        en: 'https://inburgeringoefenen.nl/en/oefenvragen',
        ar: 'https://inburgeringoefenen.nl/ar/oefenvragen',
        'x-default': 'https://inburgeringoefenen.nl/nl/oefenvragen',
      },
    },
  };
}

const totalQuestions = TOPICS.reduce((s, t) => s + t.total, 0);

export default async function OefenIndexPage({ params }: Props) {
  const { locale } = await params;

  // The flag kept this out of the nav and the sitemap, but the route still served a 200 with an
  // empty topic list — an indexable page with no content, which is the exact thing the flag exists
  // to prevent. `data/oefenvragen-topics.ts` is a typed-empty stub until A2 topics are authored.
  //
  // A redirect rather than `notFound()`, for two reasons: `notFound()` here streams a 200 shell and
  // resolves to the not-found page on the client, which is a soft 404 — the worst of both; and any
  // inbound link to this KNM-era URL is better spent on the live funnel than on an error page. Flip
  // FEATURES.oefenvragen when the topics exist.
  if (!FEATURES.oefenvragen) redirect(encodeURI(localeHref(locale, `oefenen`)));

  const t = await getTranslations({ locale, namespace: 'oefenvragen' });

  const [headLead, headMuted] = t('heading').split('\n');

  return (
    <>
      {/* De kop op Gracht met sluier; de drie kerngetallen als metachips op glas in plaats van
          emoji-tegels (geen emoji in de UI). */}
      <PageField variant="gracht" className="-mt-[var(--nav-h)] !pt-[calc(var(--nav-h)+40px)] sm:!pt-[calc(var(--nav-h)+64px)]">
        <Crumbs items={[{ label: t('breadcrumb_home'), href: '/' }, { label: t('breadcrumb_index') }]} className="mb-6" />
        <SectionHeading as="h1" size="section" title={headLead} muted={headMuted} onField />
        <p className="g-lead mt-5">{t('intro')}</p>
        <ul className="g-metachips list-none p-0 m-0 mt-7">
          <li className="g-metachip g-glass"><ListChecks aria-hidden="true" />{t('stat_total')} · {totalQuestions} vragen</li>
          <li className="g-metachip g-glass"><LayoutGrid aria-hidden="true" />{t('stat_topics')} · {t('stat_topics_val')}</li>
          <li className="g-metachip g-glass"><BadgeCheck aria-hidden="true" />{t('stat_teacher')} · {t('stat_teacher_val')}</li>
        </ul>
      </PageField>

      <main className="g-sec !pt-12">
        <div className="g-wrap">
          <h2 className="g-head g-head-2 mb-6">{t('choose_topic')}</h2>
          <div className="g-grid3">
            {TOPICS.map(topic => (
              <a key={topic.slug} href={`/oefenvragen/${topic.slug}`} className="g-topic">
                <CategoryMark category={topicMark(topic.slug)} size={44} />
                <span className="min-w-0">
                  <b>{topic.name}</b>
                  <small>{topic.sublabel}</small>
                  <span className="g-bdg g-bdg-zacht mt-2 !h-6">{t('free_questions', { n: topic.questions.length })}</span>
                </span>
                <ArrowRight className="rtl-flip" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </main>

      <div className="g-closing">
        <Field as="section" variant="nevel" aria-labelledby="proef-heading" className="g-block g-cta-band">
          <h2 id="proef-heading">{t('proef_title')}</h2>
          <p>{t('proef_desc')}</p>
          <Link href="/dashboard" className={glasButton({ variant: 'oranje', size: 'lg', className: 'mt-2' })}>
            {t('proef_btn')}
            <ArrowRight className="rtl-flip" aria-hidden="true" />
          </Link>
        </Field>
      </div>
    </>
  );
}

/* Het merk van een KNM-onderwerp: de drie thema's met een eigen merk, anders de KNM-zuilen. */
function topicMark(slug: string): Category {
  if (slug.startsWith('werk')) return 'werk';
  if (slug.startsWith('wonen')) return 'wonen';
  if (slug.startsWith('gezondheid')) return 'gezondheid';
  return 'knm';
}
