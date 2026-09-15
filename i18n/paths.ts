import { isSkillSlug } from '@/data/skills';
import { routing, type Locale } from './routing';
import { parseSkillParam, skillParam } from './skill-slugs';
import { contentSlugParam, parseContentSlug } from './content-slugs';

/**
 * Van een Nederlands pad naar het pad van een andere taal.
 *
 * Dit bestaat omdat `absUrl(locale, path)` in `lib/schema.ts` er tot 15-09 van uitging dat een
 * pad in elke taal hetzelfde is: het plakte de taalcode voor de Nederlandse slug. Dat klopte
 * zolang alleen `/premium`, `/docent` en `/contact` een vertaling hadden — en díé drie moesten
 * hun URL's dan ook met de hand herhalen, wat de bug in de sitemap van 19-08 opleverde.
 *
 * Met een vertaalde slug op elk publiek oppervlak is dat uitgangspunt onhoudbaar: elke
 * canonical, elke hreflang en elk `@id` zou naar een 308 wijzen. Eén functie op de plek waar
 * het pad wordt samengesteld is goedkoper en veiliger dan vijftig aanroepen die het elk
 * apart onthouden.
 *
 * De aanroepers blijven dus het Nederlandse pad doorgeven — dat is de interne naam — en dit is
 * de enige plek die weet hoe het er in een andere taal uitziet.
 */
