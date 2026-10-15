/**
 * `/platform` — what the site *does*, on one page.
 *
 * It exists because the header stopped being a set of mega-panels (owner's decision, 2026-08-22):
 * four plain links, and the page behind each one does the work the dropdown was doing. That trade
 * is only safe if this page carries the links the panel carried — the onderdelen, the free taster,
 * the tools and the money page — because a header dropdown is a *site-wide* internal link on every
 * page and this page is not. So the rule for anything added to the platform later: it is listed
 * here, or it has no route in from the chrome at all.
 *
 * Opbouw (15-10, naar de featurepagina van settly): een donkere kop met het portaal als beeld, dan
 * een zijbalk met ankers naast zes secties van featurekaarten. Elke kaart is een nagebouwd scherm
 * (`FeatureMocks.tsx`) — het product is het beeld (G1.1) — met eronder wat het doet en bij welke
 * onderdelen het hoort. De docentsectie is de ene donkere band, zoals "AI drafts. A person checks."
 *
 * **The catalogue and the roadmap are stated separately.** B1 Luisteren has no content and is
 * rendered as a non-link; ONA is live but not yet reviewed, so it never sits under the review claim.
 *
 * No prices. `/premium` is the only page with `Offer` nodes and the only place a figure is read
 * from `lib/pricing.ts` — a stale price keeps showing in the SERP after the page is corrected.
 */
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  ArrowRight, Check, Clock, ClipboardCheck, Headphones, MessageSquareText, Gauge, PenLine, Mic,
  Route, Layers, Puzzle, AudioLines, Repeat, LayoutDashboard, CalendarClock, Sparkles,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { absUrl, alternatesFor, breadcrumbs, PROVIDER_REF, ogImageFor } from '@/lib/schema';
import { WEBSITE_ID, langTag } from '@/lib/site';
import JsonLd from '@/components/JsonLd';
import CategoryMark, { type Category } from '@/components/horizon/CategoryMark';
import ExamMark from '@/components/horizon/ExamMark';
import Field from '@/components/glas/Field';
import ValidationSeal from '@/components/glas/ValidationSeal';
import { glasButton } from '@/components/glas/Button';
import Crumbs from '../_components/glas/Crumbs';
import FaqList from '../_components/glas/FaqList';
import { DEFAULT_LEVEL, KNM, LEVELS, skillsAtLevel, type Level } from '@/data/skills';
import { localeHref } from '@/i18n/paths';
import { isOnaAvailable, isOnaReviewed } from '@/lib/ona/access';
import PlatformNav from './PlatformNav';
import {
  HeroMock, ExamMock, ListenMock, ExplainMock, ResultMock, WriteMock, SpeakMock, RouteMock,
  WordMock, RuleMock, NarrationMock, RepeatMock, DashMock, TimelineMock, FreeMock,
} from './FeatureMocks';

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

type Feature = {
  key: string;
  icon: typeof Check;
  visual: ReactNode;
  wide?: boolean;
  /** Breed blok met het beeld links in plaats van rechts. */
  flip?: boolean;
  /** Het veld achter het beeld. Afwisselend, zodat twee buren niet hetzelfde ogen. */
  field: 'gracht' | 'nevel' | 'licht';
  href?: string;
};

function FeatureCard({ f, t }: { f: Feature; t: (k: string) => string }) {
  const Icon = f.icon;
  return (
    <li className="g-pf2-card" data-wide={f.wide || undefined} data-flip={f.flip || undefined}>
      <Field variant={f.field} className="g-pf2-vis">{f.visual}</Field>
      <div className="g-pf2-txt">
        <span className="g-pf2-ico"><Icon aria-hidden="true" /></span>
        <h3>{t(`f_${f.key}_title`)}</h3>
        <p>{t(`f_${f.key}_body`)}</p>
        <div className="g-pf2-foot">
          <span className="g-pf2-tags">{t(`f_${f.key}_tags`)}</span>
          {f.href && (
            <a href={f.href} className="g-pf2-more">
              {t(`f_${f.key}_link`)}
              <ArrowRight aria-hidden="true" className="rtl-flip" />
            </a>
          )}
        </div>
      </div>
    </li>
  );
}

function Section({ id, title, muted, sub, children, className = '' }: { id: string; title: string; muted: string; sub: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className={`g-pf2-sec ${className}`}>
      <h2 id={`${id}-h`} className="g-pf2-h2">
        {title} <span>{muted}</span>
      </h2>
      <p className="g-pf2-sub">{sub}</p>
      {children}
    </section>
  );
}

