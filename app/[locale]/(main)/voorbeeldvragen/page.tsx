import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, BadgeCheck, Check, CreditCard, ExternalLink } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { localeHref } from '@/i18n/paths';
import { SKILLS, getFormat } from '@/data/skills';
import { getFreePractice, optionKeys, optionText } from '@/data/free-practice';
import JsonLd from '@/components/JsonLd';
import Field from '@/components/glas/Field';
import { glasButton } from '@/components/glas/Button';
import CategoryMark from '@/components/horizon/CategoryMark';
import { absUrl, alternatesFor, ogImageFor } from '@/lib/schema';
import FaqList from '../_components/glas/FaqList';
import { SPREKEN_ITEM } from '../_components/glas/demo-items';
import ExampleQuestion, { type ExampleItem } from './ExampleQuestion';

/* Landingspagina "voorbeeldvragen" — richting A (besluit eigenaar, 13-11), gepland voor week 48 in
 * `scripts/seo-agent/pages.mjs`. Voor wie zoekt hoe de vragen van het inburgeringsexamen eruitzien:
 * de pagina laat ze zien én laat ze maken, zonder account. Alle opgaven bestaan al en zijn al
 * nagekeken (de gratis proef en oefenexamen 1); er staat hier geen tweede versie van.
 *
 * Bewust anders dan /herexamen: geen tabbladen met één proef, maar per onderdeel een eigen vraag
 * onder elkaar, en andere opgaven (lz-4 en lu-4, niet lz-2 en lu-1). Van Schrijven en Spreken staat
 * alleen de opdracht hier, **nooit het modelantwoord** (CLAUDE.md §6, invariant 9: dat is een
 * nakijksleutel).
 *
 * **`noindex` tot Amber de tekst heeft nagekeken** (CLAUDE.md §2). Dan `REVIEWED` op true, de pagina
 * in `app/sitemap.ts` en de status in `seo-agent/landing-pages.json` op `live`. */
const REVIEWED = true;

const DUO_OEFENEN = 'https://www.inburgeren.nl/examen-doen/oefenen.jsp';

function mcq(skill: 'lezen' | 'luisteren', id: string): ExampleItem {
  const it = getFreePractice(skill)!.items.find(i => i.id === id)!;
  return {
    intro: it.stimulusIntro.split('\n')[0],
    stimulusHtml: it.stimulusHtml,
    audioSrc: it.audioSrc,
    script: it.stimulusScript,
    question: it.question,
    options: optionKeys(it).map(k => ({ key: k, text: optionText(it, k) })),
    correct: it.correct,
    explanation: it.explanation,
  };
}

/** Schrijven A2, oefenexamen 1, opdracht 1 — de opdracht uit `scripts/a2-content/schrijven.mjs`, zonder modelantwoord. */
const SCHRIJVEN = {
  prompt: 'U wilt beginnen met een cursus Nederlands. U heeft een folder van taalschool Centrum gekregen. U stuurt een e-mail naar de school.',
  points: [
    'Schrijf waarom u de cursus wilt doen',
    'Schrijf op welke dagen u kunt komen',
    'Bedenk zelf nog een vraag over de cursus',
  ],
};

type Props = { params: Promise<{ locale: string }> };

export async function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'voorbeeldvragen' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    robots: { index: REVIEWED && locale === 'nl', follow: true },
    alternates: alternatesFor(locale, 'voorbeeldvragen', ['nl']),
    openGraph: {
      images: ogImageFor(locale),
      title: t('meta_title'),
      description: t('meta_description'),
      type: 'website',
      url: absUrl(locale, 'voorbeeldvragen'),
      siteName: 'Inburgering Oefenen',
    },
  };
}

