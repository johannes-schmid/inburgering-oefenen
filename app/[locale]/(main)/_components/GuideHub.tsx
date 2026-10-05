/**
 * The hub of a kennisgids section — `/inburgering`, `/knm` and `/taalexamens` all render this.
 *
 * **Herontwerp 05-10-2026 (eigenaar):** dezelfde opzet als `/gidsen` en de gidspagina — een navy
 * band met het kruimelpad erin, dan de gidsen als fotokaarten, dan de oriëntatie als rijen (kop
 * links, tekst rechts). De delen-lezer (`RouteReader`) en de fasevoortgang zijn van deze pagina
 * af: de route is nu de lijst gidsen zelf, in leesvolgorde.
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
import { ArrowRight } from 'lucide-react';
import { Breadcrumb, CTABanner } from '@/components/site';
import CategoryMark from '@/components/horizon/CategoryMark';
import { DEFAULT_LEVEL, SKILLS } from '@/data/skills';
import { FEATURES } from '@/lib/features';
import { getPostBySlug, getPostLocale, getPostSlug } from '@/data/blog-posts';
import { publishedGuides, getGuideLocale, guideHref } from '@/data/guides/helpers';
import { PHASES } from '@/data/guides/phases';
import type { GuideSection } from '@/data/guides/types';
import { skillParam } from '@/i18n/skill-slugs';

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
  void fase;
  const t = await getTranslations({ locale, namespace: 'guides' });
  const tS = await getTranslations({ locale, namespace: `guides.${section}` });
  const tB = await getTranslations({ locale, namespace: 'breadcrumbs' });
  const tSkills = await getTranslations({ locale, namespace: 'skills' });
  const tR = await getTranslations({ locale, namespace: 'inburgering_route' });

  /* Leesvolgorde: op Inburgering de volgorde van de drie fasen (`PHASES`), wat daar niet in staat
     erachter; de andere hubs houden de dataorde. */
  const phaseOrder = section === 'inburgering' ? PHASES.flatMap(p => p.guides) : [];
  const rank = (slug: string) => { const i = phaseOrder.indexOf(slug); return i === -1 ? Infinity : i; };
  const guides = [...publishedGuides(section)].sort((a, b) => rank(a.slug) - rank(b.slug));
  const cards = Array.from({ length: SECTION_CARDS[section] }, (_, i) => i + 1);

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

      <header className="bg-primary text-white -mt-[var(--nav-h)]" style={{ paddingTop: 'calc(var(--nav-h) + 1rem)' }}>
        <div className="max-w-6xl mx-auto px-6 pb-12 sm:pb-14">
          <Breadcrumb tone="onDark" className="-mx-6 mb-6" items={[{ label: tB('home'), href: '/' }, { label: tB(section) }]} />
          <h1
            className="font-headline font-extrabold text-white m-0 mb-4 max-w-3xl"
            style={{ fontSize: 'clamp(2rem,4.2vw,3rem)', letterSpacing: '-0.02em', lineHeight: 1.1, textWrap: 'balance' }}
          >
            {tS('heading')}
          </h1>
          <p className="text-lg leading-relaxed m-0 max-w-2xl" style={{ color: 'rgba(255,255,255,0.8)' }}>
            {tS('subheading')}
          </p>
        </div>
      </header>

      <main className="bg-surface">
        {/* De gidsen, in leesvolgorde (`publishedGuides` sorteert op `order`). Eén kaart per gids
            met de foto erboven — dezelfde kaart als "Begin hier" op `/gidsen`. */}
        {guides.length > 0 && (
          <section className="px-6 py-14 sm:py-16">
            <div className="max-w-6xl mx-auto">
              <h2
                className="font-headline font-extrabold m-0 mb-8"
                style={{ color: '#002b6d', fontSize: 'clamp(1.6rem,3vw,2.1rem)', letterSpacing: '-0.02em' }}
              >
                {t('guides_title')}
              </h2>
              <ol className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 list-none p-0 m-0">
                {guides.map((guide, i) => {
                  const lg = getGuideLocale(guide, locale);
                  const img = guide.heroImage;
                  return (
                    <li key={guide.slug}>
                      <Link
                        href={guideHref(guide, locale)}
                        className="guide-card-link flex h-full flex-col rounded-2xl overflow-hidden no-underline bg-surface-container-lowest hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                        style={{ boxShadow: 'var(--shadow-ambient)' }}
                      >
                        {img ? (
                          <picture className="block">
                            {img.hasWebp && <source srcSet={`/images/guides/${img.base}.webp`} type="image/webp" />}
                            <img
                              src={`/images/guides/${img.base}.jpg`}
                              alt=""
                              width={1800}
                              height={760}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-44 object-cover"
                              style={{ objectPosition: img.position ?? 'center 45%' }}
                            />
                          </picture>
                        ) : (
                          <div className="h-44 bg-surface-container-low flex items-center justify-center">
                            <CategoryMark category="gidsen" size={40} />
                          </div>
                        )}
                        <span className="flex flex-col flex-1 p-6">
                          <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                            {String(i + 1).padStart(2, '0')} · {t('reading_time', { minutes: guide.readingMinutes })} · PDF
                          </span>
                          <span className="block font-headline font-bold text-lg leading-snug mt-3" style={{ color: '#002b6d', textWrap: 'balance' }}>
                            {lg.heroTitle}
                          </span>
                          <span className="block text-sm text-on-surface-variant leading-relaxed mt-2">{lg.description}</span>
                          <span className="inline-flex items-center gap-1.5 text-sm font-bold mt-auto pt-5" style={{ color: '#a24000' }}>
                            {t('read_guide')}
                            <ArrowRight size={14} className="rtl-flip" aria-hidden="true" />
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </div>
          </section>
        )}

        {/* Oriëntatie als rijen, zoals de secties van een gids: kop links, tekst rechts. Zonder
            gidsen is dit de pagina, met gidsen is het context. */}
        <section className="px-6 py-14 sm:py-16 bg-surface-container-low">
          <div className="max-w-6xl mx-auto">
            <div className="guide-row" style={{ paddingTop: 0 }}>
              <h2 className="guide-section-title font-headline" style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.15, color: '#002b6d', margin: 0 }}>
                {tS('intro_title')}
              </h2>
              <p className="text-on-surface m-0 max-w-[72ch]" style={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
                {tS('intro_body')}
              </p>
            </div>
            <div className="guide-row" style={{ paddingBottom: 0 }}>
              <h2 className="guide-section-title font-headline" style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.15, color: '#002b6d', margin: 0 }}>
                {tS('phases_title')}
              </h2>
              <ol className="list-none p-0 m-0 flex flex-col gap-7 max-w-[72ch]">
                {cards.map(n => (
                  <li key={n} className="flex gap-5">
                    <span
                      className="inline-flex items-center justify-center w-10 h-10 rounded-[11px] font-headline font-extrabold text-white flex-shrink-0"
                      style={{ background: '#002b6d' }}
                      aria-hidden="true"
                    >
                      {n}
                    </span>
                    <span className="flex flex-col gap-1 pt-1.5">
                      <span className="font-headline font-bold text-lg leading-snug" style={{ color: '#002b6d' }}>{tS(`phase_${n}_title`)}</span>
                      <span className="text-on-surface-variant leading-relaxed" style={{ fontSize: '1.05rem' }}>{tS(`phase_${n}_body`)}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* The blog posts that already cover part of this ground. */}
        {posts.length > 0 && (
          <section className="px-6 py-14 sm:py-16">
            <div className="max-w-6xl mx-auto">
              <h2 className="font-headline font-extrabold m-0 mb-2" style={{ color: '#002b6d', fontSize: 'clamp(1.6rem,3vw,2.1rem)', letterSpacing: '-0.02em' }}>{t('blog_title')}</h2>
              <p className="text-base text-on-surface-variant m-0 mb-8">{t('blog_desc')}</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map(post => {
                  const lp = getPostLocale(post!, locale);
                  return (
                    <Link
                      key={post!.slug}
                      href={{ pathname: '/blog/[slug]', params: { slug: getPostSlug(post!, locale) } }}
                      className="guide-card-link bg-surface-container-lowest rounded-2xl p-7 flex flex-col gap-3 no-underline hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                      style={{ boxShadow: 'var(--shadow-ambient)' }}
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
        <section className="px-6 pb-16">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-headline font-extrabold m-0 mb-2" style={{ color: '#002b6d', fontSize: 'clamp(1.6rem,3vw,2.1rem)', letterSpacing: '-0.02em' }}>{t('exams_title')}</h2>
            <p className="text-base text-on-surface-variant m-0 mb-8">{t('exams_desc')}</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              {SKILLS.map(skill => (
                <Link
                  key={skill.slug}
                  /* `skillParam`: next-intl vertaalt alleen het statische deel van een route,
                   * de parameterwaarde geeft het ongewijzigd door. */
                  href={{
                    pathname: '/oefenexamen/[level]/[skill]',
                    params: { level: DEFAULT_LEVEL, skill: skillParam(skill.slug, locale) },
                  }}
                  className="guide-card-link bg-surface-container-lowest rounded-2xl p-6 flex items-center gap-3 no-underline hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{ boxShadow: 'var(--shadow-ambient)' }}
                >
                  <CategoryMark category={skill.slug} size={32} />
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
