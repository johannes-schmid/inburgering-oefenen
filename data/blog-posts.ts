type PostLocale = { heroTitle: string; description: string; category: string; slug?: string };

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  category: string;
  categoryColor: 'blue' | 'orange';
  datePublished: string;
  dateLabel: string;
  breadcrumb: string;
  heroTitle: string;
  heroSubtitle: string;
  articleHtml: string;
  sidebarHtml: string;
  relatedPosts: { href: string; title: string; desc: string }[];
  ctaTitle: string;
  ctaDesc: string;
  ctaHref: string;
  ctaLabel: string;
  translations?: Partial<Record<'en' | 'ar', PostLocale>>;
};

/**
 * Blog is disabled for the A2 launch (see FEATURES.blog in lib/features.ts).
 * The engine stays; A2 posts get authored here once the SEO phase starts.
 */
const POSTS: BlogPost[] = [];

export function getPostLocale(post: BlogPost, locale: string): PostLocale {
  const t = post.translations?.[locale as 'en' | 'ar'];
  return t ?? { heroTitle: post.heroTitle, description: post.description, category: post.category };
}

/** Returns the URL slug for a post in a given locale */
export function getPostSlug(post: BlogPost, locale: string): string {
  return post.translations?.[locale as 'en' | 'ar']?.slug ?? post.slug;
}

/** All (locale, slug) pairs — used in generateStaticParams */
export function getAllPostParams(): { locale: string; slug: string }[] {
  const params: { locale: string; slug: string }[] = [];
  for (const post of POSTS) {
    params.push({ locale: 'nl', slug: post.slug });
    for (const loc of ['en', 'ar'] as const) {
      params.push({ locale: loc, slug: post.translations?.[loc]?.slug ?? post.slug });
    }
  }
  return params;
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return POSTS.find(p =>
    p.slug === slug ||
    p.translations?.en?.slug === slug ||
    p.translations?.ar?.slug === slug
  );
}

export default POSTS;
