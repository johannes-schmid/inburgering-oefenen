import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import FaqAccordion from '@/components/FaqAccordion';
import { SectionHeader } from '@/components/site';
import { DEFAULT_LEVEL, SKILLS } from '@/data/skills';
import JsonLd from '@/components/JsonLd';
import HeroShowcase from './_components/HeroShowcase';
import KennisbankCards, { type KennisbankCard } from './_components/KennisbankCards';
import { publishedGuides, getGuideLocale, guideHref } from '@/data/guides/helpers';
import { getPostBySlug, getPostLocale, getPostSlug } from '@/data/blog-posts';
import { HorizonBand, DotField, Skyline, SunDisc, SectionTransition } from '@/components/horizon';
import { courseId } from '@/lib/schema';
import { TEACHER_ID } from '@/lib/site';

type Props = { params: Promise<{ locale: string }> };

const BASE = 'https://inburgeringoefenen.nl';

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    keywords: 'inburgeringsexamen oefenen, inburgering oefenen, inburgering A2 oefenen, inburgering B1 oefenen, KNM oefenen, ONA inburgering, lezen luisteren schrijven spreken oefenen, oefenexamen inburgering, DUO oefenexamen, NT2-docent',
    robots: { index: true, follow: true },
    alternates: {
      canonical: `${BASE}/${locale}`,
      languages: {
        nl: `${BASE}/nl`,
        en: `${BASE}/en`,
        ar: `${BASE}/ar`,
        'x-default': `${BASE}/nl`,
      },
    },
    openGraph: {
      title: t('meta_title'),
      description: t('meta_description'),
      type: 'website',
      url: `${BASE}/${locale}`,
      locale: locale === 'nl' ? 'nl_NL' : locale === 'ar' ? 'ar_AR' : 'en_GB',
      siteName: 'Inburgering Oefenen',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('meta_title'),
      description: t('meta_description'),
    },
  };
}

/* The two tracks nobody can open yet — B1 (authored, awaiting the docent's review) and ONA (not
   built). The difference between those two is real but it is not one the visitor can act on, so
   the tile does not draw it: both carry the "binnenkort" chip and both send to `/contact`, the
   only surface on the site that can take "laat het me weten".

   They are full-colour tiles like A2 and KNM (owner's decision, 2026-08-22) rather than grey
   ones, so the row reads as one platform. That puts the whole weight of the availability claim on
   the chip and the footer link — which is why neither is optional here and why there is no
   variant of this block without them. */
