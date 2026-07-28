import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { getSortedPosts, getPostLocale, getPostSlug } from '@/data/blog-posts';
import { Breadcrumb, GradientHero, CTABanner, TeacherCard } from '@/components/site';
import { SITE_URL, ORG_ID, langTag } from '@/lib/site';

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
    alternates: {
      canonical: `${SITE_URL}/${locale}/blog`,
      languages: {
        nl: `${SITE_URL}/nl/blog`,
        en: `${SITE_URL}/en/blog`,
        ar: `${SITE_URL}/ar/blog`,
        'x-default': `${SITE_URL}/nl/blog`,
      },
    },
    openGraph: {
      type: 'website',
      title: t('meta_title'),
      description: t('meta_description'),
      url: `${SITE_URL}/${locale}/blog`,
      siteName: 'Inburgering Oefenen',
    },
  };
}

/** Keyed on `categoryKey`, not on the translated category label. */
const CAT_STYLES: Record<string, { bg: string; color: string }> = {
  gids: { bg: 'rgba(0,43,109,0.06)', color: '#002b6d' },
  tips: { bg: 'rgba(162,64,0,0.06)', color: '#a24000' },
  uitleg: { bg: 'rgba(44,130,83,0.06)', color: '#2d7a52' },
};

export default async function BlogIndexPage({ params }: Props) {
  const { locale } = await params;
  // See the note in blog/[slug]/page.tsx — this is what makes the route statically rendered.
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'blog' });
  const posts = getSortedPosts();

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
        publisher: { '@id': ORG_ID },
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

      <GradientHero className="pb-16">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-block px-3 py-1 rounded-full font-bold text-xs uppercase tracking-widest mb-5 bg-secondary-container text-on-secondary-container">
              {t('eyebrow')}
            </span>
            <h1 className="font-headline font-bold text-white tracking-tight mb-6 leading-tight" style={{ fontSize: 'clamp(2rem,4vw,3rem)' }}>
              {t('heading').split('\n').map((line, i, arr) => (
                <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
              ))}
            </h1>
            <TeacherCard variant="chip" experience={t('author_bio')} />
          </div>
        </div>
      </GradientHero>

      <Breadcrumb items={[{ label: t('breadcrumb_home'), href: '/' }, { label: t('breadcrumb_blog') }]} />

      <main className="py-16 px-6 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {posts.map(post => {
              const lp = getPostLocale(post, locale);
              const cat = CAT_STYLES[post.categoryKey] ?? CAT_STYLES.gids;
              return (
                <Link
                  key={post.slug}
                  href={{ pathname: '/blog/[slug]', params: { slug: getPostSlug(post, locale) } }}
                  className="bg-surface-container-lowest rounded-2xl p-7 flex flex-col gap-4 no-underline shadow-sm post-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{ textDecoration: 'none' }}
                >
                  <span className="inline-block px-3 py-1 font-bold text-xs uppercase tracking-widest rounded-full w-fit" style={{ background: cat.bg, color: cat.color }}>
                    {lp.category}
                  </span>
                  <h2 className="font-headline font-bold text-lg text-on-surface leading-snug">{lp.heroTitle}</h2>
                  <p className="text-on-surface-variant text-sm leading-relaxed flex-grow">{lp.description}</p>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0" style={{ border: '1px solid rgba(196,198,210,0.3)' }}>
                        <img src="/images/marieke-schipper.jpg" alt="Marieke Schipper" width={28} height={28} className="w-full h-full object-cover object-top" />
                      </div>
                      <span className="text-xs text-on-surface-variant">{t('post_by', { date: post.dateLabel })}</span>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0" style={{ color: '#a24000' }} aria-hidden="true">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>

          <CTABanner
            title={t('cta_title')}
            description={t('cta_desc')}
            button={{ label: t('cta_btn'), href: '/oefenen' }}
          />
        </div>
      </main>
    </>
  );
}
