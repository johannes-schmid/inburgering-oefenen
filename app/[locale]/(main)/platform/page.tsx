/**
 * `/platform` — what the site *does*, on one page.
 *
 * It exists because the header stopped being a set of mega-panels (owner's decision, 2026-08-22):
 * four plain links, and the page behind each one does the work the dropdown was doing. That trade
 * is only safe if this page carries the links the panel carried — the four onderdelen, the free
 * taster, the tools and the money page — because a header dropdown is a *site-wide* internal link
 * on every page and this page is not. So the rule for anything added to the platform later: it is
 * listed here, or it has no route in from the chrome at all.
 *
 * **The catalogue and the roadmap are stated separately, in one list.** A2 is live; B1 exists but
 * is `noindex` behind the docent's review gate; ONA is not built. The unbuilt track is
 * rendered as **non-links** with a "binnenkort" chip — the same discipline `TRACKS` uses on the
 * homepage, and the same reason: the site's only claim is that a docent stands behind what is on
 * it, and advertising a level with no reviewed content spends exactly that credibility. A link
 * would also hand a crawler the B1 pages we explicitly tell it to ignore.
 *
 * No prices. `/premium` is the only page with `Offer` nodes and the only place a figure is read
 * from `lib/pricing.ts` — a stale price keeps showing in the SERP after the page is corrected.
 */
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, ArrowLeft, ArrowUp, Check, X, BadgeCheck, CalendarClock, MessagesSquare, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { absUrl, alternatesFor, breadcrumbs, PROVIDER_REF, ogImageFor } from '@/lib/schema';
import { WEBSITE_ID, langTag } from '@/lib/site';
import JsonLd from '@/components/JsonLd';
import { HorizonBanner, CategoryMark, type Category } from '@/components/horizon';
import { FeatureCard, SectionHeader, SkillCard, CTABanner } from '@/components/site';
import { DEFAULT_LEVEL, KNM, formatCount, skillsAtLevel } from '@/data/skills';
import { localeHref } from '@/i18n/paths';

type Props = { params: Promise<{ locale: string }> };

export async function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'platform' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    alternates: alternatesFor(locale, 'platform'),
    openGraph: {
      images: ogImageFor(locale),
      type: 'website',
      title: t('meta_title'),
      description: t('meta_description'),
      url: absUrl(locale, 'platform'),
      siteName: 'Inburgering Oefenen',
    },
  };
}

/** The whole traject, in the order a candidate meets it. `live: false` renders the chip. */
const TRACKS = [
  { key: 'a2', live: true, href: '/taalexamens' as const },
  /* B1 is live and linked since 2026-08-23. It could not carry an `href` while it was
     `noindex`: a site-wide-ish link from here would have handed a crawler exactly the pages we
     told it to ignore. That is no longer true, so it links like A2 does. */
  { key: 'b1', live: true, href: '/taalexamens' as const },
  /* KNM went live 2026-08-24 and links to its own overview rather than to `/taalexamens`,
     which is the hub for the four *taalonderdelen* and does not describe it. */
  { key: 'knm', live: true, href: '/oefenexamen/knm' as const },
  { key: 'ona', live: false },
] as const;

const BENEFITS = [
  { key: 'docent', icon: BadgeCheck },
  { key: 'uitleg', icon: MessagesSquare },
  { key: 'rubric', icon: TrendingUp },
  { key: 'plan', icon: CalendarClock },
] as const;

