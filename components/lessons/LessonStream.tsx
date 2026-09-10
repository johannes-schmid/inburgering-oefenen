'use client';

import { createContext, Fragment, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { playCorrectChime } from '@/lib/answer-chime';
import WordPass from '@/components/exam/WordPass';
import { ArrowLeft, ArrowRight, Lightbulb, Check, X, RotateCcw, Eye } from 'lucide-react';
import {
  GAP, isExerciseKind, matchesTyped, normaliseTyped, tierChipOf,
  type LessonItem, type Tier,
} from './item-helpers';
import { useNarrated } from './NarrationScope';
import { useLessonProgress } from './LessonProgressScope';
import LessonVisual, { type VisualLabels } from './LessonVisual';
import LessonRecorder, { type RecorderLabels } from './LessonRecorder';
import type { LessonVisual as VisualSpec } from '@/data/lesson-visuals';

/**
 * De lesstroom: uitleg boven, opgaven eronder, op één pagina.
 *
 * ── ÉÉN PAGINA, TWEE SECTIES (gewijzigd 02-09) ───────────────────────────────
 * Dit bestand rangschikte `lesson_items` één op één op `sort_order`, met uitleg en opgaven
 * door elkaar. Dat is per beslissing van de eigenaar veranderd: de uitleg staat nu bovenaan
 * als één geheel (de regel, een werkend voorbeeld ernaast, de kaarten eronder) en de opgaven
 * staan daaronder, gegroepeerd per trap. De reden was leesbaarheid — door elkaar heen las de
 * pagina als één lange kolom bloktekst waarin je niet kon zien wat uitleg was en wat een vraag.
 *
 * **Wat NIET veranderd is, en waarom dat de kern was:** het blijft één pagina. Geen tabs, geen
 * tweede scherm, geen quizmodus. De opgaven staan allemaal open onder elkaar en de uitleg staat
 * erboven, dus je kunt tijdens het invullen terugkijken naar de regel — dat was de hele reden
 * voor "één lijst", en die reden overleeft de herindeling. Eén-vraag-per-scherm is wat de
 * exámenspeler doet, en met goede reden: daar meet je. Hier léér je.
 *
 * De ordening binnen elke sectie is nog steeds `sort_order`; alleen de `voorbeeld`-items worden
 * eruit gehaald, omdat ze naast de regel horen te staan en niet als losse regels eronder.
 *
 * ── DE OPGAVEN PER TRAP ──────────────────────────────────────────────────────
 * Herkennen (`tier` 0) → invullen (1) → zelf maken (2), elk met een eigen balkje. Die as bestond
 * al in de database en werd alleen als chipje per opgave getoond; `user_concept_mastery` telt
 * receptief en productief allang apart. De sectie toont dus wat er toch al gemeten wordt.
 *
 * ── LOKAAL NAKIJKEN, SERVERZIJDIG OPSLAAN ────────────────────────────────────
 * Het antwoord wordt hier meteen nagekeken met dezelfde pure functies die de server gebruikt
 * (`matchesTyped`, `normaliseTyped`), zodat de feedback direct verschijnt. Daarna gaat het
 * antwoord naar `/api/lesson-answer`, dat opnieuw nakijkt en de beheersing opslaat. Het
 * opgeslagen getal komt dus nooit van de client — zie de header van die route.
 *
 * De POST is *fire-and-forget met foutlog*: een haperend netwerk mag een les niet blokkeren,
 * maar een weggegooid resultaat is een verdwenen feature tot je het tegendeel hebt
 * gecontroleerd, dus hij logt.
 */

type Props = {
  lessonId: number;
  items: LessonItem[];
  /**
   * Het lesplaatje, of `null` als deze les er geen heeft.
   *
   * Het komt als prop uit de pagina en wordt hier niet zelf opgezocht: `LESSON_VISUALS` is
   * data op slug, en de slug staat op de les — niet op de items die dit component krijgt.
   */
  visual?: VisualSpec | null;
  /**
   * Staat de uitleg hier, of in de speler?
   *
   * Bij een les mét opname staat de uitleg in het lesblok (`LessonStage`) en toont deze stroom
   * alleen het overige materiaal en de opgaven. Zonder opname is er geen blok om hem in te
   * zetten, en dan staat hij hier — statisch, zoals hiervoor.
   */
  withLead?: boolean;
  /** Alleen-lezen: geen voortgang, geen beheersing. Voor de preview in `/admin/lessen`. */
  preview?: boolean;
  labels: StreamLabels;
};

export type StreamLabels = {
  check: string;
  correct: string;
  wrong: string;
  why: string;
  again: string;
  showAnswer: string;
  modelAnswer: string;
  compare: string;
  progress: string;
  yourAnswer: string;
  /** De kopjes van de twee secties en van de drie trappen — zie de kop van dit bestand. */
  ruleKick: string;
  demoKick: string;
  /** De twee sectiekoppen: "Uitleg" en "Oefenen". Zie de kop van dit bestand. */
  learnHead: string;
  learnSub: string;
  practiceHead: string;
  exHead: string;
  exSub: string;
  /** De pager: "Opgave {n} van {total}", de pijlen, en de doorlink onder de kaart. */
  exOf: string;
  exGoto: string;
  exPrev: string;
  exNext: string;
  exNextItem: string;
  exSkip: string;
  tierHeads: [string, string, string];
  tierSubs: [string, string, string];
  tierOther: string;
  /** De labels van het lesplaatje. Zie `LessonVisual.tsx`. */
  visual: VisualLabels;
  /** De labels van de microfoon. Zie `LessonRecorder.tsx`. */
  recorder: RecorderLabels;
  /** Wat er bij een spreekopgave om de opname heen staat. */
  sayAfter: string;
  sayFocus: string;
  audioTodo: string;
};

/**
 * De doorlink van de pager, om in de voet van de opgave te zetten.
 *
 * Via context en niet als prop: `ExFrame` zit acht renderers diep (mcq, gap, typen, open, …) en
 * die zouden alle acht een knop moeten doorgeven die alleen de pager kent. In de mockup staat
 * "Overslaan →" náást "Nakijken", dus het hoort in díe voet en niet in een tweede regel eronder.
 */
const PagerNext = createContext<React.ReactNode>(null);

/** Wat er van één opgave bekend is nadat de cursist hem heeft nagekeken. */
type Verdict = { correct: boolean } | null;

/**
 * Een element dat oplicht zodra de ingesproken uitleg erover praat, met de extra uitleg erbij.
 *
 * Eén wrapper en geen vijf keer dezelfde drie regels: de regelkaart, de twee vormkaarten en de
 * twee voorbeelden doen alle vijf hetzelfde. `as` omdat een `<p>` in een `<div>` mag en
 * omgekeerd niet — de voorbeeldregels zitten in het navy paneel.
 */
function Narrated({
  id, className, children,
}: { id: string; className?: string; children: React.ReactNode }) {
  const { active, note } = useNarrated(id);
  return (
    <div className={`${className ?? ''}${active ? ' is-narrating' : ''}`} data-narrate={id}>
      {children}
      {active && note && (
        <p className="nar-note">
          {/* Een lampje en geen luidspreker: deze regel is juist wat de stem *niet* zegt.
              Een luidsprekertje beloofde dat je het zou horen. */}
          <Lightbulb size={13} strokeWidth={2.4} aria-hidden />
          <span>{note}</span>
        </p>
      )}
    </div>
  );
}

export default function LessonStream({
  lessonId, items, visual = null, preview = false, withLead = true, labels,
}: Props) {
  const [verdicts, setVerdicts] = useState<Record<number, Verdict>>({});
  const exercises = useMemo(() => items.filter(i => isExerciseKind(i.kind)), [items]);
  /** Welke opgave in beeld staat. De pager houdt er precies één open — zie de sectie onderaan. */
  const [at, setAt] = useState(0);

  /**
   * De uitleg opgesplitst: de eerste `uitleg` draagt de regel en de kaarten, de
   * `voorbeeld`-items worden het paneel ernaast, en de rest van het materiaal blijft in
   * `sort_order` staan met de renderers die het al had.
   *
   * Alleen de *eerste* uitleg wordt de regel. Een tweede uitleg midden in een les is een
   * tweede uitleg, niet een tweede kop — die hoort in de stroom en niet nog eens naast een
   * navy paneel, want dan staan er twee dingen op de pagina die allebei "de regel" heten.
   */
  const { lead, demos, rest } = useMemo(() => {
    const blocks = items.filter(i => !isExerciseKind(i.kind));
    const firstUitleg = blocks.find(i => i.kind === 'uitleg') as
      Extract<LessonItem, { kind: 'uitleg' }> | undefined;
    const voorbeelden = firstUitleg
      ? (blocks.filter(i => i.kind === 'voorbeeld') as Extract<LessonItem, { kind: 'voorbeeld' }>[])
      : [];
    const hoisted = new Set<number>([
      ...(firstUitleg ? [firstUitleg.id] : []),
      ...voorbeelden.map(v => v.id),
    ]);
    return { lead: firstUitleg, demos: voorbeelden, rest: blocks.filter(i => !hoisted.has(i.id)) };
  }, [items]);

  /**
   * De opgaven per trap, plus één doorlopende nummering.
   *
   * De nummers lopen over de groepen heen, want "opgave 7" moet hetzelfde ding betekenen als
   * in de voortgangsregel erboven. Opgaven zonder trap krijgen een eigen groep achteraan in
   * plaats van bij trap 1 te worden gegooid: `tier` is nullable en NULL betekent daar
   * "onbekend", en een onbekende moeilijkheid als "invullen" tonen is een verzonnen feit.
   */
  /**
   * De opgaven in trapvolgorde: herkennen → invullen → zelf maken.
   *
   * Die as bestond al in de database en `user_concept_mastery` telt receptief en productief
   * allang apart. De trapkóppen zijn met de pager weg, maar de órde niet: opgave 1 is nog
   * steeds de makkelijkste, en de trap staat als chip op de opgave zelf.
   *
   * Opgaven zonder trap komen achteraan en niet bij trap 1: `tier` is nullable en NULL betekent
   * daar "onbekend", en een onbekende moeilijkheid als "invullen" tonen is een verzonnen feit.
   */
  const ordered = useMemo(() => {
    const byTier = ([0, 1, 2] as Tier[]).flatMap(tier => exercises.filter(e => e.tier === tier));
    return [...byTier, ...exercises.filter(e => e.tier == null)];
  }, [exercises]);
  const current = ordered[Math.min(at, ordered.length - 1)] ?? null;

  /**
   * Melden aan de kaart "Deze les" in de kop: hoeveel opgaven nagekeken zijn, en of de uitleg
   * in beeld is geweest.
   *
   * "In beeld geweest" is letterlijk dat: de kop van de opgavensectie is een keer zichtbaar
   * geweest, dus je bent de uitleg voorbij. Geen tijdmeting en geen aanname over lezen.
   */
  const { report: reportProgress } = useLessonProgress();
  const answeredCount = Object.values(verdicts).filter(Boolean).length;
  useEffect(() => {
    reportProgress({ done: answeredCount, total: ordered.length });
  }, [reportProgress, answeredCount, ordered.length]);

  const practiceRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = practiceRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) {
        reportProgress({ seenLearn: true });
        io.disconnect();
      }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [reportProgress]);

  /**
   * Meld het antwoord aan de server.
   *
   * De uitkomst van de server wordt bewust NIET over de lokale uitslag heen gezet. Ze gebruiken
   * dezelfde functies, dus ze horen gelijk te zijn; zouden ze dat toch niet zijn, dan is de
   * feedback onder de ogen van de cursist wegwisselen het slechtste van twee kwaden. Een
   * verschil hoort in de log en in `/admin`, niet in een knipperend vinkje.
   */
  const report = useCallback((itemId: number, answer: unknown) => {
    if (preview) return;
    fetch('/api/lesson-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId, itemId, answer }),
    })
      .then(async r => {
        if (!r.ok) console.error('[lessons] antwoord niet opgeslagen', r.status, await r.text());
      })
      .catch(e => console.error('[lessons] antwoord niet opgeslagen', e));
  }, [lessonId, preview]);

  const settle = useCallback((itemId: number, correct: boolean, answer: unknown) => {
    /* Eén trechter voor elke opgavesoort in de leerlaag, dus één plek voor het belletje. */
    if (correct) playCorrectChime();
    setVerdicts(v => ({ ...v, [itemId]: { correct } }));
    report(itemId, answer);
  }, [report]);

  const reset = useCallback((itemId: number) => {
    setVerdicts(v => {
      const next = { ...v };
      delete next[itemId];
      return next;
    });
  }, []);

  return (
    <div className="lesson-stream">
      {/* ── de uitleg ──
          De eerste `uitleg` draagt de regel; de `voorbeeld`-items eromheen worden het navy
          paneel ernaast. Die worden dus uit `sort_order` gehaald en dat is de bedoeling: los
          onder elkaar waren het drie losse regels tekst, naast de regel zijn ze het bewijs
          erbij. Zonder voorbeeld staat de regel over de volle breedte in plaats van naast een
          leeg vak. */}
      {/* ── Twee benoemde secties ──
          De uitleg en de opgaven stonden al onder elkaar, maar niets zei waar de een ophield
          en de ander begon: één doorlopende kolom kaarten leest als één brok. De kop is dus
          geen versiering maar de enige scheiding die er is — de geen-lijnenregel laat een
          streep niet toe, en een tweede achtergrondtrap zou de kaarten eronder platslaan. */}
      {((withLead && lead) || rest.length > 0) && (
        <div className="les-sec">
          <h2>{labels.learnHead}</h2>
          <p>{labels.learnSub}</p>
        </div>
      )}

      {/* ── het lesplaatje ──
          Bóven de regel, en dat is de hele opzet: eerst zie je welke vorm de zin heeft, daarna
          lees je de woorden erbij. Andersom — tekst eerst — werkt alleen voor wie de regel al
          kent, en dat is precies niet wie hier zit. */}
      {withLead && visual && <LessonVisual spec={visual} labels={labels.visual} />}

      {withLead && lead && (
        <>
          <div className={demos.length > 0 ? 'les-split' : ''} style={demos.length > 0 ? undefined : { marginBottom: '0.875rem' }}>
            <Narrated id="rule" className="rule-panel">
              <span className="rp-kick">{labels.ruleKick}</span>
              <div dangerouslySetInnerHTML={{ __html: lead.payload.body_html }} />
            </Narrated>
            {demos.length > 0 && (
              <div className="demo-panel">
                <span className="dp-kick">{labels.demoKick}</span>
                {demos.map((d, i) => (
                  <Narrated key={d.id} id={`demo-${i}`} className="dp-item">
                    <p className="dp-sent" dangerouslySetInnerHTML={{ __html: d.payload.sentence_html }} />
                    {d.payload.note && (
                      <p className="dp-note">
                        <ArrowRight size={13} strokeWidth={2.4} className="rtl-flip" />
                        {d.payload.note}
                      </p>
                    )}
                  </Narrated>
                ))}
              </div>
            )}
          </div>

          {lead.payload.cards.length > 0 && (
            <div className="form-cards">
              {lead.payload.cards.map((c, i) => (
                <Narrated key={i} id={`card-${i}`} className="fcard">
                  <span className="fc-label">{c.label}</span>
                  <p className="fc-body" dangerouslySetInnerHTML={{ __html: c.example_html }} />
                </Narrated>
              ))}
            </div>
          )}
        </>
      )}

      {/* De rest van het materiaal — leestekst, woordenlijst, zinnenbank, audio, een tweede
          uitleg — met de renderers die er al waren, in `sort_order`. */}
      {rest.length > 0 && (
        <ol className="stream-list">
          {rest.map(item => (
            <li key={item.id} className="stream-block">
              <ItemView
                item={item}
                verdict={null}
                onSettle={() => {}}
                onReset={() => {}}
                labels={labels}
              />
            </li>
          ))}
        </ol>
      )}

      {/* ── de opgaven, per trap ── */}
      {exercises.length > 0 && (
        <section id="oefenen" ref={practiceRef} style={{ marginTop: '2rem' }}>
          <div className="les-sec">
            <h2>{labels.practiceHead}</h2>
          </div>

          {/* ── de pager ──
              Eén opgave per keer, met de nummers erboven (mockup van de eigenaar, 08-09). Dat
              draait het "alles open onder elkaar" van 02-09 terug voor déze sectie: negen
              open opgaven onder de uitleg maakten de pagina één lange kolom waarin niets zei
              welke vraag nu aan de beurt was. De uitleg blijft erboven staan, dus de reden
              voor één pagina — tijdens het invullen de regel kunnen terugkijken — houdt.

              De trapkoppen (Herkennen · Invullen · Zelf maken) zijn hiermee weg als balken;
              de trap staat als chip op de opgave zelf, en de nummers lopen in dezelfde
              volgorde, dus de as is er nog. */}
          <Narrated id="exercises" className="exq nar-exhead">
            <div className="exq-head">
              <b>{labels.exHead}</b>
              <span>{labels.exOf.replace('{n}', String(at + 1)).replace('{total}', String(ordered.length))}</span>
            </div>

            <div className="exq-steps">
              <ol>
                {ordered.map((item, i) => {
                  const v = verdicts[item.id];
                  const cls = i === at ? 'is-at' : v ? (v.correct ? 'is-done' : 'is-wrong') : '';
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={cls}
                        aria-current={i === at ? 'step' : undefined}
                        aria-label={labels.exGoto.replace('{n}', String(i + 1))}
                        onClick={() => setAt(i)}
                      >
                        {i + 1}
                      </button>
                    </li>
                  );
                })}
              </ol>
              <div className="exq-nav">
                <button
                  type="button" aria-label={labels.exPrev}
                  disabled={at === 0} onClick={() => setAt(n => Math.max(0, n - 1))}
                >
                  <ArrowLeft size={15} strokeWidth={2.6} className="rtl-flip" aria-hidden />
                </button>
                <button
                  type="button" aria-label={labels.exNext} className="is-now"
                  disabled={at >= ordered.length - 1}
                  onClick={() => setAt(n => Math.min(ordered.length - 1, n + 1))}
                >
                  <ArrowRight size={15} strokeWidth={2.6} className="rtl-flip" aria-hidden />
                </button>
              </div>
            </div>
          </Narrated>

          {current && (
            <PagerNext.Provider
              value={at < ordered.length - 1
                ? (
                  <button type="button" className="exq-skip" onClick={() => setAt(n => n + 1)}>
                    {verdicts[current.id] ? labels.exNextItem : labels.exSkip}
                    <ArrowRight size={13} strokeWidth={2.6} className="rtl-flip" aria-hidden />
                  </button>
                )
                : null}
            >
            <div className="exq-card">
              {/* Geen `num`: het nummer staat in de stapregel erboven, en dan mag de trap-chip
                  in de kaart staan — zie de `num == null`-regel in `ExFrame`. */}
              <ItemView
                key={current.id}
                item={current}
                verdict={verdicts[current.id] ?? null}
                onSettle={(correct, answer) => settle(current.id, correct, answer)}
                onReset={() => reset(current.id)}
                labels={labels}
              />
            </div>
            </PagerNext.Provider>
          )}

        </section>
      )}
    </div>
  );
}

