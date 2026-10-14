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
import CategoryMark from '@/components/horizon/CategoryMark';
import Field from '@/components/glas/Field';
import SectionHeading from '@/components/glas/SectionHeading';
import { glasButton } from '@/components/glas/Button';
import Crumbs from './glas/Crumbs';
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

      {/* De kop: Nevel, het leesveld (glas.html §14), onder de pil door, met het kruimelpad erin. */}
      <Field as="header" variant="nevel" veil className="g-readhead">
        <div className="g-wrap">
          <Crumbs items={[{ label: tB('home'), href: '/' }, { label: tB(section) }]} />
          <h1>{tS('heading')}</h1>
          <p className="g-lead">{tS('subheading')}</p>
        </div>
      </Field>

      {/* De gidsen, in leesvolgorde. Een gids met een eigen kopfoto krijgt het glazen bijschrift
          (glas.html §14), een gids zonder foto de gidskaart met het categoriemerk — nooit een
          verzonnen beeld. */}
      {guides.length > 0 && (
        <section className="g-sec" aria-labelledby="hub-guides">
          <div className="g-wrap">
            <SectionHeading id="hub-guides" title={t('guides_title')} size="h1" className="mb-8" />
            <ol className="g-gcards list-none p-0 m-0">
              {guides.map((guide, i) => {
                const lg = getGuideLocale(guide, locale);
                const img = guide.heroImage;
                const meta = `${String(i + 1).padStart(2, '0')} · ${t('reading_time', { minutes: guide.readingMinutes })} · PDF`;
                return (
                  <li key={guide.slug} className="flex">
                    {img ? (
                      <Link href={guideHref(guide, locale)} className="g-gcard w-full">
                        <picture>
                          {img.hasWebp && <source srcSet={`/images/guides/${img.base}.webp`} type="image/webp" />}
                          <img
                            src={`/images/guides/${img.base}.jpg`}
                            alt=""
                            width={1800}
                            height={760}
                            loading="lazy"
                            decoding="async"
                            style={{ objectPosition: img.position ?? 'center 45%' }}
                          />
                        </picture>
                        <div className="g-glass">
                          <span className="g-mono">{meta}</span>
                          <h3>{lg.heroTitle}</h3>
                          <p className="m-0 mt-1.5 text-[0.8125rem] leading-relaxed text-ink-2 line-clamp-2">{lg.description}</p>
                        </div>
                      </Link>
                    ) : (
                      <Link href={guideHref(guide, locale)} className="g-gids w-full">
                        <CategoryMark category="gidsen" size={44} />
                        <span className="g-mono">{meta}</span>
                        <h3>{lg.heroTitle}</h3>
                        <p>{lg.description}</p>
                        <span className="g-gids-ft">
                          <span>{t('read_guide')}</span>
                          <ArrowRight aria-hidden="true" className="rtl-flip" />
                        </span>
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      )}

      {/* Oriëntatie: wat het is, en de fasen als stappen. Zonder gidsen is dit de pagina, met
          gidsen is het context. Een trede hoger dan de gidsen; dat is de scheiding. */}
      <section className="g-sec g-sec-tier" aria-labelledby="hub-intro">
        <div className="g-wrap grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16 items-start">
          <div className="lg:sticky lg:top-[calc(var(--nav-h)+24px)]">
            <SectionHeading id="hub-intro" title={tS('intro_title')} size="h1" />
            <p className="g-body mt-4">{tS('intro_body')}</p>
          </div>
          <div className="bg-wit rounded-g-xl p-6 sm:p-8">
            <h2 className="g-head g-head-3 mb-6">{tS('phases_title')}</h2>
            <ol className="g-gsteps">
              {cards.map(n => (
                <li key={n} className="g-gstep">
                  <span className="g-gstep-n" aria-hidden="true">{n}</span>
                  <div>
                    <b>{tS(`phase_${n}_title`)}</b>
                    <p>{tS(`phase_${n}_body`)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* De blogposts die een deel van dit onderwerp al dekken. */}
      {posts.length > 0 && (
        <section className="g-sec" aria-labelledby="hub-blog">
          <div className="g-wrap">
            <SectionHeading id="hub-blog" title={t('blog_title')} aside={t('blog_desc')} size="h1" className="mb-8" />
            <div className="g-grid3">
              {posts.map(post => {
                const lp = getPostLocale(post!, locale);
                return (
                  <Link
                    key={post!.slug}
                    href={{ pathname: '/blog/[slug]', params: { slug: getPostSlug(post!, locale) } }}
                    className="g-textcard"
                  >
                    <b>{lp.heroTitle}</b>
                    <span>{lp.description}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* De trechter in: de vier onderdelen, één klik van elke hub. */}
      <section className={posts.length > 0 ? 'g-sec g-sec-tier' : 'g-sec'} aria-labelledby="hub-exams">
        <div className="g-wrap">
          <SectionHeading id="hub-exams" title={t('exams_title')} aside={t('exams_desc')} size="h1" className="mb-8" />
          <div className="g-subjects g-subjects-4">
            {SKILLS.map(skill => (
              <Link
                key={skill.slug}
                /* `skillParam`: next-intl vertaalt alleen het statische deel van een route,
                 * de parameterwaarde geeft het ongewijzigd door. */
                href={{
                  pathname: '/oefenexamen/[level]/[skill]',
                  params: { level: DEFAULT_LEVEL, skill: skillParam(skill.slug, locale) },
                }}
                className="g-subject g-subject-row"
              >
                <CategoryMark category={skill.slug} size={40} />
                <b>{tSkills(`${skill.key}.name`)}</b>
                <ArrowRight aria-hidden="true" className="rtl-flip size-4 text-navy shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* De afsluiter: Nevel met één oranje knop, dus geen gloed (glas.html §13). */}
      <div className="g-closing">
        <Field as="section" variant="nevel" className="g-block g-cta-band" aria-labelledby="hub-cta">
          <h2 id="hub-cta">{t('sidebar_cta_title')}</h2>
          <p>{t('sidebar_cta_desc')}</p>
          <Link href="/oefenen" className={glasButton({ variant: 'oranje', size: 'lg', className: 'mt-2' })}>
            {t('sidebar_cta_btn')}
            <ArrowRight className="rtl-flip" aria-hidden="true" />
          </Link>
        </Field>
      </div>
    </>
  );
}