function SoonBlock({ title, desc, soonLabel, notifyLabel, href, background, minHeight, houses }: {
  title: string; desc: string; soonLabel: string; notifyLabel: string; href: string;
  background: string; minHeight: string; houses: number;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 flex flex-col ${minHeight}`}
      style={{ background, boxShadow: 'var(--shadow-ambient)' }}
    >
      <DotField on="dark" size={22} />
      <Skyline count={houses} tone="hero" height={72} />
      <div className="relative z-10 flex flex-col h-full">
        <span
          aria-hidden="true"
          className="w-11 h-11 rounded-full mb-4"
          style={{ boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.45)' }}
        />
        <h3 className="font-headline font-extrabold text-white text-[1.375rem] leading-tight m-0 mb-1.5">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-white/75 m-0">{desc}</p>

        <span className="self-start text-[0.5625rem] uppercase tracking-widest font-bold text-white/80 rounded-full px-2.5 py-1 mt-5 bg-white/15">
          {soonLabel}
        </span>
        <a
          href={href}
          className="block-notify mt-auto pt-4 inline-flex items-center gap-1.5 no-underline font-semibold text-sm text-white"
        >
          {notifyLabel}
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="rtl-flip"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </a>
      </div>
    </div>
  );
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  const tSkills = await getTranslations({ locale, namespace: 'skills' });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${BASE}/#website`,
        name: 'Inburgering Oefenen',
        url: `${BASE}/`,
        description: t('meta_description'),
        inLanguage: 'nl-NL',
      },
      {
        '@type': 'EducationalOrganization',
        '@id': `${BASE}/#organization`,
        name: 'Inburgering Oefenen',
        url: `${BASE}/`,
        description: 'Oefenexamens en kennisgidsen voor de hele inburgering in Nederland — van de vier taalonderdelen tot KNM en ONA — gemaakt door een gecertificeerde NT2-docent',
        teaches: ['Nederlands als tweede taal', 'Inburgeringsexamen', 'Kennis van de Nederlandse Maatschappij', 'Oriëntatie op de Nederlandse Arbeidsmarkt'],
        /* The levels the *taalonderdelen* are examined at. KNM and ONA are not CEFR-graded, which
         * is why they are named in `teaches` and absent here rather than given a level. */
        educationalLevel: 'A2, B1',
        areaServed: 'NL',
        inLanguage: 'nl-NL',
        employee: { '@id': TEACHER_ID },
      },
      /* The `Person` node lives on `/docent`, not here.
       *
       * Both pages used to define `#teacher` in full, with different `description`s and
       * different `knowsAbout` lists. One `@id`, two sets of facts — a contradiction no
       * validator flags, resolved by whichever page a crawler happened to read. The profile
       * page owns it; the organisation below simply employs her. */
      /* The four onderdelen, as an `ItemList` of **references**.
       *
       * These used to be four full `Course` nodes whose `url` was the
       * `/oefenexamen/a2/[skill]` overview page. Those pages now define their own `Course`,
       * and two complete Course nodes for one URL — with different names, descriptions and a
       * blanket `isAccessibleForFree: true` here versus the honest per-exam split there — is a
       * contradiction no validator flags: a search engine just picks one.
       *
       * So the overview page owns the node and the homepage points at it. The list still gives
       * each onderdeel its own entry, which is what let them surface independently. */
      {
        '@type': 'ItemList',
        '@id': `${BASE}/#onderdelen`,
        name: 'De vier taalonderdelen van het inburgeringsexamen',
        numberOfItems: SKILLS.length,
        itemListElement: SKILLS.map((skill, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: tSkills(`${skill.key}.name`),
          item: { '@id': courseId(locale, DEFAULT_LEVEL, skill.slug) },
        })),
      },
      {
        '@type': 'FAQPage',
        '@id': `${BASE}/#faq`,
        mainEntity: [1, 2, 3, 4, 5, 6].map(n => ({
          '@type': 'Question',
          name: t(`faq_q${n}`),
          acceptedAnswer: { '@type': 'Answer', text: t(`faq_a${n}`) },
        })),
      },
    ],
  };

  /* The four parts of the inburgeringstraject, in the order a candidate meets them, with what is
     actually shipped. `live: false` renders the "binnenkort" chip — see the comment on the row in
     the hero for why a bare list of four would be a false claim. A2 is the shipped product; B1's
     thirty exams exist but sit behind the docent's review gate (`noindex`, see `data/skills.ts`);
     KNM is the documented fifth onderdeel and is not built; ONA is announced and not built. */
  const TRACKS = [
    { key: 'track_a2', live: true },
    /* B1 went live 2026-08-23: the docent signed off the thirty B1 oefenexamens, so its pages
       are indexed and its modules buyable. This chip, `TRACKS` on `/platform`, the `robots` on
       `oefenexamen/[level]/[skill]` and the `LEVELS` loop in `app/sitemap.ts` are one decision
       in four files and move together. */
    { key: 'track_b1', live: true },
    { key: 'track_knm', live: false },
    { key: 'track_ona', live: false },
  ] as const;


  /* The A2 tile names the four onderdelen it contains, read straight from the taxonomy — so a
     fifth onderdeel or a renamed one cannot leave a stale string on the homepage. Each one links to
     its exam overview: since the four-card grid was removed these chips are the *only* link to the
     onderdelen from this page, which the hard rule in `CLAUDE.md` requires. */
  const A2_CHIPS = SKILLS.map(s => ({ slug: s.slug, name: tSkills(`${s.key}.name`) }));

  /* The three placeholder quote cards. The avatar is `null` until
     `scripts/generate-review-avatars.mjs` has run — existence is checked on the server rather than
     guessed, because a broken portrait beside a testimonial is worse than no portrait. */
  const REVIEWS = [1, 2, 3].map(n => {
    const file = `images/reviews/placeholder-${n}.webp`;
    return { n, avatar: existsSync(join(process.cwd(), 'public', file)) ? `/${file}` : null };
  });

  /* The kennisbank row. Everything a reader can *read* rather than practise, in one grid.
   *
   * Assembled here rather than in the client component so no `articleHtml` reaches the browser —
   * `Nav.tsx` carries the same rule for the same reason.
   *
   * Three sources, deliberately mixed: the published guides, the section hubs that have no guide
   * yet, and the blog posts that already own their query. A guide is only listed when
   * `publishedGuides()` returns it (reviewed = published), so a draft can never appear here; the
   * KNM card points at the hub because KNM's kennisgidsen live there and nothing is authored under
   * `data/guides/` for it yet. The blog posts are the same three the hubs link — one query, one
   * owning page, so this row must not start competing with `/taalexamens`. */
  const guideCards: KennisbankCard[] = publishedGuides('inburgering').map(guide => {
    const g = getGuideLocale(guide, locale);
    const route = guideHref(guide);
    return {
      id: guide.slug,
      group: t('kb_group_inburgering'),
      title: g.heroTitle,
      desc: g.description,
      href: `/${locale}${route.pathname.replace('[slug]', guide.slug).replace('[thema]', guide.slug)}`,
    };
  });

  const postCards: KennisbankCard[] = ([
    ['taalniveaus-a1-a2-b1-nederlands', 'kb_group_taalexamens'],
    ['lezen-examen-inburgering-a2', 'kb_group_taalexamens'],
    ['luisteren-examen-inburgering-a2', 'kb_group_taalexamens'],
  ] as const)
    .map(([slug, group]) => {
      const post = getPostBySlug(slug);
      if (!post) return null;
      const lp = getPostLocale(post, locale);
      const card: KennisbankCard = {
        id: slug,
        group: t(group),
        title: lp.heroTitle,
        desc: lp.description,
        href: `/${locale}/blog/${getPostSlug(post, locale)}`,
      };
      return card;
    })
    .filter((c): c is KennisbankCard => c !== null);

  const KENNISBANK: KennisbankCard[] = [
    ...guideCards,
    {
      id: 'knm-hub',
      group: t('kb_group_knm'),
      title: t('kb_knm_title'),
      desc: t('kb_knm_desc'),
      href: `/${locale}/knm`,
    },
    ...postCards,
  ];

  const faqs = [1, 2, 3, 4, 5, 6].map(n => ({ q: `faq_q${n}`, a: `faq_a${n}`, link: n === 1 }));

  return (
    <div className="dot-page">
      <JsonLd data={jsonLd} />

      {/* ── HERO — centred, on a light surface ──
          Rebuilt to the owner's mockup, 2026-08-22. This replaces the split navy hero (copy left,
          graphic panel right) that replaced the photograph, and the reason is positioning rather
          than taste: the split panel could hold one product card comfortably, and the claim this
          page now has to make is that **the whole traject is here** — A2, B1, KNM, ONA. A centred
          headline over a collage of six surfaces says "all of it in one place" in one glance; a
          two-column hero says "here is one thing".

          Light, not navy, and that is what the collage buys. Six white cards need a surface to sit
          on; over `primary` they become the whole composition and the graphic language disappears
          under them. The dot field, the street and the closing band still carry it. */}
      <section
        id="hero"
        className="relative overflow-hidden -mt-[var(--nav-h)]"
        style={{ paddingTop: 'calc(var(--nav-h) + 2.25rem)' }}
      >

        <div className="max-w-3xl mx-auto px-6 relative z-10 flex flex-col items-center text-center gap-4">
          <span className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full" style={{ background: 'var(--color-surface-container-high)' }}>
            {/* The badge's disc is a 6px bullet, not the composition's sun — §7.3 counts one sun
                per view and on this hero there is deliberately none, because a centred layout has
                no flank for an accent that is not either behind the copy or on top of a card. */}
            <span aria-hidden="true" className="w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ background: 'var(--color-primary)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-secondary-container)' }} />
            </span>
            <span className="text-primary font-semibold text-xs uppercase tracking-widest">{t('hero_badge')}</span>
          </span>

          <h1
            className="font-headline font-extrabold text-primary tracking-tight m-0"
            style={{ fontSize: 'clamp(1.75rem, 4.2vw, 2.875rem)', lineHeight: 1.05, letterSpacing: '-0.03em' }}
          >
            {t('hero_line1')}
          </h1>

          {/* The four parts of the traject, each carrying its own state.
              **This row is why the headline is allowed to say "alles".** Naming A2 · B1 · KNM · ONA
              as a bare list would advertise four things and deliver one: B1's thirty exams exist
              but are `noindex` behind the docent's review gate, and KNM and ONA are not built at
              all. A chip that says "binnenkort" makes the same scope claim honestly, and it is the
              one place on the page where the roadmap is stated — so when a part goes live, this is
              the row to change. */}
          <ul className="flex flex-wrap items-center justify-center gap-2 list-none p-0 m-0">
            {TRACKS.map(track => (
              <li key={track.key}>
                <span
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.8125rem] font-semibold"
                  style={track.live
                    ? { background: 'var(--color-primary)', color: '#fff' }
                    : { background: 'var(--color-surface-container-high)', color: 'var(--color-on-surface-variant)' }}
                >
                  {t(track.key)}
                  {!track.live && (
                    <span className="text-[0.5625rem] font-bold uppercase tracking-widest opacity-70">{t('pkg_soon')}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>

          <p className="text-base sm:text-[1.0625rem] leading-relaxed text-on-surface-variant m-0 max-w-xl">
            {t('hero_subheading')}
          </p>

          <a
            href={`/${locale}/oefenen`}
            className="hero-cta-primary inline-flex items-center gap-2 px-7 py-3.5 font-bold rounded-xl no-underline font-headline text-base"
            style={{ background: 'var(--color-primary)', color: '#fff', boxShadow: '0 12px 28px rgba(0,43,109,0.22)' }}
          >
            {t('cta_primary')}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="rtl-flip"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </a>
        </div>

        {/* The collage sits *over* the street rather than above it, which is what makes the two
            read as one composition instead of a graphic strip bolted under a hero. There is no
            negative bottom margin: the section's own edge is the crop, and a 40px overhang cut the
            phone through the middle of its third answer option — a crop that reads as a rendering
            bug rather than as a composition. */}
        <div className="relative z-10 mt-8 px-6 pb-2">
          <HeroShowcase />
        </div>

        {/* The street, faint, on the neutral ramp — a light-surface skyline, so it sits behind the
            cards rather than competing with them. Two counts behind one breakpoint (§7.1). */}
        <div className="sm:hidden">
          <Skyline count={6} tone="light" height={84} />
        </div>
        <div className="hidden sm:block">
          <Skyline count={14} tone="light" height={112} />
        </div>

        {/* The horizon band closes the hero the way it closes every other header on the site. */}
        <HorizonBand className="absolute left-0 right-0 bottom-0 z-20" />
      </section>

      {/* ── DE BLOKKEN — het hele traject als trap, in DUO's eigen volgorde ──
          To the owner's mockup (2026-08-22) and reordered on his instruction to check the sequence.

          **The order is A2 → B1 → KNM → ONA, and it is sourced rather than chosen.** DUO's own
          component list (inburgeren.nl, "Onder de Wet 2013" tab — `SEO/facts.md` §7) reads Lezen,
          Luisteren, Schrijven, Spreken, **KNM**, **ONA**: the taalonderdelen first, then KNM, then
          ONA. A2 → KNM → B1 → ONA mixes two axes, because A2 and B1 are not consecutive steps —
          they are two *levels* of the same four taalonderdelen, and the gemeente's leerroute
          decides which one you sit. Keeping both levels together and the non-language components
          after them is the only order that is a sequence rather than a shuffle, and it matches the
          `TRACKS` chip row in the hero, which must not disagree with the tiles below it.

          **The heights climb left to right and the widest tile is not the biggest offer.** The ramp
          reads as "there is more of this traject the further you go", which is true of the
          candidate's journey. It deliberately does *not* claim readiness: A2 is the shipped product
          and the shortest tile, ONA is the tallest and still carries a "binnenkort" chip. If a
          future edit makes the tallest tile the most-sold one, the ramp starts lying — the height
          encodes position in the traject, nothing else.

          **All four are full-colour now** (owner's decision): two blues for the taalonderdelen, two
          clays for the components DUO examines separately. State is carried by the footer of each
          tile — a button where you can start, a "binnenkort" chip and a mailing-list link where you
          cannot — not by draining the colour out of a tile.

          **The discs are discs, not `CategoryMark`s, and that is a constraint rather than a
          preference.** A mark's `cut` colour is the tile showing *through* the ink, so it must equal
          the tile behind it, and there is no mark tone for clay. A track is also not an onderdeel:
          A2 *contains* the four marks, which the grid below draws one per card. The single orange
          disc on the A2 tile is the composition's one sun (§7.3); the other three are translucent
          white, so nothing competes with it. */}
      <section aria-labelledby="blocks-heading" className="px-6 pt-12 pb-14 sm:pt-14 sm:pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] gap-x-10 gap-y-4 items-start mb-9">
            <div>
              <p className="text-secondary font-semibold text-[0.6875rem] uppercase tracking-widest m-0 mb-2">
                {t('blocks_eyebrow')}
              </p>
              <h2
                id="blocks-heading"
                className="font-headline font-extrabold text-primary tracking-tight m-0"
                style={{ fontSize: 'clamp(1.5rem, 3.4vw, 2.25rem)', lineHeight: 1.1, letterSpacing: '-0.03em' }}
              >
                {t('blocks_heading')}
              </h2>
            </div>
            <p className="text-[0.9375rem] leading-relaxed text-on-surface-variant m-0 lg:pt-6">
              {t('blocks_intro')}
            </p>
          </div>

          {/* Bottoms aligned, tops stepping up — so the ramp reads as four blocks standing on one
              street rather than as four cards someone forgot to make the same size. Below `lg` the
              stagger is dropped entirely: on a phone the tiles are stacked, and a staircase you can
              only see one step of at a time is noise. */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:items-end">
            {/* ── Taal A2 — live, and the shortest step ── */}
            <div
              className="relative overflow-hidden rounded-2xl p-5 flex flex-col lg:min-h-[17rem]"
              style={{ background: 'var(--color-primary)', boxShadow: 'var(--shadow-ambient)' }}
            >
              <DotField on="dark" size={22} />
              <Skyline count={4} tone="hero" height={64} />
              <div className="relative z-10 flex flex-col h-full">
                <SunDisc size={44} className="mb-4" />
                <h3 className="font-headline font-extrabold text-white text-[1.375rem] leading-tight m-0 mb-1.5">
                  {t('blocks_a2_title')}
                </h3>
                <p className="text-sm leading-relaxed text-white/75 m-0">{t('blocks_a2_desc')}</p>

                {/* **These four chips are links, and that is a product rule rather than a
                    nicety.** `CLAUDE.md`: all four taalonderdelen must stay visible on the landing
                    page — dropping one is how the fork first went wrong — and
                    `tests/public.spec.js` asserts a `/oefenexamen/a2/<skill>` link per onderdeel.
                    When the four-card grid below this row was removed, these chips became the only
                    thing carrying that, so they must stay anchors. */}
                <ul className="flex flex-wrap gap-1.5 list-none p-0 m-0 mt-4 mb-4">
                  {A2_CHIPS.map(chip => (
                    <li key={chip.slug}>
                      <a
                        href={`/${locale}/oefenexamen/${DEFAULT_LEVEL}/${chip.slug}`}
                        className="block-chip inline-flex rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold text-white/90 bg-white/12 no-underline"
                      >
                        {chip.name}
                      </a>
                    </li>
                  ))}
                </ul>

                <a
                  href={`/${locale}/oefenen`}
                  className="block-cta mt-auto inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 no-underline font-headline font-bold text-sm"
                  style={{ background: '#fff', color: 'var(--color-primary)' }}
                >
                  {t('blocks_a2_cta')}
                </a>
              </div>
            </div>

            {/* ── Taal B1 — authored, `noindex`, behind the docent's review gate ── */}
            <SoonBlock
              title={t('blocks_b1_title')}
              desc={t('blocks_b1_desc')}
              soonLabel={t('pkg_soon')}
              notifyLabel={t('blocks_notify')}
              href={`/${locale}/contact`}
              background="var(--color-primary-container)"
              minHeight="lg:min-h-[18.5rem]"
              houses={5}
            />

            {/* ── KNM — ready, but still served from knmoefenen.nl ──
                The link leaves the site on purpose: the content exists there and the migration is
                the owner's next job, so the honest tile is one that says where it is now rather
                than one that promises it here. When KNM lands as the fifth onderdeel, this becomes
                an internal href and the note comes off. */}
            <div
              className="relative overflow-hidden rounded-2xl p-5 flex flex-col lg:min-h-[20rem]"
              style={{ background: 'var(--color-secondary)', boxShadow: 'var(--shadow-ambient)' }}
            >
              <DotField on="dark" size={22} />
              <Skyline count={6} tone="hero" height={76} />
              <div className="relative z-10 flex flex-col h-full">
                <span aria-hidden="true" className="w-11 h-11 rounded-full mb-4" style={{ background: 'rgba(255,255,255,0.62)' }} />
                <h3 className="font-headline font-extrabold text-white text-[1.375rem] leading-tight m-0 mb-1.5">
                  {t('blocks_knm_title')}
                </h3>
                <p className="text-sm leading-relaxed text-white/75 m-0">{t('blocks_knm_desc')}</p>

                <p className="text-[0.625rem] uppercase tracking-widest font-bold text-white/70 m-0 mt-5 mb-2">
                  {t('blocks_knm_note')}
                </p>
                <a
                  href="https://knmoefenen.nl"
                  rel="noopener"
                  className="block-cta mt-auto inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 no-underline font-headline font-bold text-sm text-white bg-white/22"
                >
                  {t('blocks_knm_cta')}
                </a>
              </div>
            </div>

            {/* ── ONA — the last step of the traject and the tallest tile, and nothing is built ── */}
            <SoonBlock
              title={t('blocks_ona_title')}
              desc={t('blocks_ona_desc')}
              soonLabel={t('pkg_soon')}
              notifyLabel={t('blocks_notify')}
              href={`/${locale}/contact`}
              background="var(--color-on-secondary-container)"
              minHeight="lg:min-h-[21.5rem]"
              houses={7}
            />
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF — placeholders, and they say so ──
          To the owner's mockup §6 (2026-08-22), whose own annotation reads *"Quotes zijn
          plaatshouders — vul ze met echte reacties van cursisten voordat dit live gaat."*

          **Nothing here claims to be a review, and that is deliberate rather than timid.**
          `CLAUDE.md`'s hard rule is that invented social proof never ships: three fabricated
          testimonials and an `AggregateRating` of 4.8 came across in the fork and were removed,
          because the product has no customers yet and the site's only claim is that a docent stands
          behind it. So the cards carry the placeholder sentence itself, the attribution names a
          *kind* of cursist rather than a person, and there is **no `Review` or `AggregateRating`
          node anywhere** — `scripts/check-schema.mjs` fails the build if one appears.

          Two things must happen together when the real reactions arrive: the quotes and the
          attributions become real (with permission to publish), and the avatars become photographs
          of those people. Replacing one without the other is how a placeholder face ends up
          standing next to a real quote — see `scripts/generate-review-avatars.mjs`, which exists
          only for this interim state and is to be deleted then.

          The four discs float **beside** the heading, never behind it (§7.3 forbids a graphic
          running under a headline; the mockup draws them overlapping the words). One of them is the
          orange accent and the other three are navy and peach, so the section keeps its single sun. */}
      <section id="cursisten" className="relative overflow-hidden py-14 sm:py-16 px-6">

        <div className="max-w-5xl mx-auto relative">
          {/* The disc clusters. `aria-hidden`, absolutely placed, and hidden below `lg` — on a
              phone the copy fills the full width and there is no flank for them to occupy. */}
          <div aria-hidden="true" className="hidden lg:block">
            <span className="absolute -left-4 -top-2 w-16 h-16 rounded-full" style={{ background: 'rgba(254,118,44,0.38)' }} />
            <span className="absolute left-7 top-6 w-11 h-11 rounded-full" style={{ background: 'var(--color-primary)' }} />
            <span className="absolute right-0 -top-4 w-20 h-20 rounded-full" style={{ background: 'var(--color-primary)' }} />
            <span className="absolute right-12 top-9 w-12 h-12 rounded-full" style={{ background: 'rgba(254,118,44,0.32)' }} />
          </div>

          <div className="relative z-10 text-center mb-9">
            <p className="text-secondary font-semibold text-[0.6875rem] uppercase tracking-widest m-0 mb-3">
              {t('reviews_eyebrow')}
            </p>
            <h2
              className="font-headline font-extrabold text-primary tracking-tight m-0"
              style={{ fontSize: 'clamp(1.5rem, 3.4vw, 2.25rem)', lineHeight: 1.1, letterSpacing: '-0.03em' }}
            >
              {t('reviews_heading')}
            </h2>
          </div>

          <div className="relative z-10 grid sm:grid-cols-3 gap-4">
            {REVIEWS.map(review => (
              <figure
                key={review.n}
                className="m-0 rounded-2xl p-5 flex flex-col bg-surface-container-lowest"
                style={{ boxShadow: 'var(--shadow-ambient)' }}
              >
                <blockquote className="m-0 text-[0.9375rem] leading-relaxed text-on-surface">
                  {`“${t(`reviews_q${review.n}`)}”`}
                </blockquote>
                <figcaption className="mt-auto pt-6 flex items-center gap-3">
                  {review.avatar
                    ? (
                      <img
                        src={review.avatar}
                        alt=""
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                    )
                    : (
                      /* No avatar on disk yet — the generator needs credit on the AI Gateway. A
                         hollow ring rather than a silhouette glyph: an empty seat reads as "a
                         person goes here", a generic head reads as a person who does not exist. */
                      <span
                        aria-hidden="true"
                        className="w-10 h-10 rounded-full flex-shrink-0 bg-surface-container-high"
                        style={{ boxShadow: 'inset 0 0 0 2px var(--color-outline-variant)' }}
                      />
                    )}
                  <span className="text-xs leading-snug text-on-surface-variant">
                    {t(`reviews_a${review.n}`)}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── DE DOCENT EN DE VERGELIJKING — één sectie, twee blokken ──
          To the owner's mockup §3a/§3b (2026-08-22). This **replaces two sections**: the old
          "mentor" block (`TeacherCard` + three `FeatureCard`s) and the separate `#geen-ai`
          comparison band. They made the same argument twice and cost ~1,100px between them; the
          mockup puts the docent's voice and the comparison in one place, which is also the only
          honest shape — the claim *is* that she stands behind it, and the two columns are the
          evidence.

          **The quote is hers and it is the one she already gave** (`home.teacher_quote`). The
          mockup writes a new line in her voice about checking every beoordeling; that is a claim
          about a real, named person's working practice, and `CLAUDE.md`'s rule about the KNM
          quotation applies — rewriting words inside quotation marks puts a sentence in someone's
          mouth. The mockup's *substance* is kept, as prose, in the three chips and in the "Bij ons"
          column, where it is the site speaking rather than her. Swap the quote only with her words.

          **The peach panel is the one warm surface on the page and it holds the trust layer** —
          §7.4 says state the claim once per view, so the `DocentSeal`-style ringed portrait lives
          here and nowhere else in this section. */}
      <section id="docent" className="py-14 sm:py-16 px-6">
        <div className="max-w-6xl mx-auto flex flex-col gap-4">

          {/* 3a — de docent aan het woord */}
          <div
            className="relative overflow-hidden rounded-2xl p-6 sm:p-8 grid sm:grid-cols-[auto_minmax(0,1fr)] gap-6 sm:gap-8 items-center"
            /* The warm ground is `secondary_container` at 22% over `surface_container_low` — a
               tint of a token, not a new hue. There is no peach in `@theme` and inventing one
               would give the palette a twelfth colour that only this panel knows about. */
            style={{ background: 'rgba(254,118,44,0.22)' }}
          >
            {/* A second, larger disc of the same warm tone, bottom-left — the panel's own texture,
                clipped by the card. Not a sun: it is the same hue as the ground it sits on. */}
            <span aria-hidden="true" className="absolute -left-10 bottom-[-4.5rem] w-56 h-56 rounded-full" style={{ background: 'rgba(255,255,255,0.28)' }} />

            <figure className="relative z-10 m-0 flex flex-col items-center text-center gap-2 justify-self-center">
              {/* The ringed portrait: peach halo, orange ring, her photograph. Rings are outer
                  box-shadows so the image itself stays a clean circle at any size. */}
              <img
                src="/images/marieke-schipper.jpg"
                alt={t('teacher_name')}
                width={132}
                height={132}
                className="w-[7.25rem] h-[7.25rem] sm:w-[8.25rem] sm:h-[8.25rem] rounded-full object-cover object-top"
                style={{ boxShadow: '0 0 0 5px var(--color-secondary-container), 0 0 0 13px rgba(255,255,255,0.45)' }}
              />
              <figcaption className="mt-3">
                <span className="block font-headline font-bold text-primary text-base leading-tight">{t('teacher_name')}</span>
                <span className="block text-xs text-on-secondary-container mt-0.5">{t('teacher_experience')}</span>
              </figcaption>
            </figure>

            <div className="relative z-10">
              <p className="text-secondary font-semibold text-[0.6875rem] uppercase tracking-widest m-0 mb-3">
                {t('docent_eyebrow')}
              </p>
              <blockquote
                className="m-0 font-headline font-extrabold text-primary tracking-tight"
                style={{ fontSize: 'clamp(1.125rem, 2.2vw, 1.5rem)', lineHeight: 1.25, letterSpacing: '-0.02em' }}
              >
                {t('teacher_quote')}
              </blockquote>

              <ul className="flex flex-wrap gap-2 list-none p-0 m-0 mt-5">
                {[1, 2, 3].map(n => (
                  <li key={n}>
                    <span className="inline-flex rounded-full px-3 py-1.5 text-xs font-semibold text-on-secondary-container bg-white/55">
                      {t(`docent_chip_${n}`)}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href={`/${locale}/docent`}
                className="block-cta inline-flex items-center gap-2 rounded-full px-5 py-2.5 mt-5 no-underline font-headline font-bold text-sm"
                style={{ background: 'var(--color-primary)', color: '#fff' }}
              >
                {t('docent_cta')}
              </a>
            </div>
          </div>

          {/* 3b — onze manier naast de hunne. Factual copy only: no logos, nothing crossed out.
              "Bij ons" is navy with `secondary_container` bullets and "Bij AI-platforms" is a tonal
              step with hollow rings — the contrast is carried by surface and by the shape of the
              bullet, never by a new hue for "good" (§7.3). */}
          <div className="grid md:grid-cols-2 gap-4">
            <div
              className="relative overflow-hidden rounded-2xl p-6 flex flex-col"
              style={{ background: 'var(--color-primary)', boxShadow: 'var(--shadow-ambient)' }}
            >
              <DotField on="dark" size={22} />
              <div className="relative z-10 flex flex-col h-full">
                <h3 className="font-headline font-bold text-white text-lg m-0 mb-4">{t('ai_us_title')}</h3>
                <ul className="flex flex-col gap-3 list-none p-0 m-0">
                  {[1, 2, 3, 4].map(n => (
                    <li key={n} className="flex gap-3 text-sm text-white/85 leading-relaxed">
                      <span aria-hidden="true" className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 bg-secondary-container" />
                      <span>{t(`ai_us_${n}`)}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={`/${locale}/docent`}
                  className="block-cta mt-6 self-start inline-flex items-center gap-2 rounded-full px-5 py-2.5 no-underline font-headline font-bold text-sm"
                  style={{ background: '#fff', color: 'var(--color-primary)' }}
                >
                  {t('docent_meet_cta')}
                </a>
              </div>
            </div>

            <div className="rounded-2xl p-6 bg-surface-container">
              <h3 className="font-headline font-bold text-on-surface-variant text-lg m-0 mb-4">{t('ai_them_title')}</h3>
              <ul className="flex flex-col gap-3 list-none p-0 m-0">
                {[1, 2, 3, 4].map(n => (
                  <li key={n} className="flex gap-3 text-sm text-on-surface-variant leading-relaxed">
                    <span
                      aria-hidden="true"
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5"
                      style={{ boxShadow: 'inset 0 0 0 2px var(--color-outline-variant)' }}
                    />
                    <span>{t(`ai_them_${n}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── DE KENNISBANK — alles wat geen oefenexamen is ──
          To the owner's mockup §4a (2026-08-22), placed directly after the docent's quote: the
          section answers "and what if I am not ready to practise yet?", which is the question the
          quote leaves open.

          The cards, the pills and the colour cycle live in `_components/KennisbankCards.tsx`; what
          stays here is *which* destinations the row holds, because that is a content decision and
          it is bounded by the publication gate. Read the comment on `KENNISBANK` above. */}
      <section aria-labelledby="kennisbank-heading" className="py-14 sm:py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2
            id="kennisbank-heading"
            className="font-headline font-extrabold text-primary tracking-tight m-0 mb-6"
            style={{ fontSize: 'clamp(1.5rem, 3.4vw, 2.25rem)', lineHeight: 1.1, letterSpacing: '-0.03em' }}
          >
            {t('kb_heading')}
          </h2>

          <KennisbankCards cards={KENNISBANK} allLabel={t('kb_all')} />
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-14 sm:py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <SectionHeader
            eyebrow={t('faq_badge')}
            title={t('faq_heading')}
            subtitle={t('faq_subheading')}
          />

          <FaqAccordion
            items={faqs.map(({ q, a, link }) => ({
              question: t(q),
              answer: t(a),
              link: link ? { href: '#onderdelen', label: t('faq_a1_link') } : undefined,
            }))}
          />
        </div>
      </section>

      {/* ── The closing CTA ──
          Last on the page, after the FAQ, and it *is* the footer's top edge (owner's decision,
          2026-08-22 — it was a rounded navy card above the FAQ first). The silhouette handover
          moved here from `Footer`, so the houses rise out of the page grid once and everything
          below the street line — this panel and the footer columns — is one navy field. That is
          why `.footer-transition` is hidden from this page: §7.2 allows the handover once, and a
          second one would put a white band between the CTA and the footer it flows into.

          The mockup draws the panel orange with navy type; it is navy on the owner's instruction.
          An orange field this size was the loudest thing on a page of light cards and read as a
          second hero rather than as the end of one page. It carries the sun of its own
          composition as a glow behind the headline, and the button is white — an orange button
          would put the accent in two places in one panel. */}
      <section id="closing" aria-labelledby="closing-heading" className="relative bg-primary">
        <SectionTransition className="closing-transition" />

        <div className="relative overflow-hidden px-6 pt-10 pb-16 sm:pt-12 sm:pb-20 text-center">
          <span
            aria-hidden="true"
            className="absolute inset-x-0 mx-auto -top-10 w-[20rem] h-[20rem] sm:w-[26rem] sm:h-[26rem] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(254,118,44,0.34) 0%, rgba(254,118,44,0) 70%)' }}
          />

          <div className="relative z-10 flex flex-col items-center gap-4">
            <span className="text-[0.6875rem] uppercase tracking-[0.18em] font-bold text-white/70">
              {t('closing_eyebrow')}
            </span>
            <h2
              id="closing-heading"
              className="font-headline font-extrabold text-white text-[1.875rem] sm:text-[2.5rem] leading-[1.1] tracking-[-0.03em] m-0 max-w-2xl"
            >
              {t('closing_heading')}
            </h2>
            <p className="text-base leading-relaxed text-white/80 m-0 max-w-md">
              {t('closing_sub')}
            </p>
            <a
              href={`/${locale}/oefenen`}
              className="hero-cta-primary mt-2 inline-flex items-center gap-2 px-7 py-3.5 rounded-full no-underline font-semibold text-base"
              style={{ background: '#fff', color: 'var(--color-primary)' }}
            >
              {t('cta_primary')}
            </a>
          </div>
        </div>
      </section>

      <style>{`
        /* The handover's own band is surface-container-lowest — pure white, which on this page
           reads as a lighter stripe cut across the grid right where the seam must not be. It gets
           the page's own lattice instead, and its internal dot field (18px, its first child) is
           dropped so the two pitches cannot moiré against each other. */
        .closing-transition {
          background-color: var(--color-surface);
          background-image: radial-gradient(circle at center, rgba(0, 43, 109, 0.14) 1.4px, transparent 1.5px);
          background-size: 26px 26px;
          background-position: 13px 13px;
        }
        .closing-transition > div:first-child {
          display: none;
        }

        /* §7.2 allows one silhouette handover per page and the closing CTA now owns it.
           This <style> only ships with the homepage, so the rule is scoped by existing here. */
        footer .footer-transition {
          display: none;
        }

        .skill-card {
          transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s ease;
        }
        .skill-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0,43,109,0.12) !important;
        }
        .skill-card:active {
          transform: translateY(-1px);
        }
        .skill-card:hover .skill-card-cta {
          text-decoration: underline;
        }
        .block-cta {
          transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.18s ease;
        }
        .block-cta:hover {
          transform: translateY(-2px);
        }
        .block-cta:active {
          transform: translateY(0);
          opacity: 0.9;
        }
        .block-cta:focus-visible, .block-notify:focus-visible {
          outline: 2px solid #fff;
          outline-offset: 2px;
        }
        .kb-pill {
          transition: transform 0.15s ease, background 0.15s ease;
        }
        .kb-pill:hover {
          transform: translateY(-1px);
        }
        .kb-pill:focus-visible {
          outline: 2px solid var(--color-secondary);
          outline-offset: 2px;
        }
        .kb-card {
          transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.18s ease;
        }
        .kb-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-ambient);
        }
        .kb-card:active {
          transform: translateY(-1px);
        }
        .kb-card:focus-visible {
          outline: 2px solid var(--color-secondary);
          outline-offset: 3px;
        }
        .kb-card:hover .kb-arrow {
          transform: translateX(3px);
        }
        .kb-arrow {
          transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1);
        }
        [dir="rtl"] .kb-card:hover .kb-arrow {
          transform: translateX(-3px);
        }
        .block-chip {
          transition: background 0.15s ease;
        }
        .block-chip:hover {
          background: rgba(255,255,255,0.22);
        }
        .block-chip:focus-visible {
          outline: 2px solid #fff;
          outline-offset: 2px;
        }
        .block-notify {
          transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .block-notify:hover {
          text-decoration: underline;
        }
        .block-notify:hover svg {
          transform: translateX(3px);
        }
        .block-notify svg {
          transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1);
        }
        [dir="rtl"] .block-notify:hover svg {
          transform: translateX(-3px) scaleX(-1);
        }
        .hero-cta-primary {
          transition: transform 0.15s ease;
        }
        .hero-cta-primary:hover {
          transform: translateY(-2px);
        }
        .hero-cta-secondary {
          transition: background 0.15s ease;
        }
        .hero-cta-secondary:hover {
          background: rgba(255,255,255,0.20) !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .skill-card, .kb-pill, .kb-card, .kb-arrow, .block-cta, .block-chip, .block-notify, .block-notify svg, .hero-cta-primary, .hero-cta-secondary { transition: none; }
        }
      `}</style>
    </div>
  );
}
