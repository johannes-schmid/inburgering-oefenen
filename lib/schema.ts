/**
 * The JSON-LD shapes more than one page needs.
 *
 * Deliberately thin. Page-specific graphs (the homepage's `@graph`, a blog post's
 * `BlogPosting`) stay on their page — pulling them here would centralise things that have
 * exactly one caller. What lives here is what two pages would otherwise define differently.
 *
 * Origins and `@id` anchors come from `lib/site.ts`; this module never restates the URL.
 */
import { SITE_URL, ORG_ID, TEACHER_ID } from '@/lib/site';
import type { Level, SkillSlug } from '@/data/skills';
import { translateDutchPath } from '@/i18n/paths';

/**
 * Absolute URL for a locale-prefixed path. `absUrl('nl', 'oefenen')` → `…/nl/oefenen`.
 *
 * **Geef altijd het Nederlandse pad door** — dat is de interne naam van de route. Sinds de
 * publieke slugs per taal verschillen (15-09) vertaalt deze functie het pad zelf:
 * `absUrl('en', 'oefenexamen/a2/lezen')` → `…/en/practice-exam/a2/reading`. Een aanroeper die
 * de vertaalde slug al zelf invult, vertaalt hem twee keer en komt op een pad uit dat niet
 * bestaat. Zie `i18n/paths.ts`.
 */
export function absUrl(locale: string, path = ''): string {
  const localized = translateDutchPath(path, locale);
  return localized ? `${SITE_URL}/${locale}/${localized}` : `${SITE_URL}/${locale}`;
}

/**
 * The stable `@id` of an onderdeel's Course node.
 *
 * There must be exactly **one** Course per exam URL. The homepage and the
 * `/oefenexamen/[level]/[skill]` overview both describe these courses; the overview owns the
 * node and the homepage references this id, rather than both emitting a full Course for the
 * same `url` with different `description`s — which is a contradiction a validator will not
 * catch and a search engine resolves by picking one.
 */
export function courseId(locale: string, level: Level, skill: SkillSlug): string {
  return `${absUrl(locale, `oefenexamen/${level}/${skill}`)}#course`;
}

/**
 * `alternates` for a route whose slug is **not** translated — canonical plus one hreflang per
 * locale plus `x-default`.
 *
 * Fourteen `(main)` pages hand-roll this block today and no helper existed; new routes use this
 * one. Sinds 15-09 dekt hij óók de vertaalde slugs: `absUrl` leidt het pad per taal af uit
 * `routing.ts`, dus `alternatesFor('en', 'gidsen')` levert `/en/guides`. De kop van dit blok
 * zei tot dan dat dat niet kon; dat was waar zolang `absUrl` de taalcode simpelweg vóór het
 * Nederlandse pad plakte. `/premium`, `/docent` en `/contact` hoeven hun literalen dus niet
 * meer te herhalen.
 *
 * `path` carries no leading slash: `alternatesFor('nl', 'inburgering')`.
 *
 * `indexable` narrows the hreflang set to the locales that are actually indexable, and exists
 * because of the kennisgidsen. A guide with no English body is `noindex` on `/en/...` — correct,
 * it would be a thin duplicate — but the block still advertised that URL as the English
 * alternative. **An hreflang pointing at a `noindex` page is a contradiction Google resolves by
 * distrusting the cluster**, so the guide it *does* have a translation for loses the signal too.
 * Omit the locale instead: hreflang is a claim that an alternative exists, and for those pages it
 * does not. `x-default` stays unconditional — Dutch is always there and is always the fallback.
 *
 * Pass nothing for a route that is genuinely translated in all three (every hand-written page).
 */
export function alternatesFor(locale: string, path: string, indexable?: readonly string[]) {
  const locales = indexable ?? ['nl', 'en', 'ar'];
  const languages: Record<string, string> = {};
  for (const l of locales) languages[l] = absUrl(l, path);
  languages['x-default'] = absUrl('nl', path);
  return { canonical: absUrl(locale, path), languages };
}

export type Crumb = {
  name: string;
  /** Locale-prefixed path without the leading slash. Omit for the current (last) page. */
  path?: string;
};

/**
 * `BreadcrumbList`, with the homepage always first.
 *
 * The last crumb deliberately carries no `item`: it is the page being viewed, and pointing a
 * breadcrumb at itself is what makes Google drop the whole trail. Names are passed in already
 * translated — a breadcrumb in the wrong language on an `/ar` page is worse than none.
 */
