import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import FaqAccordion from '@/components/FaqAccordion';
import { SectionHeader } from '@/components/site';
import { DEFAULT_LEVEL, KNM_THEMES, SKILLS, getFormat } from '@/data/skills';
import JsonLd from '@/components/JsonLd';
import HeroShowcase from './_components/HeroShowcase';
import KennisbankCards, { type KennisbankCard } from './_components/KennisbankCards';
import FeatureCarousel from './_components/FeatureCarousel';
import { publishedGuides, getGuideLocale, guideHref } from '@/data/guides/helpers';
import { getPostBySlug, getPostLocale, getPostSlug } from '@/data/blog-posts';
import TrustpilotScore from '@/components/site/TrustpilotScore';
import { HorizonBand, DotField, Skyline, SectionTransition, ExamMark, GlassChip, AvatarCluster, HeroAurora, HERO_GRADIENT } from '@/components/horizon';
import { Link } from '@/i18n/navigation';
import { ArrowUpRight } from 'lucide-react';
import { courseId, TEACHER_REF, ogImageFor } from '@/lib/schema';
import { localeHref, localizedPath } from '@/i18n/paths';

type Props = { params: Promise<{ locale: string }> };

const BASE = 'https://inburgeringoefenen.nl';

/* Het masker waarmee de skyline in de hero oplost. Hij staat net boven de uitdoving, dus hij moet
   aan zijn eigen onderkant al doorzichtig zijn — anders zie je de daklijn als een harde rand in
   het verloop staan. `-webkit-` erbij omdat Safari de ongeprefixte nog niet overal pakt. */
const FADE_MASK = 'linear-gradient(to bottom, #000 0%, rgba(0,0,0,0.35) 70%, transparent 100%)';

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
      images: ogImageFor(locale),
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

/* ── De tegel van een track ──
   Eén vorm voor alle vier de blokken (A2, B1, KNM, ONA), in drie banden: een kop met het
   track-merk en een pijl, een romp met titel, uitleg en de chips, en een voet met de
   catalogusregel en de knop. De scheiding tussen romp en voet is een lichtere laag over het
   navy — geen lijn, conform de no-line-regel — en de skyline loopt er doorheen, want de voet is
   doorschijnend.

   De pijl rechtsboven is decoratief (`aria-hidden`): de chips zijn zelf links, dus de tegel kan
   geen anker zijn. Hij schuift mee op hover van de hele tegel, samen met de knop.

   B1 en ONA zijn niet allebei "nog niet af": B1 is live en mist één onderdeel (dat staat in de
   voetregel), ONA is aangekondigd en heeft daarom `muted` en de "binnenkort"-chip in plaats van
   een chiprij. Beschikbaarheid wordt gedragen door de voet, nooit door de kleur. */
