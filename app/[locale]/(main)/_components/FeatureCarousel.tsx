'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ArrowRight, Check } from 'lucide-react';
import { CategoryMark, DotField, Skyline, type Category } from '@/components/horizon';

/**
 * De draaiende vitrine: vijf **echte** schermen uit het portaal, met de tabrij van clay.com als
 * bediening (eigenaar, 21-09).
 *
 * **De plaatjes zijn schermafdrukken, geen nagebouwde kaartjes.** Dat was de opdracht van 21-09 en
 * het is ook de enige versie die klopt: een nagebouwd scherm veroudert zodra het echte verandert en
 * niemand merkt het. Ze staan in `public/images/platform/` en zijn gemaakt met puppeteer tegen de
 * lokale stack, ingelogd, met de dev-overlays uit het DOM gehaald.
 *
 * **Alleen oppervlakken met échte inhoud.** Op de lokale stack zijn A2 Lezen/Luisteren/Schrijven/
 * Spreken demo-fixtures ("Demovraag 1") — die staan er dus níet in. Wat er wél in staat is echt:
 * de KNM-speler, een B1-luisterfragment, een les uit de leerlaag, de woordkaarten en het portaal.
 * Zet hier nooit een afdruk van een demo-fixture in; dat is een plaatje van iets dat niet bestaat.
 * **Vervangen van een afdruk is één regel per dia** (`shot`), zodra er productie-afdrukken van
 * Schrijven en Spreken zijn.
 *
 * **De carrousel stopt bij hover, bij focus, na een klik en bij `prefers-reduced-motion`.** Een
 * blok dat doorschuift terwijl iemand erin leest is een toegankelijkheidsfout. De overgang en de
 * voortgangsbalk animeren met `transform` en `opacity` — nooit `width`, nooit `transition-all` (§8).
 */

type Slide = {
  key: string;
  category: Category;
  /** De schermafdruk. 1600×1000, uit `public/images/platform/`. */
  shot: string;
  /** De zwevende kaart linksonder: één voordeel plus de weg ernaartoe. */
  card: { points: string[]; href: string };
};

const SLIDES: Slide[] = [
  { key: 'examen',       category: 'knm',       shot: '/images/platform/knm.jpg',          card: { points: ['examen_p1', 'examen_p2', 'examen_p3'], href: '/nl/oefenexamen/knm/1' } },
  { key: 'luisteren',    category: 'luisteren', shot: '/images/platform/luisteren.jpg',    card: { points: ['luisteren_p1', 'luisteren_p2', 'luisteren_p3'], href: '/nl/oefenexamen/b1/lezen' } },
  { key: 'lessen',       category: 'lezen',     shot: '/images/platform/les.jpg',          card: { points: ['lessen_p1', 'lessen_p2', 'lessen_p3'], href: '/nl/platform' } },
  { key: 'woordkaarten', category: 'knm',       shot: '/images/platform/woordkaarten.jpg', card: { points: ['woordkaarten_p1', 'woordkaarten_p2', 'woordkaarten_p3'], href: '/nl/knm' } },
  { key: 'portaal',      category: 'gidsen',    shot: '/images/platform/dashboard.jpg',    card: { points: ['portaal_p1', 'portaal_p2', 'portaal_p3'], href: '/nl/platform' } },
];

const INTERVAL_MS = 7000;

