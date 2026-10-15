import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, ArrowUpRight, Check, Lock, Play } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { DEFAULT_LEVEL, SKILLS, getFormat, KNM } from '@/data/skills';
import { getFreePractice, optionKeys, optionText } from '@/data/free-practice';
import { ONA_CARDS } from '@/data/ona/cards';
import { BUNDLE_PRICE_CENTS, MODULE_PRICE_CENTS, euro } from '@/lib/pricing';
import { REVIEWS } from '@/data/reviews';
import JsonLd from '@/components/JsonLd';
import TrustpilotScore from '@/components/site/TrustpilotScore';
import Field from '@/components/glas/Field';
import { glasButton } from '@/components/glas/Button';
import CategoryMark from '@/components/horizon/CategoryMark';
import ExamMark from '@/components/horizon/ExamMark';
import { Link } from '@/i18n/navigation';
import { localeHref } from '@/i18n/paths';
import { courseId, TEACHER_REF, ogImageFor } from '@/lib/schema';
import FaqList from './_components/glas/FaqList';
import HomeTracks from './_components/glas/HomeTracks';
import HomeHeroCopy from './_components/glas/HomeHeroCopy';
import HomeDemo, { type DemoListening, type DemoMcq, type DemoSpeaking } from './_components/glas/HomeDemo';

/* De homepage (variant B, sinds 15-10 de standaard — besluit eigenaar).
 *
 * De opbouw en de schrijfstijl zijn die van de landingspagina van deutschtest üben (Nachtzug):
 * hero met app-scherm, het bewijs, een werkende demo, één zin als citaat, drie panelen
 * "zo bereid je je voor", drie doelgroepen, de belofte, vragen en een afsluiter. De inhoud is van
 * dit project, en de vier blokken (Taal A2, Taal B1, KNM, ONA) zijn de tabbladen van de demo.
 * Alle regels van CLAUDE.md §2 gelden hier ook: ONA heet nergens nagekeken, en een score is
 * oefenfeedback, geen DUO-uitslag. */

type Props = { params: Promise<{ locale: string }> };

const BASE = 'https://inburgeringoefenen.nl';

export async function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
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

/* Een eigen KNM-vraag, alleen voor de demo. Feit: de leerplicht begint in de maand nadat een
   kind 5 wordt (Leerplichtwet 1969, art. 3). */
const KNM_ITEM: DemoMcq = {
  intro: '',
  question: 'Je zoon is 5 jaar geworden. Moet hij naar school?',
  options: [
    { key: 'A', text: 'Nee, ouders mogen dat zelf kiezen.' },
    { key: 'B', text: 'Ja, vanaf 5 jaar is een kind leerplichtig.' },
    { key: 'C', text: 'Alleen als hij al Nederlands spreekt.' },
  ],
  correct: 'B',
  explanation: 'In Nederland moet een kind vanaf 5 jaar naar school. Dat heet de leerplicht.',
};

/* Spreken A2, oefenexamen 1, onderdeel 1, opgave 1 — letterlijk uit `scripts/a2-content/spreken.mjs`. */
const SPREKEN_ITEM: DemoSpeaking = {
  speaker: 'Buurvrouw',
  says: 'Hoi! Wij zijn nieuw in deze straat. Waar woont u en hoe lang woont u hier al?',
  prompt: 'Uw nieuwe buurvrouw stelt zich voor. Geef antwoord op haar vraag.',
  answer: 'Ik woon op nummer 24. Ik woon hier nu ongeveer drie jaar.',
  limit: 60,
};

