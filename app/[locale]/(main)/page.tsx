import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, ArrowUpRight, Check, X } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { DEFAULT_LEVEL, SKILLS, getFormat } from '@/data/skills';
import JsonLd from '@/components/JsonLd';
import KennisbankCards, { type KennisbankCard } from './_components/KennisbankCards';
import FeatureCarousel from './_components/FeatureCarousel';
import HomeTracks from './_components/glas/HomeTracks';
import HomeHeroCopy from './_components/glas/HomeHeroCopy';
import FaqList from './_components/glas/FaqList';
import { publishedGuides, getGuideLocale, guideHref } from '@/data/guides/helpers';
import { getPostBySlug, getPostLocale, getPostSlug } from '@/data/blog-posts';
import TrustpilotScore from '@/components/site/TrustpilotScore';
import Field from '@/components/glas/Field';
import SectionHeading from '@/components/glas/SectionHeading';
import { glasButton } from '@/components/glas/Button';
import CategoryMark from '@/components/horizon/CategoryMark';
import { Link } from '@/i18n/navigation';
import { courseId, TEACHER_REF, ogImageFor } from '@/lib/schema';
import { localeHref, localizedPath } from '@/i18n/paths';
import { isOnaAvailable } from '@/lib/ona/access';
import { REVIEWS } from '@/data/reviews';

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



  /* The A2 tile names the four onderdelen it contains, read straight from the taxonomy — so a
     fifth onderdeel or a renamed one cannot leave a stale string on the homepage. Each one links to
     its exam overview: since the four-card grid was removed these chips are the *only* link to the
     onderdelen from this page, which the hard rule in `CLAUDE.md` requires. */
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

  return (
    <>
      <JsonLd data={jsonLd} />

      {/* Eén doorlopende ondergrond (feedback eigenaar 15-10): de hero vervaagt in de pagina en
          geen sectie heeft een eigen band. Wat de secties scheidt is ruimte, en een paar zachte
          gloeden (`g-glow`) die de stijl van de hero vasthouden tot in de footer. */}
      <div className="g-home">

      {/* ── HERO — product als beeld (glas.html §13 "Hero", G7: de structuur van vandaag) ──
          Het veld `hero` draagt de ene gloed van deze view, rechts; de tekst staat links op de
          sluier (regel 06). De knoppen zijn daarom navy en ghost, niet oranje.

          **De trackrij blijft staan en is niet decoratief:** de kop mag "A2, B1 en KNM" zeggen
          omdat die rij per track zegt wat er wél en niet achter zit (CLAUDE.md §2: het merk is het
          hele traject, de catalogus wordt apart genoemd). A2 en B1 linken naar hun niveau-overzicht.

          De opbouw is die van deutschtest üben (feedback eigenaar 15-10): een brede tekstkolom met
          een rustige vinkjesrij onder de knoppen, en rechts één app-scherm met een pil die over de
          onderrand valt. Het scherm is een plaatje van het product, dus `aria-hidden`; alles wat
          iemand moet wéten staat links. Elk getal erin is illustratieve schermstand, geen claim. */}
      <Field as="section" id="hero" variant="hero" veil className="g-hero g-hero-fade g-hero-live" aria-labelledby="hero-heading">
        <span className="g-hero-orbs" aria-hidden="true"><i /><i /></span>
        <div className="g-wrap g-hero-grid">
          <HomeHeroCopy locale={locale} headingId="hero-heading" />

          <div className="g-hero-scene" aria-hidden="true" dir="ltr" lang="nl">
            <div className="g-phone g-glass g-glass-strong">
              <span className="g-phone-notch" />
              <div className="g-phone-big">
                <span>Je examen over</span>
                <b className="g-tnum">23 dagen</b>
              </div>
              <div className="g-phone-row">
                <CategoryMark category="luisteren" size={36} />
                <span><b>Luisteren A2 · vraag 4</b>Ga verder waar je was.</span>
              </div>
              <div className="g-phone-row">
                <span className="g-phone-ok"><Check /></span>
                <span><b>Schrijven nagekeken</b>Je feedback staat klaar.</span>
              </div>
            </div>
            <div className="g-phone-pill g-glass g-glass-strong">
              <span className="g-phone-num">2</span>
              <span><b>Lezen A2 · oefenexamen 2</b>Klaar. Hierna: Schrijven.</span>
            </div>
          </div>
        </div>
      </Field>

      {/* ── DE VERBINDENDE KAART — drie bewijsstukken direct onder de hero ──
          Plek en maten zijn die van de talenstrook van deutschtest üben (feedback eigenaar 15-10):
          geen overlap meer met de hero, de kaart begint op dezelfde hoogte als die strook en de
          volgende sectie volgt met hetzelfde sectieritme. De vorm van de kaart blijft.
          Het cijfer, het aantal, de docent. **De Trustpilot-score is van knmoefenen.nl en dat staat
          erbij**; een score van een ander domein zonder bron is geleend vertrouwen. Er hoort géén
          `AggregateRating` bij in de structured data van dit domein. Het getal 1.000+ is dat van de
          docent zelf (opgave eigenaar). Nooit een gebruikersaantal dat niet uit de database of uit
          `SEO/facts.md` komt. De quotes rij rendert pas als er échte quotes zijn (`QUOTES`). */}
      <section aria-labelledby="proof-heading" className="g-wrap relative z-10">
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

      <HomeTracks locale={locale} />

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
      <section id="docent" aria-labelledby="proofsec-heading" className="g-sec g-glow g-glow-start g-glow-soft">
        <div className="g-wrap g-stack">
          <SectionHeading id="proofsec-heading" title={t('proofsec_heading')} aside={t('proofsec_body')} className="mb-12" />

          {/* De opbouw van glas.html §08: links de stemmen, rechts de docent, eronder de vergelijking.
              Twee reviews, niet drie: de kolom moet even hoog blijven als de docentkaart ernaast. */}
          <div className="g-proof">
            <div id="cursisten" className="g-proof-reviews">
              <h3 className="g-sr">{t('reviews_heading')}</h3>
              {REVIEWS.slice(0, 2).map(review => (
                <figure key={review.name} className="g-review">
                  <div className="g-stars" aria-hidden="true"><i /><i /><i /><i /><i /></div>
                  <blockquote lang={review.lang}>{`“${review.text}”`}</blockquote>
                  <figcaption>
                    <b>{review.name}</b>
                    Trustpilot · <time dateTime={review.date}>{reviewDate.format(new Date(review.date))}</time>
                  </figcaption>
                </figure>
              ))}
              <p className="m-0 px-1 text-xs leading-relaxed text-ink-2">
                {t('reviews_source')}{' '}
                <a href="https://nl.trustpilot.com/review/knmoefenen.nl" target="_blank" rel="noopener noreferrer" className="g-ilink inline-flex items-center gap-0.5 whitespace-nowrap">
                  {t('reviews_source_link')}
                  <ArrowUpRight className="size-3 rtl-flip" aria-hidden="true" />
                </a>
              </p>
            </div>

            <div className="g-docent">
              <img src="/images/amber-van-der-zalm-264.webp" alt={t('teacher_name')} width={264} height={264} />
              <div className="g-docent-t">
                <p className="g-docent-line">{t('docent_line')}</p>
                <p className="m-0 text-[0.9375rem] leading-relaxed text-ink-2">{t('docent_line_sub')}</p>
                <div className="g-docent-who">
                  <b>{t('teacher_name')}</b>
                  <small>{t('teacher_experience')}</small>
                </div>
                <Link href="/docent" className="g-tlink">
                  {t('docent_cta')}
                  <ArrowRight className="rtl-flip" aria-hidden="true" />
                </Link>
              </div>
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
        </div>
      </section>

      {/* ── DE KENNISBANK — alles wat geen oefenexamen is. Welke bestemmingen de rij draagt is een
          inhoudsbeslissing, begrensd door de publicatiepoort: zie `KENNISBANK`. */}
      <section aria-labelledby="kennisbank-heading" className="g-sec">
        <div className="g-wrap">
          <SectionHeading id="kennisbank-heading" title={t('kb_heading')} aside={t('kb_intro')} className="mb-6" />
          <KennisbankCards cards={KENNISBANK} allLabel={t('kb_all')} />
        </div>
      </section>

      {/* ── FAQ ── dezelfde zes vragen als de FAQPage hierboven in de JSON-LD. */}
      <section id="faq" aria-labelledby="faq-heading" className="g-sec">
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
          Eén oranje knop, dus géén oranje gloed. Geen eigen vlak meer: een afgeronde kaart boven de
          footerkaart las als twee blokken (feedback eigenaar 15-10). De tekst staat op de
          ondergrond met een Nevel-gloed erachter, en die loopt door in de footer, die van boven
          invloeit. */}
      <section aria-labelledby="closing-heading" className="g-sec g-glow g-glow-mid g-closing-open">
        <div className="g-wrap g-cta-band">
          <h2 id="closing-heading">{t('closing_heading')}</h2>
          <p>{t('closing_sub')}</p>
          <a href={localeHref(locale, `oefenen`)} className={glasButton({ variant: 'oranje', size: 'lg', className: 'mt-2' })}>
            {t('cta_primary')}
            <ArrowRight className="rtl-flip" aria-hidden="true" />
          </a>
        </div>
      </section>
      </div>
    </>
  );
}

/* ── De verdieping ──
   Links de belofte met een link, rechts drie getallen die hem onderbouwen. Een `CategoryMark`
   hoort hier niet: "10 oefenexamens" is geen onderdeel (§7, de iconenverdeling). De getallen staan
   op melkglas boven een gloed van de pagina (`g-glow`): wit op mist was te kaal (feedback
   eigenaar 15-10), en glas mag hier omdat er iets ónder ligt. */
function DeepDive({
  id, heading, body, linkLabel, href, cards,
}: {
  id: string;
  heading: string;
  body: string;
  linkLabel: string;
  href: string;
  cards: { key: string; stat: string; label: string; body: string }[];
}) {
  return (
    <section aria-labelledby={`${id}-heading`} className="g-sec g-glow g-glow-end">
      <div className="g-wrap grid gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16 items-start">
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
            <li key={card.key} className="g-numcard g-glass">
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