export default async function VoorbeeldvragenPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'voorbeeldvragen' });
  const tHome = await getTranslations({ locale, namespace: 'home' });
  const tSkills = await getTranslations({ locale, namespace: 'skills' });
  const skillName = (slug: string) => tSkills(`${slug}.name`);
  const startHref = (skill: string) => localeHref(locale, `oefenexamen/a2/${skill}/1`);

  const lezen = mcq('lezen', 'lz-4');
  const luisteren = { ...mcq('luisteren', 'lu-4'), speakers: { A: 'Juf', B: 'Hassan' } };

  const faqs = [1, 2, 3].map(n => ({ question: t(`faq_q${n}`), answer: t(`faq_a${n}`) }));
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${absUrl(locale, 'voorbeeldvragen')}#faq`,
    mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
  };

  const StartLink = ({ skill }: { skill: string }) => (
    <a href={startHref(skill)} className="g-tlink g-vv-start">
      {t('start', { skill: skillName(skill) })}
      <ArrowRight className="rtl-flip" aria-hidden="true" />
    </a>
  );

  return (
    <>
      <JsonLd data={jsonLd} />
      <div className="g-home g-hb g-rx g-vv">
        {/* ── HERO + LEZEN ── de eerste vraag staat er meteen, om te maken. */}
        <Field as="section" variant="hero" veil className="g-rx-hero" aria-labelledby="vv-h1">
          <div className="g-wrap g-rx-hero-grid">
            <div className="g-rx-head">
              <h1 id="vv-h1" className="g-rx-h1">
                {t('h1')} <span>{t('h1_muted')}</span>
              </h1>
              <p className="g-hb-lead">{t('lead')}</p>
              <a href="#examens" className={`${glasButton({ variant: 'oranje', size: 'lg' })} g-rx-cta`}>
                {t('cta_button')}
                <ArrowRight className="rtl-flip" aria-hidden="true" />
              </a>
              <ul className="g-rx-chips">
                <li className="is-goed"><Check aria-hidden="true" />{t('chip_noaccount')}</li>
                <li><BadgeCheck aria-hidden="true" />{t('chip_docent')}</li>
                <li><CreditCard aria-hidden="true" />{t('chip_nopay')}</li>
              </ul>
            </div>
            <Field variant="gracht" className="g-hb-stage g-rx-stage g-vv-stage">
              <p className="g-vv-label"><CategoryMark category="lezen" size={28} />{t('label', { skill: skillName('lezen') })}</p>
              <ExampleQuestion item={lezen} />
              <StartLink skill="lezen" />
            </Field>
          </div>
        </Field>

        {/* ── LUISTEREN ── het echte fragment; het transcript komt pas na een goed antwoord. */}
        <section aria-labelledby="vv-lu" className="g-sec g-rx-sec g-sec-tier">
          <div className="g-wrap">
            <h2 id="vv-lu" className="g-hb-h2 g-hb-h2-start">{t('lu_h2')} <span>{t('lu_muted')}</span></h2>
            <div className="g-vv-card">
              <p className="g-vv-label"><CategoryMark category="luisteren" size={28} />{t('label', { skill: skillName('luisteren') })}</p>
              <ExampleQuestion item={luisteren} />
              <StartLink skill="luisteren" />
            </div>
          </div>
        </section>

        {/* ── SCHRIJVEN EN SPREKEN ── alleen de opdracht; het antwoord geef je in het oefenexamen. */}
        <section aria-labelledby="vv-open" className="g-sec g-rx-sec">
          <div className="g-wrap">
            <h2 id="vv-open" className="g-hb-h2 g-hb-h2-start">{t('open_h2')} <span>{t('open_muted')}</span></h2>
            <div className="g-vv-open">
              <article className="g-vv-task">
                <p className="g-vv-label"><CategoryMark category="schrijven" size={28} />{t('label', { skill: skillName('schrijven') })}</p>
                <div dir="ltr" lang="nl">
                  <p className="g-vv-prompt">{SCHRIJVEN.prompt}</p>
                  <ul className="g-vv-points">
                    {SCHRIJVEN.points.map(p => <li key={p}>{p}</li>)}
                  </ul>
                </div>
                <p className="g-vv-note">{t('schrijven_note')}</p>
                <StartLink skill="schrijven" />
              </article>
              <article className="g-vv-task">
                <p className="g-vv-label"><CategoryMark category="spreken" size={28} />{t('label', { skill: skillName('spreken') })}</p>
                <div dir="ltr" lang="nl">
                  <p className="g-vv-prompt">{SPREKEN_ITEM.prompt}</p>
                  <blockquote className="g-vv-says"><b>{SPREKEN_ITEM.speaker}</b>{SPREKEN_ITEM.says}</blockquote>
                </div>
                <p className="g-vv-note">{t('spreken_note', { seconds: SPREKEN_ITEM.limit })}</p>
                <StartLink skill="spreken" />
              </article>
            </div>
          </div>
        </section>

        {/* ── HET ECHTE EXAMEN ── aantallen en tijden uit data/skills.ts; DUO-aanbod uit SEO/facts.md §8. */}
        <section id="examens" aria-labelledby="vv-ex" className="g-sec g-rx-sec g-sec-tier g-rx-anchor">
          <div className="g-wrap">
            <h2 id="vv-ex" className="g-hb-h2 g-hb-h2-start">{t('exam_h2')} <span>{t('exam_muted')}</span></h2>
            <p className="g-hb-lead g-rx-sub">{t('exam_lead')}</p>
            <ul className="g-vv-table">
              {SKILLS.map(skill => {
                const f = getFormat('a2', skill.slug);
                return (
                  <li key={skill.slug}>
                    <a href={startHref(skill.slug)} className="g-vv-row">
                      <CategoryMark category={skill.slug} size={36} />
                      <b>{skillName(skill.key)}</b>
                      <span className="g-vv-meta g-tnum">
                        <span>{t('exam_items', { n: f.itemCount ?? 0 })}</span>
                        <span>{f.durationMinutes} min</span>
                      </span>
                      <span className="g-vv-row-go">{t('exam_start')}<ArrowRight className="rtl-flip" aria-hidden="true" /></span>
                    </a>
                  </li>
                );
              })}
            </ul>
            <p className="g-vv-duo">
              {t('exam_duo')}{' '}
              <a href={DUO_OEFENEN} target="_blank" rel="noopener noreferrer" className="g-rx-src">
                {t('source')}<ExternalLink aria-hidden="true" />
              </a>
            </p>
          </div>
        </section>

        {/* ── DE DOCENT ── */}
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
        <section aria-labelledby="vv-faq" className="g-sec g-rx-sec g-sec-tier">
          <div className="g-wrap grid items-start gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-14">
            <h2 id="vv-faq" className="g-hb-h2 g-hb-h2-start">{t('faq_h2')}</h2>
            <FaqList items={faqs} />
          </div>
        </section>

        {/* ── AFSLUITER ── */}
        <section aria-labelledby="vv-cta" className="g-wrap g-hb-cta-wrap">
          <Field variant="gracht" className="g-hb-cta">
            <h2 id="vv-cta">{t('cta_h2')}</h2>
            <p>{t('cta_text')}</p>
            <a href="#examens" className={glasButton({ variant: 'oranje', size: 'lg' })}>
              {t('cta_button')}
              <ArrowRight className="rtl-flip" aria-hidden="true" />
            </a>
          </Field>
        </section>
      </div>
    </>
  );
}
