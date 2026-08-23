/**
 * The hub of a kennisgids section — `/inburgering`, `/knm` and `/taalexamens` all render this.
 *
 * One component, three sections, because hubs that drift apart is a mistake this repo has made
 * before (`sections` versus `task_type`). The section supplies its own copy through the
 * `guides.<section>` message namespace; nothing about any hub is hardcoded here. The two
 * per-section facts that cannot come from a message — how many orienting cards and which blog
 * posts overlap — are the two `Record<GuideSection, …>` maps below, so a fourth section is two
 * entries and a namespace rather than a new file.
 *
 * **The zero-guide state is content, not a placeholder.** M1 shipped the architecture before the
 * guides (M2/M3), and the owner chose to make the nav entries visible immediately. A page that
 * says "binnenkort" and nothing else would be a thin page on an indexable route, so the hub always
 * carries the section's own orientation — what it is, the phases it runs through — plus the blog
 * posts that already cover part of the ground and the route into the free taster. As guides are
 * reviewed they appear above all of that; the empty state simply stops being the whole page.
 *
 * Linking the existing posts is also the fix for a real overlap:
 * `taalniveaus-a1-a2-b1-nederlands` already owns the "A2 of B1" ground that M2 lists as a spoke.
 * One query, one owning page — applied before the duplicate exists rather than after.
 */
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import JsonLd from '@/components/JsonLd';
import { absUrl, breadcrumbs, PROVIDER_REF } from '@/lib/schema';
import { WEBSITE_ID, langTag } from '@/lib/site';
import { GradientHero, Breadcrumb, SectionHeader, CTABanner } from '@/components/site';
import SkillIcon from '@/components/site/SkillIcon';
import GuideCover from '@/components/horizon/GuideCover';
import { DEFAULT_LEVEL, SKILLS } from '@/data/skills';
import { FEATURES } from '@/lib/features';
import { getPostBySlug, getPostLocale, getPostSlug } from '@/data/blog-posts';
import { publishedGuides, getGuideLocale, guideHref } from '@/data/guides/helpers';
import { PHASES, phaseFromParam } from '@/data/guides/phases';
import { guideSections } from '@/lib/guides/sections';
import RouteReader, { type RoutePhaseView } from '@/components/inburgering/RouteReader';
import RouteProgress from '@/components/inburgering/RouteProgress';
import type { GuideSection } from '@/data/guides/types';

/**
 * How many orienting cards a section renders. Copy lives in `guides.<section>.phase_N_*`, so the
 * count and the message keys must agree — a card with no key throws at render.
 *
 * Taalexamens has four because its cards are the four onderdelen, not phases of a process.
 */
const SECTION_CARDS: Record<GuideSection, number> = {
  inburgering: 5,
  knm: 5,
  taalexamens: 4,
};

/**
 * Posts worth surfacing on a hub, by Dutch slug. Deliberately a short hand-picked list rather
 * than every post: the hub points at what overlaps its own subject, not at the blog index.
 */
const HUB_POSTS: Record<GuideSection, string[]> = {
  inburgering: [
    'inburgeringsexamen-a2-uitleg',
    'taalniveaus-a1-a2-b1-nederlands',
    'inburgeringsexamen-zakken-herkansen',
  ],
  knm: [],
  /* The strongest of the three: the per-onderdeel posts for Lezen and Luisteren already exist, so
   * two of the four guides M4 plans for this section are effectively written. The hub links them
   * rather than M4 writing competing pages — one query, one owning page, the same call M1 made for
   * `taalniveaus-a1-a2-b1-nederlands`. */
  taalexamens: [
    'lezen-examen-inburgering-a2',
    'luisteren-examen-inburgering-a2',
    'inburgeringsexamen-a2-uitleg',
    'taalniveaus-a1-a2-b1-nederlands',
  ],
};