/* Wat de tegels van proefvraag lu-1 groot laten zien: de drie antwoorden zijn een dag en een tijd. */
const LU1_TILES: DemoListening['tiles'] = {
  A: { small: 'woensdag', big: '10:30' },
  B: { small: 'vrijdag', big: '9:00' },
  C: { small: 'vrijdag', big: '10:30' },
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'home_b' });
  const tHome = await getTranslations({ locale, namespace: 'home' });

  /* Het A2-voorbeeld is een bestaande proefvraag (lz-2), dus tekst die al door de docent is
     nagekeken, en niet een tweede versie ervan. */
  const lz = getFreePractice('lezen')!.items.find(i => i.id === 'lz-2')!;
  const a2Item: DemoMcq = {
    intro: lz.stimulusIntro.split('\n')[0],
    stimulusHtml: lz.stimulusHtml,
    question: lz.question,
    options: optionKeys(lz).map(k => ({ key: k, text: optionText(lz, k) })),
    correct: lz.correct,
    explanation: lz.explanation,
  };
  /* Het Luisteren-voorbeeld is proefvraag lu-1, met het echte fragment uit de gratis proef. */
  const lu = getFreePractice('luisteren')!.items.find(i => i.id === 'lu-1')!;
  const luItem: DemoListening = {
    intro: lu.stimulusIntro,
    question: lu.question,
    options: optionKeys(lu).map(k => ({ key: k, text: optionText(lu, k) })),
    correct: lu.correct,
    explanation: lu.explanation,
    audioSrc: lu.audioSrc!,
    script: lu.stimulusScript!,
    speakers: { A: 'Tandartspraktijk', B: 'Sara' },
    tiles: LU1_TILES,
  };
  const fmt = (skill: 'lezen' | 'luisteren' | 'spreken') => {
    const f = getFormat('a2', skill);
    return { items: f.itemCount ?? 0, minutes: f.durationMinutes ?? 0 };
  };


  const reviewDate = new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : locale === 'en' ? 'en-GB' : 'nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });

  const faqs = [1, 2, 3, 4, 5, 6].map(n => ({ question: tHome(`faq_q${n}`), answer: tHome(`faq_a${n}`) }));

  const tSkills = await getTranslations({ locale, namespace: 'skills' });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${BASE}/#website`,
        name: 'Inburgering Oefenen',
        url: `${BASE}/`,
        description: tHome('meta_description'),
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
          name: tHome(`faq_q${n}`),
          acceptedAnswer: { '@type': 'Answer', text: tHome(`faq_a${n}`) },
        })),
      },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <div className="g-home g-hb">
        {/* ── HERO ── dezelfde opbouw én tekst als de huidige homepage (HomeHeroCopy). */}
        <Field as="section" variant="hero" veil className="g-hero g-hero-fade g-hero-live" aria-labelledby="hb-hero">
          <span className="g-hero-orbs" aria-hidden="true"><i /><i /></span>
          <div className="g-wrap g-hero-grid">
            <HomeHeroCopy locale={locale} headingId="hb-hero" />

            <div className="g-hero-scene" aria-hidden="true" dir="ltr" lang="nl">
              <div className="g-phone g-glass g-glass-strong">
                <span className="g-phone-notch" />
                <div className="g-phone-big">
                  <span>Je examen over</span>
                  <b className="g-tnum">12 dagen</b>
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

        {/* ── HET BEWIJS ── dezelfde kaart als op de huidige homepage: de Trustpilot-score is van
            knmoefenen.nl en dat staat erbij; 1.000+ is de opgave van de docent zelf. */}
        <section aria-labelledby="hb-proof" className="g-wrap g-hb-proof">
          <h2 id="hb-proof" className="g-sr">{tHome('proof_line')}</h2>
          <div className="g-hb-proof-row g-glass g-glass-strong">
            <div className="g-hb-proof-item">
              <span className="g-hb-proof-num g-tnum">4,4</span>
              <div className="min-w-0">
                <TrustpilotScore score={4.4} compact />
                <p>
                  {tHome('proof_trustpilot_label')}{' '}
                  <a href="https://nl.trustpilot.com/review/knmoefenen.nl" target="_blank" rel="noopener noreferrer" className="g-ilink inline-flex items-center gap-0.5 whitespace-nowrap">
                    {tHome('proof_source')}
                    <ArrowUpRight className="size-3 rtl-flip" aria-hidden="true" />
                  </a>
                </p>
              </div>
            </div>
            <div className="g-hb-proof-item">
              <span className="g-hb-proof-num g-tnum">1.000+</span>
              <p>{tHome('proof_students_label')}</p>
            </div>
            <div className="g-hb-proof-item">
              <img src="/images/amber-van-der-zalm-264.webp" alt="" width={44} height={44} className="g-hb-proof-face" />
              <div className="min-w-0">
                <b>{tHome('teacher_name')}</b>
                <p>
                  {tHome('proof_teacher_role')}{' · '}
                  <Link href="/docent" className="g-ilink inline-flex items-center gap-0.5 whitespace-nowrap">
                    {tHome('proof_teacher_link')}
                    <ArrowRight className="size-3 rtl-flip" aria-hidden="true" />
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── DE TRACKBAND ── hetzelfde blok als op de huidige homepage, op dezelfde plek. */}
        <HomeTracks locale={locale} centered />

        {/* ── DE DEMO ── */}
        <section aria-labelledby="hb-demo" className="g-sec">
          <div className="g-wrap">
            <div className="g-hb-center">
              <h2 id="hb-demo" className="g-hb-h2">{t('demo_h2')}</h2>
              <p className="g-hb-lead">{t('demo_lead')}</p>
            </div>
            <Field variant="gracht" className="g-hb-stage">
              <HomeDemo
                luisteren={luItem}
                lezen={a2Item}
                spreken={SPREKEN_ITEM}
                formats={{ luisteren: fmt('luisteren'), lezen: fmt('lezen'), spreken: fmt('spreken') }}
                knm={KNM_ITEM}
                knmMinutes={KNM.durationMinutes ?? 0}
                onaCards={ONA_CARDS.map(c => c.title)}
              />
            </Field>
          </div>
        </section>

        {/* ── DE ZIN ── */}
        <section className="g-hb-quote">
          <figure className="g-wrap">
            <blockquote>{`“${t('quote_text')}”`}</blockquote>
            <figcaption>{t('quote_caption')}</figcaption>
          </figure>
        </section>

        {/* ── ZO BEREID JE JE VOOR ── echte schermen uit het product, geen nagebouwde. */}
        <section aria-labelledby="hb-panels" className="g-sec g-hb-band g-hb-panels">
          <div className="g-wrap">
            <h2 id="hb-panels" className="g-hb-h2 g-hb-h2-lg">{t('panels_h2')}</h2>
            <div className="g-hb-panel-list">
              {([1, 2, 3] as const).map(n => (
                <div key={n} className="contents">
                  {n > 1 && <span className="g-sep5" aria-hidden="true"><i /><i /><i /><i /><i /></span>}
                  <article className="g-hb-pcard">
                    <div className="g-hb-pcard-t">
                      <h3>{t(`panel${n}_title`)}</h3>
                      <p>{t(`panel${n}_text`)}</p>
                      <ul>
                        {[1, 2, 3].map(i => <li key={i}>{t(`panel${n}_p${i}`)}</li>)}
                      </ul>
                    </div>
                    <Field variant={n === 2 ? 'nevel' : 'gracht'} className="g-hb-shot">
                      <PanelMock n={n} />
                    </Field>
                  </article>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── VOOR WIE ── */}
        <section aria-labelledby="hb-aud" className="g-sec">
          <div className="g-wrap">
            <h2 id="hb-aud" className="g-hb-h2 g-hb-h2-start">
              {t('aud_h2')} <span>{t('aud_h2_muted')}</span>
            </h2>
            <ul className="g-hb-aud">
              <li>
                <Field variant="gracht" className="g-hb-acard">
                  <span className="g-hb-tag">{t('aud1_tag')}</span>
                  <div className="g-hb-art" aria-hidden="true">
                    <div className="g-hb-art-marks">
                      {(['a2', 'b1', 'knm', 'ona'] as const).map(k => <ExamMark key={k} track={k} size={52} />)}
                    </div>
                  </div>
                  <h3>{t('aud1_title')}</h3>
                  <p>{t('aud1_text')}</p>
                </Field>
              </li>
              <li>
                <Field variant="nevel" className="g-hb-acard">
                  <span className="g-hb-tag">{t('aud2_tag')}</span>
                  <div className="g-hb-art" aria-hidden="true">
                    <div className="g-hb-chipcard g-glass g-glass-strong">
                      <CategoryMark category="spreken" size={40} />
                      <span><b>{t('aud2_art')}</b><small dir="ltr" lang="nl">Spreken A2 · examen 3</small></span>
                    </div>
                  </div>
                  <h3>{t('aud2_title')}</h3>
                  <p>{t('aud2_text')}</p>
                </Field>
              </li>
              <li>
                <Field variant="gracht" className="g-hb-acard">
                  <span className="g-hb-tag">{t('aud3_tag')}</span>
                  <div className="g-hb-art" aria-hidden="true">
                    <div className="g-hb-ticket g-glass g-glass-strong">
                      <small>{t('aud3_art')}</small>
                      <b className="g-tnum">{t('aud3_art_days')}</b>
                    </div>
                  </div>
                  <h3>{t('aud3_title')}</h3>
                  <p>{t('aud3_text')}</p>
                </Field>
              </li>
            </ul>
          </div>
        </section>

        {/* ── STEMMEN ── echte Trustpilot-reviews van knmoefenen.nl, letterlijk (data/reviews.ts). */}
        <section aria-labelledby="hb-reviews" className="g-sec">
          <div className="g-wrap">
            <h2 id="hb-reviews" className="g-hb-h2 g-hb-h2-start">{tHome('reviews_heading')}</h2>
            <div className="g-reviews g-hb-reviews">
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
            <p className="g-hb-reviews-src">
              {tHome('reviews_source')}{' '}
              <a href="https://nl.trustpilot.com/review/knmoefenen.nl" target="_blank" rel="noopener noreferrer" className="g-ilink inline-flex items-center gap-0.5 whitespace-nowrap">
                {tHome('reviews_source_link')}
                <ArrowUpRight className="size-3 rtl-flip" aria-hidden="true" />
              </a>
            </p>
          </div>
        </section>

        {/* ── DE BELOFTE ── de docent is de belofte; ONA staat er eerlijk bij. */}
        <section aria-labelledby="hb-promise" className="g-sec">
          <div className="g-wrap g-hb-promise">
            <Field variant="nevel" className="g-hb-portrait">
              <img src="/images/amber-van-der-zalm.webp" alt={tHome('teacher_name')} width={480} height={600} decoding="async" />
              <div className="g-hb-portrait-who g-glass g-glass-strong">
                <b>{tHome('teacher_name')}</b>
                <small>{tHome('teacher_experience')}</small>
              </div>
            </Field>
            <div className="g-hb-promise-t">
              <h2 id="hb-promise" className="g-hb-h2 g-hb-h2-lg g-hb-h2-start">{t('promise_h2')}</h2>
              <p>{t('promise_p1')}</p>
              <p>{t('promise_p2')}</p>
              <p>{t('promise_p3')}</p>
              <Link href="/docent" className="g-tlink">
                {t('promise_link')}
                <ArrowRight className="rtl-flip" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── VRAGEN ── dezelfde zes vragen als de huidige homepage. */}
        <section id="vragen" aria-labelledby="hb-faq" className="g-sec">
          <div className="g-wrap grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-14 items-start">
            <div>
              <h2 id="hb-faq" className="g-hb-h2 g-hb-h2-start">{t('faq_h2')}</h2>
              <p className="g-body mt-4">
                {t('faq_price', { module: euro(MODULE_PRICE_CENTS), bundle: euro(BUNDLE_PRICE_CENTS) })}
              </p>
            </div>
            <FaqList items={faqs} />
          </div>
        </section>

        {/* ── AFSLUITER ── één oranje knop op de pagina, op een veld zonder oranje gloed. */}
        <section aria-labelledby="hb-cta" className="g-wrap g-hb-cta-wrap">
          <Field variant="gracht" className="g-hb-cta">
            <h2 id="hb-cta">{t('cta_h2')}</h2>
            <p>{t('cta_text')}</p>
            <a href={localeHref(locale, 'oefenen')} className={glasButton({ variant: 'oranje', size: 'lg' })}>
              {t('hero_cta')}
              <ArrowRight className="rtl-flip" aria-hidden="true" />
            </a>
          </Field>
        </section>
      </div>
    </>
  );
}