/* ── De satellietkaart in de kop ──
   Clay's "Centralize your GTM data": een groot productpaneel in het midden, met aan weerszijden
   kleine kaarten die elk één bron benoemen en er met een pijl naartoe wijzen. De vorm zegt wat
   een opsomming niet zegt — dat die dingen niet los van elkaar bestaan maar in één ding
   samenkomen — en dat is precies de belofte van deze pagina.

   Bij Clay wijzen links de bronnen naar binnen en rechts de bestemmingen naar buiten. Hier wijst
   álles naar binnen: de vier onderdelen zijn geen invoer en uitvoer, ze zitten alle vier ín het
   portaal. De pijl staat daarom op de binnenrand van de kaart en kijkt naar het midden.

   De chips zijn geen decoratie: ze komen uit `data/skills.ts` via dezelfde `label_*`-sleutels die
   `SkillCard` verderop op deze pagina gebruikt. Eén hertelling van een formaat verandert de kop
   mee, en de kop kan nooit iets anders beweren dan de kaarten eronder.

   Het merk is de `CategoryMark` op een lichte tegel — dat is de gesanctioneerde combinatie (§7):
   een categoriemerk benoemt wat er ín een track zit, en deze kaarten zijn wit, niet navy. */
function OnderdeelCard({
  category, name, chips, side,
}: {
  category: Category;
  name: string;
  chips: string[];
  /** Aan welke kant van het midden de kaart staat — bepaalt waar de pijl hangt en welke kant op.
      `below` is de KNM-kaart: die staat onder het paneel en wijst omhoog. */
  side: 'left' | 'right' | 'below';
}) {
  const Arrow = side === 'left' ? ArrowRight : side === 'right' ? ArrowLeft : ArrowUp;
  return (
    <li
      className="pf-sat relative rounded-2xl p-4 list-none"
      style={{ background: 'var(--color-surface-container-lowest)', boxShadow: 'var(--shadow-ambient)' }}
    >
      <div className="flex items-center gap-2.5">
        <CategoryMark category={category} size={32} />
        <span className="font-headline font-bold text-primary text-[0.9375rem] leading-tight">{name}</span>
      </div>
      <ul className="flex flex-wrap gap-1.5 list-none p-0 m-0 mt-3">
        {chips.map(chip => (
          <li
            key={chip}
            className="rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold text-on-surface-variant"
            style={{ background: 'var(--color-surface-container-high)' }}
          >
            {chip}
          </li>
        ))}
      </ul>

      {/* De pijl hangt in de kolomgoot (`gap-4` = 1rem, dus -1rem) en bestaat alleen op `lg`,
          want daaronder staan de kaarten ónder het paneel en wijst "naar binnen" nergens naar. */}
      <span
        aria-hidden="true"
        className={side === 'below'
          ? 'hidden lg:flex absolute left-1/2 -translate-x-1/2 -top-4 w-6 h-6 items-center justify-center'
          : `hidden lg:flex absolute top-1/2 -translate-y-1/2 ${side === 'left' ? '-right-4' : '-left-4'} w-6 h-6 items-center justify-center`}
      >
        <Arrow className={`size-4 text-white/55 ${side === 'below' ? '' : 'rtl-flip'}`} strokeWidth={2.5} />
      </span>
    </li>
  );
}

/* ── De uitleglaag ──
   Zes blokken die vertellen wat het platform dóet, in de vorm die Clay voor zijn productuitleg
   gebruikt: links het beeld, rechts de tekst, en elk blok schuift bij het scrollen óver het
   vorige heen.

   **Het schuiven is `position: sticky` en geen scrollscript.** Elk blok plakt onder de vaste
   header, met per blok een paar pixels meer afstand, zodat de rand van het blok eronder zichtbaar
   blijft als een stapel. Er komt geen scroll-listener, geen IntersectionObserver en geen
   bibliotheek aan te pas — dus er is niets dat op een trage telefoon achterloopt, en de
   `prefers-reduced-motion`-uitweg is één regel: dan staat de stapel stil en staan de blokken
   gewoon onder elkaar.

   Elk blok heeft een dekkende achtergrond. Dat is hier geen smaak maar de voorwaarde: een blok
   dat er doorheen laat kijken laat het blok eronder meelezen zodra het eroverheen schuift. */