export default async function PlatformPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'platform' });
  const tSkills = await getTranslations({ locale, namespace: 'skills' });
  const tB = await getTranslations({ locale, namespace: 'breadcrumbs' });

  const skills = skillsAtLevel(DEFAULT_LEVEL);
  const onaLive = isOnaAvailable();
  const onaReviewed = isOnaReviewed();
  const exam = (level: Level, slug: string) => localeHref(locale, `oefenexamen/${level}/${slug}`);

  const SECTIONS: { id: string; features: Feature[] }[] = [
    {
      id: 'examens',
      features: [
        { key: 'exam', icon: ClipboardCheck, wide: true, field: 'gracht', visual: <ExamMock />, href: localeHref(locale, 'taalexamens') },
        { key: 'listen', icon: Headphones, field: 'nevel', visual: <ListenMock />, href: exam('a2', 'luisteren') },
        { key: 'explain', icon: MessageSquareText, field: 'licht', visual: <ExplainMock /> },
        { key: 'result', icon: Gauge, wide: true, flip: true, field: 'nevel', visual: <ResultMock /> },
      ],
    },
    {
      id: 'feedback',
      features: [
        { key: 'write', icon: PenLine, wide: true, field: 'gracht', visual: <WriteMock />, href: exam('a2', 'schrijven') },
        { key: 'speak', icon: Mic, wide: true, flip: true, field: 'nevel', visual: <SpeakMock />, href: exam('a2', 'spreken') },
      ],
    },
    {
      id: 'lessen',
      features: [
        { key: 'route', icon: Route, wide: true, field: 'gracht', visual: <RouteMock /> },
        { key: 'words', icon: Layers, field: 'nevel', visual: <WordMock /> },
        { key: 'rules', icon: Puzzle, field: 'licht', visual: <RuleMock /> },
        { key: 'narration', icon: AudioLines, field: 'licht', visual: <NarrationMock /> },
        { key: 'repeat', icon: Repeat, field: 'nevel', visual: <RepeatMock /> },
      ],
    },
  ];

  const PLAN: Feature[] = [
    { key: 'dash', icon: LayoutDashboard, wide: true, field: 'gracht', visual: <DashMock />, href: localeHref(locale, 'dashboard') },
    { key: 'tijdlijn', icon: CalendarClock, field: 'nevel', visual: <TimelineMock />, href: localeHref(locale, 'inburgering/tools/tijdlijn') },
    { key: 'free', icon: Sparkles, field: 'licht', visual: <FreeMock />, href: localeHref(locale, 'oefenen') },
  ];

  const NAV = [
    { id: 'examens', label: t('nav_examens') },
    { id: 'feedback', label: t('nav_feedback') },
    { id: 'lessen', label: t('nav_lessen') },
    { id: 'docent', label: t('nav_docent') },
    { id: 'traject', label: t('nav_traject') },
    { id: 'plannen', label: t('nav_plannen') },
    { id: 'vragen', label: t('nav_vragen') },
  ];

  const FAQ_KEYS = ['free', 'same', 'who', 'score', 'phone', 'cancel'] as const;
  const faqLinks: Partial<Record<(typeof FAQ_KEYS)[number], { href: string; label: string }>> = {
    free: { href: localeHref(locale, 'premium'), label: t('faq_free_link') },
    who: { href: localeHref(locale, 'docent'), label: t('faq_who_link') },
  };

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
          itemListElement: skills.map((skill, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: tSkills(`${skill.key}.name`),
            url: absUrl(locale, `oefenexamen/${DEFAULT_LEVEL}/${skill.slug}`),
          })),
        },
      },
      {
        '@type': 'FAQPage',
        '@id': `${absUrl(locale, 'platform')}#faq`,
        mainEntity: FAQ_KEYS.map(k => ({
          '@type': 'Question',
          name: t(`faq_${k}_q`),
          acceptedAnswer: { '@type': 'Answer', text: t(`faq_${k}_a`) },
        })),
      },
      breadcrumbs(locale, tB('home'), [{ name: t('breadcrumb'), path: 'platform' }]),
    ],
  };

  return (
    <main>
      <JsonLd data={jsonLd} />

      {/* ── DE KOP ── een donkere kaart onder de nav, zoals de referentie; Nacht draagt de ene
          gloed van deze view, dus de knoppen zijn wit en glas, niet oranje. */}
      <div className="g-pf2-top">
        <Field as="header" variant="nacht" className="g-pf2-hero">
          <div className="g-pf2-hero-copy">
            <Crumbs items={[{ label: tB('home'), href: '/' }, { label: t('breadcrumb') }]} className="g-pf2-crumbs" />
            <h1>{t('heading')}</h1>
            <p className="g-pf2-lede">{t('lede')}</p>
            <ul className="g-pf2-pillars">
              {(['exams', 'lessons'] as const).map(p => (
                <li key={p}>
                  <span className="g-pf2-pillar-ico">{p === 'exams' ? <ClipboardCheck aria-hidden="true" /> : <Route aria-hidden="true" />}</span>
                  <span>
                    <b>{t(`hero_${p}_title`)}</b>
                    <small>{t(`hero_${p}_sub`)}</small>
                  </span>
                </li>
              ))}
            </ul>
            <div className="g-pf2-ctas">
              <Link href="/oefenen" className={glasButton({ variant: 'wit', size: 'lg' })}>
                {t('cta_primary')}
                <ArrowRight className="rtl-flip" aria-hidden="true" />
              </Link>
              <Link href="/premium" className={glasButton({ variant: 'glasd', size: 'lg' })}>
                {t('cta_secondary')}
              </Link>
            </div>
          </div>
          <HeroMock />
        </Field>
      </div>

      <div className="g-wrap g-pf2-body">
        <aside className="g-pf2-aside">
          <div className="g-pf2-aside-in">
            <PlatformNav items={NAV} label={t('nav_label')} />
            <div className="g-pf2-try">
              <Image src="/images/amber-van-der-zalm-264.webp" alt="" width={40} height={40} className="g-pf2-try-img" />
              <p>{t('try_body')}</p>
              <Link href="/oefenen" className="g-pf2-more">
                {t('try_cta')}
                <ArrowRight aria-hidden="true" className="rtl-flip" />
              </Link>
            </div>
          </div>
        </aside>

        <div className="g-pf2-main">
          {SECTIONS.map(s => (
            <Section key={s.id} id={s.id} title={t(`s_${s.id}_title`)} muted={t(`s_${s.id}_muted`)} sub={t(`s_${s.id}_sub`)}>
              <ul className="g-pf2-grid">
                {s.features.map(f => <FeatureCard key={f.key} f={f} t={t} />)}
              </ul>
            </Section>
          ))}

          {/* ── De docent ── de ene donkere band. Wat hier staat is de volgorde uit CLAUDE.md §2 en
              mag niet omgedraaid worden: AI stelt op, de docent controleert en beslist. ONA staat
              live vóór haar review, dus zolang dat zo is zegt deze band dat erbij. */}
          <section id="docent" aria-labelledby="docent-h" className="g-pf2-sec">
            <Field variant="nacht-stil" className="g-pf2-dark">
              <h2 id="docent-h" className="g-pf2-h2">
                {t('s_docent_title')} <span>{t('s_docent_muted')}</span>
              </h2>
              <p className="g-pf2-sub">
                {t('s_docent_sub')}
                {!onaReviewed && onaLive && <> {t('s_docent_ona')}</>}
              </p>
              <div className="g-pf2-dark-grid">
                <ol className="g-pf2-steps g-glass-d">
                  {(['1', '2', '3'] as const).map((n, i) => (
                    <li key={n} data-last={i === 2 || undefined}>
                      <span className="g-pf2-step-n">{i === 2 ? <Check aria-hidden="true" /> : n}</span>
                      <span>
                        <b>{t(`docent_step${n}`)}</b>
                        <small>{t(`docent_step${n}_sub`)}</small>
                      </span>
                    </li>
                  ))}
                </ol>
                <div className="g-pf2-amber g-glass-d">
                  <Image src="/images/amber-van-der-zalm.webp" alt={t('docent_photo_alt')} width={88} height={88} loading="eager" className="g-pf2-amber-img" />
                  <div>
                    <b>Amber van der Zalm</b>
                    <small>{t('docent_role')}</small>
                  </div>
                  <ValidationSeal glass sub={t('docent_seal_sub')} className="g-pf2-seal">{t('docent_seal')}</ValidationSeal>
                  <p>{t('docent_score_note')}</p>
                  <div className="g-pf2-dark-links">
                    <Link href="/docent" className="g-pf2-more">{t('docent_link_about')}<ArrowRight aria-hidden="true" className="rtl-flip" /></Link>
                    <Link href="/redactie" className="g-pf2-more">{t('docent_link_how')}<ArrowRight aria-hidden="true" className="rtl-flip" /></Link>
                  </div>
                </div>
              </div>
            </Field>
          </section>

          {/* ── Het traject ── de catalogus, en de route in naar elk onderdeel vanaf de chrome. Een
              onderdeel zonder inhoud (B1 Luisteren, `itemCount === null`) is geen link. */}
          <Section id="traject" title={t('s_traject_title')} muted={t('s_traject_muted')} sub={t('s_traject_sub')}>
            <ul className="g-pf2-tracks">
              {LEVELS.map(level => (
                <li key={level} className="g-pf2-track">
                  <div className="g-pf2-track-head">
                    <ExamMark track={level} size={56} />
                    <div>
                      <h3>{t(`track_${level}`)}</h3>
                      <p>{t(`track_${level}_sub`)}</p>
                    </div>
                  </div>
                  <ul className="g-pf2-parts">
                    {skillsAtLevel(level).map(skill => {
                      const name = tSkills(`${skill.key}.name`);
                      return (
                        <li key={skill.slug}>
                          {skill.itemCount !== null ? (
                            <a href={exam(level, skill.slug)}>
                              <CategoryMark category={skill.slug as Category} size={32} />
                              <span>{name}</span>
                              <ArrowRight aria-hidden="true" className="rtl-flip" />
                            </a>
                          ) : (
                            <span data-soon>
                              <CategoryMark category={skill.slug as Category} size={32} />
                              <span className="g-pf2-soon-t">
                                {name}
                                <small><Clock aria-hidden="true" />{t('badge_soon')}</small>
                              </span>
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}

              <li className="g-pf2-track">
                <div className="g-pf2-track-head">
                  <ExamMark track="knm" size={56} />
                  <div>
                    <h3>{t('track_knm')}</h3>
                    <p>{t('track_knm_sub', { exams: KNM.examCount })}</p>
                  </div>
                </div>
                <Link href="/oefenexamen/knm" className="g-pf2-more g-pf2-track-link">
                  {t('track_knm_link')}
                  <ArrowRight aria-hidden="true" className="rtl-flip" />
                </Link>
              </li>

              <li className="g-pf2-track">
                <div className="g-pf2-track-head">
                  <ExamMark track="ona" size={56} muted={!onaLive} />
                  <div>
                    <h3>
                      {t('track_ona')}
                      {onaLive && !onaReviewed && <span className="g-bdg g-bdg-grijs">{t('badge_review')}</span>}
                      {!onaLive && <span className="g-bdg g-bdg-grijs"><Clock aria-hidden="true" />{t('badge_soon')}</span>}
                    </h3>
                    <p>{t('track_ona_sub')}</p>
                  </div>
                </div>
                {onaLive && (
                  <Link href="/dashboard/ona" className="g-pf2-more g-pf2-track-link">
                    {t('track_ona_link')}
                    <ArrowRight aria-hidden="true" className="rtl-flip" />
                  </Link>
                )}
              </li>
            </ul>
          </Section>

          <Section id="plannen" title={t('s_plannen_title')} muted={t('s_plannen_muted')} sub={t('s_plannen_sub')}>
            <ul className="g-pf2-grid">
              {PLAN.map(f => <FeatureCard key={f.key} f={f} t={t} />)}
            </ul>
          </Section>

          <section id="vragen" aria-labelledby="vragen-h" className="g-pf2-sec">
            <h2 id="vragen-h" className="g-pf2-h2">{t('faq_title')}</h2>
            <FaqList
              className="mt-8"
              items={FAQ_KEYS.map(k => ({ question: t(`faq_${k}_q`), answer: t(`faq_${k}_a`), link: faqLinks[k] }))}
            />
          </section>
        </div>
      </div>

      {/* ── De afsluiter (glas.html §13) ── Nevel met de ene oranje knop van deze pagina. */}
      <div className="g-closing">
        <Field as="section" variant="nevel" aria-labelledby="pf-closing-heading" className="g-block g-cta-band">
          <h2 id="pf-closing-heading">{t('cta_title')}</h2>
          <p>{t('cta_desc')}</p>
          <Link href="/oefenen" className={glasButton({ variant: 'oranje', size: 'lg', className: 'mt-2' })}>
            {t('cta_primary')}
            <ArrowRight className="rtl-flip" aria-hidden="true" />
          </Link>
        </Field>
      </div>
    </main>
  );
}