/* De drie panelen tonen elk één klein element uit het platform, nagebouwd en Nederlands zoals het
   platform zelf (net als de telefoon in de hero) — geen volledige schermafdruk. */
function PanelMock({ n }: { n: 1 | 2 | 3 }) {
  if (n === 1) {
    const days = [
      { d: 'ma', s: 'done' },
      { d: 'di', s: 'done' },
      { d: 'wo', s: 'rest' },
      { d: 'do', s: 'done' },
      { d: 'vr', s: 'today' },
    ] as const;
    return (
      <div className="g-hb-mock g-glass g-glass-strong" aria-hidden="true" dir="ltr" lang="nl">
        <div className="g-hb-mock-head">
          <b>Hoi Amina</b>
          <span className="g-hb-mock-mono">examen over 23 dagen</span>
        </div>
        <ul className="g-hb-days">
          {days.map(x => (
            <li key={x.d} data-s={x.s}>
              <span>{x.s === 'done' && <Check />}</span>
              {x.d}
            </li>
          ))}
        </ul>
        <div className="g-hb-mock-row">
          <CategoryMark category="lezen" size={40} />
          <span className="g-hb-mock-txt"><b>Lezen A2 · 45 min</b>Morgen ga je verder bij vraag 14.</span>
        </div>
      </div>
    );
  }
  if (n === 2) {
    const wave = [8, 16, 12, 24, 14, 30, 18, 26, 12, 32, 20, 14, 26, 18, 10, 22, 28, 14, 20, 12, 24, 16, 10, 18, 12, 8];
    return (
      <div className="g-hb-mock g-glass g-glass-strong" aria-hidden="true" dir="ltr" lang="nl">
        <div className="g-hb-mock-head">
          <b className="g-hb-mock-ic"><CategoryMark category="luisteren" size={28} bare />Luisteren · vraag 4</b>
          <span className="g-hb-mock-chip g-tnum">38:12</span>
        </div>
        <span className="g-hb-mock-wave">
          {wave.map((h, i) => <i key={i} style={{ height: h }} data-on={i < 11 || undefined} />)}
        </span>
        <p className="g-hb-mock-foot"><Lock />Wat er gezegd wordt, lees je na je antwoord.</p>
      </div>
    );
  }
  return (
    <div className="g-hb-mock g-glass g-glass-strong" aria-hidden="true" dir="ltr" lang="nl">
      <div className="g-hb-mock-head">
        <b className="g-hb-mock-ic"><CategoryMark category="taalregels" size={28} bare />omdat, als en toen</b>
        <span className="g-hb-mock-mono">les · 10 min</span>
      </div>
      <p className="g-hb-mock-sent">Ik blijf thuis, <mark>omdat</mark> ik ziek <u>ben</u>.</p>
      <div className="g-hb-mock-row g-hb-mock-row-plain">
        <span className="g-hb-mock-play"><Play /></span>
        <span className="g-hb-mock-txt"><b>Ingesproken uitleg</b>Het werkwoord gaat naar het eind.</span>
        <span className="g-hb-mock-mono g-tnum">1:48</span>
      </div>
    </div>
  );
}