function FlowBlock({
  index, eyebrow, title, body, chips, visual,
}: {
  index: number;
  eyebrow: string;
  title: string;
  body: string;
  chips: string[];
  visual: ReactNode;
}) {
  return (
    <li
      className="pf-flow list-none rounded-[20px] overflow-hidden"
      style={{
        top: `calc(var(--nav-h) + 1.5rem + ${index * 0.5}rem)`,
        background: 'var(--color-surface-container-lowest)',
        boxShadow: 'var(--shadow-ambient)',
      }}
    >
      <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] items-center">
        <div className="order-2 lg:order-1 p-6 sm:p-9">
          <span className="block text-[0.625rem] uppercase tracking-widest font-bold text-secondary mb-3">
            {eyebrow}
          </span>
          <h3
            className="font-headline font-extrabold text-primary m-0 mb-3 leading-tight"
            style={{ fontSize: 'clamp(1.375rem, 2.4vw, 1.75rem)', letterSpacing: '-0.02em' }}
          >
            {title}
          </h3>
          <p className="text-[0.9375rem] leading-relaxed text-on-surface-variant m-0">{body}</p>
          <ul className="flex flex-wrap gap-1.5 list-none p-0 m-0 mt-5">
            {chips.map(chip => (
              <li
                key={chip}
                className="rounded-full px-3 py-1.5 text-[0.75rem] font-semibold text-on-surface-variant"
                style={{ background: 'var(--color-surface-container-high)' }}
              >
                {chip}
              </li>
            ))}
          </ul>
        </div>

        {/* Het beeld raakt de rand van het blok — het ís de rechterhelft, geen plaatje met een
            marge eromheen. Op smal staat het bovenaan, want een uitleg begint bij wat je ziet. */}
        <div
          className="order-1 lg:order-2 relative min-h-[14rem] lg:min-h-[21rem] overflow-hidden flex items-center justify-center p-6 lg:p-0"
          style={{ background: 'var(--color-surface-container-low)' }}
        >
          {visual}
        </div>
      </div>
    </li>
  );
}

/** Een schermafdruk die het vak vult. Vaste maten, want `fill` zou hier een even hoge doos nodig
    hebben en die is er op `lg` niet: het blok is zo hoog als zijn tekst. */
function FlowShot({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative w-full h-full min-h-[14rem] lg:min-h-[21rem]">
      <Image src={src} alt={alt} fill sizes="(max-width: 1024px) 100vw, 620px" className="object-cover object-[78%_0%]" />
    </div>
  );
}

