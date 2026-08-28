'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, X, RotateCcw, Eye } from 'lucide-react';
import {
  GAP, isExerciseKind, matchesTyped, normaliseTyped, tierChipOf,
  type LessonItem,
} from './item-helpers';

/**
 * De lesstroom: uitleg en opgaven in ÉÉN lijst.
 *
 * ── WAAROM ÉÉN LIJST ─────────────────────────────────────────────────────────
 * Dat is de hele belofte van deze laag. Een gids legt uit en een examen toetst; een les doet
 * beide in dezelfde beweging, en de cursist hoeft niet naar een oefening te zoeken die
 * "ergens anders" staat. Dus geen tabs, geen tweede scherm: `lesson_items` op `sort_order`,
 * uitlegblokken en opgaven door elkaar.
 *
 * ── ALLES STAAT OPEN, ER IS GEEN QUIZMODUS ───────────────────────────────────
 * De opgaven staan onder elkaar en zijn allemaal meteen zichtbaar. Eén-vraag-per-scherm is
 * wat de exámenspeler doet, en met goede reden: daar meet je. Hier léér je, en dan wil je
 * terug kunnen kijken naar de uitleg twee blokken hoger terwijl je de zin invult.
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
};

/** Wat er van één opgave bekend is nadat de cursist hem heeft nagekeken. */
type Verdict = { correct: boolean } | null;