export default async function GuideHub({
  section,
  locale,
  fase,
}: {
  section: GuideSection;
  locale: string;
  /**
   * `?fase=` — which of the three Inburgering fasen opens first. Only `/inburgering` passes it;
   * the other two hubs have no route. An unrecognised value falls back to fase 1 rather than to
   * nothing (`phaseFromParam`), so a stale link from an e-mail still lands on a usable page.
   */
  fase?: string;
}) {
  const t = await getTranslations({ locale, namespace: 'guides' });
  const tS = await getTranslations({ locale, namespace: `guides.${section}` });
  const tB = await getTranslations({ locale, namespace: 'breadcrumbs' });
  const tSkills = await getTranslations({ locale, namespace: 'skills' });
  const tR = await getTranslations({ locale, namespace: 'inburgering_route' });

  const guides = publishedGuides(section);
  const cards = Array.from({ length: SECTION_CARDS[section] }, (_, i) => i + 1);

  /* The Inburgering route. Built here rather than in the client component because the step titles
     are the guides' own `<h2>`s, which means reading `articleHtml` — and `articleHtml` must never
     cross into the browser bundle: the four bodies together are ~90 kB of prose that the hub does
     not render. So the server extracts `{ id, title, minutes }` per section and ships only that.
     A phase whose guides are all unpublished is dropped, so an unreviewed guide cannot put an
     empty card at the top of the funnel. */
  const phaseViews: RoutePhaseView[] =
    section === 'inburgering'
      ? PHASES.map(p => ({
          id: p.id,
          number: p.number,
          /* A fase's delen are its guides' `<h2>` sections, concatenated in reading order. The
             extraction reads `articleHtml`, which is why it happens here: the four bodies are ~90 kB
             of prose the hub does not render and which must never reach the browser bundle. */
          delen: p.guides.flatMap(slug => {
            const g = guides.find(x => x.slug === slug);
            if (!g) return [];
            const lg = getGuideLocale(g, locale);
            return guideSections(lg.articleHtml).map(sec => ({
              id: sec.id,
              title: sec.title,
              minutes: sec.minutes,
              slug: g.slug,
              section: g.section,
              guideTitle: lg.heroTitle,
              /* Carried per deel rather than looked up in the client: `RouteReader` never sees a
                 `Guide`, and shipping one to it would drag `articleHtml` into the bundle. */
              coverGlyph: g.coverGlyph,
              pillar: g.pillar,
            }));
          }),
        })).filter(p => p.delen.length > 0)
      : [];
  const showRoute = phaseViews.length > 0;
  const posts = FEATURES.blog
    ? HUB_POSTS[section].map(slug => getPostBySlug(slug)).filter(Boolean)
    : [];

  /* CollectionPage + ItemList + BreadcrumbList.
   *
   * The ItemList holds **published guides only** — a crawler must not be handed a structured link
   * to a page whose own meta tag says noindex. On an empty section the list is therefore absent
   * rather than empty: in JSON-LD an omitted property means "not stated", while an empty array is
   * a claim that the collection contains nothing.
   *
   * Every shared node is referenced by `@id` and none is restated — the invariant
   * `scripts/check-schema.mjs` enforces since M0. */
  const selfUrl = absUrl(locale, section);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${selfUrl}#collection`,
        name: tS('heading'),
        description: tS('meta_description'),
        url: selfUrl,
        inLanguage: langTag(locale),
        isPartOf: { '@id': WEBSITE_ID },
        publisher: PROVIDER_REF,
      },
      ...(guides.length
        ? [{
            '@type': 'ItemList',
            '@id': `${selfUrl}#list`,
            itemListElement: guides.map((guide, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              url: absUrl(locale, `${section}/${guide.slug}`),
              name: getGuideLocale(guide, locale).heroTitle,
            })),
          }]
        : []),
      breadcrumbs(locale, tB('home'), [{ name: tB(section) }], selfUrl),
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />

      <GradientHero className="pb-16">
        <div className="max-w-3xl">
          <span className="inline-block px-3 py-1 rounded-full font-bold text-xs uppercase tracking-widest mb-5 bg-secondary-container text-on-secondary-container">
            {tS('eyebrow')}
          </span>
          <h1
            className="font-headline font-bold text-white tracking-tight mb-6 leading-tight"
            style={{ fontSize: 'clamp(2rem,4vw,3rem)' }}
          >
            {tS('heading')}
          </h1>
          {/* Where the reader is in the route. Renders nothing until localStorage has been read —
              see `RouteProgress`. */}
          <RouteProgress phases={phaseViews} />
          <p className="text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>
            {tS('subheading')}
          </p>
        </div>
      </GradientHero>

      <Breadcrumb items={[{ label: tB('home'), href: '/' }, { label: tB(section) }]} />

      <main className="bg-surface">
        {/* The guides themselves — only once one has been reviewed. */}
        {guides.length > 0 && !showRoute && (
          <section className="py-16 px-6">
            <div className="max-w-7xl mx-auto">
              <SectionHeader title={t('guides_title')} />
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {guides.map(guide => {
                  const lg = getGuideLocale(guide, locale);
                  return (
                    <Link
                      key={guide.slug}
                      href={guideHref(guide)}
                      className="bg-surface-container-lowest rounded-2xl overflow-hidden flex flex-col no-underline shadow-sm post-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                      style={{ textDecoration: 'none' }}
                    >
                      {/* The cover carries the eyebrow's job visually — the field says which cluster
                          and the sun says whether this is the pillar — so the chip stays for the
                          words and the two do not compete. See `components/horizon/GuideCover.tsx`. */}
                      <GuideCover
                        slug={guide.slug}
                        field={guide.section}
                        glyph={guide.coverGlyph}
                        pillar={guide.pillar}
                        className="rounded-none"
                      />
                      <div className="p-7 flex flex-col gap-3">
                        <span
                          className="inline-block px-3 py-1 font-bold text-xs uppercase tracking-widest rounded-full w-fit"
                          style={{ background: 'rgba(0,43,109,0.06)', color: '#002b6d' }}
                        >
                          {lg.eyebrow}
                        </span>
                        <h2 className="font-headline font-bold text-lg text-on-surface leading-snug">
                          {lg.heroTitle}
                        </h2>
                        <p className="text-on-surface-variant text-sm leading-relaxed">{lg.description}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* The route — Inburgering only. It is the page's spine, so it sits directly under the
            hero, above the orientation prose: a reader who knows what inburgering is should not
            have to scroll past a definition of it to find where to start. `SectionHeader` carries
            the same copy the fasen cards used to introduce. */}
        {showRoute && (
          <section className="py-14 px-6">
            <div className="max-w-7xl mx-auto">
              {/* No `SectionHeader` above the route: the open fase already prints its own eyebrow
                  and title, and two headings stacked read as one of them being a subtitle of the
                  other (owner's mockup, 2026-08-23). */}
              <RouteReader phases={phaseViews} initialPhase={phaseFromParam(fase)} />
            </div>
          </section>
        )}

        {/* Orientation. Always rendered: with no guides it is the page, with guides it is context. */}
        <section className={guides.length > 0 ? 'pb-16 px-6' : 'py-16 px-6'}>
          <div className="max-w-7xl mx-auto">
            <div
              className="bg-surface-container-lowest rounded-2xl p-8 md:p-10 mb-10"
              style={{ boxShadow: '0 2px 32px rgba(0,43,109,0.06)' }}
            >
              <h2
                className="font-headline font-bold text-on-surface mb-4"
                style={{ fontSize: '1.5rem', letterSpacing: '-0.01em' }}
              >
                {tS('intro_title')}
              </h2>
              <p className="text-on-surface-variant leading-relaxed max-w-3xl" style={{ lineHeight: 1.7 }}>
                {tS('intro_body')}
              </p>
            </div>

            {/* The five traject cards. On Inburgering the fasen above now carry the "where do I
                start" job, and these are the DUO process end to end — kept, because they answer a
                different question, but demoted below the route rather than competing with it. */}
            <SectionHeader title={tS('phases_title')} />
            <ol className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 list-none p-0">
              {cards.map(n => (
                <li
                  key={n}
                  className="bg-surface-container-lowest rounded-2xl p-6"
                  style={{ boxShadow: '0 2px 16px rgba(0,43,109,0.06)' }}
                >
                  <span
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg font-headline font-bold text-sm mb-4"
                    style={{ background: 'rgba(254,118,44,0.12)', color: '#a24000' }}
                    aria-hidden="true"
                  >
                    {n}
                  </span>
                  <h3 className="font-headline font-bold text-on-surface mb-2 leading-snug">
                    {tS(`phase_${n}_title`)}
                  </h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{tS(`phase_${n}_body`)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* The blog posts that already cover part of this ground. */}
        {posts.length > 0 && (
          <section className="pb-16 px-6">
            <div className="max-w-7xl mx-auto">
              <SectionHeader title={t('blog_title')} subtitle={t('blog_desc')} />
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map(post => {
                  const lp = getPostLocale(post!, locale);
                  return (
                    <Link
                      key={post!.slug}
                      href={{ pathname: '/blog/[slug]', params: { slug: getPostSlug(post!, locale) } }}
                      className="bg-surface-container-lowest rounded-2xl p-7 flex flex-col gap-3 no-underline shadow-sm post-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                      style={{ textDecoration: 'none' }}
                    >
                      <h3 className="font-headline font-bold text-on-surface leading-snug">{lp.heroTitle}</h3>
                      <p className="text-on-surface-variant text-sm leading-relaxed">{lp.description}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Into the funnel: the four onderdelen, one click away from every hub. */}
        <section className="pb-16 px-6">
          <div className="max-w-7xl mx-auto">
            <SectionHeader title={t('exams_title')} subtitle={t('exams_desc')} />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              {SKILLS.map(skill => (
                <Link
                  key={skill.slug}
                  href={{
                    pathname: '/oefenexamen/[level]/[skill]',
                    params: { level: DEFAULT_LEVEL, skill: skill.slug },
                  }}
                  className="bg-surface-container-lowest rounded-2xl p-6 flex items-center gap-3 no-underline shadow-sm post-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{ textDecoration: 'none' }}
                >
                  <SkillIcon skill={skill.slug} size="sm" />
                  <span className="font-headline font-bold text-on-surface">
                    {tSkills(`${skill.key}.name`)}
                  </span>
                </Link>
              ))}
            </div>

            <CTABanner
              title={t('sidebar_cta_title')}
              description={t('sidebar_cta_desc')}
              button={{ label: t('sidebar_cta_btn'), href: '/oefenen' }}
            />
          </div>
        </section>
      </main>
    </>
  );
}
