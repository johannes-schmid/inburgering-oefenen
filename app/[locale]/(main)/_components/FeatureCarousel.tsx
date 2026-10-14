'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ArrowRight, Check } from 'lucide-react';
import { CategoryMark, type Category } from '@/components/horizon';
import Field from '@/components/glas/Field';
import SectionHeading from '@/components/glas/SectionHeading';
import { glasButton } from '@/components/glas/Button';

/**
 * De draaiende vitrine: vijf **echte** schermen uit het portaal, met een tabrij als bediening.
 * Gedeeld door de homepage en `/platform`.
 *
 * **De plaatjes zijn schermafdrukken, geen nagebouwde kaartjes** — een nagebouwd scherm veroudert
 * zodra het echte verandert en niemand merkt het. Ze staan in `public/images/platform/`, gemaakt met
 * puppeteer tegen de lokale stack. **Alleen oppervlakken met échte inhoud**: nooit een afdruk van een
 * demo-fixture ("Demovraag 1"). Vervangen is één regel per dia (`shot`).
 *
 * Glas (glas.html §04/§13): de afdruk ligt op een veld (Gracht), de uitlegkaart is glas óp dat veld
 * — glas alleen waar iets op iets anders ligt. Geen oranje knop: deze sectie heeft geen wijzer nodig,
 * de afdruk is het beeld.
 *
 * **De carrousel stopt bij hover, bij focus, na een klik en bij `prefers-reduced-motion`.** Een
 * blok dat doorschuift terwijl iemand erin leest is een toegankelijkheidsfout. De overgang en de
 * voortgangsbalk animeren met `transform` en `opacity`.
 */

type Slide = {
  key: string;
  category: Category;
  /** De schermafdruk. 1600×1000, uit `public/images/platform/`. */
  shot: string;
  card: { points: string[]; href: string };
};

const SLIDES: Slide[] = [
  { key: 'examen',       category: 'knm',       shot: '/images/platform/knm.jpg',          card: { points: ['examen_p1', 'examen_p2', 'examen_p3'], href: '/nl/oefenexamen/knm/1' } },
  { key: 'luisteren',    category: 'luisteren', shot: '/images/platform/luisteren.jpg',    card: { points: ['luisteren_p1', 'luisteren_p2', 'luisteren_p3'], href: '/nl/oefenexamen/b1/lezen' } },
  { key: 'lessen',       category: 'lezen',     shot: '/images/platform/les.jpg',          card: { points: ['lessen_p1', 'lessen_p2', 'lessen_p3'], href: '/nl/platform' } },
  { key: 'woordkaarten', category: 'woorden',   shot: '/images/platform/woordkaarten.jpg', card: { points: ['woordkaarten_p1', 'woordkaarten_p2', 'woordkaarten_p3'], href: '/nl/knm' } },
  { key: 'portaal',      category: 'gidsen',    shot: '/images/platform/dashboard.jpg',    card: { points: ['portaal_p1', 'portaal_p2', 'portaal_p3'], href: '/nl/platform' } },
];

const INTERVAL_MS = 7000;