/* ── de renderers ────────────────────────────────────────────────────────── */

type ViewProps = {
  item: LessonItem;
  /** Het nummer van de opgave binnen de les, doorlopend over de drie trappen. */
  num?: number;
  verdict: Verdict;
  onSettle: (correct: boolean, answer: unknown) => void;
  onReset: () => void;
  labels: StreamLabels;
};

/**
 * Kies de renderer bij de soort.
 *
 * Een `switch` met een `never`-default, zodat een nieuwe item-soort een **compilefout** geeft
 * en niet een leeg blok in een les. Dat is dezelfde bescherming die `guideHref()` in
 * `data/guides/helpers.ts` heeft moeten krijgen nadat elke variant daar type-correct naar de
 * verkeerde pagina routeerde.
 */
function ItemView(props: ViewProps) {
  const { item } = props;
  switch (item.kind) {
    case 'uitleg':       return <Uitleg item={item} />;
    case 'voorbeeld':    return <Voorbeeld item={item} />;
    case 'leestekst':    return <Leestekst item={item} />;
    case 'audio':        return <AudioBlock item={item} labels={props.labels} />;
    case 'video':        return <VideoBlock item={item} />;
    case 'woordenlijst': return <Woordenlijst item={item} />;
    case 'zinnenbank':   return <Zinnenbank item={item} />;
    case 'mcq':          return <Mcq {...props} item={item} />;
    case 'gap_choice':   return <GapChoice {...props} item={item} />;
    case 'gap_type':     return <GapType {...props} item={item} />;
    case 'woordorde':    return <Woordorde {...props} item={item} />;
    case 'matchen':      return <Matchen {...props} item={item} />;
    case 'open_zin':     return <OpenZin {...props} item={item} />;
    case 'markeren':     return <Markeren {...props} item={item} />;
    case 'naspreken':    return <Naspreken {...props} item={item} />;
    case 'opnemen':      return <Opnemen {...props} item={item} />;
    default: {
      const never: never = item;
      throw new Error(`geen renderer voor item-soort ${JSON.stringify(never)}`);
    }
  }
}

