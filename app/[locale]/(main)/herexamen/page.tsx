import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, BadgeCheck, Check, CreditCard, ExternalLink } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { localeHref } from '@/i18n/paths';
import { SKILLS, getFormat, type Level } from '@/data/skills';
import JsonLd from '@/components/JsonLd';
import Field from '@/components/glas/Field';
import { glasButton } from '@/components/glas/Button';
import CategoryMark from '@/components/horizon/CategoryMark';
import ExamMark from '@/components/horizon/ExamMark';
import { absUrl, alternatesFor, ogImageFor } from '@/lib/schema';
import FaqList from '../_components/glas/FaqList';
import HomeDemo, { type TabId } from '../_components/glas/HomeDemo';
import { SPREKEN_ITEM, demoFormats, lezenDemo, luisterenDemo } from '../_components/glas/demo-items';

/* Landingspagina "herexamen" — richting A (besluit eigenaar, 13-11): de pagina opent met een echte,
 * al nagekeken opgave per onderdeel en één knop "Start gratis" naar oefenexamen 1 in het platform,
 * waar het gratis account gevraagd wordt. Geen prijzen van ons. De voorstellen en hun status staan in
 * `seo-agent/landing-pages.json`.
 *
 * **`noindex` tot Amber de tekst heeft nagekeken** (CLAUDE.md §2: niets publiceert zonder haar). Zet
 * dan `REVIEWED` op true, zet de pagina in `app/sitemap.ts` en de status in landing-pages.json op
 * `live`. Elk DUO-feit hieronder komt uit SEO/facts.md §4, §5, §11 en §14, met de bron als link;
 * "alleen het gezakte onderdeel opnieuw" is géén letterlijke DUO-zin (facts §10), dus de pagina
 * beschrijft het per examen. */
const REVIEWED = true;

/**
 * De talen die Google mag indexeren. Nederlands is door Amber nagekeken (16-11); Engels is op
 * 23-11-2026 opengezet op besluit van de eigenaar, die de Engelse tekst zelf heeft gelezen — de
 * opgaven op de pagina blijven Nederlands. Arabisch blijft `noindex` tot iemand die het vloeiend
 * leest de tekst heeft gecontroleerd. `app/sitemap.ts` hanteert dezelfde lijst: zet een taal op
 * beide plekken tegelijk aan, anders adverteert de sitemap een URL die zichzelf noindex noemt.
 */
const INDEXED_LOCALES = ['nl', 'en'];

const DUO_BETALEN = 'https://www.inburgeren.nl/inburgeren-betalen/index.jsp';
const DUO_VERLENGING = 'https://www.inburgeren.nl/nieuwsberichten/artikel.jsp?cid=tcm:94-243309-16';

/** Het demo-tabblad per onderdeel en het niveau van de opgave erin (Schrijven is de B1-brief). */
const DEMO: { tab: TabId; level: Level }[] = [
  { tab: 'lezen', level: 'a2' },
  { tab: 'luisteren', level: 'a2' },
  { tab: 'schrijven', level: 'b1' },
  { tab: 'spreken', level: 'a2' },
];

type Props = { params: Promise<{ locale: string }> };

export async function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'herexamen' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    robots: { index: REVIEWED && INDEXED_LOCALES.includes(locale), follow: true },
    alternates: alternatesFor(locale, 'herexamen', INDEXED_LOCALES),
    openGraph: {
      images: ogImageFor(locale),
      title: t('meta_title'),
      description: t('meta_description'),
      type: 'website',
      url: absUrl(locale, 'herexamen'),
      siteName: 'Inburgering Oefenen',
    },
  };
}

