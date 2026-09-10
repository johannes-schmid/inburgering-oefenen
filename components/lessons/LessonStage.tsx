'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { splitUitleg, type LessonItem } from './item-helpers';
import LessonVisual, { type VisualLabels } from './LessonVisual';
import { useNarrationCue } from './NarrationScope';
import type { LessonVisual as VisualSpec } from '@/data/lesson-visuals';

export type StageLabels = {
  ruleKick: string;
  demoKick: string;
  prev: string;
  next: string;
  /** "Naar {what}" — het onderdeel bij zijn eigen naam, uit de cue-namen. */
  goto: string;
  visual: VisualLabels;
};

/**
 * De uitleg ín de speler, en hij verspringt met de stem mee.
 *
 * ── WAT DIT VERVANGT, EN WAAROM ──────────────────────────────────────────────
 * De uitleg stond als statisch blok ónder de speler: het plaatje, de regel, de voorbeelden en
 * de vormkaarten allemaal open onder elkaar, en de opname lichtte op afstand aan wat ze op dat
 * moment besprak. Dat werkte alleen als je precies het juiste stuk in beeld had. Nu is het
 * omgekeerd: de speler toont het onderdeel waar de stem het over heeft, en niets anders.
 *
 * ── DE CUES ZIJN DE DIA'S, EN DAT IS GEEN TOEVAL ─────────────────────────────
 * `lesson_narration` heeft al markers per onderdeel (`vis-1 … vis-n`, `rule`, `demo-0…`,
 * `card-0…`) — zie de kop van `LessonNarration`. Die markers zijn hier de dia-indeling: één dia
 * per element dat de stem kan aanwijzen, in dezelfde volgorde. Er wordt dus geen tweede
 * ordening verzonnen die met de opname uit de bocht kan lopen.
 *
 * Het plaatje is één dia met eigen stappen: `LessonVisual` leest de cue zelf en loopt op
 * `vis-1 … vis-n` door zijn stappen (zie `useNarrationCue` in `NarrationScope`), dus die
 * stappen zijn hier geen aparte dia's.
 *
 * ── ZONDER GELUID WERKT HET OOK ──────────────────────────────────────────────
 * Pijlen en stipjes eronder. Wie leest in plaats van luistert bladert zelf, en wie de opname
 * pauzeert houdt de dia die in beeld staat — de dia volgt de stem alleen als de stem iets
 * nieuws aanwijst.
 */