export default async function PlatformPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'platform' });
  const tSkills = await getTranslations({ locale, namespace: 'skills' });
  const tB = await getTranslations({ locale, namespace: 'breadcrumbs' });

  const skills = skillsAtLevel(DEFAULT_LEVEL);

  /* De twee kanten van de compositie in de kop. De verdeling is de vaardigheid zelf en niet de
     volgorde van `SKILLS`: links wat je binnenkrijgt (Lezen, Luisteren), rechts wat je zelf
     produceert (Schrijven, Spreken). Afgeleid uit de taxonomie via `scoring`, zodat een vijfde
     taalonderdeel niet stil aan één kant verdwijnt — `mcq` is receptief, `rubric` productief. */
  const receptief = skills.filter(s => s.scoring === 'mcq');
  const productief = skills.filter(s => s.scoring !== 'mcq');

  /* De zes blokken van de uitleglaag. De sleutel is ook de sleutelprefix in `messages/*.json`, en
     het beeld staat hier omdat drie van de zes een paneeltje zijn dat de vertalingen nodig heeft. */
  const FLOW: { key: string; visual: ReactNode }[] = [
    { key: 'examen', visual: <FlowShot src="/images/platform/luisteren.jpg" alt={t('flow_examen_alt')} /> },
    {
      key: 'beoordeling',
      /* Geen verzonnen criteria: de criteria staan in `rubrics.criteria` en worden per categorie
         door de docent geschreven, dus een paneeltje dat er drie verzint laat iets zien wat er
         niet is. Wat hier staat is de vórm — vier ankers, 0 tot 3 — en die ligt wél vast. */
      visual: (
        <div
          className="w-full max-w-[19rem] rounded-2xl p-5"
          style={{ background: 'var(--color-surface-container-lowest)', boxShadow: 'var(--shadow-ambient)' }}
        >
          <span className="block text-[0.625rem] uppercase tracking-widest font-bold text-secondary mb-3">
            {t('flow_rubric_label')}
          </span>
          <ul className="list-none p-0 m-0 flex flex-col gap-2">
            {[0, 1, 2, 3].map(score => (
              <li key={score} className="flex items-center gap-3">
                <span
                  className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center font-headline font-bold text-[0.8125rem]"
                  style={score === 2
                    ? { background: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)' }
                    : { background: 'var(--color-surface-container-high)', color: 'var(--color-on-surface-variant)' }}
                >
                  {score}
                </span>
                <span
                  className="h-2 rounded-full"
                  style={{ width: `${40 + score * 18}%`, background: score === 2 ? 'var(--color-secondary-container)' : 'var(--color-surface-container-high)' }}
                />
              </li>
            ))}
          </ul>
          <p className="text-[0.75rem] leading-relaxed text-on-surface-variant m-0 mt-4">
            {t('flow_rubric_note')}
          </p>
        </div>
      ),
    },
    { key: 'woorden', visual: <FlowShot src="/images/platform/woordkaarten.jpg" alt={t('flow_woorden_alt')} /> },
    {
      key: 'route',
      /* De drie kaarten van de leerroute, in de volgorde die §3 vastlegt: woorden → de taalregels
         die dít examen vraagt → het examen. Er komt hier geen vierde kaart bij. */
      visual: (
        <ol className="w-full max-w-[19rem] list-none p-0 m-0 flex flex-col gap-2.5">
          {(['words', 'rules', 'exam'] as const).map((step, i) => (
            <li
              key={step}
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{ background: 'var(--color-surface-container-lowest)', boxShadow: 'var(--shadow-ambient)' }}
            >
              <span
                className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center font-headline font-bold text-[0.75rem]"
                style={{ background: 'var(--color-primary)', color: '#fff' }}
              >
                {i + 1}
              </span>
              <span className="font-headline font-bold text-primary text-[0.875rem]">
                {t(`flow_route_${step}`)}
              </span>
            </li>
          ))}
        </ol>
      ),
    },
    { key: 'tips', visual: <FlowShot src="/images/platform/les.jpg" alt={t('flow_tips_alt')} /> },
    {
      key: 'fouten',
      /* Eén echte fout uit de lesstof (`want` / `omdat`), niet een verzonnen voorbeeld — dezelfde
         regel staat als taalregel in de database en als blogpost op de site. */
      visual: (
        <div
          className="w-full max-w-[19rem] rounded-2xl p-5"
          style={{ background: 'var(--color-surface-container-lowest)', boxShadow: 'var(--shadow-ambient)' }}
        >
          <span className="block text-[0.625rem] uppercase tracking-widest font-bold text-secondary mb-3">
            {t('flow_mistake_label')}
          </span>
          <p className="flex items-start gap-2 m-0 mb-2 text-[0.875rem] leading-relaxed text-on-surface-variant">
            <X className="size-4 mt-0.5 shrink-0" style={{ color: 'var(--color-error)' }} aria-hidden="true" />
            <span>{t('flow_mistake_wrong')}</span>
          </p>
          <p className="flex items-start gap-2 m-0 text-[0.875rem] leading-relaxed text-primary font-semibold">
            <Check className="size-4 mt-0.5 shrink-0" style={{ color: 'var(--color-secondary)' }} aria-hidden="true" />
            <span>{t('flow_mistake_right')}</span>
          </p>
          <p className="text-[0.75rem] leading-relaxed text-on-surface-variant m-0 mt-4">
            {t('flow_mistake_note')}
          </p>
        </div>
      ),
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${absUrl(locale, 'platform')}#page`,
        url: absUrl(locale, 'platform'),
        name: t('meta_title'),
        description: t('meta_description'),
        inLanguage: langTag(locale),
        isPartOf: { '@id': WEBSITE_ID },
        provider: PROVIDER_REF,
        mainEntity: {
          '@type': 'ItemList',
          '@id': `${absUrl(locale, 'platform')}#list`,
          numberOfItems: skills.length,
          /* The four onderdelen only. The three unbuilt tracks are announced on the page and are
             deliberately absent here: an `ItemList` entry is a claim that the thing exists at a
             URL, and each of those would need a URL to point at. */
          itemListElement: skills.map((skill, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: tSkills(`${skill.key}.name`),
            url: absUrl(locale, `oefenexamen/${DEFAULT_LEVEL}/${skill.slug}`),
          })),
        },
      },
      breadcrumbs(locale, tB('home'), [{ name: t('breadcrumb'), path: 'platform' }]),
    ],
  };

  return (
    <main className="bg-surface min-h-screen">
      <JsonLd data={jsonLd} />

      {/* ── DE KOP — het portaal in het midden, de onderdelen eromheen ──
          Herbouwd 22-09 naar clay.com's "Centralize your GTM data", dat de eigenaar aanwees. De
          kop was een gecentreerde tekstkop op een navy verloop en verder niets: de pagina die
          moet laten zien *wat het platform is* liet er niets van zien.

          Wat is overgenomen: de gecentreerde kop, het productpaneel eronder in het midden, en de
          kleine kaarten links en rechts die met een pijl naar dat paneel wijzen. Wat niet is
          overgenomen: Clay's oranje veld achter de compositie. Een oranje vlak van dit formaat is
          het luidste ding op de pagina en leest als een tweede hero — dezelfde afweging als bij
          de afsluitende CTA op de homepage. Het veld is hier het navy verloop dat er al stond.

          De schermafdruk is echt (`public/images/platform/`, gemaakt met puppeteer tegen de
          lokale stack) en geen nagebouwd kaartje — zie de kop van `FeatureCarousel.tsx` voor
          waarom dat de enige versie is die klopt. */}
      <section
        className="relative overflow-hidden px-6 -mt-[var(--nav-h)] pb-16 sm:pb-20"
        style={{ background: 'var(--gradient-brand)', paddingTop: 'calc(var(--nav-h) + 3.5rem)' }}
      >
        {/* No sun disc: the header is centred, so there is no empty flank for the accent and it
            would land on the headline (§7.3). */}
        <HorizonBanner seed={3} sun={false} />
        <div className="relative max-w-4xl mx-auto text-center">
          <span
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-5"
            style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' }}
          >
            {t('eyebrow')}
          </span>
          <h1
            className="font-headline font-extrabold text-white mb-4"
            style={{ fontSize: 'clamp(1.9rem, 4vw, 2.8rem)', letterSpacing: '-0.02em', lineHeight: 1.06, textWrap: 'balance' }}
          >
            {t('heading')}
          </h1>
          <p className="text-base sm:text-lg leading-relaxed max-w-2xl mx-auto m-0" style={{ color: 'rgba(255,255,255,0.85)' }}>
            {t('lede')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-7">
            <a
              href={localeHref(locale, `oefenen`)}
              className="inline-flex items-center gap-2 bg-secondary-container px-6 py-3 rounded-full font-bold text-sm button-inner-glow no-underline"
              style={{ color: '#ffffff' }}
            >
              {t('cta_primary')}
              <ArrowRight size={16} className="rtl-flip" aria-hidden="true" />
            </a>
            <Link
              href="/premium"
              className="inline-flex items-center px-6 py-3 rounded-full font-bold text-sm no-underline"
              style={{ background: 'rgba(255,255,255,0.14)', color: '#ffffff' }}
            >
              {t('cta_secondary')}
            </Link>
          </div>
        </div>

        {/* ── De compositie ──
            Eén grid die op `lg` drie kolommen is (kaarten · paneel · kaarten) en daaronder één
            kolom, met het paneel bovenaan en de vier kaarten er in twee rijen van twee onder.
            `order-*` doet dat zonder de kaarten twee keer te renderen — een tweede kopie voor
            mobiel is twee plekken waar dezelfde lijst uit elkaar kan lopen. */}
        <div className="relative max-w-7xl mx-auto mt-12 sm:mt-16">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,14.5rem)_minmax(0,1fr)_minmax(0,14.5rem)] lg:items-center">

            <ul className="order-2 lg:order-1 grid grid-cols-2 lg:grid-cols-1 gap-3 lg:gap-4 list-none p-0 m-0">
              {receptief.map(skill => (
                <OnderdeelCard
                  key={skill.slug}
                  side="left"
                  category={skill.slug as Category}
                  name={tSkills(`${skill.key}.name`)}
                  chips={[
                    t('label_exams', { count: skill.examCount }),
                    t('label_items', { count: formatCount(skill.itemCount) }),
                  ]}
                />
              ))}
            </ul>

            {/* Het paneel. De balk erboven is geen nagemaakte browserchrome maar het label van het
                scherm zelf — drie grijze bolletjes zouden zeggen "dit is een screenshot", en dat
                is precies wat een productbeeld níet moet zeggen. */}
            <figure
              className="order-1 lg:order-2 m-0 rounded-[20px] overflow-hidden"
              style={{ boxShadow: '0 40px 80px -32px rgba(0,8,27,0.55), 0 8px 24px -12px rgba(0,8,27,0.35)' }}
            >
              <div
                className="flex items-center gap-2.5 px-4 py-3"
                style={{ background: 'var(--color-primary-container)' }}
              >
                <span aria-hidden="true" className="w-2 h-2 rounded-full bg-secondary-container" />
                <span className="font-headline font-bold text-white text-[0.8125rem] tracking-tight">
                  {t('hero_portal_label')}
                </span>
              </div>
              <Image
                src="/images/platform/dashboard.jpg"
                alt={t('hero_portal_alt')}
                width={1600}
                height={1000}
                sizes="(max-width: 1024px) 100vw, 720px"
                className="w-full h-auto block"
                priority
              />
            </figure>

            <ul className="order-3 grid grid-cols-2 lg:grid-cols-1 gap-3 lg:gap-4 list-none p-0 m-0">
              {productief.map(skill => (
                <OnderdeelCard
                  key={skill.slug}
                  side="right"
                  category={skill.slug as Category}
                  name={tSkills(`${skill.key}.name`)}
                  chips={[
                    t('label_exams', { count: skill.examCount }),
                    t('label_duration', { count: formatCount(skill.durationMinutes) }),
                  ]}
                />
              ))}
            </ul>
          </div>

          {/* ── Het vijfde onderdeel ──
              KNM staat buiten de vier taalonderdelen — het heeft geen niveau en zit buiten beide
              niveaubundels (§2) — dus het staat niet ín de rij van vier, maar het krijgt wél
              dezelfde kaart op dezelfde maat: één kaart die groter is dan de andere vier zou
              beweren dat KNM het hoofdonderdeel is, en dat is precies andersom.

              De chips zijn hier geen tellingen maar wat er ín het onderdeel zit — dat is wat een
              vijfde kaart op deze plek toevoegt, en de tellingen staan verderop op de pagina al
              op de `SkillCard`. */}
          <ul className="mt-4 lg:mt-6 flex justify-center list-none p-0 m-0">
            <li className="w-full sm:max-w-[14.5rem] list-none">
              <ul className="list-none p-0 m-0">
                <OnderdeelCard
                  side="below"
                  category="knm"
                  name={tSkills('knm.name')}
                  chips={[
                    t('label_exams', { count: KNM.examCount }),
                    t('hero_knm_chip_read'),
                    t('hero_knm_chip_cards', { count: 366 }),
                  ]}
                />
              </ul>
            </li>
          </ul>
        </div>
      </section>

      {/* ── Hoe het werkt ──
          Zes blokken op een stapel; de volgorde is die van de voorbereiding zelf: eerst het
          examen nabootsen, dan de beoordeling, dan de leerstof, dan wat je nog mist, dan wat de
          docent erover zegt.

          Drie van de zes tonen een schermafdruk en drie tonen een paneeltje dat hier gebouwd is.
          Dat is geen stijlkeuze: voor die drie bestaat geen scherm dat het punt in één beeld
          maakt, en een schermafdruk van iets anders erbij zetten is een belofte doen die het
          scherm niet waarmaakt.

          **Wat hier over de beoordeling staat is de volgorde uit §2 en mag niet omgedraaid
          worden**: de docent schrijft de rubriek en de voorbeeldantwoorden, een model past ze toe,
          de docent kijkt de beoordelingen na. "De AI beoordeelt je antwoord" is precies de zin die
          dit product níet verkoopt. */}
      <section className="px-6 py-14 sm:py-16" aria-labelledby="pf-flow-heading">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-10 sm:mb-14">
            <span className="block text-[0.6875rem] uppercase tracking-widest font-bold text-secondary mb-3">
              {t('flow_eyebrow')}
            </span>
            <h2
              id="pf-flow-heading"
              className="font-headline font-extrabold text-primary m-0 mb-4 leading-[1.08]"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', letterSpacing: '-0.03em' }}
            >
              {t('flow_heading')}
            </h2>
            <p className="text-base leading-relaxed text-on-surface-variant m-0">{t('flow_sub')}</p>
          </div>

          <ul className="list-none p-0 m-0 flex flex-col gap-6">
            {FLOW.map((block, i) => (
              <FlowBlock
                key={block.key}
                index={i}
                eyebrow={t(`flow_${block.key}_eyebrow`)}
                title={t(`flow_${block.key}_title`)}
                body={t(`flow_${block.key}_body`)}
                chips={[t(`flow_${block.key}_chip1`), t(`flow_${block.key}_chip2`)]}
                visual={block.visual}
              />
            ))}
          </ul>
        </div>
      </section>

      {/* The four onderdelen — the same module card the homepage and the overviews use. */}
      <section className="px-6 py-14 sm:py-16">
        <div className="max-w-6xl mx-auto">
          <SectionHeader eyebrow={t('skills_eyebrow')} title={t('skills_heading')} subtitle={t('skills_sub')} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {skills.map((skill, i) => (
              <SkillCard
                key={skill.slug}
                skill={skill}
                index={i}
                href={localeHref(locale, `oefenexamen/${DEFAULT_LEVEL}/${skill.slug}`)}
                name={tSkills(`${skill.key}.name`)}
                tagline={tSkills(`${skill.key}.tagline`)}
                examsLabel={t('label_exams', { count: skill.examCount })}
                itemsLabel={t('label_items', { count: formatCount(skill.itemCount) })}
                durationLabel={t('label_duration', { count: formatCount(skill.durationMinutes) })}
                freeNote={t('label_free')}
                cta={t('label_cta')}
              />
            ))}
          </div>
        </div>
      </section>

      {/* The catalogue and the roadmap. */}
      <section className="px-6 py-14 sm:py-16 bg-surface-container-low">
        <div className="max-w-5xl mx-auto">
          <SectionHeader eyebrow={t('tracks_eyebrow')} title={t('tracks_heading')} subtitle={t('tracks_sub')} />
          <ul className="grid gap-4 sm:grid-cols-2 list-none p-0 m-0">
            {TRACKS.map(track => {
              const body = (
                <>
                  <span className="flex items-center gap-2 flex-wrap">
                    <span className={`font-headline font-bold text-base ${'href' in track ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                      {t(`track_${track.key}`)}
                    </span>
                    {!track.live && (
                      <span
                        className="text-[0.6rem] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                        style={{ background: '#fcecdd', color: '#a24000' }}
                      >
                        {t('badge_soon')}
                      </span>
                    )}
                  </span>
                  <span className="block text-sm text-on-surface-variant leading-relaxed mt-1.5">
                    {t(`track_${track.key}_sub`)}
                  </span>
                </>
              );
              /* An announced-but-unbuilt track is an `<li>`, not a greyed link: there is nowhere
                 to go, and a disabled anchor still takes focus and still promises a destination. */
              return (
                <li key={track.key}>
                  {'href' in track ? (
                    <Link
                      href={track.href}
                      className="block rounded-2xl p-5 no-underline bg-surface-container-lowest transition-transform hover:-translate-y-0.5"
                      style={{ boxShadow: 'var(--shadow-ambient)' }}
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className="rounded-2xl p-5 bg-surface-container">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Why practise here — the USP, stated as what the product does rather than as a slogan. */}
      <section className="px-6 py-14 sm:py-16">
        <div className="max-w-6xl mx-auto">
          <SectionHeader eyebrow={t('why_eyebrow')} title={t('why_heading')} subtitle={t('why_sub')} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map(b => (
              <FeatureCard
                key={b.key}
                icon={b.icon}
                title={t(`why_${b.key}`)}
                description={t(`why_${b.key}_sub`)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* The tools. `/inburgering/tools/tijdlijn` is live; the two woordenlijsten are registered
          placeholders, so they are named and not linked. */}
      <section className="px-6 py-14 sm:py-16 bg-surface-container-low">
        <div className="max-w-5xl mx-auto">
          <SectionHeader eyebrow={t('tools_eyebrow')} title={t('tools_heading')} subtitle={t('tools_sub')} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Link
              href="/inburgering/tools/tijdlijn"
              className="block rounded-2xl p-5 no-underline bg-surface-container-lowest transition-transform hover:-translate-y-0.5"
              style={{ boxShadow: 'var(--shadow-ambient)' }}
            >
              <span className="font-headline font-bold text-base text-on-surface">{t('tool_tijdlijn')}</span>
              <span className="block text-sm text-on-surface-variant leading-relaxed mt-1.5">{t('tool_tijdlijn_sub')}</span>
              <span className="inline-flex items-center gap-1.5 text-sm font-bold mt-3" style={{ color: '#a24000' }}>
                {t('tool_open')}
                <ArrowRight size={14} className="rtl-flip" aria-hidden="true" />
              </span>
            </Link>
            {(['woorden', 'grammatica'] as const).map(key => (
              <div key={key} className="rounded-2xl p-5 bg-surface-container">
                <span className="flex items-center gap-2 flex-wrap">
                  <span className="font-headline font-bold text-base text-on-surface-variant">{t(`tool_${key}`)}</span>
                  <span
                    className="text-[0.6rem] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                    style={{ background: '#fcecdd', color: '#a24000' }}
                  >
                    {t('badge_soon')}
                  </span>
                </span>
                <span className="block text-sm text-on-surface-variant leading-relaxed mt-1.5">{t(`tool_${key}_sub`)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="max-w-5xl mx-auto">
          <CTABanner
            eyebrow={t('cta_eyebrow')}
            title={t('cta_title')}
            description={t('cta_desc')}
            button={{ label: t('cta_primary'), href: '/oefenen' }}
          />
        </div>
      </section>

      <style>{`
        /* De satellietkaarten en de KNM-knop in de kop. Alleen transform en opacity (§8), met
           een uitgang voor prefers-reduced-motion. */
        /* De stapel: position sticky per blok, met de eigen top-waarde als inline stijl omdat
           die per index verschuift. Op smal staat de stapel uit: een blok dat daar plakt neemt bijna het
           hele scherm in en de rest van de pagina komt niet meer voorbij. */
        @media (min-width: 1024px) {
          .pf-flow { position: sticky; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pf-flow { position: static; }
        }
        .pf-sat {
          transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .pf-sat:hover {
          transform: translateY(-2px);
        }
        .pf-knm-cta {
          transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.18s ease;
        }
        .pf-knm-cta:hover {
          transform: translateY(-2px);
        }
        .pf-knm-cta:active {
          transform: translateY(0);
          opacity: 0.9;
        }
        .pf-knm-cta:focus-visible {
          outline: 2px solid var(--color-secondary);
          outline-offset: 3px;
        }
        @media (prefers-reduced-motion: reduce) {
          .pf-sat, .pf-knm-cta { transition: none; }
        }
      `}</style>
    </main>
  );
}
