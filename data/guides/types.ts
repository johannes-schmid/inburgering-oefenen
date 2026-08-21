/**
 * Kennisgidsen — the type.
 *
 * Same governing principle as `data/blog-posts.ts`: **content is data, routes are generic.**
 * `app/[locale]/(main)/inburgering/[slug]/page.tsx` and `…/knm/[thema]/page.tsx` generate all
 * metadata, canonical, hreflang and JSON-LD from these objects. Adding a guide is a new file in
 * this directory plus one line in `index.ts` — never a route file.
 *
 * **One file per guide**, unlike the blog, which keeps all five posts in one 2,288-line module.
 * A guide runs to roughly the same length as a post, and there will be ~15 of them across the two
 * sections; a single module would pass 7,000 lines and every docent review would be a diff
 * against everything. One file per guide keeps a review readable and makes `status` a per-file
 * fact.
 *
 * Two rules that are load-bearing rather than stylistic:
 *
 * 1. **`status: 'reviewed'` is the only state that publishes.** The owner's decision of
 *    2026-08-19 is that guides may be machine-drafted but go live only after the NT2 docent has
 *    reviewed them. That is expressed here as a constraint, not as a comment: a `draft` guide is
 *    `noindex`, absent from its hub, absent from the sitemap and absent from every `related`
 *    list — but still reachable by URL, which is what makes it reviewable. Same discipline as
 *    `review_status` on exam content, and the same reason: a field that merely documents intent
 *    gets ignored.
 *
 * 2. **Slugs are identical across locales.** `components/Nav.tsx` switches language with
 *    `router.replace(pathname, { locale })`, so a per-locale slug type-checks and then 404s the
 *    moment a reader switches language. `GuideLocale` therefore has no `slug` field, on purpose —
 *    the blog's `PostLocale` does, and that is the shape not to copy here.
 *
 * Every number in `articleHtml` comes from `SEO/facts.md` and is wrapped in a fact box carrying
 * its source URL and consulted-on date. Nothing from `facts.md` §9 ships at all.
 */

/**
 * The three hubs. A section is a URL segment and an audience, not a category label.
 *
 * They are also the funnel phases of `docs/MILESTONES.html` §3: `inburgering` is TOFU
 * (orientation), `knm` and `taalexamens` are MOFU (subject knowledge). BOFU is the oefenexamens,
 * which are not guides and have no section here.
 *
 * **Adding a fourth means touching `guideHref()` in `helpers.ts` and nothing else** — that is why
 * that helper exists. Before it, four separate `section === 'inburgering' ? … : '/knm'` ternaries
 * decided the URL, and every one of them compiled cleanly with a third section and routed it to
 * `/knm/[thema]`.
 */
export type GuideSection = 'inburgering' | 'knm' | 'taalexamens';

export type GuideFaq = { q: string; a: string };

/**
 * Per-locale content. Anything omitted falls back to the Dutch field on `Guide`.
 *
 * Deliberately **no `slug`** — see rule 2 above.
 */
export type GuideLocale = {
  heroTitle: string;
  description: string;
  eyebrow: string;
  /**
   * Meta title for this locale. Optional only so an existing translation cannot break; **write it
   * on every new one.** Before 2026-08-20 the route used `guide.title` unconditionally, so an
   * English page carried a Dutch `<title>` — the one string a searcher sees before clicking.
   */
  title?: string;
  /** Last breadcrumb crumb, both in the visible trail and in the BreadcrumbList JSON-LD. */
  breadcrumb?: string;
  /** Human publication date for the byline, written out in this locale's own convention. */
  dateLabel?: string;
  heroSubtitle?: string;
  /** Alt text for the hero photo in this locale. The photo itself never changes. */
  heroImageAlt?: string;
  articleHtml?: string;
  sidebarHtml?: string;
  ctaTitle?: string;
  ctaDesc?: string;
  ctaLabel?: string;
  faq?: GuideFaq[];
};

/**
 * The full-bleed hero photo behind the H1.
 *
 * Optional, and a guide without one keeps the flat `--gradient-brand` hero. `GuideArticle` lays a
 * left-to-right navy scrim over it, the same one the homepage uses, so **the subject has to survive
 * having its left 55% covered** — a centred close-up reads as a smudge behind the title.
 *
 * `credit` is the photographer's name, kept beside the file it belongs to rather than only in
 * `resources/images/CREDITS.md`: Pexels' licence needs no on-page attribution, but a photo whose
 * provenance lives in one file gets re-used with no provenance at all. `scripts/fetch-guide-images.mjs`
 * writes both.
 */
