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
import { ArrowRight, ArrowLeft, ArrowUp, Check, X, BadgeCheck, CalendarClock, MessagesSquare, TrendingUp, Clock } from 'lucide-react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { absUrl, alternatesFor, breadcrumbs, PROVIDER_REF, ogImageFor } from '@/lib/schema';
import { WEBSITE_ID, langTag } from '@/lib/site';
import JsonLd from '@/components/JsonLd';
import CategoryMark, { type Category } from '@/components/horizon/CategoryMark';
import ExamMark from '@/components/horizon/ExamMark';
import Field from '@/components/glas/Field';
import PageField from '@/components/glas/PageField';
import SectionHeading from '@/components/glas/SectionHeading';
import { glasButton } from '@/components/glas/Button';
import { DEFAULT_LEVEL, KNM, formatCount, skillsAtLevel } from '@/data/skills';
import { localeHref } from '@/i18n/paths';
import { isOnaAvailable } from '@/lib/ona/access';

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
  /* ONA volgt `isOnaAvailable()`; live linkt hij naar het portaal, waar een gast kan kijken. */
  ...(isOnaAvailable()
    ? [{ key: 'ona', live: true, href: '/dashboard/ona' } as const]
    : [{ key: 'ona', live: false } as const]),
] as const;

const BENEFITS = [
  { key: 'docent', icon: BadgeCheck },
  { key: 'uitleg', icon: MessagesSquare },
  { key: 'rubric', icon: TrendingUp },
  { key: 'plan', icon: CalendarClock },
] as const;

/* ── De satellietkaart in de kop ──
   Een groot productpaneel in het midden, met aan weerszijden kleine kaarten die elk één onderdeel
   benoemen en er met een pijl naartoe wijzen: de vier onderdelen zitten alle vier ín het portaal.
   Glas (glas.html §04): de kaarten liggen óp het veld van de kop, dus ze zijn glas — 86% wit, want
   er staat tekst op (regel 06). De chips komen uit `data/skills.ts`, zodat de kop nooit iets
   anders kan beweren dan de kaarten verderop. Het merk is de `CategoryMark` op een lichte tegel. */
function OnderdeelCard({
  category, name, chips, side,
}: {
  category: Category;
  name: string;
  chips: string[];
  /** Aan welke kant van het midden de kaart staat — bepaalt waar de pijl hangt en welke kant op. */
  side: 'left' | 'right' | 'below';
}) {
  const Arrow = side === 'left' ? ArrowRight : side === 'right' ? ArrowLeft : ArrowUp;
  return (
    <li className={`g-pf-sat g-pf-sat-${side} g-glass g-glass-strong list-none`}>
      <div className="flex items-center gap-2.5">
        <CategoryMark category={category} size={36} />
        <span className="g-head text-[0.9375rem] font-bold leading-tight">{name}</span>
      </div>
      <ul className="g-pf-chips">
        {chips.map(chip => <li key={chip}>{chip}</li>)}
      </ul>
      {/* De pijl hangt in de kolomgoot en bestaat alleen op `lg`: daaronder staan de kaarten ónder
          het paneel en wijst "naar binnen" nergens naar. */}
      <span aria-hidden="true" className="g-pf-sat-arrow">
        <Arrow className={side === 'below' ? '' : 'rtl-flip'} strokeWidth={2.5} />
      </span>
    </li>
  );
}

/* ── De uitleglaag ──
   Zes blokken die vertellen wat het platform dóet (glas.html §08 "Uitleg-blok"): links de tekst,
   rechts het beeld op een veld, en op `lg` schuift elk blok bij het scrollen óver het vorige heen.
   **Het schuiven is `position: sticky` en geen scrollscript** — geen listener, geen observer, en
   de reduced-motion-uitweg is één regel (dan staan de blokken gewoon onder elkaar). Elk blok is
   dekkend wit: een blok dat er doorheen laat kijken laat het blok eronder meelezen. */
function FlowBlock({
  index, label, title, body, chips, visual, shot,
}: {
  index: number;
  label: string;
  title: string;
  body: string;
  chips: string[];
  visual: ReactNode;
  /** Een schermafdruk vult het vak tot de rand; een paneeltje ligt op het veld. */
  shot?: boolean;
}) {
  return (
    <li className="g-pf-flowblock" style={{ top: `calc(var(--nav-h) + 1.5rem + ${index * 0.5}rem)` }}>
      <div className="g-pf-flowtext">
        <span className="g-mono">{label}</span>
        <h3>{title}</h3>
        <p>{body}</p>
        <ul className="g-metachips list-none p-0 m-0 mt-5">
          {chips.map(chip => (
            <li key={chip} className="g-metachip bg-mist">
              <Check aria-hidden="true" className="!text-goed" />
              {chip}
            </li>
          ))}
        </ul>
      </div>
      {shot ? (
        <div className="g-pf-flowvis bg-mist-2">{visual}</div>
      ) : (
        <Field variant="nevel" className="g-pf-flowvis">{visual}</Field>
      )}
    </li>
  );
}

