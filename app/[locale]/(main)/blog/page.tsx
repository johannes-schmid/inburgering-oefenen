import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { getSortedPosts, getPostLocale, getPostSlug } from '@/data/blog-posts';
import { ArrowRight } from 'lucide-react';
import PageField from '@/components/glas/PageField';
import Field from '@/components/glas/Field';
import SectionHeading from '@/components/glas/SectionHeading';
import { glasButton } from '@/components/glas/Button';
import Crumbs from '../_components/glas/Crumbs';
import BlogIndex, { type BlogCard } from './BlogIndex';
import { SITE_URL, langTag } from '@/lib/site';
import { alternatesFor, PROVIDER_REF, ogImageFor } from '@/lib/schema';

type Props = { params: Promise<{ locale: string }> };

export async function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    /* `alternatesFor` leidt canonical én hreflang af uit `routing.ts`, zodat ze de vertaalde
     * slug van deze taal krijgen in plaats van de taalcode vóór het Nederlandse pad. */
    alternates: alternatesFor(locale, 'blog'),
    openGraph: {
      images: ogImageFor(locale),
      type: 'website',
      title: t('meta_title'),
      description: t('meta_description'),
      url: `${SITE_URL}/${locale}/blog`,
      siteName: 'Inburgering Oefenen',
    },
  };
}

export default async function BlogIndexPage({ params }: Props) {
  const { locale } = await params;
  // See the note in blog/[slug]/page.tsx — this is what makes the route statically rendered.
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'blog' });
  const posts = getSortedPosts();
  const tHome = await getTranslations({ locale, namespace: 'home' });
  const [headLead, headMuted] = t('heading').split('\n');
  const cards: BlogCard[] = posts.map(post => {
    const lp = getPostLocale(post, locale);
    return {
      key: post.slug,
      slug: getPostSlug(post, locale),
      title: lp.heroTitle,
      desc: lp.description,
      category: lp.category,
      image: post.image,
      dateLabel: lp.dateLabel,
      readingLabel: t('reading_time', { minutes: post.readingMinutes }),
    };
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Blog',
        '@id': `${SITE_URL}/${locale}/blog#blog`,
        name: t('meta_title'),
        description: t('meta_description'),
        url: `${SITE_URL}/${locale}/blog`,
        inLanguage: langTag(locale),
        publisher: PROVIDER_REF,
      },
      {
        '@type': 'ItemList',
        '@id': `${SITE_URL}/${locale}/blog#list`,
        itemListElement: posts.map((post, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${SITE_URL}/${locale}/blog/${getPostSlug(post, locale)}`,
          name: getPostLocale(post, locale).heroTitle,
        })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* De kop op Nevel (glas.html §14: "de blog krijgt het veld Nevel, bijna wit, met een zweem").
          Kruimelpad op het veld, geen eigen grijze band. De auteur staat als zegel onder de kop:
          een echte, controleerbare docent (CLAUDE.md §2), geen kicker. */}
      <PageField variant="nevel" className="-mt-[var(--nav-h)] !pt-[calc(var(--nav-h)+40px)] sm:!pt-[calc(var(--nav-h)+64px)]">
        <Crumbs items={[{ label: t('breadcrumb_home'), href: '/' }, { label: t('breadcrumb_blog') }]} className="mb-6" />
        <SectionHeading as="h1" size="section" title={headLead} muted={headMuted} onField />
        <span className="g-seal g-glass g-glass-strong mt-7 !items-start !rounded-g-lg !py-2.5 !pe-4 max-w-xl">
          <img src="/images/amber-van-der-zalm-264.webp" alt="" width={30} height={30} className="!size-10 !rounded-g-sm" />
          <span>
            <b>
              <Link href="/docent" className="g-ilink !no-underline hover:!underline">Amber van der Zalm</Link>
            </b>
            <small className="block text-[12.5px] leading-snug text-ink-2 mt-0.5">{t('author_bio')}</small>
          </span>
        </span>
      </PageField>

      <main className="g-sec !pt-10">
        <div className="g-wrap">
          <BlogIndex cards={cards} allLabel={tHome('kb_all')} authorName="Amber van der Zalm" />
        </div>
      </main>

      {/* Afsluiter vlak boven de footer: Nevel met de ene oranje knop van deze view. */}
      <div className="g-closing">
        <Field as="section" variant="nevel" aria-labelledby="blog-cta-heading" className="g-block g-cta-band">
          <h2 id="blog-cta-heading">{t('cta_title')}</h2>
          <p>{t('cta_desc')}</p>
          <Link href="/oefenen" className={glasButton({ variant: 'oranje', size: 'lg', className: 'mt-2' })}>
            {t('cta_btn')}
            <ArrowRight className="rtl-flip" aria-hidden="true" />
          </Link>
        </Field>
      </div>
    </>
  );
}