export default function LessonStage({
  items, visual, cueNames, labels,
}: {
  items: LessonItem[];
  visual: VisualSpec | null;
  /** Per cue-id de naam van dat onderdeel — dezelfde map die de speler gebruikt. */
  cueNames: Record<string, string>;
  labels: StageLabels;
}) {
  const { lead, demos } = useMemo(() => splitUitleg(items), [items]);

  /** De dia's, in de volgorde waarin de opname ze aanwijst. */
  const slides = useMemo(() => {
    const out: { key: string; cues: string[]; node: React.ReactNode }[] = [];

    if (visual) {
      out.push({
        key: 'visual',
        /* Alle stapcues van het plaatje wijzen naar deze ene dia; het plaatje regelt zijn
           eigen stap. */
        /* `vis` is de naam van het plaatje zelf en `vis-1 … vis-n` zijn zijn stappen — zie
           `narrationCueNames`. Twaalf is ruim boven het grootste plaatje; een cue die er niet
           is kost hier niets. */
        cues: ['vis', ...Array.from({ length: 12 }, (_, i) => `vis-${i + 1}`)],
        node: <LessonVisual spec={visual} labels={labels.visual} />,
      });
    }

    if (lead) {
      out.push({
        key: 'rule',
        cues: ['rule'],
        node: (
          <div className="stg-rule">
            <span className="rp-kick">{labels.ruleKick}</span>
            <div dangerouslySetInnerHTML={{ __html: lead.payload.body_html }} />
          </div>
        ),
      });

      demos.forEach((d, i) => {
        out.push({
          key: `demo-${i}`,
          cues: [`demo-${i}`],
          node: (
            <div className="stg-demo">
              <span className="dp-kick">{labels.demoKick}</span>
              <p className="dp-sent" dangerouslySetInnerHTML={{ __html: d.payload.sentence_html }} />
              {d.payload.note && (
                <p className="dp-note">
                  <ArrowRight size={13} strokeWidth={2.4} className="rtl-flip" />
                  {d.payload.note}
                </p>
              )}
            </div>
          ),
        });
      });

      lead.payload.cards.forEach((c, i) => {
        out.push({
          key: `card-${i}`,
          cues: [`card-${i}`],
          node: (
            <div className="stg-card">
              <span className="fc-label">{c.label}</span>
              <p className="fc-body" dangerouslySetInnerHTML={{ __html: c.example_html }} />
            </div>
          ),
        });
      });
    }

    return out;
  }, [visual, lead, demos, labels]);

  const [at, setAt] = useState(0);
  const { id: cueId } = useNarrationCue();

  /* De stem stuurt de dia, maar alleen als hij iets aanwijst dat een dia ís: de cue
     `exercises` hoort bij de opgaven onderaan en mag deze dia niet omgooien. */
  useEffect(() => {
    if (!cueId) return;
    const idx = slides.findIndex(s => s.cues.includes(cueId));
    if (idx >= 0) setAt(idx);
  }, [cueId, slides]);

  if (slides.length === 0) return null;
  const shown = Math.min(at, slides.length - 1);

  return (
    <div className="stage">
      {/* Het blok houdt één maat, en de dia past zich aan (verzoek van de eigenaar, 08-09):
          een plaatje van vijf rijen werd eerst afgeknipt en een vormkaart van drie regels liet
          een gat achter. `Fit` schaalt de dia naar de doos in plaats van de doos naar de dia,
          dus het blok springt nooit van hoogte terwijl je luistert. */}
      <Fit key={slides[shown].key}>{slides[shown].node}</Fit>

      <div className="stg-nav">
        <button
          type="button" aria-label={labels.prev}
          disabled={shown === 0} onClick={() => setAt(n => Math.max(0, n - 1))}
        >
          <ArrowLeft size={15} strokeWidth={2.6} className="rtl-flip" aria-hidden />
        </button>

        <ol className="stg-dots">
          {slides.map((s, i) => {
            const name = cueNames[s.cues[0]] ?? cueNames[s.key];
            return (
              <li key={s.key}>
                <button
                  type="button"
                  className={i === shown ? 'is-at' : ''}
                  aria-current={i === shown ? 'true' : undefined}
                  aria-label={name ? labels.goto.replace('{what}', name) : `${i + 1}`}
                  onClick={() => setAt(i)}
                />
              </li>
            );
          })}
        </ol>

        {/* De naam van de dia die in beeld staat — dezelfde namen die de speler in zijn
            "nu:"-regel gebruikt, dus de twee zeggen nooit iets anders. */}
        <span className="stg-name">
          {cueNames[slides[shown].cues[0]] ?? cueNames[slides[shown].key] ?? ''}
        </span>

        <button
          type="button" aria-label={labels.next}
          disabled={shown >= slides.length - 1}
          onClick={() => setAt(n => Math.min(slides.length - 1, n + 1))}
        >
          <ArrowRight size={15} strokeWidth={2.6} className="rtl-flip" aria-hidden />
        </button>
      </div>
    </div>
  );
}


/**
 * Eén dia in een doos van vaste hoogte: te groot wordt hij geschaald, te klein blijft hij staan.
 *
 * Alleen verkleinen, nooit vergroten — een vormkaart van drie regels uitgerekt tot 22rem leest
 * als een defect. En schalen met `transform` en niet met een `font-size`-truc: dat is de enige
 * vorm die de verhoudingen van het lesplaatje heel laat (de vakjes, de nummers, de streepjes),
 * en het is de eigenschap die dit systeem voor beweging toestaat.
 */
function Fit({ children }: { children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const measure = useCallback(() => {
    const b = box.current;
    const i = inner.current;
    if (!b || !i) return;
    /* `offsetHeight` is de ongeschaalde maat: een transform verandert de layout niet. Dus dit
       blijft kloppen ook als er al een schaal op staat. */
    const need = i.offsetHeight;
    const have = b.clientHeight;
    setScale(need > 0 && have > 0 ? Math.min(1, have / need) : 1);
  }, []);

  useLayoutEffect(() => {
    measure();
    const i = inner.current;
    if (!i || typeof ResizeObserver === 'undefined') return;
    /* De dia kan zelf van hoogte veranderen: het lesplaatje klapt een noot open zodra de stem
       bij die stap is. Zonder observer bleef de schaal dan op de oude maat staan. */
    const ro = new ResizeObserver(measure);
    ro.observe(i);
    if (box.current) ro.observe(box.current);
    return () => ro.disconnect();
  }, [measure]);

  return (
    <div className="stg-fit" ref={box}>
      <div className="stg-fit-in" ref={inner} style={{ transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}