/** Een schermafdruk die het vak vult. */
function FlowShot({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="g-pf-flowshot">
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

  /* De twee kanten van de compositie in de kop: links wat je binnenkrijgt (`mcq`), rechts wat je
     zelf produceert (`rubric`). Afgeleid uit de taxonomie, zodat een vijfde taalonderdeel niet
     stil aan één kant verdwijnt. */
  const receptief = skills.filter(s => s.scoring === 'mcq');
  const productief = skills.filter(s => s.scoring !== 'mcq');

  /* De zes blokken van de uitleglaag. De sleutel is ook de sleutelprefix in `messages/*.json`. */
  const FLOW: { key: string; visual: ReactNode; shot?: boolean }[] = [
    { key: 'examen', shot: true, visual: <FlowShot src="/images/platform/luisteren.jpg" alt={t('flow_examen_alt')} /> },
    {
      key: 'beoordeling',
      /* Geen verzonnen criteria: die schrijft de docent per categorie in `rubrics.criteria`. Wat
         hier staat is de vórm — vier ankers, 0 tot 3 — en die ligt wél vast. */
      visual: (
        <div className="g-glass g-glass-strong w-full max-w-[20rem] p-5">
          <span className="g-mono">{t('flow_rubric_label')}</span>
          <ul className="list-none p-0 m-0 mt-3 flex flex-col gap-2">
            {[0, 1, 2, 3].map(score => (
              <li key={score} className="flex items-center gap-3">
                <span
                  className={`size-7 shrink-0 rounded-g-xs flex items-center justify-center g-head text-[0.8125rem] font-bold ${score === 2 ? 'bg-navy !text-white' : 'bg-mist text-ink-2'}`}
                >
                  {score}
                </span>
                <span className={`h-2 rounded-full ${score === 2 ? 'bg-navy' : 'bg-mist-2'}`} style={{ width: `${40 + score * 18}%` }} />
              </li>
            ))}
          </ul>
          <p className="text-[0.75rem] leading-relaxed text-ink-2 m-0 mt-4">{t('flow_rubric_note')}</p>
        </div>
      ),
    },
    { key: 'woorden', shot: true, visual: <FlowShot src="/images/platform/woordkaarten.jpg" alt={t('flow_woorden_alt')} /> },
    {
      key: 'route',
      /* De drie kaarten van de leerroute (§3): woorden → de taalregels die dít examen vraagt →
         het examen. Er komt hier geen vierde kaart bij. */
      visual: (
        <ol className="w-full max-w-[20rem] list-none p-0 m-0 flex flex-col gap-2.5">
          {(['words', 'rules', 'exam'] as const).map((step, i) => (
            <li key={step} className="g-glass g-glass-strong rounded-g-md px-4 py-3 flex items-center gap-3">
              <span className="size-7 shrink-0 rounded-full flex items-center justify-center g-head text-[0.75rem] font-extrabold bg-navy !text-white">
                {i + 1}
              </span>
              <span className="g-head text-[0.9375rem] font-bold">{t(`flow_route_${step}`)}</span>
            </li>
          ))}
        </ol>
      ),
    },
    { key: 'tips', shot: true, visual: <FlowShot src="/images/platform/les.jpg" alt={t('flow_tips_alt')} /> },
    {
      key: 'fouten',
      /* Eén echte fout uit de lesstof (`want` / `omdat`), niet een verzonnen voorbeeld. Fout is rood
         met een kruis, goed is groen met een vinkje (G3). */
      visual: (
        <div className="g-glass g-glass-strong w-full max-w-[20rem] p-5">
          <span className="g-mono">{t('flow_mistake_label')}</span>
          <p className="flex items-start gap-2 m-0 mt-3 mb-2 rounded-g-sm bg-fout-tint px-3 py-2 text-[0.875rem] leading-relaxed text-[#5e0d0d]">
            <X className="size-4 mt-0.5 shrink-0 text-fout" aria-hidden="true" />
            <span>{t('flow_mistake_wrong')}</span>
          </p>
          <p className="flex items-start gap-2 m-0 rounded-g-sm bg-goed-tint px-3 py-2 text-[0.875rem] leading-relaxed text-goed-ink font-semibold">
            <Check className="size-4 mt-0.5 shrink-0 text-goed" aria-hidden="true" />
            <span>{t('flow_mistake_right')}</span>
          </p>
          <p className="text-[0.75rem] leading-relaxed text-ink-2 m-0 mt-4">{t('flow_mistake_note')}</p>
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
    <>
      <JsonLd data={jsonLd} />

      {/* ── DE KOP — het portaal in het midden, de onderdelen eromheen ──
          Gracht, zonder gloed: de oranje wijzer van deze pagina is de knop in de afsluiter, dus de
          kop gebruikt navy en ghost. De schermafdruk is echt (`public/images/platform/`), geen
          nagebouwd kaartje — zie de kop van `FeatureCarousel.tsx`. */}
      <PageField variant="gracht" className="g-under-nav">
        <div className="max-w-3xl">
          <h1 className="g-head g-head-1">{t('heading')}</h1>
          <p className="g-lead mt-5">{t('lede')}</p>
          <div className="g-ctas">
            <a href={localeHref(locale, `oefenen`)} className={glasButton({ variant: 'navy', size: 'lg' })}>
              {t('cta_primary')}
              <ArrowRight className="rtl-flip" aria-hidden="true" />
            </a>
            <Link href="/premium" className={glasButton({ variant: 'ghost', size: 'lg' })}>
              {t('cta_secondary')}
            </Link>
          </div>
        </div>

        {/* Eén grid: op `lg` drie kolommen (kaarten · paneel · kaarten), daaronder het paneel
            bovenaan en de kaarten in rijen van twee. Geen tweede kopie voor mobiel. */}
        <div className="g-pf-comp">
          <ul className="g-pf-col">
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

          {/* De balk erboven is het label van het scherm zelf, geen nagemaakte browserchrome. */}
          <figure className="g-pf-shot">
            <div className="g-pf-shot-bar">
              <i aria-hidden="true" />
              {t('hero_portal_label')}
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

          <ul className="g-pf-col">
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

        {/* ── Het vijfde onderdeel ── KNM staat buiten de vier taalonderdelen (geen niveau, buiten
            beide bundels), dus onder de rij — maar op dezelfde maat: een grotere kaart zou beweren
            dat KNM het hoofdonderdeel is. */}
        <ul className="mt-4 lg:mt-6 flex justify-center list-none p-0 m-0">
          <OnderdeelCardWrap>
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
          </OnderdeelCardWrap>
        </ul>
      </PageField>

      {/* ── Hoe het werkt ── zes blokken op een stapel, in de volgorde van de voorbereiding zelf.
          **Wat hier over de beoordeling staat is de volgorde uit §2 en mag niet omgedraaid worden**:
          de docent schrijft de rubriek, een model past ze toe, de docent kijkt de beoordelingen na. */}
      <section className="g-sec" aria-labelledby="pf-flow-heading">
        <div className="g-wrap">
          <SectionHeading id="pf-flow-heading" title={t('flow_heading')} aside={t('flow_sub')} className="mb-10" />
          <ol className="g-pf-flow">
            {FLOW.map((block, i) => (
              <FlowBlock
                key={block.key}
                index={i}
                label={`${String(i + 1).padStart(2, '0')} · ${t(`flow_${block.key}_eyebrow`)}`}
                title={t(`flow_${block.key}_title`)}
                body={t(`flow_${block.key}_body`)}
                chips={[t(`flow_${block.key}_chip1`), t(`flow_${block.key}_chip2`)]}
                visual={block.visual}
                shot={block.shot}
              />
            ))}
          </ol>
        </div>
      </section>

      {/* ── De vier onderdelen ── de route in vanaf de chrome: de header linkt ze niet meer. */}
      <section className="g-sec g-sec-tier" aria-labelledby="pf-skills-heading">
        <div className="g-wrap">
          <SectionHeading id="pf-skills-heading" title={t('skills_heading')} aside={t('skills_sub')} className="mb-10" />
          <ul className="g-pf-cards list-none p-0 m-0">
            {skills.map(skill => (
              <li key={skill.slug} className="flex">
                <a href={localeHref(locale, `oefenexamen/${DEFAULT_LEVEL}/${skill.slug}`)} className="g-gids flex-1">
                  <CategoryMark category={skill.slug as Category} size={48} />
                  <h3>{tSkills(`${skill.key}.name`)}</h3>
                  <p>{tSkills(`${skill.key}.tagline`)}</p>
                  <ul className="g-pf-chips !mt-0">
                    <li>{t('label_exams', { count: skill.examCount })}</li>
                    <li>{t('label_items', { count: formatCount(skill.itemCount) })}</li>
                    <li>{t('label_duration', { count: formatCount(skill.durationMinutes) })}</li>
                  </ul>
                  <span className="g-bdg g-bdg-goed self-start"><Check aria-hidden="true" />{t('label_free')}</span>
                  <span className="g-gids-ft">
                    <span className="g-head text-[0.875rem] font-bold">{t('label_cta')}</span>
                    <ArrowRight className="rtl-flip" aria-hidden="true" />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── De catalogus en de roadmap, in één lijst ── een track die nog niet gebouwd is, is een
          `<li>` en geen grijze link: er is niets om naartoe te gaan, en een uitgeschakeld anker
          neemt nog steeds focus en belooft nog steeds een bestemming. */}
      <section className="g-sec" aria-labelledby="pf-tracks-heading">
        <div className="g-wrap">
          <SectionHeading id="pf-tracks-heading" title={t('tracks_heading')} aside={t('tracks_sub')} className="mb-10" />
          <ul className="g-grid2 list-none p-0 m-0">
            {TRACKS.map(track => (
              <li key={track.key} className="flex">
                {'href' in track ? (
                  <Link href={track.href} className="g-gids flex-1 !min-h-0">
                    <div className="flex items-center gap-4">
                      <ExamMark track={track.key} size={56} />
                      <h3>{t(`track_${track.key}`)}</h3>
                    </div>
                    <p>{t(`track_${track.key}_sub`)}</p>
                    <span className="g-gids-ft">
                      <span />
                      <ArrowRight className="rtl-flip" aria-hidden="true" />
                    </span>
                  </Link>
                ) : (
                  <div className="g-pf-soon flex-1 !min-h-0">
                    <div className="flex items-center gap-4">
                      <ExamMark track={track.key} size={56} muted />
                      <h3>{t(`track_${track.key}`)}</h3>
                      <span className="g-bdg g-bdg-grijs"><Clock aria-hidden="true" />{t('badge_soon')}</span>
                    </div>
                    <p>{t(`track_${track.key}_sub`)}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Waarom hier ── de USP, als wat het product dóet en niet als slogan. Het icoon is een
          functioneel lucide-teken in een lichte tegel; een onderdeelmerk hoort hier niet (§7). */}
      <section className="g-sec g-sec-tier" aria-labelledby="pf-why-heading">
        <div className="g-wrap">
          <SectionHeading id="pf-why-heading" title={t('why_heading')} aside={t('why_sub')} className="mb-10" />
          <ul className="g-pf-cards list-none p-0 m-0">
            {BENEFITS.map(b => {
              const Icon = b.icon;
              return (
                <li key={b.key} className="g-pf-why">
                  <span className="g-pf-ico"><Icon aria-hidden="true" /></span>
                  <h3>{t(`why_${b.key}`)}</h3>
                  <p>{t(`why_${b.key}_sub`)}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ── De hulpmiddelen ── `/inburgering/tools/tijdlijn` is live; de twee woordenlijsten zijn
          geregistreerde plaatshouders, dus ze staan er met naam en zonder link. */}
      <section className="g-sec" aria-labelledby="pf-tools-heading">
        <div className="g-wrap">
          <SectionHeading id="pf-tools-heading" title={t('tools_heading')} aside={t('tools_sub')} className="mb-10" />
          <div className="g-grid3">
            <Link href="/inburgering/tools/tijdlijn" className="g-gids">
              <span className="g-pf-ico"><CalendarClock aria-hidden="true" /></span>
              <h3>{t('tool_tijdlijn')}</h3>
              <p>{t('tool_tijdlijn_sub')}</p>
              <span className="g-gids-ft">
                <span className="g-head text-[0.875rem] font-bold">{t('tool_open')}</span>
                <ArrowRight className="rtl-flip" aria-hidden="true" />
              </span>
            </Link>
            {(['woorden', 'grammatica'] as const).map(key => (
              <div key={key} className="g-pf-soon">
                <span className="g-bdg g-bdg-grijs self-start"><Clock aria-hidden="true" />{t('badge_soon')}</span>
                <h3>{t(`tool_${key}`)}</h3>
                <p>{t(`tool_${key}_sub`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
    </>
  );
}

/** De KNM-kaart staat alleen in de kop, op de maat van de andere vier. */
function OnderdeelCardWrap({ children }: { children: ReactNode }) {
  return (
    <li className="w-full sm:max-w-[15rem] list-none">
      <ul className="list-none p-0 m-0">{children}</ul>
    </li>
  );
}