export type GuideHeroImage = {
  /** Path under `public/images/guides/`, without extension. A `.jpg` always exists. */
  base: string;
  /**
   * Whether a `.webp` exists beside the `.jpg`. `scripts/fetch-guide-images.mjs` deletes the WebP
   * when it encodes *larger* than the mozjpeg — which happens on foliage-dense photos — so this is
   * not a formality: a `<source>` pointing at a deleted file costs a 404 per view, and one pointing
   * at a heavier file costs the reader bandwidth for the same picture.
   */
  hasWebp: boolean;
  /** Dutch alt text. Describes the photo, never the article; a locale may override it. */
  alt: string;
  /** CSS `object-position`. Default `center 45%`; set it when the subject sits off-centre. */
  position?: string;
  credit: string;
};

export type Guide = {
  slug: string;
  section: GuideSection;

  /**
   * The publication gate. `draft` → noindex, unlisted, out of the sitemap, reachable by URL.
   * Only a `reviewed` guide is published. See rule 1 above.
   */
  status: 'draft' | 'reviewed';
  /** Who reviewed it. Required on a `reviewed` guide — pinned by `tests-unit/guides.test.ts`. */
  reviewedBy?: string;
  /** ISO date of that review. Shown as "laatst gecontroleerd" and used as `dateModified`. */
  reviewedOn?: string;

  /** The cluster's pillar. Its hub lists it first, above the spokes. */
  pillar: boolean;

  /** Meta title. ≤60 characters — `SEO/README.md`'s on-page checklist. */
  title: string;
  /** Meta description. 140–160 characters, pinned by `tests-unit/guides.test.ts`. */
  description: string;

  datePublished: string;
  dateModified: string;
  /** Human date for the byline, in Dutch. */
  dateLabel: string;
  /** Short label for the breadcrumb's last crumb — the full title rarely fits. */
  breadcrumb: string;
  /** Small label above the H1, e.g. "Stappenplan". */
  eyebrow: string;

  heroTitle: string;
  heroSubtitle: string;
  /** The hero photo. Without one the hero is the flat brand gradient. */
  heroImage?: GuideHeroImage;
  readingMinutes: number;

  articleHtml: string;
  sidebarHtml: string;
  faq: GuideFaq[];

  /** Sibling guides, stored by slug. A draft or unknown slug is dropped when rendering. */
  related: string[];
  /** Related blog posts, by their Dutch slug — the blog covers ground the guides link rather
   *  than duplicate. `taalniveaus-a1-a2-b1-nederlands` is the worked example. */
  relatedPosts: string[];

  ctaTitle: string;
  ctaDesc: string;
  /** Must be a pathname declared in `i18n/routing.ts`. Never `/oefenvragen` (flagged off). */
  ctaHref: '/oefenen' | '/premium' | '/docent';
  ctaLabel: string;

  translations?: Partial<Record<'en' | 'ar', GuideLocale>>;
};

/** One locale's content, with Dutch as the fallback for every optional field. */
export type ResolvedGuide = {
  heroTitle: string;
  description: string;
  eyebrow: string;
  title: string;
  breadcrumb: string;
  dateLabel: string;
  heroSubtitle: string;
  heroImageAlt: string;
  articleHtml: string;
  sidebarHtml: string;
  ctaTitle: string;
  ctaDesc: string;
  ctaLabel: string;
  faq: GuideFaq[];
};

/**
 * Renders the fact-box markup documented in `app/globals.css`, identical to the blog's `fact()`.
 * Duplicated rather than imported: pulling it out of `data/blog-posts.ts` would make the blog
 * module a dependency of every guide file for six lines of string concatenation.
 */
export function fact(claim: string, sourceLabel: string, url: string, checked: string): string {
  return `<div class="fact-box"><p class="fact-box-claim">${claim}</p>` +
    `<p class="fact-box-source">Bron: <a href="${url}" target="_blank" rel="noopener">${sourceLabel}</a> — geraadpleegd ${checked}</p></div>`;
}