export default function FeatureCarousel() {
  const t = useTranslations('home');
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  /* Ná een klik stopt het doorschuiven definitief: doorgaan neemt de bediening terug af, en dat
     is de klacht die elke carrousel krijgt. */
  const [took, setTook] = useState(false);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    if (paused || took || reduced.current) return;
    const id = setTimeout(() => setActive(a => (a + 1) % SLIDES.length), INTERVAL_MS);
    return () => clearTimeout(id);
  }, [active, paused, took]);

  const pick = useCallback((i: number) => { setActive(i); setTook(true); }, []);
  const running = !paused && !took;
  const slide = SLIDES[active];

  return (
    <section
      aria-labelledby="vitrine-heading"
      className="px-6 pt-16 pb-16 sm:pt-20 lg:pb-36"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="max-w-6xl mx-auto">
        <p className="text-secondary font-semibold text-[0.6875rem] uppercase tracking-widest text-center m-0 mb-3">
          {t('vitrine_eyebrow')}
        </p>
        <h2
          id="vitrine-heading"
          className="font-headline font-extrabold text-primary tracking-tight text-center m-0"
          style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', lineHeight: 1.05, letterSpacing: '-0.03em', textWrap: 'balance' }}
        >
          {t('vitrine_heading')}
        </h2>

        {/* De ondertitel wisselt mee met de tab, zoals bij Clay: de kop noemt het platform, de
            ondertitel het scherm dat je nu ziet. */}
        <p
          key={`sub-${slide.key}`}
          className="text-center text-on-surface-variant max-w-xl mx-auto mt-4 mb-8 leading-relaxed min-h-[3.5rem]"
          style={{ animation: 'vitrine-in 320ms cubic-bezier(0.22,1,0.36,1) both' }}
        >
          {t(`vitrine_${slide.key}_sub`)}
        </p>

        {/* De tabrij. Horizontaal scrollbaar op smal scherm: vijf pillen passen niet op 390px, en
            afbreken maakt er twee rijen van die als twee groepen lezen. */}
        <div
          role="tablist"
          aria-label={t('vitrine_heading')}
          className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 sm:mx-0 sm:px-0 sm:justify-center sm:flex-wrap"
        >
          {SLIDES.map((s, i) => {
            const on = i === active;
            return (
              <button
                key={s.key}
                role="tab"
                type="button"
                aria-selected={on}
                aria-controls="vitrine-panel"
                id={`vitrine-tab-${s.key}`}
                onClick={() => pick(i)}
                className="relative shrink-0 overflow-hidden rounded-full px-5 py-2.5 text-[0.9375rem] font-semibold cursor-pointer whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                style={on
                  ? { background: 'var(--color-primary)', color: '#ffffff' }
                  : { background: 'var(--color-surface-container-low)', color: 'var(--color-on-surface-variant)' }}
              >
                {t(`vitrine_${s.key}_tab`)}
                {on && running && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 bottom-0 h-[3px] w-full origin-left"
                    style={{ background: 'var(--color-secondary-container)', animation: `vitrine-fill ${INTERVAL_MS}ms linear forwards` }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id="vitrine-panel"
          aria-labelledby={`vitrine-tab-${slide.key}`}
          className="relative mt-14 sm:mt-20 lg:mt-24 lg:mb-28"
        >
          {/* ── Het podium ──────────────────────────────────────────────────────────────
              Clay zet zijn schermafdruk niet op de pagina maar op een toneeltje: een gekleurd
              vlak, twee gekleurde kaarten die er links en rechts achter vandaan piepen, en wat
              decor. Dat is wat een screenshot van een documentatieplaatje een productplaatje
              maakt, en het is precies wat hier ontbrak.

              Het decor is de eigen grafische taal en niets anders (§8, geen illustraties): het
              puntenraster, de zonneschijf, de straat en twee rechthoeken. Vier CSS-primitieven,
              geen tekening.

              **Eén zonneschijf, en hij zit half achter de afdruk.** Halfverstopt is hij een
              lichtbron; helemaal in beeld is hij een bal in de lucht — dat is precies waarom hij
              vanochtend uit de hero moest. De oranje knop op de zwevende kaart is het tweede
              oranje in deze sectie en daarmee is het op.

              De hele laag is `aria-hidden` en `pointer-events-none`: het is decor, en het mag
              nooit voor de knop op de kaart komen te liggen. */}
          <div
            aria-hidden="true"
            className="absolute -inset-x-4 sm:-inset-x-8 lg:-inset-x-14 -top-6 sm:-top-10 -bottom-10 lg:-bottom-24 rounded-[32px] sm:rounded-[44px] overflow-hidden pointer-events-none"
            style={{ background: 'var(--color-surface-container-low)' }}
          >
            <DotField on="dark" size={26} />
            {/* Hier heeft een `SunDisc` gestaan en hij is er twee keer uit gehaald. Bovenaan
                sneed het podium hem af tot een oranje steen; onderaan werd hij een oranje vlek
                tussen de huizen. Een schijf heeft ruimte nodig én iets dat hem afdekt, en op een
                licht paneel met een schermafdruk erop is die ruimte er niet. Het oranje van deze
                sectie is de knop op de zwevende kaart, en daarmee is het op (§8). */}
            {/* De straat sluit het podium af, zoals hij elke kop op deze site afsluit. Twee
                tellingen achter één breekpunt (§7.1). */}
            <div className="sm:hidden absolute left-0 right-0 bottom-0">
              <Skyline count={6} tone="light" height={70} />
            </div>
            <div className="hidden sm:block absolute left-0 right-0 bottom-0">
              <Skyline count={13} tone="light" height={104} />
            </div>
          </div>

          {/* De twee kaarten die achter de afdruk vandaan piepen — Clay's gekleurde randen. Ze
              suggereren een stapel schermen zonder er een te tekenen. Onder `lg` weg: daar is er
              geen ruimte naast de afdruk en worden het twee strepen. */}
          <div aria-hidden="true" className="hidden lg:block absolute -left-12 top-12 bottom-24 w-32 rounded-[28px] pointer-events-none" style={{ background: 'var(--color-primary-container)' }} />
          <div aria-hidden="true" className="hidden lg:block absolute -right-12 top-28 bottom-10 w-32 rounded-[28px] pointer-events-none" style={{ background: 'var(--color-primary-container)' }} />

          <figure
            key={slide.key}
            className="relative m-0 rounded-[20px] overflow-hidden"
            style={{
              boxShadow: '0 40px 80px -32px rgba(0,8,27,0.38), 0 8px 24px -12px rgba(0,8,27,0.16)',
              animation: 'vitrine-in 420ms cubic-bezier(0.22,1,0.36,1) both',
            }}
          >
            <Image
              src={slide.shot}
              alt={t(`vitrine_${slide.key}_alt`)}
              width={1600}
              height={1000}
              sizes="(max-width: 1024px) 100vw, 960px"
              className="w-full h-auto block"
              priority={false}
            />
          </figure>

          {/* De zwevende kaart. Op `lg` hangt hij over de onderrand van de afdruk heen — dat is
              wat de compositie diepte geeft; daaronder valt hij gewoon onder de afdruk. */}
          <div
            key={`card-${slide.key}`}
            className="mt-5 lg:mt-0 lg:absolute lg:-left-8 lg:-bottom-14 lg:w-[360px] rounded-2xl p-6"
            style={{
              background: 'var(--color-surface-container-lowest)',
              boxShadow: '0 24px 56px -24px rgba(0,8,27,0.30), var(--shadow-ambient)',
              animation: 'vitrine-in 500ms cubic-bezier(0.22,1,0.36,1) both',
            }}
          >
            <CategoryMark category={slide.category} size={40} className="mb-4" />
            <h3
              className="font-headline font-extrabold text-primary m-0 mb-4 text-[1.125rem] leading-snug"
              style={{ letterSpacing: '-0.02em' }}
            >
              {t(`vitrine_${slide.key}_title`)}
            </h3>
            <ul className="list-none p-0 m-0 mb-5 flex flex-col gap-2.5">
              {slide.card.points.map(p => (
                <li key={p} className="flex items-start gap-2.5 text-[0.9375rem] leading-snug text-on-surface">
                  <Check className="size-4 mt-0.5 shrink-0" style={{ color: '#a24000' }} />
                  {t(`vitrine_${p}`)}
                </li>
              ))}
            </ul>
            <a
              href={slide.card.href}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold no-underline font-headline bg-secondary-container text-on-secondary-container button-inner-glow"
            >
              {t(`vitrine_${slide.key}_cta`)}
              <ArrowRight className="size-4 rtl-flip" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