export default function LessonStream({ lessonId, items, preview = false, labels }: Props) {
  const [verdicts, setVerdicts] = useState<Record<number, Verdict>>({});
  const exercises = useMemo(() => items.filter(i => isExerciseKind(i.kind)), [items]);
  const answered = Object.values(verdicts).filter(Boolean).length;

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
      {exercises.length > 0 && (
        <p className="stream-count">
          {labels.progress.replace('{done}', String(answered)).replace('{total}', String(exercises.length))}
        </p>
      )}

      <ol className="stream-list">
        {items.map(item => (
          <li key={item.id} className={isExerciseKind(item.kind) ? 'stream-ex' : 'stream-block'}>
            <ItemView
              item={item}
              verdict={verdicts[item.id] ?? null}
              onSettle={(correct, answer) => settle(item.id, correct, answer)}
              onReset={() => reset(item.id)}
              labels={labels}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ── de renderers ────────────────────────────────────────────────────────── */

type ViewProps = {
  item: LessonItem;
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
    case 'audio':        return <AudioBlock item={item} />;
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

function AudioBlock({ item }: { item: Extract<LessonItem, { kind: 'audio' }> }) {
  return (
    <div className="blk blk-audio">
      {item.payload.label && <span className="mini-label">{item.payload.label}</span>}
      {/* Geen eigen speler: `components/exam/AudioPlayer` is een clientcomponent met de
          DUO-bediening en die komt in M-L2, als er audio in een les zit. Tot dan het kale
          element, dat werkt en niets belooft. */}
      <audio controls preload="none" src={item.payload.audio_url} />
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
  item, verdict, canCheck, onCheck, onReset, labels, children, extra,
}: {
  item: LessonItem;
  verdict: Verdict;
  canCheck: boolean;
  onCheck: () => void;
  onReset: () => void;
  labels: StreamLabels;
  children: React.ReactNode;
  extra?: React.ReactNode;
}) {
  const chip = tierChipOf(item.tier);
  return (
    <div className={`ex${verdict ? (verdict.correct ? ' is-right' : ' is-wrong') : ''}`}>
      {chip && <span className="ex-tier">{chip}</span>}
      {children}

      {verdict && (
        <div className="ex-fb">
          <p className="fb-head">
            {verdict.correct
              ? <><Check size={17} strokeWidth={3} /> {labels.correct}</>
              : <><X size={17} strokeWidth={3} /> {labels.wrong}</>}
          </p>
          {extra}
          {item.explanation && (
            <div className="fb-why">
              <span className="mini-label">{labels.why}</span>
              <p>{item.explanation}</p>
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
            <button type="button" className="ex-check" onClick={onCheck} disabled={!canCheck}>
              {labels.check}
            </button>
          )}
      </div>

    </div>
  );
}

function Mcq({ item, verdict, onSettle, onReset, labels }: ViewProps & { item: Extract<LessonItem, { kind: 'mcq' }> }) {
  const [picked, setPicked] = useState<string | null>(null);
  const answered = !!verdict;

  return (
    <ExFrame
      item={item} verdict={verdict} labels={labels} onReset={() => { onReset(); setPicked(null); }}
      canCheck={picked !== null}
      onCheck={() => onSettle(!!item.options.find(o => o.label === picked)?.is_correct, picked)}
    >
      {item.payload.intro && <p className="ex-intro">{item.payload.intro}</p>}
      <p className="ex-prompt">{item.payload.prompt}</p>
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
              <span className="opt-b">{o.body}</span>
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

function GapChoice({ item, verdict, onSettle, onReset, labels }: ViewProps & { item: Extract<LessonItem, { kind: 'gap_choice' }> }) {
  const [picked, setPicked] = useState<string | null>(null);
  const { sentence, choices, answer } = item.payload;

  return (
    <ExFrame
      item={item} verdict={verdict} labels={labels} onReset={() => { onReset(); setPicked(null); }}
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

function GapType({ item, verdict, onSettle, onReset, labels }: ViewProps & { item: Extract<LessonItem, { kind: 'gap_type' }> }) {
  const [text, setText] = useState('');
  const { sentence, answer, accept, hint } = item.payload;

  return (
    <ExFrame
      item={item} verdict={verdict} labels={labels} onReset={() => { onReset(); setText(''); }}
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

function Woordorde({ item, verdict, onSettle, onReset, labels }: ViewProps & { item: Extract<LessonItem, { kind: 'woordorde' }> }) {
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
      item={item} verdict={verdict} labels={labels} onReset={() => { onReset(); setOrder([]); }}
      canCheck={order.length === tokens.length}
      onCheck={() => onSettle(ok(), order)}
      extra={verdict && !verdict.correct
        ? <p className="fb-answer">{labels.showAnswer}: <strong>{answer.join(' ')}</strong></p> : undefined}
    >
      {instruction && <p className="ex-prompt">{instruction}</p>}
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

function Matchen({ item, verdict, onSettle, onReset, labels }: ViewProps & { item: Extract<LessonItem, { kind: 'matchen' }> }) {
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
      item={item} verdict={verdict} labels={labels} onReset={() => { onReset(); setChoice({}); }}
      canCheck={done}
      onCheck={() => onSettle(ok(), choice)}
    >
      {instruction && <p className="ex-prompt">{instruction}</p>}
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

function OpenZin({ item, verdict, onSettle, onReset, labels }: ViewProps & { item: Extract<LessonItem, { kind: 'open_zin' }> }) {
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
      item={item} verdict={verdict} labels={labels} onReset={() => { onReset(); setShown(false); }}
      canCheck={text.trim().split(/\s+/).length >= 3}
      onCheck={() => { setShown(true); onSettle(true, text); }}
      extra={
        <div className="model">
          <span className="mini-label">{labels.modelAnswer}</span>
          <p className="model-a">{model_answer}</p>
          {checklist.length > 0 && (
            <ul className="model-check">
              {checklist.map((c, i) => <li key={i}><Check size={13} strokeWidth={3} /> {c}</li>)}
            </ul>
          )}
          <p className="model-note">{labels.compare}</p>
        </div>
      }
    >
      <p className="ex-prompt">{prompt}</p>
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

function Markeren({ item, verdict, onSettle, onReset, labels }: ViewProps & { item: Extract<LessonItem, { kind: 'markeren' }> }) {
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
      item={item} verdict={verdict} labels={labels} onReset={() => { onReset(); setPicked({}); }}
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
      <p className="ex-prompt">{instruction}</p>
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