export default async function HerexamenPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'herexamen' });
  const tHome = await getTranslations({ locale, namespace: 'home' });
  const tSkills = await getTranslations({ locale, namespace: 'skills' });
  const skillName = (slug: string) => tSkills(`${slug}.name`);

  const start = Object.fromEntries(DEMO.map(({ tab, level }) => [tab, {
    href: localeHref(locale, `oefenexamen/${level}/${tab}/1`),
    label: t('start', { skill: skillName(tab), level: level.toUpperCase() }),
  }]));

  const facts = [
    { n: 1, href: DUO_BETALEN },
    { n: 2, href: DUO_BETALEN },
    { n: 3, href: DUO_BETALEN },
    { n: 4, href: DUO_BETALEN },
    { n: 5, href: DUO_VERLENGING },
  ];
  const faqs = [1, 2, 3].map(n => ({ question: t(`faq_q${n}`), answer: t(`faq_a${n}`) }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${absUrl(locale, 'herexamen')}#faq`,
    mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <div className="g-home g-hb g-rx">
        {/* ── HERO + DE PROEF ── de pagina opent met iets om te doen, niet met uitleg. */}
        <Field as="section" variant="hero" veil className="g-rx-hero" aria-labelledby="rx-h1">
          <div className="g-wrap g-rx-hero-grid">
            <div className="g-rx-head">
              <h1 id="rx-h1" className="g-rx-h1">
                {t('h1')} <span>{t('h1_muted')}</span>
              </h1>
              <p className="g-hb-lead">{t('lead')}</p>
              <a href="#kies" className={`${glasButton({ variant: 'oranje', size: 'lg' })} g-rx-cta`}>
                {t('hero_cta')}
                <ArrowRight className="rtl-flip" aria-hidden="true" />
              </a>
              <ul className="g-rx-chips">
                <li className="is-goed"><Check aria-hidden="true" />{t('chip_free')}</li>
                <li><BadgeCheck aria-hidden="true" />{t('chip_docent')}</li>
                <li><CreditCard aria-hidden="true" />{t('chip_nopay')}</li>
              </ul>
            </div>
            <Field variant="gracht" className="g-hb-stage g-rx-stage" id="proef">
              <HomeDemo
                only={DEMO.map(d => d.tab)}
                start={start}
                luisteren={luisterenDemo()}
                lezen={lezenDemo()}
                spreken={SPREKEN_ITEM}
                formats={demoFormats()}
              />
            </Field>
          </div>
        </Field>

        {/* ── KIES JE EXAMEN ── oefenexamen 1 per onderdeel en niveau; elk is gratis met een account. */}
        <section id="kies" aria-labelledby="rx-pick" className="g-sec g-rx-sec g-rx-anchor">
          <div className="g-wrap">
            <h2 id="rx-pick" className="g-hb-h2 g-hb-h2-start">{t('pick_h2')} <span>{t('pick_muted')}</span></h2>
            <p className="g-hb-lead g-rx-sub">{t('pick_lead')}</p>
            <div className="g-rx-levels">
              {(['a2', 'b1'] as const).map(level => (
                <div key={level} className="g-rx-level">
                  <p className="g-rx-level-name"><ExamMark track={level} size={32} />{t('pick_level', { level: level.toUpperCase() })}</p>
                  <ul className="g-rx-grid">
                    {SKILLS.map(skill => (
                      <li key={skill.slug}>
                        <a href={localeHref(locale, `oefenexamen/${level}/${skill.slug}/1`)} className="g-rx-exam">
                          <CategoryMark category={skill.slug} size={40} />
                          <span className="g-rx-exam-t">
                            <span className="g-rx-exam-top"><b>{skillName(skill.key)}</b><span className="g-rx-free">{t('pick_free')}</span></span>
                            <small>{t('pick_exam')} · {getFormat(level, skill.slug).durationMinutes} min</small>
                          </span>
                          <ArrowRight className="g-rx-go rtl-flip" aria-hidden="true" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WAT DUO ZEGT ── alleen wat in SEO/facts.md staat, met de bron erbij. */}
        <section aria-labelledby="rx-facts" className="g-sec g-rx-sec g-sec-tier">
          <div className="g-wrap">
            <h2 id="rx-facts" className="g-hb-h2 g-hb-h2-start">{t('facts_h2')} <span>{t('facts_muted')}</span></h2>
            <ol className="g-rx-facts">
              {facts.map(f => (
                <li key={f.n}>
                  <b>{t(`fact${f.n}_title`)}</b>
                  <p>{t(`fact${f.n}_text`)}</p>
                  <a href={f.href} target="_blank" rel="noopener noreferrer" className="g-rx-src">
                    {t('source')}<ExternalLink aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── DE DOCENT ── één keer, zonder woorden die ze niet zelf schreef. */}
        <section aria-label={tHome('teacher_name')} className="g-sec g-rx-sec">
          <div className="g-wrap g-rx-docent">
            <img src="/images/amber-van-der-zalm.webp" alt={tHome('teacher_name')} width={120} height={150} decoding="async" />
            <div>
              <b>{tHome('teacher_name')}</b>
              <small>{tHome('teacher_experience')}</small>
              <p>{t('docent_text')}</p>
              <a href={localeHref(locale, 'docent')} className="g-tlink">
                {t('docent_link')}
                <ArrowRight className="rtl-flip" aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        {/* ── VRAGEN ── */}
        <section aria-labelledby="rx-faq" className="g-sec g-rx-sec g-sec-tier">
          <div className="g-wrap grid items-start gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-14">
            <h2 id="rx-faq" className="g-hb-h2 g-hb-h2-start">{t('faq_h2')}</h2>
            <FaqList items={faqs} />
          </div>
        </section>

        {/* ── AFSLUITER ── terug naar de proef: één oranje knop. */}
        <section aria-labelledby="rx-cta" className="g-wrap g-hb-cta-wrap">
          <Field variant="gracht" className="g-hb-cta">
            <h2 id="rx-cta">{t('cta_h2')}</h2>
            <p>{t('cta_text')}</p>
            <a href="#proef" className={glasButton({ variant: 'oranje', size: 'lg' })}>
              {t('cta_button')}
              <ArrowRight className="rtl-flip" aria-hidden="true" />
            </a>
          </Field>
        </section>
      </div>
    </>
  );
}