export function translateDutchPath(path: string, locale: string): string {
  const clean = path.replace(/^\/+|\/+$/g, '');
  if (!clean) return '';

  const match = matchDutch(`/${clean}`);
  if (!match) return clean;

  const entry = routing.pathnames[match.route] as string | Record<string, string>;
  const template = typeof entry === 'string' ? entry : entry[locale as Locale] ?? entry.nl;

  return fill(template, match.params, locale).replace(/^\//, '');
}

/**
 * Het volledige pad van een route in één taal, opgebouwd uit de routenaam in plaats van uit
 * een Nederlands pad. Gebruik dit waar de route bekend is (de sitemap, een `generateMetadata`);
 * `translateDutchPath` is voor de aanroepers die alleen een pad in handen hebben.
 */
export function localizedPath(
  route: keyof typeof routing.pathnames,
  locale: string,
  params: Record<string, string> = {},
): string {
  const entry = routing.pathnames[route] as string | Record<string, string>;
  const template = typeof entry === 'string' ? entry : entry[locale as Locale] ?? entry.nl;
  return `/${locale}${fill(template, params, locale)}`;
}

/**
 * Twee parameterwaarden worden vertaald: de onderdeelnaam (`[skill]`) en de slug van een gids
 * of blogartikel (`[slug]`, en `[thema]` voor de KNM-route, die om historische redenen anders
 * heet maar dezelfde gids-slug draagt).
 *
 * Alle andere blijven staan. `[level]` is 'a2'/'b1' en `[n]` is een examennummer — namen die
 * DUO voert of die de kandidaat op zijn uitslag ziet; een vertaling daarvan is geen betere
 * URL, alleen een onherkenbare.
 */
function fill(template: string, params: Record<string, string>, locale: string): string {
  return Object.entries(params).reduce(
    (path, [name, value]) => path.replace(`[${name}]`, paramValue(name, value, locale)),
    template,
  );
}

function paramValue(name: string, value: string, locale: string): string {
  if (name === 'skill' && isSkillSlug(value)) return skillParam(value, locale);
  if (name === 'slug' || name === 'thema') return contentSlugParam(value, locale);
  return value;
}

type Match = { route: keyof typeof routing.pathnames; params: Record<string, string> };

/* Het meest specifieke pad wint, want `/knm/woordenlijst` en `/knm/[thema]` passen allebei op
 * twee segmenten. Dat is dezelfde voorrang die de App Router zelf hanteert — een statisch
 * segment gaat vóór een parameter — en `tests-unit/guides.test.ts` bewaakt dat er geen gids op
 * zo'n gereserveerde slug wordt geschreven. */
function matchDutch(path: string): Match | undefined {
  const segments = path.split('/').filter(Boolean);
  let best: Match | undefined;
  let bestStatics = -1;

  for (const route of Object.keys(routing.pathnames) as (keyof typeof routing.pathnames)[]) {
    const entry = routing.pathnames[route] as string | Record<string, string>;
    const dutch = (typeof entry === 'string' ? entry : entry.nl).split('/').filter(Boolean);
    if (dutch.length !== segments.length) continue;

    const params: Record<string, string> = {};
    let statics = 0;
    let ok = true;

    for (const [i, part] of dutch.entries()) {
      if (part.startsWith('[')) params[part.slice(1, -1)] = segments[i];
      else if (part === segments[i]) statics++;
      else { ok = false; break; }
    }

    if (ok && statics > bestStatics) { best = { route, params }; bestStatics = statics; }
  }

  return best;
}

/**
 * Een intern `href` met taalcode én de vertaalde slug: `localeHref('en', 'oefenen/lezen')`
 * geeft `/en/practice/reading`.
 *
 * Er staan een kleine tweehonderd van deze links in de codebase als `` `/${locale}/…` ``, en dat
 * ging goed zolang elk pad in elke taal hetzelfde was. Met vertaalde slugs wordt zo'n link een
 * 308 — hij werkt, maar elke interne link naar een publieke pagina kost dan een hop, en dat is
 * precies het crawl-signaal dat we met die vertaling wilden winnen.
 *
 * Geef ook hier het **Nederlandse** pad door. Een query of anker mag eraan vastzitten; die
 * blijven onaangeraakt.
 */
export function localeHref(locale: string, path: string): string {
  const [pathname = '', rest = ''] = splitOnce(path.replace(/^\/+/, ''));
  const localized = translateDutchPath(pathname, locale);
  return `/${locale}${localized ? `/${localized}` : ''}${rest}`;
}

function splitOnce(path: string): [string, string] {
  const at = path.search(/[?#]/);
  return at === -1 ? [path, ''] : [path.slice(0, at), path.slice(at)];
}

/**
 * Het canonieke pad voor een URL die de onderdeelnaam in de verkeerde taal draagt, of
 * `undefined` als er niets mis is.
 *
 * Dit hoort in `proxy.ts` en niet op de pagina, en dat is een les die geld kostte: een
 * `permanentRedirect()` in deze route levert **geen 308**. De overzichtspagina leest geen
 * dynamische API en wordt dus statisch gerenderd (`x-nextjs-prerender: 1`); Next bakt de
 * omleiding dan ín de statische pagina en antwoordt met 200. De canonical klopte, de status
 * niet — precies de vorm waarin dit ongemerkt de index in glipt.
 *
 * **Alleen de trechter.** `/dashboard/[level]/[skill]` draagt dezelfde vier waarden maar heeft
 * geen vertaalde slug, dus `/en/dashboard/a2/reading` bestaat niet: dat zonder deze afbakening
 * omleiden haalt het portaal onderuit.
 */
export function canonicalSkillPath(pathname: string): string | undefined {
  const segments = pathname.split('/').filter(Boolean);
  const [locale, ...rest] = segments;
  if (!routing.locales.includes(locale as Locale) || rest.length === 0) return undefined;

  /* `nextUrl.pathname` is procent-gecodeerd en `routing.ts` bevat de letterlijke Arabische
   * slug, dus vergelijken kan alleen na decoderen: zonder dit viel `/ar/تدرب/lezen` buiten de
   * afbakening en bleef hij naast `/ar/تدرب/القراءة` bestaan. */
  if (!funnelHeads(locale).has(safeDecode(rest[0]))) return undefined;

  /* Overal gedecodeerd doorrekenen, zodat er nooit een half gecodeerd pad uit komt. De
   * `URL` die `proxy.ts` ermee vult codeert het weer netjes in zijn geheel. */
  let changed = false;
  const fixed = rest.map(segment => {
    const decoded = safeDecode(segment);
    const slug = parseSkillParam(decoded);
    if (!slug) return decoded;
    const want = skillParam(slug, locale);
    if (want !== decoded) changed = true;
    return want;
  });

  return changed ? `/${[locale, ...fixed].join('/')}` : undefined;
}

/** Het eerste segment van de twee routes waar `[skill]` vertaald is, in deze taal. */
function funnelHeads(locale: string): Set<string> {
  const heads = new Set<string>();
  for (const route of ['/oefenen', '/oefenexamen/[level]/[skill]'] as const) {
    const entry = routing.pathnames[route] as string | Record<string, string>;
    const template = typeof entry === 'string' ? entry : entry[locale as Locale] ?? entry.nl;
    heads.add(template.split('/').filter(Boolean)[0]);
  }
  return heads;
}

function safeDecode(value: string): string {
  try { return decodeURIComponent(value); } catch { return value; }
}

/**
 * Het canonieke pad voor een gids- of blog-URL die de slug in de verkeerde taal draagt, of
 * `undefined` als er niets mis is.
 *
 * Tot deze wijziging was elke slug in elke taal gelijk, dus `/en/civic-integration/wonen`
 * stond in de index, in verstuurde mails en in links van buiten. Die URL's blijven werken en
 * krijgen hier een 308 naar `/en/civic-integration/housing`.
 *
 * Dit hoort in `proxy.ts` en niet op de pagina, om dezelfde reden als `canonicalSkillPath`
 * hierboven: een `permanentRedirect()` in een statisch gerenderde route levert een 200 met de
 * omleiding ín de pagina in plaats van een 308.
 *
 * De vier routes hieronder zijn de enige die een gids- of blogslug dragen. `/knm/woordenlijst`
 * en de andere gereserveerde statische kinderen passen wel op de vorm maar niet op de tabel:
 * `parseContentSlug` geeft er `undefined` op terug en het pad blijft onaangeraakt.
 */
const SLUG_ROUTES = [
  '/inburgering/[slug]',
  '/knm/[thema]',
  '/taalexamens/[slug]',
  '/blog/[slug]',
] as const;

export function canonicalContentPath(pathname: string): string | undefined {
  const segments = pathname.split('/').filter(Boolean).map(safeDecode);
  const [locale, ...rest] = segments;
  if (!routing.locales.includes(locale as Locale) || rest.length === 0) return undefined;

  for (const route of SLUG_ROUTES) {
    const entry = routing.pathnames[route] as string | Record<string, string>;
    const template = (typeof entry === 'string' ? entry : entry[locale as Locale] ?? entry.nl)
      .split('/')
      .filter(Boolean);
    if (template.length !== rest.length) continue;

    let value: string | undefined;
    let ok = true;
    for (const [i, part] of template.entries()) {
      if (part.startsWith('[')) value = rest[i];
      else if (part !== rest[i]) { ok = false; break; }
    }
    if (!ok || !value) continue;

    const nlSlug = parseContentSlug(value);
    if (!nlSlug) return undefined;
    const want = contentSlugParam(nlSlug, locale);
    if (want === value) return undefined;

    return `/${[locale, ...rest.map(s => (s === value ? want : s))].join('/')}`;
  }

  return undefined;
}