export function breadcrumbs(locale: string, home: string, trail: Crumb[], selfUrl?: string) {
  const all: Crumb[] = [{ name: home, path: '' }, ...trail];
  const last = trail[trail.length - 1];
  return {
    '@type': 'BreadcrumbList',
    // `selfUrl` overschrijft de afleiding voor een pagina die haar eigen URL al kent. Sinds
    // `absUrl` de slug per taal opzoekt is dat zelden nog nodig — geef het Nederlandse pad door.
    '@id': `${selfUrl ?? absUrl(locale, last?.path ?? '')}#breadcrumb`,
    itemListElement: all.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      ...(i < all.length - 1 ? { item: absUrl(locale, crumb.path) } : {}),
    })),
  };
}

/**
 * The provider/publisher reference every educational node on the site shares.
 *
 * **`name` en `url` staan erbij, en dat is geen tweede definitie van de node.** Een `@id` wordt
 * per document opgelost: op `/gidsen` verwijst `publisher: { '@id': ORG_ID }` naar een node die
 * alleen in de `@graph` van de homepage bestaat, en een crawler die die pagina niet in dezelfde
 * beurt gelezen heeft, houdt een lege verwijzing over. Daarmee was "wie geeft dit uit" op elke
 * gids en elk blogartikel feitelijk blanco — precies het signaal waar de docent-op-naam voor
 * bedoeld is.
 *
 * Wat hier bij mag staan, is beperkt tot wat overal identiek is: de naam en het adres. De
 * velden die per pagina zouden kunnen gaan afwijken — `description`, `teaches`, `logo` — blijven
 * van de homepage. Dat is dezelfde regel als hiervoor: één eigenaar per node, en verwijzingen
 * die genoeg zeggen om op zichzelf te staan zonder iets tegen te spreken.
 */
export const PROVIDER_REF = {
  '@id': ORG_ID,
  '@type': 'EducationalOrganization',
  name: 'Inburgering Oefenen',
  url: `${SITE_URL}/`,
} as const;

/**
 * Dezelfde afspraak voor de docent: de `Person`-node hoort bij `/docent`, dit is de verwijzing
 * die elders genoeg zegt om te lezen als een auteur.
 *
 * `jobTitle` staat erbij omdat dat het hele punt van de byline is — een auteursverwijzing zonder
 * beroep is voor een lezer én voor een crawler niet te onderscheiden van een willekeurige naam.
 * De onderbouwing ervan (`hasCredential`, `knowsAbout`, `description`) blijft op de profielpagina.
 */
export const TEACHER_REF = {
  '@id': TEACHER_ID,
  '@type': 'Person',
  name: 'Marieke Schipper',
  jobTitle: 'NT2-docent',
  url: `${SITE_URL}/nl/docent`,
} as const;

/**
 * Het Open Graph-plaatje van een pagina, als `images` voor `generateMetadata`.
 *
 * **Dit moet expliciet in elke `openGraph` die een pagina zélf opgeeft, en dat is geen
 * dubbelop.** Next voegt het `openGraph`-object van een pagina niet samen met dat van de layout —
 * het vervángt het. Zolang een pagina een eigen `openGraph` heeft zonder `images`, valt het
 * plaatje weg, en de bestandsconventie (`app/[locale]/opengraph-image.tsx`) springt daar *niet*
 * voor in: die vult alleen een pagina aan die zelf geen `openGraph` opgeeft. Op 15-09 was dat
 * getest en gemeten — `/premium` had een plaatje omdat die géén eigen blok heeft, `/`, `/gidsen`
 * en `/blog` hadden er geen omdat ze er wél een hebben.
 *
 * De URL wijst naar de route die dat bestand oplevert, zonder de hash die Next er in de meta-tag
 * zelf achter zet: die hash is een cache-buster, geen deel van het adres, en `/[locale]/opengraph-image`
 * antwoordt zonder hem met dezelfde PNG van 1200×630.
 */
export function ogImageFor(locale: string) {
  return [{
    url: `${SITE_URL}/${locale}/opengraph-image`,
    width: 1200,
    height: 630,
    alt: 'Inburgering Oefenen — oefenexamens voor het inburgeringsexamen van een NT2-docent',
  }];
}

/**
 * Drop keys whose value is `null` or `undefined`.
 *
 * B1's `itemCount` and `durationMinutes` are `null` — unverified, see `data/skills.ts`. In
 * JSON-LD an absent property means "not stated" while `0` is a claim, so an unverified count
 * must vanish rather than serialise. Same rule `lib/pricing.ts` applies to `itemCount`.
 */
export function omitEmpty<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== null && v !== undefined),
  ) as Partial<T>;
}