function BlockTile({
  track, title, desc, chips, note, soonLabel, ctaLabel, href, background, glow, muted,
}: {
  track: 'a2' | 'b1' | 'knm' | 'ona';
  title: string;
  desc: string;
  chips?: { key: string | number; name: string; href: string }[];
  note?: string;
  soonLabel?: string;
  ctaLabel: string;
  href: string;
  background: string;
  /** De zachte lichtplek rechtsboven — de enige diepte in de tegel, zie de kop hierboven. */
  glow: string;
  muted?: boolean;
}) {
  return (
    <div
      className="block-tile relative overflow-hidden rounded-2xl flex flex-col lg:min-h-[21.5rem]"
      style={{ background, boxShadow: 'var(--shadow-ambient)' }}
    >
      <DotField on="dark" size={22} />
      {/* Geen skyline meer onderin: vier straatjes naast elkaar vulden de onderkant van de rij en
          duwden de voet omhoog. De diepte komt nu van één zachte lichtplek rechtsboven — een
          radiaal verloop, geen slagschaduw — en van de lichtere voetband eronder. */}
      <div
        aria-hidden="true"
        className="absolute -top-16 -right-16 size-56 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${glow} 0%, rgba(255,255,255,0) 70%)` }}
      />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <ExamMark track={track} size={44} onDark muted={muted} />
          <span
            aria-hidden="true"
            className="block-arrow flex items-center justify-center rounded-full size-8 text-white/80"
            style={{ background: 'rgba(255,255,255,0.12)' }}
          >
            <ArrowUpRight className="size-4 rtl-flip" strokeWidth={2.25} />
          </span>
        </div>

        <div className="px-5 pt-4 pb-5">
          <h3 className="font-headline font-extrabold text-white text-[1.375rem] leading-tight m-0 mb-1.5">
            {title}
          </h3>
          <p className="text-sm leading-relaxed text-white/75 m-0">{desc}</p>

          {/* **Deze chips zijn links, en dat is een productregel.** `CLAUDE.md`: alle vier de
              taalonderdelen moeten op de landingspagina zichtbaar blijven, en
              `tests/public.spec.js` eist per onderdeel een `/oefenexamen/a2/<skill>`-link. Sinds
              de kaartenrij hieronder weg is, dragen deze chips dat alleen. */}
          {chips && (
            <ul className="flex flex-wrap gap-1.5 list-none p-0 m-0 mt-4">
              {chips.map(chip => (
                <li key={chip.key}>
                  <a
                    href={chip.href}
                    className="block-chip inline-flex rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold text-white/90 no-underline"
                    style={{ background: 'rgba(255,255,255,0.12)' }}
                  >
                    {chip.name}
                  </a>
                </li>
              ))}
            </ul>
          )}

          {soonLabel && (
            <span
              className="inline-flex mt-4 text-[0.5625rem] uppercase tracking-widest font-bold text-white/80 rounded-full px-2.5 py-1"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              {soonLabel}
            </span>
          )}

          {/* De catalogus en het merk staan op elke pagina apart genoemd — dus de tegel die B1
              verkoopt, is ook de tegel die zegt welk onderdeel er nog niet is. Die regel stond in
              een eigen voetband; die band is weg (de tegel is één kleur), dus de regel staat nu
              onder de chips waar hij over gaat. Weglaten mag niet. */}
          {note && (
            <p className="text-[0.625rem] uppercase tracking-widest font-bold text-white/70 m-0 mt-3">
              {note}
            </p>
          )}
        </div>

        <div className="mt-auto px-5 pb-5">
          {/* Vol wit, niet `bg-white/22`: op `primary-container` is die zo doorzichtig dat de tegel
              er doorheen leest en de knop als een vlek oogt. */}
          <a
            href={href}
            className="block-cta flex items-center justify-center gap-2 rounded-full px-5 py-2.5 no-underline font-headline font-bold text-sm"
            style={{ background: '#fff', color: 'var(--color-primary)' }}
          >
            {ctaLabel}
          </a>
        </div>
      </div>
    </div>
  );
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
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
        /* `logo` hoort bij de organisatie-node en nergens anders — dit is de enige plek waar de
         * node zelf gedefinieerd wordt, en Google leest hem hiervandaan voor het merkbeeld naast
         * een resultaat. `icon-512.png` is het bestand dat er al is en ruim boven de 112px-ondergrens
         * zit die Google noemt. */
        logo: `${BASE}/icon-512.png`,
        employee: TEACHER_REF,
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
    /* KNM went live 2026-08-24, when its content moved across from knmoefenen.nl: ten
       oefenexamens, seven lesmodules and 366 woordkaarten, all authored on that platform by
       the same docent. This chip, the tile below, `TRACKS` on `/platform`, the KNM rows in
       `app/sitemap.ts` and `lib/llms.ts`, and the table at the top of `CLAUDE.md` are one
       decision in six places and move together. */
    { key: 'track_knm', live: true },
    { key: 'track_ona', live: false },
  ] as const;


  /* The A2 tile names the four onderdelen it contains, read straight from the taxonomy — so a
     fifth onderdeel or a renamed one cannot leave a stale string on the homepage. Each one links to
     its exam overview: since the four-card grid was removed these chips are the *only* link to the
     onderdelen from this page, which the hard rule in `CLAUDE.md` requires. */
  const A2_CHIPS = SKILLS.map(s => ({ slug: s.slug, name: tSkills(`${s.key}.name`) }));

  /* B1's chips are the onderdelen that actually have something behind them, derived from the same
     fact the overview page's `robots` reads: `itemCount === null` means DUO's format at this level
     is unverified, which is B1 Luisteren and only B1 Luisteren. So this list is Lezen, Schrijven
     and Spreken, and it will pick up Luisteren automatically on the commit that counts its format
     off real material — rather than needing someone to remember this line. Linking Luisteren today
     would put a `noindex` page behind a chip on the most-linked page on the site. */
  const B1_CHIPS = SKILLS
    .filter(s => getFormat('b1', s.slug).itemCount !== null)
    .map(s => ({ slug: s.slug, name: tSkills(`${s.key}.name`) }));

  /* The three placeholder quote cards. The avatar is `null` until
     `scripts/generate-review-avatars.mjs` has run — existence is checked on the server rather than
     guessed, because a broken portrait beside a testimonial is worse than no portrait. */
  const REVIEWS = [1, 2, 3].map(n => {
    const file = `images/reviews/placeholder-${n}-80.webp`;
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
    const route = guideHref(guide, locale);
    return {
      id: guide.slug,
      group: t('kb_group_inburgering'),
      title: g.heroTitle,
      desc: g.description,
      /* `route.pathname` is de interne routenaam ('/inburgering/[slug]'); `localizedPath` vult
       * de parameter in én pakt de slug van deze taal. Zelf `/${locale}` ervoor plakken gaf
       * `/en/inburgering/…`, wat een 307 is naar `/en/civic-integration/…`. */
      href: localizedPath(route.pathname, locale, { slug: guide.slug, thema: guide.slug }),
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
        href: localeHref(locale, `blog/${getPostSlug(post, locale)}`),
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

  /* De quotes van echte cursisten. **Leeg tot de eigenaar ze aanlevert** — een quote hier is een
     uitspraak van een bestaand persoon, dus hij wordt geplakt, niet geschreven (§2: nooit
     verzonnen social proof). Vorm: { text, author }, met de auteur als voornaam of als soort
     cursist, nooit een verzonnen volledige naam. De rij rendert niet zolang dit leeg is. */
  const QUOTES: { text: string; author: string }[] = [];

  const faqs = [1, 2, 3, 4, 5, 6].map(n => ({ q: `faq_q${n}`, a: `faq_a${n}`, link: n === 1 }));

  return (
    <div className="dot-page">
      <JsonLd data={jsonLd} />

      {/* ── HERO — volvlaks horizonscène, onder de zwevende kop door ──
          Herbouwd 21-09 naar het voorbeeld van clay.com, dat de eigenaar als richting koos. Drie
          dingen zijn overgenomen en één bewust niet.

          **Overgenomen (1): de scène loopt van de bovenrand af.** De `-mt-[var(--nav-h)]` stond er
          al, maar de sectie was licht, dus je zág de pil niet zweven — hij hing boven een strook
          van dezelfde kleur als de pagina. Op navy is het verschil er wel, en dát is wat de
          zwevende kop van 21-09 nodig had om te werken. Verander je dit terug naar een lichte
          hero, dan verliest `components/Nav.tsx` zijn achtergrond.

          **Overgenomen (2): de kunst bóven de kop.** Clay zet het toneel op de heuvels en de tekst
          eronder. Hier is `HeroShowcase` het toneel. De maskering onderaan is de heuvellijn: de
          collage dooft in het navy in plaats van te worden afgesneden — de oude versie rekende op
          de sectierand als crop, en die is er nu niet meer omdat er tekst onder staat.

          **Overgenomen (3): kop links, belofte plus knoppen rechts.** Eén regel tekst per kolom,
          niets ertussen.

          **Níet overgenomen: de 3D-illustratie.** §8 verbiedt tekeningen; de scène is de vier
          CSS-primitieven — luchtverloop, zonneschijf, puntenraster, skyline — plus een echte
          productcollage. Dat is waar `components/horizon/` voor bestaat.

          De chiprij blijft staan en is niet decoratief: de kop mag "alle examenonderdelen" zeggen
          omdat die rij per track zegt wat er wél en niet achter zit. Zie de opmerking bij `TRACKS`. */}
      <section
        id="hero"
        className="relative overflow-hidden -mt-[var(--nav-h)] text-on-primary"
        style={{ background: HERO_GRADIENT, paddingTop: 'calc(var(--nav-h) + 1.5rem)' }}
      >
        {/* Het bewegende licht over de hele sectie — zie `components/horizon/HeroAurora.tsx`.
            Het staat achter álles: het puntenraster, de skyline, de collage en de tekst liggen er
            allemaal overheen, want dit is de lucht en niet een laag ín de scène. */}
        <HeroAurora />

        {/* Het raster schuift één cel mee met het licht. Eén cel is de periode van het raster, dus
            de terugsprong is onzichtbaar; het masker houdt het weg bij de rand, waar de beweging
            anders als een schuivende rand zichtbaar wordt. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{
            maskImage: 'radial-gradient(120% 100% at 50% 40%, #000 45%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(120% 100% at 50% 40%, #000 45%, transparent 100%)',
          }}
        >
          <div
            className="absolute -inset-8"
            style={{ animation: 'hero-dot-drift 24s linear infinite', willChange: 'transform' }}
          >
            <DotField on="light" />
          </div>
        </div>

        {/* Hier stond een `SunDisc`. Hij is eruit: gedempt over navy wordt het oranje bruin en
            leest de schijf als een veeg in plaats van als een lichtbron. Een schijf moet bedekt
            worden door iets dat ervóór staat, nooit door zijn eigen container. */}

        {/* De straat op de horizon, achter alles. Twee tellingen achter één breekpunt (§7.1).

            **De skyline stopt bóven de uitdoving** (eigenaar, 21-09). Hij stond eerst op
            `bottom-0` en liep dus dwars door het verloop heen: de huizen bleven als bleke blokken
            in het wit staan, wat de uitdoving juist ongedaan maakt. Nu staan ze op de hoogte waar
            het verloop begint, met hun eigen masker eroverheen, zodat de straat oplost vóórdat
            het navy dat doet. De twee waarden moeten gelijk blijven aan de hoogte van de
            uitdoving hieronder: de straat staat op driekwart van de hoogte van het verloop, zodat
            hij al opgelost is voordat het navy dat is. */}
        <div
          className="absolute left-0 right-0 bottom-36 sm:hidden"
          style={{ maskImage: FADE_MASK, WebkitMaskImage: FADE_MASK }}
        >
          <Skyline count={7} tone="hero" height={96} />
        </div>
        <div
          className="absolute left-0 right-0 bottom-56 hidden sm:block"
          style={{ maskImage: FADE_MASK, WebkitMaskImage: FADE_MASK }}
        >
          <Skyline count={14} tone="hero" height={150} />
        </div>

        {/* De uitdoving naar de pagina (clay.com, eigenaar 21-09). De scène wordt niet afgesneden
            op de sectierand maar lost op in de paginakleur, zodat de verbindende kaart eronder in
            een veld staat in plaats van tegen een harde rand. Het verloop staat vóór de skyline —
            de huizen doven dus mee — en onder de tekstkolom (`z-10`), zodat het nooit over de kop
            of de knoppen heen valt. Letterlijke rgba() van `--color-surface`, want `color-mix()`
            rendert solide in de screenshotbrowser. */}
        <div
          aria-hidden="true"
          className="absolute left-0 right-0 bottom-0 h-48 sm:h-72 z-[5] pointer-events-none"
          style={{
            /* Zes stops in plaats van drie. Met drie loopt een verloop lineair en ziet het oog de
               plek waar het begint als een rand — precies wat een uitdoving niet moet doen. Deze
               stops volgen een ease-in-curve: de eerste helft geeft nauwelijks dekking weg, de
               laatste derde doet het meeste werk. */
            background:
              'linear-gradient(to bottom, rgba(248,249,251,0) 0%, rgba(248,249,251,0.06) 22%, rgba(248,249,251,0.2) 42%, rgba(248,249,251,0.45) 60%, rgba(248,249,251,0.75) 78%, rgba(248,249,251,0.94) 91%, rgb(248,249,251) 100%)',
          }}
        />

        {/* De twee gloedlagen die de uitdoving laten ademen. Ze staan ónder het verloop (`z-[4]`),
            dus ze kleuren het navy net boven de overgang op en raken de kop nooit. Het masker is
            hetzelfde verloop: zo begint de gloed precies waar de uitdoving begint en zie je hem
            aan de bovenkant niet als een vlek eindigen. `will-change` houdt ze op hun eigen laag,
            anders hertekent de browser de hele hero per frame. Keyframes: `app/globals.css`. */}
        <div
          aria-hidden="true"
          className="absolute left-0 right-0 bottom-0 h-56 sm:h-80 z-[4] pointer-events-none overflow-hidden"
          style={{ maskImage: FADE_MASK, WebkitMaskImage: FADE_MASK }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(60% 120% at 28% 100%, rgba(248,249,251,0.5) 0%, rgba(248,249,251,0) 70%)',
              animation: 'hero-fade-drift-a 26s cubic-bezier(0.45, 0, 0.55, 1) infinite alternate',
              willChange: 'transform, opacity',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(55% 110% at 74% 100%, rgba(248,249,251,0.42) 0%, rgba(248,249,251,0) 70%)',
              animation: 'hero-fade-drift-b 34s cubic-bezier(0.45, 0, 0.55, 1) infinite alternate',
              willChange: 'transform, opacity',
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          {/* Het toneel. De maskering dooft de collage in de lucht — Clay's heuvellijn, hier als
              verloop. `-webkit-mask-image` staat erbij omdat Safari de ongeprefixte nog niet
              overal pakt; zonder masker is dit een rechte afsnijding door de onderste kaart. */}
          <div
            className="hidden sm:block pointer-events-none"
            style={{
              maskImage: 'linear-gradient(to bottom, #000 72%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, #000 72%, transparent 100%)',
            }}
          >
            <HeroShowcase />
          </div>

          <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-8 lg:gap-16 items-end pt-8 sm:pt-4 pb-28 lg:pb-40">
            <div className="flex flex-col items-start gap-5">
              <GlassChip>
                <span aria-hidden="true" className="w-3.5 h-3.5 rounded-full flex items-center justify-center bg-white">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-secondary-container)' }} />
                </span>
                <span className="uppercase tracking-widest">{t('hero_badge')}</span>
              </GlassChip>

              <h1
                className="font-headline font-extrabold m-0"
                style={{ fontSize: 'clamp(2rem, 4.4vw, 3.25rem)', lineHeight: 1.02, letterSpacing: '-0.035em', textWrap: 'balance' }}
              >
                {t('hero_line1')}
              </h1>

              {/* De vier delen van het traject, elk met zijn eigen stand. Zonder deze rij zou de
                  kop vier dingen adverteren en er één leveren. */}
              <ul className="flex flex-wrap items-center gap-2 list-none p-0 m-0">
                {TRACKS.map(track => (
                  <li key={track.key}>
                    <span
                      className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[0.8125rem] font-semibold"
                      style={track.live
                        ? { background: 'rgba(255,255,255,0.18)', color: '#ffffff' }
                        : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.72)' }}
                    >
                      {t(track.key)}
                      {!track.live && (
                        <span className="text-[0.5625rem] font-bold uppercase tracking-widest">{t('pkg_soon')}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-6 lg:pb-3">
              <p className="text-lg sm:text-xl leading-relaxed m-0" style={{ color: 'rgba(255,255,255,0.82)' }}>
                {t('hero_subheading')}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={localeHref(locale, `oefenen`)}
                  className="hero-cta-primary inline-flex items-center gap-2 px-7 py-3.5 font-bold rounded-xl no-underline font-headline text-base bg-secondary-container text-on-secondary-container button-inner-glow"
                >
                  {t('cta_primary')}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="rtl-flip"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </a>
                <Link
                  href="/platform"
                  className="inline-flex items-center gap-2 px-7 py-3.5 font-bold rounded-xl no-underline font-headline text-base text-primary"
                  style={{ background: '#ffffff' }}
                >
                  {t('cta_secondary')}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="rtl-flip"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DE VERBINDENDE KAART — het element dat de hero aan de pagina vastzet ──
          Clay's grijze kaart die over de onderrand van de hero heen valt, met dezelfde taak: de
          scène stopt niet, hij wordt overgenomen. De negatieve marge is het hele punt — zonder de
          overlap is dit een sectie ná de hero in plaats van een scharnier tussen twee.

          **Drie panelen, elk één bewijsstuk: het cijfer, het aantal, de docent.** Er stonden eerst
          ook vier cijfertegels (10 oefenexamens / 129 lessen / 366 woordkaarten / 4 × 2) en die
          zijn eruit op verzoek van de eigenaar (21-09): ze zeggen iets over de omvang van de
          catalogus en niets over vertrouwen, en ze maakten de kaart twee keer zo hoog.

          **De twee cijfers komen van knmoefenen.nl** — zie `SEO/facts.md` §12 — en de eigenaar
          heeft op 21-09 besloten die herkomst niet meer in de copy te zetten omdat hij het hele
          platform onder één naam trekt. De bronlink naar het Trustpilot-profiel blijft daarom
          staan: dat is wat het cijfer nog controleerbaar maakt. Er hoort nog steeds **geen
          `AggregateRating`** bij in de structured data van dit domein.

          Wat hier nooit mag komen: een gebruikersaantal dat niet uit de database of uit
          `facts.md` komt, en een getal dat per deploy verschuift (het aantal gepubliceerde
          examens is er zo één — lokaal 22, productie meer). */}
      <section aria-labelledby="proof-heading" className="relative z-20 -mt-12 sm:-mt-16 px-4 sm:px-6">
        <div
          className="max-w-6xl mx-auto rounded-[28px] sm:rounded-[36px] px-5 sm:px-8 py-7 sm:py-9"
          style={{ background: 'var(--color-surface-container-lowest)', boxShadow: '0 24px 60px -28px rgba(0,8,27,0.28), var(--shadow-ambient)' }}
        >
          <h2 id="proof-heading" className="sr-only">{t('proof_line')}</h2>

          <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">

            {/* 1 — Trustpilot. Het cijfer staat in `SEO/facts.md` §12 en nergens anders; zie de
                kop van `TrustpilotScore.tsx` voor waarom er geen woordlabel bij staat. */}
            <div className="rounded-2xl px-5 py-5 flex flex-col gap-3" style={{ background: 'var(--color-surface-container-low)' }}>
              <TrustpilotScore score={4.4} />
              <p className="m-0 text-[0.8125rem] leading-snug text-on-surface-variant">
                <span className="font-headline font-extrabold text-primary text-[1.75rem] leading-none tracking-tight align-middle mr-1.5">4,4</span>
                {t('proof_trustpilot_label')}{' '}
                <a
                  href="https://nl.trustpilot.com/review/knmoefenen.nl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 font-semibold whitespace-nowrap"
                  style={{ color: '#a24000' }}
                >
                  {t('proof_source')}
                  <ArrowUpRight className="size-3 rtl-flip" />
                </a>
              </p>
            </div>

            {/* 2 — het aantal cursisten. De avatars stellen niemand voor; zie de kop van
                `components/horizon/AvatarCluster.tsx`. */}
            <div className="rounded-2xl px-5 py-5 flex flex-col gap-3" style={{ background: 'var(--color-surface-container-low)' }}>
              <div className="flex items-center gap-1.5">
                <AvatarCluster count={5} size={36} />
                <span
                  className="h-9 px-3 rounded-full flex items-center font-headline font-bold text-[0.8125rem] text-primary"
                  style={{ background: 'var(--color-surface-container-high)' }}
                >
                  +995
                </span>
              </div>
              <p className="m-0 text-[0.8125rem] leading-snug text-on-surface-variant">
                <span className="font-headline font-extrabold text-primary text-[1.75rem] leading-none tracking-tight align-middle mr-1.5">1.000+</span>
                {t('proof_students_label')}
              </p>
            </div>

            {/* 3 — de docent. De enige claim die over dít platform gaat, en de enige echte persoon
                op deze kaart. De docentclaim staat één keer per pagina (§7). */}
            <div className="rounded-2xl px-5 py-5 flex items-start gap-4" style={{ background: 'var(--color-surface-container-low)' }}>
              <img
                src="/images/marieke-schipper-264.webp"
                alt="Marieke Schipper"
                width={56}
                height={56}
                className="w-14 h-14 rounded-full object-cover object-top shrink-0"
                style={{ boxShadow: '0 0 0 3px var(--color-secondary-container)' }}
              />
              <p className="m-0 text-[0.8125rem] leading-snug text-on-surface-variant">
                <span className="block font-headline font-bold text-primary text-[1rem] leading-tight">Marieke Schipper</span>
                {t('proof_teacher_role')}
                <span className="block mt-1">{t('proof_seal_short')}</span>
              </p>
            </div>
          </div>

          {/* De quotes. Zie `QUOTES` boven de return: leeg tot er échte reacties zijn, en dan
              geplakt en niet geschreven. */}
          {QUOTES.length > 0 && (
            <ul className="grid gap-3 sm:gap-4 sm:grid-cols-3 mt-3 sm:mt-4 list-none p-0 mb-0">
              {QUOTES.map(q => (
                <li key={q.author + q.text.slice(0, 12)} className="rounded-2xl px-5 py-5" style={{ background: 'var(--color-surface-container-low)' }}>
                  <blockquote className="m-0 text-[0.875rem] leading-relaxed text-on-surface">{`“${q.text}”`}</blockquote>
                  <p className="m-0 mt-3 text-[0.75rem] font-semibold text-on-surface-variant">{q.author}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
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

          **De vier tegels zijn even hoog.** De oplopende trap die hier stond codeerde de plek in
          het traject; naast vier gelijke merken las dat als vier formaten van hetzelfde ding.
          Hoogte zegt hier dus niets meer — wat beschikbaar is, staat in de voet van de tegel.

          **De rij staat op één kleurenfamilie** (2026-09-15): `primary` en `primary-container`
          wisselen elkaar af. De klei-tegels van KNM en ONA zijn eruit — vier verschillende kleuren
          naast elkaar lazen als vier producten in plaats van één traject, en de klei is in dit
          systeem de accentkleur, niet een vlak. State wordt gedragen door de voet van de tegel —
          een knop waar je kunt beginnen, een "binnenkort"-chip en een mailinglijstlink waar niet.

          **De markering is het officiële `ExamMark`, hetzelfde merk als in het portaal.** Een
          track-merk hoort op een navy tegel; hier staat het op een navy vlak, dus `onDark` — de
          enige gesanctioneerde manier om een track-merk op een donker oppervlak te zetten. ONA
          krijgt `muted`: aangekondigd, niets erachter, en dus geen oranje. Er staat geen `SunDisc`
          meer in dit blok — het oranje accent binnen de merken is de enige oranje van de sectie. */}
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

          {/* Vier tegels van één hoogte (besluit eigenaar, 15-09). De trapvorm die hier stond —
              bodems uitgelijnd, toppen oplopend — codeerde de plek in het traject, maar op een rij
              van vier merken las hij als vier verschillende formaten. Alle vier staan nu op
              `lg:min-h-[21.5rem]`, de hoogte van de langste (ONA); als een tegel meer tekst krijgt
              groeit de rij mee, want de grid staat op `items-stretch`. */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:items-stretch">
            {/* ── Taal A2 — live ── */}
            <BlockTile
              track="a2"
              title={t('blocks_a2_title')}
              desc={t('blocks_a2_desc')}
              chips={A2_CHIPS.map(chip => ({
                key: chip.slug,
                name: chip.name,
                href: localeHref(locale, `oefenexamen/${DEFAULT_LEVEL}/${chip.slug}`),
              }))}
              ctaLabel={t('blocks_a2_cta')}
              href={localeHref(locale, `oefenen`)}
              background="var(--color-primary)"
              glow="rgba(255,255,255,0.16)"
            />

            {/* ── Taal B1 — live sinds 23-08-2026, toen de docent de inhoud aftekende ──
                Tot dan was dit een "binnenkort"-tegel. */}
            <BlockTile
              track="b1"
              title={t('blocks_b1_title')}
              desc={t('blocks_b1_desc')}
              chips={B1_CHIPS.map(chip => ({
                key: chip.slug,
                name: chip.name,
                href: localeHref(locale, `oefenexamen/b1/${chip.slug}`),
              }))}
              note={t('blocks_b1_note')}
              ctaLabel={t('blocks_b1_cta')}
              href={localeHref(locale, `oefenen/b1/lezen`)}
              background="var(--color-primary-container)"
              glow="rgba(255,255,255,0.14)"
            />

            {/* ── KNM — het vijfde onderdeel, hier live sinds 24-08-2026 ──
                De CTA wees vroeger naar knmoefenen.nl, want daar stond de inhoud. Die staat nu
                hier, dus de link is intern. knmoefenen.nl blijft bewust staan en wordt **niet**
                omgeleid — `CLAUDE.md` houdt hem als ranking-asset tot KNM hier rankt.

                De chips volgen de regel van A2: afgeleid uit `KNM_THEMES`, nooit getypt, zodat een
                hernoemd thema geen verouderde tekst kan achterlaten op de meest gelinkte pagina van
                de site. Ze wijzen naar de kennisgidsen — publiek, zonder account. */}
            <BlockTile
              track="knm"
              title={t('blocks_knm_title')}
              desc={t('blocks_knm_desc')}
              chips={KNM_THEMES.map(theme => ({
                key: theme.id,
                name: theme.title,
                href: `/${locale}/knm/${theme.guideSlug}`,
              }))}
              ctaLabel={t('blocks_knm_cta')}
              href={localeHref(locale, `oefenexamen/knm`)}
              background="var(--color-primary)"
              glow="rgba(255,255,255,0.16)"
            />

            {/* ── ONA — de laatste stap van het traject, en er is niets gebouwd ──
                Volle kleur zoals de andere drie (besluit eigenaar, 22-08-2026), zodat de rij als
                één platform leest; het hele gewicht van de beschikbaarheidsclaim ligt daarom op de
                chip en de knop, en die zijn hier niet optioneel. `/contact` is de enige plek op de
                site die "laat het me weten" kan aannemen. */}
            <BlockTile
              track="ona"
              title={t('blocks_ona_title')}
              desc={t('blocks_ona_desc')}
              soonLabel={t('pkg_soon')}
              ctaLabel={t('blocks_notify')}
              href={localeHref(locale, `contact`)}
              background="var(--color-primary-container)"
              glow="rgba(255,255,255,0.14)"
              muted
            />
          </div>
        </div>
      </section>

      {/* ── DE VITRINE — vijf schermen die er al zijn ──
          Clay's tabrij met een productbeeld eronder (eigenaar, 21-09), hier als draaiende
          carrousel. Hij staat ná de blokken en niet ervóór: die zeggen *wat* je kunt kopen, deze
          sectie zegt *hoe het eruitziet*, en die volgorde is de enige die niet twee keer hetzelfde
          vraagt. Zie de kop van `FeatureCarousel.tsx` voor de regel dat elke dia een werkende
          route achter zich moet hebben. */}
      <FeatureCarousel />

      {/* ── SOCIAL PROOF — placeholders, and they say so ──
          To the owner's mockup §6 (2026-08-22), whose own annotation reads *"Quotes zijn
          plaatshouders — vul ze met echte reacties van cursisten voordat dit live gaat."*

          **The three quotes are written, not given, and the product still has no customers**
          (owner's decision, 2026-08-23, taken over the objection that this is the invented social
          proof `CLAUDE.md` forbids — three fabricated testimonials and an `AggregateRating` of 4.8
          came across in the fork and were removed for exactly that reason). They replaced the
          visible "Plaatshouder — vervang met een echte reactie" sentences, so the page no longer
          announces what they are.

          What holds the line down to the minimum, and must stay:
          - **No `Review` and no `AggregateRating` node anywhere**, and `scripts/check-schema.mjs`
            fails the build if one appears. A quote in prose is a marketing claim; the same quote in
            JSON-LD is a rating fed to a SERP, which is the version that cannot be walked back.
          - **The attribution names a *kind* of cursist, never a person**, and carries no star, no
            date and no place. Nothing here puts words in a real person's mouth.
          - **The avatars are pictures of nobody** (`scripts/generate-review-avatars.mjs`).

          So the honest read of this section today is: illustrative copy, unmarked. When real
          reactions arrive the quotes, the attributions *and* the avatars are replaced together —
          replacing one without the others is how a generated face ends up standing next to a real
          person's words — and that script is deleted.

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
                src="/images/marieke-schipper-264.webp"
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
                href={localeHref(locale, `docent`)}
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
                  href={localeHref(locale, `docent`)}
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
              href={localeHref(locale, `oefenen`)}
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
           Dit blok wordt alleen met de homepage meegestuurd, dus de regel is gescoped doordat
           hij hier staat. Schrijf in deze CSS nooit het woord style met punthaken eromheen:
           React escapet dat op de server als bescherming tegen injectie, de client houdt de
           onbewerkte tekst aan, en dat verschil is een hydration-mismatch (React #418) die de
           hele boom opnieuw laat renderen. */
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
        .block-tile {
          transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .block-tile:hover {
          transform: translateY(-3px);
        }
        .block-arrow {
          transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .block-tile:hover .block-arrow {
          transform: translate(2px, -2px);
        }
        .block-chip {
          transition: opacity 0.15s ease, transform 0.15s ease;
        }
        .block-chip:hover {
          opacity: 0.8;
        }
        .block-chip:focus-visible {
          outline: 2px solid #fff;
          outline-offset: 2px;
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
        .block-cta:focus-visible {
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
          .skill-card, .kb-pill, .kb-card, .kb-arrow, .block-cta, .block-chip, .hero-cta-primary, .hero-cta-secondary { transition: none; }
        }
      `}</style>
    </div>
  );
}