export default function FeatureCarousel() {
  const t = useTranslations('home');
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  /* Ná een klik stopt het doorschuiven definitief: doorgaan neemt de bediening terug af. */
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
  /* Pijltjestoetsen tussen de tabs, zonder animatie (G6: toetsenbordacties animeren nooit). */
  const onKey = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const rtl = document.documentElement.dir === 'rtl';
    setActive(a => {
      const next = (a + (rtl ? -dir : dir) + SLIDES.length) % SLIDES.length;
      document.getElementById(`vitrine-tab-${SLIDES[next].key}`)?.focus();
      return next;
    });
    setTook(true);
  }, []);
  const running = !paused && !took;
  const slide = SLIDES[active];

  return (
    <section
      aria-labelledby="vitrine-heading"
      className="g-sec"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="g-wrap">
        <SectionHeading id="vitrine-heading" title={t('vitrine_heading')} size="section" />
        {/* De ondertitel wisselt mee met de tab: de kop noemt het platform, deze regel het scherm. */}
        <p key={`sub-${slide.key}`} className="g-lead mt-4 min-h-[3.5rem]" style={{ animation: 'vitrine-in 280ms cubic-bezier(0.23,1,0.32,1) both' }}>
          {t(`vitrine_${slide.key}_sub`)}
        </p>

        {/* Horizontaal scrollbaar op smal scherm: vijf pillen passen niet op 390px. */}
        <div
          role="tablist"
          aria-label={t('vitrine_heading')}
          onKeyDown={onKey}
          className="g-chips mt-6 flex-nowrap overflow-x-auto -mx-4 px-4 pb-1 sm:mx-0 sm:px-0 sm:flex-wrap"
        >
          {SLIDES.map((s, i) => {
            const on = i === active;
            return (
              <button
                key={s.key}
                role="tab"
                type="button"
                aria-selected={on}
                tabIndex={on ? 0 : -1}
                aria-controls="vitrine-panel"
                id={`vitrine-tab-${s.key}`}
                onClick={() => pick(i)}
                className="g-chip g-chip-wit relative shrink-0 overflow-hidden"
              >
                <CategoryMark category={s.category} size={28} />
                {t(`vitrine_${s.key}_tab`)}
                {on && running && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-[3px] origin-left rtl:origin-right"
                    style={{ background: 'var(--oranje)', animation: `vitrine-fill ${INTERVAL_MS}ms linear forwards` }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div role="tabpanel" id="vitrine-panel" aria-labelledby={`vitrine-tab-${slide.key}`} className="mt-6">
          <Field variant="gracht" className="rounded-g-xl p-3 sm:p-6 lg:p-10">
            <div className="relative lg:pb-16">
              <figure
                key={slide.key}
                className="relative m-0 rounded-g-lg overflow-hidden shadow-zweef bg-wit lg:w-[86%] lg:ms-auto"
                style={{ animation: 'vitrine-in 320ms cubic-bezier(0.23,1,0.32,1) both' }}
              >
                <Image
                  src={slide.shot}
                  alt={t(`vitrine_${slide.key}_alt`)}
                  width={1600}
                  height={1000}
                  sizes="(max-width: 1024px) 100vw, 960px"
                  className="w-full h-auto block"
                />
              </figure>

              {/* De uitlegkaart: glas óp het veld. Op `lg` hangt hij over de onderrand van de afdruk;
                  daaronder valt hij gewoon onder de afdruk. */}
              <div
                key={`card-${slide.key}`}
                className="g-glass g-glass-strong mt-3 p-5 sm:p-6 lg:mt-0 lg:absolute lg:start-0 lg:bottom-0 lg:w-[380px]"
                style={{ animation: 'vitrine-in 380ms cubic-bezier(0.23,1,0.32,1) both' }}
              >
                <CategoryMark category={slide.category} size={40} />
                <h3 className="g-head g-head-3 mt-4">{t(`vitrine_${slide.key}_title`)}</h3>
                <ul className="list-none p-0 m-0 mt-3 flex flex-col gap-2.5">
                  {slide.card.points.map(p => (
                    <li key={p} className="flex items-start gap-2.5 text-[0.9375rem] leading-snug text-ink">
                      <Check className="size-4 mt-0.5 shrink-0 text-goed" aria-hidden="true" />
                      {t(`vitrine_${p}`)}
                    </li>
                  ))}
                </ul>
                <a href={slide.card.href} className={glasButton({ variant: 'navy', size: 'sm', className: 'mt-5' })}>
                  {t(`vitrine_${slide.key}_cta`)}
                  <ArrowRight className="rtl-flip" aria-hidden="true" />
                </a>
              </div>
            </div>
          </Field>
        </div>
      </div>
    </section>
  );
}
