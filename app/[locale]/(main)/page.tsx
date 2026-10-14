import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, ArrowUpRight, Check, Clock, Play, X } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { DEFAULT_LEVEL, KNM_THEMES, SKILLS, getFormat } from '@/data/skills';
import JsonLd from '@/components/JsonLd';
import KennisbankCards, { type KennisbankCard } from './_components/KennisbankCards';
import FeatureCarousel from './_components/FeatureCarousel';
import TrackCard from './_components/glas/TrackCard';
import FaqList from './_components/glas/FaqList';
import { publishedGuides, getGuideLocale, guideHref } from '@/data/guides/helpers';
import { getPostBySlug, getPostLocale, getPostSlug } from '@/data/blog-posts';
import TrustpilotScore from '@/components/site/TrustpilotScore';
import Field from '@/components/glas/Field';
import SectionHeading from '@/components/glas/SectionHeading';
import { glasButton } from '@/components/glas/Button';
import ExamMark from '@/components/horizon/ExamMark';
import CategoryMark from '@/components/horizon/CategoryMark';
import { Link } from '@/i18n/navigation';
import { courseId, TEACHER_REF, ogImageFor } from '@/lib/schema';
import { localeHref, localizedPath } from '@/i18n/paths';
import { isOnaAvailable } from '@/lib/ona/access';

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
    /* ONA volgt `isOnaAvailable()` — dezelfde vlag als het portaal, het menu en de checkout. */
    { key: 'track_ona', live: isOnaAvailable() },
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

  /* Echte reviews van **knmoefenen.nl** op Trustpilot, letterlijk overgenomen (11-10-2026) en in
     hun eigen taal: een vertaalde quote is niet meer wat iemand schreef. Een eventuele weglating is
     gemarkeerd met […]. De naam staat zoals Trustpilot hem toont, ingekort tot voornaam en
     initiaal; er is geen foto, want de reviewers hebben er op Trustpilot geen.

     **Wat hier niet mag komen:** een review van iemand die aan het bedrijf verbonden is. "Amber"
     en "ingrid van der zalm" (beide augustus 2026) staan daarom niet in deze lijst; zie
     `SEO/facts.md` §12. Elke nieuwe review hier: eerst de eigenaar laten bevestigen dat het een
     echte, onafhankelijke klant is. */
  const REVIEWS = [
    {
      name: 'Francesca G.',
      date: '2026-08-09',
      lang: 'en',
      text: 'The practice exams are extremely helpful. I completed 10 practice exams and passed with a 9!',
    },
    {
      name: 'Anne',
      date: '2026-08-10',
      lang: 'en',
      text: "I used KNMoefenen for about six weeks while preparing for my inburgering exam, and it made a real difference in how I studied. […] The free flashcards are a real bonus, so don't skip it!",
    },
    {
      name: 'Raghda Z.',
      date: '2026-09-23',
      lang: 'nl',
      text: 'Dank u voor deze prachtige aanmelding, het heeft mijn studie van het boek in korte tijd verkort',
    },
  ] as const;
  const reviewDate = new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : locale === 'en' ? 'en-GB' : 'nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });

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
      /* Dezelfde foto als de hero van de gids zelf, en bewust niet een tweede snede: de tegel is
         de vooruitblik op díe pagina. `hasWebp` slaat op de hero-variant; hier staat de `.jpg`,
         want `next/image` maakt er zelf een moderne encode van. */
      image: guide.heroImage ? `/images/guides/${guide.heroImage.base}.jpg` : undefined,
      imageAlt: g.heroImageAlt || guide.heroImage?.alt,
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
        image: post.image,
        imageAlt: lp.heroTitle,
        href: localeHref(locale, `blog/${getPostSlug(post, locale)}`),
      };
      return card;
    })
    .filter((c): c is KennisbankCard => c !== null);

  /* **Zes kaarten, en dat is het patroon van de bento precies één keer**: de grote tegel, twee
     halve ernaast, en een rij van drie eronder. Een zevende kaart begint het patroon opnieuw en
     zet er een tweede blok van dezelfde vorm onder — dan leest de rij als een archief in plaats
     van als een greep uit de kennisbank, en daar staat `/gidsen` al voor.

     De verdeling is vier gidsen, de KNM-hub en één blogpost, zodat elke filterpil ook echt iets
     te tonen heeft: de pillen worden uit de kaarten afgeleid, dus een rij van zes gidsen zou
     één pil overhouden. */
  const KENNISBANK: KennisbankCard[] = [
    ...guideCards.slice(0, 4),
    {
      id: 'knm-hub',
      group: t('kb_group_knm'),
      title: t('kb_knm_title'),
      desc: t('kb_knm_desc'),
      href: `/${locale}/knm`,
      category: 'knm',
    },
    ...postCards.slice(0, 1),
  ];

  /* De quotes van echte cursisten. **Leeg tot de eigenaar ze aanlevert** — een quote hier is een
     uitspraak van een bestaand persoon, dus hij wordt geplakt, niet geschreven (§2: nooit
     verzonnen social proof). Vorm: { text, author }, met de auteur als voornaam of als soort
     cursist, nooit een verzonnen volledige naam. De rij rendert niet zolang dit leeg is. */
  const QUOTES: { text: string; author: string }[] = [];

  /* Het formaat van A2 Lezen als voorbeeld in de eerste verdieping. Uit de taxonomie, nooit
     getypt: `SEO/facts.md` §1 is de bron van de duur en een hertelling moet de pagina meenemen. */
  const A2_LEZEN = getFormat(DEFAULT_LEVEL, 'lezen');

  const faqs = [1, 2, 3, 4, 5, 6].map(n => ({ q: `faq_q${n}`, a: `faq_a${n}`, link: n === 1 }));

  const [heroLead, heroMuted] = t('hero_line1').split(' — ');

  return (
    <>
      <JsonLd data={jsonLd} />

      {/* ── HERO — product als beeld (glas.html §13 "Hero", G7: de structuur van vandaag) ──
          Het veld `hero` draagt de ene gloed van deze view, rechts; de tekst staat links op de
          sluier (regel 06). De knoppen zijn daarom navy en ghost, niet oranje.

          **De trackrij blijft staan en is niet decoratief:** de kop mag "A2, B1 en KNM" zeggen
          omdat die rij per track zegt wat er wél en niet achter zit (CLAUDE.md §2: het merk is het
          hele traject, de catalogus wordt apart genoemd). A2 en B1 linken naar hun niveau-overzicht.

          Rechts de scène: drie glazen kaartjes met een vraag, een examendag en een luisterspeler.
          Het is een plaatje van het product, dus `aria-hidden`; alles wat iemand moet wéten staat
          in de tekst links. Elk getal erin is illustratieve schermstand, geen claim. Onder 960px
          valt de scène weg: zes overlappende kaartjes worden op 390px een stapel afgesneden blokken. */}
      <Field as="section" id="hero" variant="hero" veil className="g-hero" aria-labelledby="hero-heading">
        <div className="g-wrap g-hero-grid">
          <div>
            <span className="g-seal g-glass g-glass-strong">
              <img src="/images/amber-van-der-zalm-264.webp" alt="" width={30} height={30} />
              <b>{t('hero_badge')}</b>
            </span>
            <h1 id="hero-heading">
              {heroLead}
              {heroMuted && <> <span>{heroMuted}</span></>}
            </h1>
            <p className="g-lead">{t('hero_subheading')}</p>
            <div className="g-ctas">
              <a href={localeHref(locale, `oefenen`)} className={glasButton({ variant: 'navy', size: 'lg' })}>
                {t('cta_primary')}
                <ArrowRight className="rtl-flip" aria-hidden="true" />
              </a>
              <Link href="/platform" className={glasButton({ variant: 'ghost', size: 'lg' })}>
                {t('cta_secondary')}
              </Link>
            </div>

            <ul className="flex flex-wrap items-center gap-2 list-none p-0 m-0 mt-6" aria-label={t('blocks_heading')}>
              {TRACKS.map(track => {
                const levelHref = track.key === 'track_a2' ? localeHref(locale, 'oefenexamen/a2')
                  : track.key === 'track_b1' ? localeHref(locale, 'oefenexamen/b1')
                  : null;
                return (
                  <li key={track.key}>
                    {levelHref ? (
                      <a href={levelHref} className="g-metachip g-glass g-hero-track">
                        <Check aria-hidden="true" className="text-goed" />
                        {t(track.key)}
                      </a>
                    ) : (
                      <span className="g-metachip g-glass">
                        {track.live ? <Check aria-hidden="true" className="text-goed" /> : <Clock aria-hidden="true" />}
                        {t(track.key)}
                        {!track.live && <span className="g-bdg g-bdg-grijs !h-5 !px-2 !text-[11px]">{t('pkg_soon')}</span>}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="g-scene" aria-hidden="true">
            <div className="g-glass g-glass-strong" style={{ insetInlineStart: 0, top: 6, width: '78%', padding: 18 }}>
              <div className="flex items-center justify-between">
                <span className="g-mono">Lezen A2 · vraag 4</span>
                <CategoryMark category="lezen" size={30} />
              </div>
              <div className="g-head text-[17px] font-bold tracking-[-0.015em] text-ink mt-2.5 mb-3">
                Wat moet je meenemen naar de afspraak?
              </div>
              <div className="g-answers">
                <div className="g-ans !py-2.5 !text-sm"><span className="g-ans-k !size-[26px]">A</span><span className="g-ans-text">Je paspoort en een pasfoto</span></div>
                <div className="g-ans !py-2.5 !text-sm" aria-checked="true"><span className="g-ans-k !size-[26px]">B</span><span className="g-ans-text">Alleen een brief van de gemeente</span></div>
              </div>
            </div>
            <div className="g-glass g-glass-strong flex items-center gap-3.5" style={{ insetInlineEnd: 0, top: 238, width: '54%', padding: 16 }}>
              <ExamMark track="a2" size={56} />
              <div>
                <span className="g-mono">Je examen</span>
                <div className="g-head g-tnum text-[34px] font-extrabold tracking-[-0.05em] leading-none mt-1">23 dagen</div>
              </div>
            </div>
            <div className="g-glass g-glass-strong flex items-center gap-3" style={{ insetInlineStart: '6%', top: 352, width: '62%', padding: '12px 14px' }}>
              <span className="size-[38px] rounded-full bg-navy text-white flex items-center justify-center shrink-0">
                <Play className="size-4 rtl-flip" fill="currentColor" />
              </span>
              <span className="flex items-center gap-[3px] h-7 flex-1 overflow-hidden">
                {WAVE.map((h, i) => (
                  <b key={i} className="block w-[3px] rounded-[2px] bg-navy shrink-0" style={{ height: `${h}%`, opacity: i < 14 ? 1 : 0.3 }} />
                ))}
              </span>
            </div>
          </div>
        </div>
      </Field>

      {/* ── DE VERBINDENDE KAART — drie bewijsstukken over de onderrand van de hero ──
          Het cijfer, het aantal, de docent. **De Trustpilot-score is van knmoefenen.nl en dat staat
          erbij**; een score van een ander domein zonder bron is geleend vertrouwen. Er hoort géén
          `AggregateRating` bij in de structured data van dit domein. Het getal 1.000+ is dat van de
          docent zelf (opgave eigenaar). Nooit een gebruikersaantal dat niet uit de database of uit
          `SEO/facts.md` komt. De quotes rij rendert pas als er échte quotes zijn (`QUOTES`). */}
      <section aria-labelledby="proof-heading" className="g-wrap relative z-10 -mt-12 sm:-mt-16">
        <div className="bg-wit rounded-g-xl p-2.5 sm:p-3 shadow-zweef">
          <h2 id="proof-heading" className="g-sr">{t('proof_line')}</h2>
          <div className="grid gap-2 sm:gap-2.5 lg:grid-cols-3">
            <div className="rounded-g-lg bg-mist px-4 py-3.5 flex items-center gap-3">
              <span className="g-head g-tnum text-[28px] font-extrabold tracking-[-0.04em] leading-none shrink-0">4,4</span>
              <div className="min-w-0">
                <TrustpilotScore score={4.4} compact />
                <p className="m-0 mt-1 text-[0.75rem] leading-snug text-ink-2">
                  {t('proof_trustpilot_label')}{' '}
                  <a href="https://nl.trustpilot.com/review/knmoefenen.nl" target="_blank" rel="noopener noreferrer" className="g-ilink inline-flex items-center gap-0.5 whitespace-nowrap">
                    {t('proof_source')}
                    <ArrowUpRight className="size-3 rtl-flip" aria-hidden="true" />
                  </a>
                </p>
              </div>
            </div>
            <div className="rounded-g-lg bg-mist px-4 py-3.5 flex items-center gap-3">
              <span className="g-head g-tnum text-[28px] font-extrabold tracking-[-0.04em] leading-none shrink-0">1.000+</span>
              <p className="m-0 text-[0.75rem] leading-snug text-ink-2">{t('proof_students_label')}</p>
            </div>
            <div className="rounded-g-lg bg-mist px-4 py-3.5 flex items-center gap-3">
              <img
                src="/images/amber-van-der-zalm-264.webp"
                alt={t('teacher_name')}
                width={44}
                height={44}
                className="size-11 rounded-g-sm object-cover object-top shrink-0"
              />
              <div className="min-w-0 text-[0.75rem] leading-snug text-ink-2">
                <p className="m-0 g-head text-[0.9375rem] font-bold leading-tight">{t('teacher_name')}</p>
                <p className="m-0 mt-0.5">
                  {t('proof_teacher_role')}{' · '}
                  <Link href="/docent" className="g-ilink inline-flex items-center gap-0.5 whitespace-nowrap">
                    {t('proof_teacher_link')}
                    <ArrowRight className="size-3 rtl-flip" aria-hidden="true" />
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {QUOTES.length > 0 && (
            <ul className="grid gap-2.5 sm:grid-cols-3 mt-2.5 list-none p-0 mb-0">
              {QUOTES.map(q => (
                <li key={q.author + q.text.slice(0, 12)} className="rounded-g-lg bg-mist px-5 py-5">
                  <blockquote className="m-0 text-[0.875rem] leading-relaxed text-ink">{`“${q.text}”`}</blockquote>
                  <p className="m-0 mt-3 text-[0.75rem] font-semibold text-ink-2">{q.author}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ── DE TRACKBAND — het hele traject, in DUO's eigen volgorde ──
          **A2 → B1 → KNM → ONA, en die volgorde is gebrond, niet gekozen** (`SEO/facts.md` §7): de
          taalonderdelen eerst, dan KNM, dan ONA. A2 en B1 zijn twee niveaus van dezelfde vier
          onderdelen, dus ze staan naast elkaar.

          **De chips zijn links, en dat is een productregel**: de homepage moet alle vier de
          taalonderdelen linken (CLAUDE.md §3, `tests/public.spec.js`). A2 leest ze uit `SKILLS`, B1
          uit dezelfde taxonomie gefilterd op een geverifieerd formaat (dus geen Luisteren B1 tot
          dat geteld is), KNM uit `KNM_THEMES`. Beschikbaarheid staat in de tekst — de B1-noot, de
          "binnenkort"-badge van ONA als `isOnaAvailable()` onwaar is — nooit in de kleur.
          Kaartkoppen: Gracht, en Nevel voor ONA (glas.html §13 "Trackband"). */}
      <section id="onderdelen" aria-labelledby="blocks-heading" className="g-sec g-sec-tier mt-12 sm:mt-16">
        <div className="g-wrap">
          <SectionHeading id="blocks-heading" title={t('blocks_heading')} aside={t('blocks_intro')} className="mb-10" />
          <div className="g-tracks">
            <TrackCard
              track="a2"
              title={t('blocks_a2_title')}
              desc={t('blocks_a2_desc')}
              chips={A2_CHIPS.map(chip => ({ key: chip.slug, name: chip.name, href: localeHref(locale, `oefenexamen/${DEFAULT_LEVEL}/${chip.slug}`) }))}
              ctaLabel={t('blocks_a2_cta')}
              href={localeHref(locale, `oefenen`)}
            />
            <TrackCard
              track="b1"
              title={t('blocks_b1_title')}
              desc={t('blocks_b1_desc')}
              chips={B1_CHIPS.map(chip => ({ key: chip.slug, name: chip.name, href: localeHref(locale, `oefenexamen/b1/${chip.slug}`) }))}
              note={t('blocks_b1_note')}
              ctaLabel={t('blocks_b1_cta')}
              href={localeHref(locale, `oefenen/b1/lezen`)}
            />
            {/* KNM: de chips wijzen naar de kennisgidsen per thema — publiek, zonder account.
                knmoefenen.nl blijft bewust staan als ranking-asset; deze link is intern. */}
            <TrackCard
              track="knm"
              title={t('blocks_knm_title')}
              desc={t('blocks_knm_desc')}
              chips={KNM_THEMES.map(theme => ({ key: theme.id, name: theme.title, href: `/${locale}/knm/${theme.guideSlug}` }))}
              ctaLabel={t('blocks_knm_cta')}
              href={localeHref(locale, `oefenexamen/knm`)}
            />
            {/* ONA volgt `isOnaAvailable()` — dezelfde vlag als het portaal, het menu en de checkout.
                Live wijst de knop naar het portaal; anders is het de aankondiging met `/contact`. */}
            {isOnaAvailable() ? (
              <TrackCard
                track="ona"
                variant="nevel"
                title={t('blocks_ona_title')}
                desc={t('blocks_ona_desc')}
                ctaLabel={t('blocks_ona_cta')}
                href={localeHref(locale, `dashboard/ona`)}
              />
            ) : (
              <TrackCard
                track="ona"
                variant="nevel"
                muted
                badge={t('pkg_soon')}
                title={t('blocks_ona_title')}
                desc={t('blocks_ona_desc')}
                ctaLabel={t('blocks_notify')}
                href={localeHref(locale, `contact`)}
              />
            )}
          </div>
        </div>
      </section>

      {/* ── DE VITRINE — vijf schermen die er al zijn. Ná de tracks: die zeggen *wat* je kunt kopen,
          deze sectie *hoe het eruitziet*. */}
      <FeatureCarousel />

      {/* ── VERDIEPING 1 en 2 — zo oefen je, zo leer je ──
          Dezelfde vorm twee keer, en dat is de structuur: links de belofte, rechts drie getallen die
          hem onderbouwen. De getallen van verdieping 1 komen uit `data/skills.ts`, niet uit de copy
          (§9: elk getal heeft een bron). **De middelste kaart van verdieping 2 heeft bewust geen
          getal**: 31 regels en 28 lessen naast elkaar is een claim die zichzelf tegenspreekt. */}
      <DeepDive
        id="dd-oefenen"
        tier
        heading={t('dd1_heading')}
        body={t('dd1_body')}
        linkLabel={t('dd1_link')}
        href={localeHref(locale, `oefenexamen/${DEFAULT_LEVEL}/lezen`)}
        cards={[
          { key: 'c1', stat: t('dd1_c1_stat'), label: t('dd1_c1_label'), body: t('dd1_c1_body') },
          {
            key: 'c2',
            stat: t('dd1_c2_stat', { items: A2_LEZEN.itemCount ?? 0 }),
            label: t('dd1_c2_label'),
            body: t('dd1_c2_body', { minutes: A2_LEZEN.durationMinutes ?? 0 }),
          },
          { key: 'c3', stat: t('dd1_c3_stat'), label: t('dd1_c3_label'), body: t('dd1_c3_body') },
        ]}
      />
      <DeepDive
        id="dd-leren"
        heading={t('dd2_heading')}
        body={t('dd2_body')}
        linkLabel={t('dd2_link')}
        href={localeHref(locale, `platform`)}
        cards={[
          { key: 'c1', stat: t('dd2_c1_stat'), label: t('dd2_c1_label'), body: t('dd2_c1_body') },
          { key: 'c2', stat: t('dd2_c2_stat'), label: t('dd2_c2_label'), body: t('dd2_c2_body') },
          { key: 'c3', stat: t('dd2_c3_stat'), label: t('dd2_c3_label'), body: t('dd2_c3_body') },
        ]}
      />

      {/* ── HET BEWIJS — claim, onderbouwing, stemmen (glas.html §08 "Docent, review, vergelijking") ──
          - Geen `Review` en geen `AggregateRating` in de structured data; `scripts/check-schema.mjs`
            laat de build vallen als er een verschijnt.
          - **De quotes zijn echte Trustpilot-reviews van knmoefenen.nl**, letterlijk en met datum.
            Zie `REVIEWS` voor wat er wel en niet in mag.
          - **Naast het portret staat een uitspraak, geen citaat** (`home.docent_line`): een quote
            toeschrijven aan een echte persoon mag alleen met haar eigen, letterlijke woorden.
          - De vergelijking is feitelijk: geen logo's, niets doorgestreept. */}
      <section id="docent" aria-labelledby="proofsec-heading" className="g-sec g-sec-tier">
        <div className="g-wrap g-stack">
          <SectionHeading id="proofsec-heading" title={t('proofsec_heading')} aside={t('proofsec_body')} className="mb-6" />

          <div className="g-docent">
            <img src="/images/amber-van-der-zalm-264.webp" alt={t('teacher_name')} width={264} height={264} />
            <div className="g-docent-t">
              <p className="g-docent-line">{t('docent_line')}</p>
              <p className="m-0 text-[0.9375rem] leading-relaxed text-ink-2">{t('docent_line_sub')}</p>
              <ul className="g-metachips list-none p-0 m-0">
                {[1, 2, 3].map(n => (
                  <li key={n} className="g-metachip bg-mist">
                    <Check aria-hidden="true" className="!text-goed" />
                    {t(`docent_chip_${n}`)}
                  </li>
                ))}
              </ul>
              <div className="g-docent-who">
                <b>{t('teacher_name')}</b>
                <small>{t('teacher_experience')}</small>
              </div>
              <Link href="/docent" className={glasButton({ variant: 'navy', size: 'sm' })}>
                {t('docent_cta')}
                <ArrowRight className="rtl-flip" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="g-compare">
            <div className="g-compare-us g-on-dark flex flex-col">
              <h3>{t('ai_us_title')}</h3>
              <ul>
                {[1, 2, 3, 4].map(n => (
                  <li key={n}><Check aria-hidden="true" />{t(`ai_us_${n}`)}</li>
                ))}
              </ul>
              <Link href="/docent" className={glasButton({ variant: 'wit', size: 'sm', className: 'mt-6 self-start' })}>
                {t('docent_meet_cta')}
              </Link>
            </div>
            <div className="g-compare-them">
              <h3>{t('ai_them_title')}</h3>
              <ul>
                {[1, 2, 3, 4].map(n => (
                  <li key={n}><X aria-hidden="true" />{t(`ai_them_${n}`)}</li>
                ))}
              </ul>
            </div>
          </div>

          <div id="cursisten" className="mt-10">
            <SectionHeading title={t('reviews_heading')} size="h2" as="h3" className="mb-5" />
            <div className="g-reviews">
              {REVIEWS.map(review => (
                <figure key={review.name} className="g-review">
                  <div className="g-stars" aria-hidden="true"><i /><i /><i /><i /><i /></div>
                  <blockquote lang={review.lang}>{`“${review.text}”`}</blockquote>
                  <figcaption>
                    <b>{review.name}</b>
                    Trustpilot · <time dateTime={review.date}>{reviewDate.format(new Date(review.date))}</time>
                  </figcaption>
                </figure>
              ))}
            </div>
            <p className="m-0 mt-4 text-xs leading-relaxed text-ink-2">
              {t('reviews_source')}{' '}
              <a href="https://nl.trustpilot.com/review/knmoefenen.nl" target="_blank" rel="noopener noreferrer" className="g-ilink inline-flex items-center gap-0.5 whitespace-nowrap">
                {t('reviews_source_link')}
                <ArrowUpRight className="size-3 rtl-flip" aria-hidden="true" />
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ── DE KENNISBANK — alles wat geen oefenexamen is. Welke bestemmingen de rij draagt is een
          inhoudsbeslissing, begrensd door de publicatiepoort: zie `KENNISBANK`. */}
      <section aria-labelledby="kennisbank-heading" className="g-sec">
        <div className="g-wrap">
          <SectionHeading id="kennisbank-heading" title={t('kb_heading')} aside={t('kb_intro')} className="mb-8" />
          <KennisbankCards cards={KENNISBANK} allLabel={t('kb_all')} />
        </div>
      </section>

      {/* ── FAQ ── dezelfde zes vragen als de FAQPage hierboven in de JSON-LD. */}
      <section id="faq" aria-labelledby="faq-heading" className="g-sec g-sec-tier">
        <div className="g-wrap grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-14 items-start">
          <div className="lg:sticky lg:top-[calc(var(--nav-h)+24px)]">
            <SectionHeading id="faq-heading" title={t('faq_heading')} size="h1" />
            <p className="g-body mt-4">{t('faq_subheading')}</p>
          </div>
          <FaqList
            items={faqs.map(({ q, a, link }) => ({
              question: t(q),
              answer: t(a),
              link: link ? { href: '#onderdelen', label: t('faq_a1_link') } : undefined,
            }))}
          />
        </div>
      </section>

      {/* ── DE AFSLUITER (glas.html §13 "Afsluiter") ──
          Nevel met één oranje knop, dus géén gloed. Hij was een navy band die met een skyline
          overliep in een navy footer; die footer is nu F1 "licht glas", en navy tegen een licht
          veld is een naad. Nu zijn afsluiter en footer twee afgeronde vlakken op dezelfde
          mistondergrond, met dezelfde 16px marge — er is geen rand meer om te overbruggen. */}
      <div className="g-closing">
        <Field as="section" variant="nevel" aria-labelledby="closing-heading" className="g-block g-cta-band">
          <h2 id="closing-heading">{t('closing_heading')}</h2>
          <p>{t('closing_sub')}</p>
          <a href={localeHref(locale, `oefenen`)} className={glasButton({ variant: 'oranje', size: 'lg', className: 'mt-2' })}>
            {t('cta_primary')}
            <ArrowRight className="rtl-flip" aria-hidden="true" />
          </a>
        </Field>
      </div>
    </>
  );
}

/* Het golfje van de luisterspeler in de hero: vaste hoogtes, zodat server en client hetzelfde
   tekenen (een `Math.random()` hier is een hydration-mismatch). */
const WAVE = [38, 62, 80, 54, 92, 70, 44, 66, 88, 58, 36, 72, 96, 64, 48, 76, 90, 52, 40, 68, 84, 60, 46, 74, 56, 34, 62, 86, 50, 42];

/* ── De verdieping ──
   Links de belofte met een link, rechts drie getallen die hem onderbouwen. Een `CategoryMark`
   hoort hier niet: "10 oefenexamens" is geen onderdeel (§7, de iconenverdeling). De twee
   verdiepingen staan op verschillende ondergronden; dat is de scheiding, geen lijn. */
function DeepDive({
  id, heading, body, linkLabel, href, cards, tier,
}: {
  id: string;
  heading: string;
  body: string;
  linkLabel: string;
  href: string;
  cards: { key: string; stat: string; label: string; body: string }[];
  tier?: boolean;
}) {
  return (
    <section aria-labelledby={`${id}-heading`} className={tier ? 'g-sec g-sec-tier' : 'g-sec'}>
      <div className="g-wrap grid gap-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-16 items-start">
        <div className="lg:sticky lg:top-[calc(var(--nav-h)+24px)]">
          <SectionHeading id={`${id}-heading`} title={heading} size="h1" />
          <p className="g-body mt-4">{body}</p>
          <a href={href} className="g-tlink mt-5">
            {linkLabel}
            <ArrowRight className="rtl-flip" aria-hidden="true" />
          </a>
        </div>
        <ul className="g-numcards">
          {cards.map(card => (
            <li key={card.key} className={tier ? 'g-numcard' : 'g-numcard'}>
              <b className="g-tnum">{card.stat}</b>
              <span className="g-mono mt-2">{card.label}</span>
              <p>{card.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