/* ── uitleg en materiaal ─────────────────────────────────────────────────── */

function Uitleg({ item }: { item: Extract<LessonItem, { kind: 'uitleg' }> }) {
  return (
    <div className="blk blk-uitleg">
      <div className="blk-body" dangerouslySetInnerHTML={{ __html: item.payload.body_html }} />
      {item.payload.cards.length > 0 && (
        <div className="card-pair">
          {item.payload.cards.map((c, i) => (
            <div key={i} className="mini-card">
              <span className="mini-label">{c.label}</span>
              <p dangerouslySetInnerHTML={{ __html: c.example_html }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Voorbeeld({ item }: { item: Extract<LessonItem, { kind: 'voorbeeld' }> }) {
  return (
    <div className="blk blk-voorbeeld">
      <p className="vb-sentence" dangerouslySetInnerHTML={{ __html: item.payload.sentence_html }} />
      {item.payload.note && <p className="vb-note">{item.payload.note}</p>}
    </div>
  );
}

function Leestekst({ item }: { item: Extract<LessonItem, { kind: 'leestekst' }> }) {
  const { title, source, body_html, words } = item.payload;
  return (
    <div className="blk blk-tekst">
      <div className="tekst-main">
        {source && <span className="tekst-src">{source}</span>}
        <h3>{title}</h3>
        <div className="tekst-body" dangerouslySetInnerHTML={{ __html: body_html }} />
      </div>
      {words.length > 0 && (
        <aside className="woordhulp">
          <span className="wh-head">Woordhulp</span>
          <dl>
            {words.map((w, i) => (
              <div key={i}>
                <dt>{w.word}</dt>
                <dd>{w.meaning}</dd>
              </div>
            ))}
          </dl>
        </aside>
      )}
    </div>
  );
}

function AudioBlock({ item, labels }: { item: Extract<LessonItem, { kind: 'audio' }>; labels: StreamLabels }) {
  return (
    <div className="blk blk-audio">
      {item.payload.label && <span className="mini-label">{item.payload.label}</span>}
      {/* Geen eigen speler: `components/exam/AudioPlayer` is een clientcomponent met de
          DUO-bediening en die komt in M-L2, als er audio in een les zit. Tot dan het kale
          element, dat werkt en niets belooft. */}
      {item.payload.audio_url
        ? <audio controls preload="none" src={item.payload.audio_url} />
        /* Geen URL betekent: dit fragment is nog niet ingesproken. Zie `audioPayload` in
           lib/lessons/items.ts — de les wordt geschreven vóór de TTS-run, en een lege plek
           zou eruitzien als kapotte audio in plaats van als ontbrekende audio. */
        : <p className="audio-todo">{labels.audioTodo}</p>}
      {item.payload.transcript && (
        <details className="transcript">
          <summary>Transcript</summary>
          <p>{item.payload.transcript}</p>
        </details>
      )}
    </div>
  );
}

function VideoBlock({ item }: { item: Extract<LessonItem, { kind: 'video' }> }) {
  return (
    <div className="blk blk-video">
      <video controls preload="none" poster={item.payload.poster_url ?? undefined}
             src={item.payload.video_url} />
      {item.payload.label && <p className="vb-note">{item.payload.label}</p>}
    </div>
  );
}

function Woordenlijst({ item }: { item: Extract<LessonItem, { kind: 'woordenlijst' }> }) {
  // De woorden zelf komen uit `lesson_words` en worden door de pagina ingeladen; dit item
  // draagt alleen de verwijzing. Zonder ingeladen woorden rendert het niets in plaats van een
  // leeg kader — een lege lijst met een kop erboven leest als een fout.
  const words = item.words ?? [];
  if (!words.length) return null;

  const groups = [
    { usage: 'receptief' as const, head: 'Deze woorden moet je begrijpen' },
    { usage: 'productief' as const, head: 'Deze woorden moet je zelf kunnen gebruiken' },
  ];

  return (
    <div className="blk blk-woorden">
      {groups.map(g => {
        const list = words.filter(w => w.usage === g.usage);
        if (!list.length) return null;
        return (
          <div key={g.usage} className="woordgroep">
            <span className="mini-label">{g.head}</span>
            <ul>
              {list.map(w => (
                <li key={w.id}>
                  <strong>{w.article ? `${w.article} ` : ''}{w.dutch}</strong>
                  {w.plural && <span className="w-plural">· {w.plural}</span>}
                  {w.frame && <span className="w-frame">{w.frame}</span>}
                  <span className="w-meaning">{w.meaning_nl}</span>
                  {w.example && <span className="w-example">{w.example}</span>}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function Zinnenbank({ item }: { item: Extract<LessonItem, { kind: 'zinnenbank' }> }) {
  return (
    <div className="blk blk-zinnen">
      {item.payload.columns.map((c, i) => (
        <div key={i}>
          <span className="mini-label">{c.heading}</span>
          <ul>{c.phrases.map((p, j) => <li key={j}>{p}</li>)}</ul>
        </div>
      ))}
    </div>
  );
}

/* ── de opgaven ──────────────────────────────────────────────────────────── */

/**
 * Het frame om elke opgave: de trap-chip, de nakijkknop en de feedback.
 *
 * Eén component, zodat elke opgavesoort dezelfde feedback krijgt en dezelfde plek waar de
 * uitleg verschijnt. Correct is klei (`secondary`), fout is `--color-error`, en een lucide
 * `Check`/`X` draagt de betekenis — voor wie de twee tinten niet kan scheiden is het icoon het
 * antwoord. Geen nieuwe kleur voor een status.
 */
function ExFrame({
  item, verdict, canCheck, onCheck, onReset, labels, children, extra, num,
}: {
  item: LessonItem;
  verdict: Verdict;
  num?: number;
  canCheck: boolean;
  onCheck: () => void;
  onReset: () => void;
  labels: StreamLabels;
  children: React.ReactNode;
  extra?: React.ReactNode;
}) {
  /* De chip draagt de trap én wat die trap van je vraagt ("Herkennen · Zie je het verschil?").
     De trapkoppen zeiden dat eerst als sectiekop; met de pager is deze chip de enige plek waar
     de as nog staat, en dan hoort het hele label erin. */
  const chip = item.tier != null && item.tier <= 2
    ? `${labels.tierHeads[item.tier]} · ${labels.tierSubs[item.tier]}`
    : tierChipOf(item.tier);
  return (
    /* De reisgroene rand op de opgavekaart, niet op de optie: elke opgavesoort in de leerlaag
       eindigt in deze kaart, dus zo krijgt invullen dezelfde beloning als meerkeuze — en één
       lijst met één rand, in plaats van twee die om de aandacht vechten. */
    <div className={`ex${verdict ? (verdict.correct ? ' is-right answer-correct' : ' is-wrong') : ''}`}>
      {/* Nummer, trap en uitslag op één regel. Het nummer loopt door over de drie trappen,
          zodat "opgave 7" hetzelfde ding betekent als in de voortgangsregel erboven. */}
      <div className="ex-head">
        {num != null && <span className="ex-num">{num}</span>}
        {/* De trap-chip alleen buiten een trapgroep: staat de opgave ín "Invullen", dan zegt
            de kop dat al en is de chip een tweede keer hetzelfde woord. `num` is er alleen
            binnen een groep, dus dat is ook precies de vraag die hier gesteld wordt. */}
        {chip && num == null && <span className="ex-tier">{chip}</span>}
        {verdict && (
          <span className={`ex-ok${verdict.correct ? '' : ' is-wrong'}`}>
            {verdict.correct
              ? <><Check size={13} strokeWidth={3} /> {labels.correct}</>
              : <><X size={13} strokeWidth={3} /> {labels.wrong}</>}
          </span>
        )}
      </div>
      {children}

      {verdict && (
        <div className="ex-fb answer-verdict">
          <p className="fb-head">
            {verdict.correct
              ? <><Check size={17} strokeWidth={3} /> {labels.correct}</>
              : <><X size={17} strokeWidth={3} /> {labels.wrong}</>}
          </p>
          {extra}
          {item.explanation && (
            <div className="fb-why">
              <span className="mini-label">{labels.why}</span>
              {/* Als HTML — zie `explanation` in `lib/lessons/items.ts`. */}
              <p dangerouslySetInnerHTML={{ __html: item.explanation }} />
            </div>
          )}
        </div>
      )}
      <div className="ex-foot">
        {verdict
          ? (
            <button type="button" className="ex-again" onClick={onReset}>
              <RotateCcw size={14} strokeWidth={2.5} /> {labels.again}
            </button>
          )
          : (
            <button type="button" className="ex-check-quiet" onClick={onCheck} disabled={!canCheck}>
              <Check size={13} strokeWidth={2.6} /> {labels.check}
            </button>
          )}
        {useContext(PagerNext)}
      </div>

    </div>
  );
}

function Mcq({ item, verdict, onSettle, onReset, labels, num }: ViewProps & { item: Extract<LessonItem, { kind: 'mcq' }> }) {
  const [picked, setPicked] = useState<string | null>(null);
  const answered = !!verdict;

  return (
    <ExFrame
      item={item} verdict={verdict} labels={labels} num={num} onReset={() => { onReset(); setPicked(null); }}
      canCheck={picked !== null}
      onCheck={() => onSettle(!!item.options.find(o => o.label === picked)?.is_correct, picked)}
    >
      {item.payload.intro && <p className="ex-intro">{item.payload.intro}</p>}
      {/* Als HTML: `prompt` mag cursief dragen om een aangehaald woord aan te wijzen, en dat
          kwam hiervoor met tags en al in beeld. Zie `promptHtml` in `lib/lessons/items.ts`. */}
      <p className="ex-prompt" dangerouslySetInnerHTML={{ __html: item.payload.prompt }} />
      <div className={`opts${item.payload.layout === 'text' ? '' : ' opts-grid'}`} role="radiogroup">
        {item.options.map(o => {
          const isPicked = picked === o.label;
          const reveal = answered && o.is_correct;
          const wrongPick = answered && isPicked && !o.is_correct;
          return (
            <button
              key={o.label}
              type="button"
              role="radio"
              aria-checked={isPicked}
              disabled={answered}
              onClick={() => setPicked(o.label)}
              className={`opt${isPicked ? ' picked' : ''}${reveal ? ' right' : ''}${wrongPick ? ' wrong' : ''}`}
            >
              <span className="opt-l">{o.label}</span>
              <span className="opt-b"><WordPass text={o.body ?? ''} active={reveal} /></span>
              {reveal && <Check size={16} strokeWidth={3} className="opt-i" />}
              {wrongPick && <X size={16} strokeWidth={3} className="opt-i" />}
            </button>
          );
        })}
      </div>
    </ExFrame>
  );
}

/** De zin met het gat, als drie stukken: vóór, het gat, erna. */
function GapSentence({ sentence, children }: { sentence: string; children: React.ReactNode }) {
  const [before, after] = sentence.split(GAP);
  return (
    <p className="gap-sentence">
      <span>{before}</span>{children}<span>{after}</span>
    </p>
  );
}

function GapChoice({ item, verdict, onSettle, onReset, labels, num }: ViewProps & { item: Extract<LessonItem, { kind: 'gap_choice' }> }) {
  const [picked, setPicked] = useState<string | null>(null);
  const { sentence, choices, answer } = item.payload;

  return (
    <ExFrame
      item={item} verdict={verdict} labels={labels} num={num} onReset={() => { onReset(); setPicked(null); }}
      canCheck={picked !== null}
      onCheck={() => onSettle(normaliseTyped(picked ?? '') === normaliseTyped(answer), picked)}
      extra={verdict && !verdict.correct
        ? <p className="fb-answer">{labels.showAnswer}: <strong>{answer}</strong></p> : undefined}
    >
      <GapSentence sentence={sentence}>
        <span className={`gap-slot${picked ? ' filled' : ''}`}>{picked ?? ''}</span>
      </GapSentence>
      <div className="chips">
        {choices.map(c => (
          <button
            key={c} type="button" disabled={!!verdict}
            onClick={() => setPicked(c)}
            className={`chip${picked === c ? ' picked' : ''}`}
          >{c}</button>
        ))}
      </div>
    </ExFrame>
  );
}

function GapType({ item, verdict, onSettle, onReset, labels, num }: ViewProps & { item: Extract<LessonItem, { kind: 'gap_type' }> }) {
  const [text, setText] = useState('');
  const { sentence, answer, accept, hint } = item.payload;

  return (
    <ExFrame
      item={item} verdict={verdict} labels={labels} num={num} onReset={() => { onReset(); setText(''); }}
      canCheck={text.trim().length > 0}
      onCheck={() => onSettle(matchesTyped(text, answer, accept), text)}
      extra={verdict && !verdict.correct
        ? <p className="fb-answer">{labels.showAnswer}: <strong>{answer}</strong></p> : undefined}
    >
      <GapSentence sentence={sentence}>
        <input
          className="gap-input"
          value={text}
          disabled={!!verdict}
          onChange={e => setText(e.target.value)}
          aria-label={item.payload.hint ?? 'vul het woord in'}
          size={Math.max(6, answer.length + 2)}
        />
      </GapSentence>
      {hint && !verdict && <p className="ex-hint">{hint}</p>}
    </ExFrame>
  );
}

function Woordorde({ item, verdict, onSettle, onReset, labels, num }: ViewProps & { item: Extract<LessonItem, { kind: 'woordorde' }> }) {
  const { instruction, tokens, answer } = item.payload;
  const [order, setOrder] = useState<string[]>([]);
  const pool = useMemo(() => {
    // Elke token één keer uit de pool halen, op index — twee gelijke woorden in één zin
    // ("dat ... dat") moeten allebei plaatsbaar blijven.
    const used = new Map<string, number>();
    for (const t of order) used.set(t, (used.get(t) ?? 0) + 1);
    return tokens.filter(t => {
      const n = used.get(t) ?? 0;
      if (n > 0) { used.set(t, n - 1); return false; }
      return true;
    });
  }, [tokens, order]);

  const ok = () => order.length === answer.length
    && order.every((t, i) => normaliseTyped(t) === normaliseTyped(answer[i]));

  return (
    <ExFrame
      item={item} verdict={verdict} labels={labels} num={num} onReset={() => { onReset(); setOrder([]); }}
      canCheck={order.length === tokens.length}
      onCheck={() => onSettle(ok(), order)}
      extra={verdict && !verdict.correct
        ? <p className="fb-answer">{labels.showAnswer}: <strong>{answer.join(' ')}</strong></p> : undefined}
    >
      {instruction && <p className="ex-prompt" dangerouslySetInnerHTML={{ __html: instruction }} />}
      <div className="wo-line" aria-live="polite">
        {order.length === 0 && <span className="wo-empty">…</span>}
        {order.map((t, i) => (
          <button key={`${t}-${i}`} type="button" disabled={!!verdict}
                  onClick={() => setOrder(o => o.filter((_, j) => j !== i))}
                  className="chip picked">{t}</button>
        ))}
      </div>
      <div className="chips">
        {pool.map((t, i) => (
          <button key={`${t}-${i}`} type="button" disabled={!!verdict}
                  onClick={() => setOrder(o => [...o, t])}
                  className="chip">{t}</button>
        ))}
      </div>
    </ExFrame>
  );
}

function Matchen({ item, verdict, onSettle, onReset, labels, num }: ViewProps & { item: Extract<LessonItem, { kind: 'matchen' }> }) {
  const { instruction, pairs } = item.payload;
  const [choice, setChoice] = useState<Record<string, string>>({});
  const rights = useMemo(() => {
    // Vaste, van de inhoud afgeleide ordening — géén Math.random(). Deze component rendert
    // client-side, maar een willekeurige volgorde zou bij elke re-render verspringen terwijl
    // iemand aan het kiezen is.
    return [...pairs.map(p => p.right)].sort((a, b) => a.localeCompare(b, 'nl'));
  }, [pairs]);

  const done = pairs.every(p => choice[p.left]);
  const ok = () => pairs.every(p => normaliseTyped(choice[p.left] ?? '') === normaliseTyped(p.right));

  return (
    <ExFrame
      item={item} verdict={verdict} labels={labels} num={num} onReset={() => { onReset(); setChoice({}); }}
      canCheck={done}
      onCheck={() => onSettle(ok(), choice)}
    >
      {instruction && <p className="ex-prompt" dangerouslySetInnerHTML={{ __html: instruction }} />}
      <div className="match">
        {pairs.map(p => {
          const picked = choice[p.left];
          const right = verdict ? normaliseTyped(picked ?? '') === normaliseTyped(p.right) : null;
          return (
            <div key={p.left} className={`match-row${right === true ? ' right' : ''}${right === false ? ' wrong' : ''}`}>
              <span className="match-l">{p.left}</span>
              <select
                value={picked ?? ''}
                disabled={!!verdict}
                onChange={e => setChoice(c => ({ ...c, [p.left]: e.target.value }))}
                aria-label={p.left}
              >
                <option value="">…</option>
                {rights.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              {right === true && <Check size={15} strokeWidth={3} />}
              {right === false && <X size={15} strokeWidth={3} />}
            </div>
          );
        })}
      </div>
    </ExFrame>
  );
}

function OpenZin({ item, verdict, onSettle, onReset, labels, num }: ViewProps & { item: Extract<LessonItem, { kind: 'open_zin' }> }) {
  const { prompt, starter, model_answer, checklist } = item.payload;
  const [text, setText] = useState(starter ?? '');
  const [shown, setShown] = useState(false);

  /**
   * Zelfvergelijking, geen beoordeling.
   *
   * Bewust géén rubriekcall: dat kost een modelcall per oefenzin, en de Schrijven-rubrieken
   * bestaan om een héle opgave te beoordelen. De cursist krijgt het voorbeeldantwoord en een
   * checklist en vergelijkt zelf. Daarom is er ook geen "fout": alles met inhoud geldt als
   * gedaan — een rood kruis bij een geldige zin die net anders is geformuleerd is erger dan
   * geen meting.
   */
  return (
    <ExFrame
      item={item} verdict={verdict} labels={labels} num={num} onReset={() => { onReset(); setShown(false); }}
      canCheck={text.trim().split(/\s+/).length >= 3}
      onCheck={() => { setShown(true); onSettle(true, text); }}
      extra={
        <div className="model">
          <span className="mini-label">{labels.modelAnswer}</span>
          <p className="model-a">{model_answer}</p>
          {checklist.length > 0 && (
            <ul className="model-check">
              {checklist.map((c, i) => (
                <li key={i}>
                  <Check size={13} strokeWidth={3} />
                  <span dangerouslySetInnerHTML={{ __html: c }} />
                </li>
              ))}
            </ul>
          )}
          <p className="model-note">{labels.compare}</p>
        </div>
      }
    >
      <p className="ex-prompt" dangerouslySetInnerHTML={{ __html: prompt }} />
      <textarea
        className="open-input"
        rows={3}
        value={text}
        disabled={!!verdict}
        onChange={e => setText(e.target.value)}
        aria-label={prompt}
      />
      {!verdict && !shown && (
        <button type="button" className="ex-peek" onClick={() => setShown(true)}>
          <Eye size={14} strokeWidth={2.5} /> {labels.modelAnswer}
        </button>
      )}
      {!verdict && shown && <p className="model-a peeked">{model_answer}</p>}
    </ExFrame>
  );
}

/* ── de twee spreekopgaven ───────────────────────────────────────────────── */

/**
 * Naspreken: hoor de zin, zeg hem na, hoor jezelf terug.
 *
 * **Kijkt nooit af.** Er is geen vergelijking tussen de opname en `target`, en dus ook geen
 * "fout": zodra er een opname is, is de opgave gedaan. Precies dezelfde afspraak als bij
 * `open_zin`, en om een sterkere reden — een rood kruis omdat de spraakherkenning een accent
 * niet volgde is erger dan geen meting, en het zou de belofte van dit product omdraaien.
 * Wat er verstaan is staat er wél, want dat is voor uitspraak het nuttigste signaal dat
 * bestaat. Zie `LessonRecorder.tsx`.
 */
function Naspreken({ item, verdict, onSettle, onReset, labels, num }: ViewProps & { item: Extract<LessonItem, { kind: 'naspreken' }> }) {
  const { prompt, target, focus, audio_url } = item.payload;
  const [recorded, setRecorded] = useState(false);

  return (
    <ExFrame
      item={item} verdict={verdict} labels={labels} num={num}
      onReset={() => { onReset(); setRecorded(false); }}
      canCheck={recorded}
      onCheck={() => onSettle(true, 'opgenomen')}
    >
      <p className="ex-prompt" dangerouslySetInnerHTML={{ __html: prompt ?? labels.sayAfter }} />
      {audio_url
        ? <audio className="say-audio" controls preload="none" src={audio_url} />
        : <p className="audio-todo">{labels.audioTodo}</p>}
      <p className="say-target">{target}</p>
      <p className="say-focus">
        <span className="mini-label">{labels.sayFocus}</span> {focus}
      </p>
      <LessonRecorder
        limit={20}
        labels={labels.recorder}
        disabled={!!verdict}
        onRecorded={() => setRecorded(true)}
      />
    </ExFrame>
  );
}

/**
 * Opnemen: een gesproken antwoord op een examenopdracht.
 *
 * De gesproken tegenhanger van `open_zin`, met hetzelfde model: je hoort jezelf terug, je
 * krijgt het voorbeeldantwoord en de checklist, en je vergelijkt zelf. Geen rubriek en geen
 * modelcall — die bestaan om een héle examenopdracht te beoordelen, niet een oefenantwoord.
 */
function Opnemen({ item, verdict, onSettle, onReset, labels, num }: ViewProps & { item: Extract<LessonItem, { kind: 'opnemen' }> }) {
  const { prompt, intro, image_urls, image_alt, model_answer, checklist, record_seconds } = item.payload;
  const [recorded, setRecorded] = useState(false);

  return (
    <ExFrame
      item={item} verdict={verdict} labels={labels} num={num}
      onReset={() => { onReset(); setRecorded(false); }}
      canCheck={recorded}
      onCheck={() => onSettle(true, 'opgenomen')}
      extra={
        <div className="model">
          <span className="mini-label">{labels.modelAnswer}</span>
          <p className="model-a">{model_answer}</p>
          {checklist.length > 0 && (
            <ul className="model-check">
              {checklist.map((c, i) => (
                <li key={i}>
                  <Check size={13} strokeWidth={3} />
                  <span dangerouslySetInnerHTML={{ __html: c }} />
                </li>
              ))}
            </ul>
          )}
          <p className="model-note">{labels.compare}</p>
        </div>
      }
    >
      {intro && <p className="ex-intro">{intro}</p>}
      <p className="ex-prompt" dangerouslySetInnerHTML={{ __html: prompt }} />
      {image_urls.length > 0 && (
        <div className="rec-shots">
          {image_urls.map((src, i) => (
            /* eslint-disable-next-line @next/next/no-img-element -- de plaatjes staan in onze
               eigen Storage en hun formaat komt uit de opgave, niet uit een layoutbeslissing. */
            <img key={src} src={src} alt={image_alt ?? `${i + 1}`} />
          ))}
        </div>
      )}
      <LessonRecorder
        limit={record_seconds}
        labels={labels.recorder}
        disabled={!!verdict}
        onRecorded={() => setRecorded(true)}
      />
    </ExFrame>
  );
}

function Markeren({ item, verdict, onSettle, onReset, labels, num }: ViewProps & { item: Extract<LessonItem, { kind: 'markeren' }> }) {
  const { instruction, body_html, targets } = item.payload;
  const [picked, setPicked] = useState<Record<string, string>>({});
  const bodyRef = useRef<HTMLDivElement>(null);

  /**
   * "Markeren" is hier *aanwijzen door te selecteren*, niet slepen.
   *
   * De cursist selecteert een stuk tekst en kiest welk label het is. Een echte
   * markeer-interactie op woordniveau vraagt om het opsplitsen van de HTML in klikbare tokens,
   * en dat breekt bij elke `<strong>` of `<br>` in de tekst. Selectie werkt met de tekst zoals
   * hij is, ook op een telefoon, en is met een `<select>` per label ook zonder muis te doen.
   */
  const capture = (label: string) => {
    const sel = typeof window !== 'undefined' ? window.getSelection() : null;
    const text = sel?.toString().trim() ?? '';
    if (!text) return;
    setPicked(p => ({ ...p, [label]: text }));
    sel?.removeAllRanges();
  };

  const done = targets.every(t => picked[t.label]);
  const ok = () => targets.every(t => normaliseTyped(picked[t.label] ?? '') === normaliseTyped(t.text));

  return (
    <ExFrame
      item={item} verdict={verdict} labels={labels} num={num} onReset={() => { onReset(); setPicked({}); }}
      canCheck={done}
      onCheck={() => onSettle(ok(), picked)}
      extra={verdict && !verdict.correct
        ? (
          <ul className="fb-targets">
            {targets.map(t => (
              <li key={t.label}><span className="mini-label">{t.label}</span> {t.text}</li>
            ))}
          </ul>
        )
        : undefined}
    >
      <p className="ex-prompt" dangerouslySetInnerHTML={{ __html: instruction }} />
      <div ref={bodyRef} className="mark-body" dangerouslySetInnerHTML={{ __html: body_html }} />
      <div className="mark-picks">
        {targets.map(t => (
          <div key={t.label} className="mark-pick">
            <span className="mini-label">{t.label}</span>
            <output>{picked[t.label] ?? '—'}</output>
            {!verdict && (
              <button type="button" onClick={() => capture(t.label)}>
                {labels.yourAnswer}
              </button>
            )}
          </div>
        ))}
      </div>
    </ExFrame>
  );
}
