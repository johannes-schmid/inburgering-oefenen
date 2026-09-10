'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, Lightbulb, Pause, Play, X } from 'lucide-react';
import { stepCount, type LessonVisual as Spec, type SlotRow } from '@/data/lesson-visuals';
import { useNarrationCue } from './NarrationScope';

/**
 * Het lesplaatje: de regel van de les als figuur, boven de uitleg.
 *
 * ── WAAROM HET BOVEN DE UITLEG STAAT ────────────────────────────────────────
 * De regel stond in twee panelen: de tekst links, twee voorbeeldzinnen rechts. Dat werkt als je
 * de regel al kent en je hem nog eens nakijkt. Het werkt niet voor iemand die hem voor het eerst
 * ziet, en dat is precies deze laag: die leest drie regels tekst over "plaats twee" zonder te
 * kunnen zien wát een plaats is. Het plaatje staat er dus vóór — eerst zien wat de vorm ís,
 * daarna de woorden erbij.
 *
 * ── TIEN SOORTEN, EN GEEN GENERIEK DIAGRAM ──────────────────────────────────
 * Elke soort beantwoordt één grammaticale vraag; welke, staat in `data/lesson-visuals.ts`. Het
 * alternatief — één "diagram"-soort met vrije vakjes — is de weg naar 28 plaatjes die alle 28
 * anders zijn. Nu ziet plaats twee er in les 2 uit als in les 1, en dát is wat het leert.
 *
 * ── DE STAPPEN, EN DRIE MANIEREN OM ZE AF TE LOPEN ──────────────────────────
 * Elk plaatje bestaat uit genummerde stappen. Ze lichten op:
 *   1. **vanuit de opname** — een cue `vis-2` in het narratiescript licht stap 2 op terwijl de
 *      stem erover praat. Dat is de reden dat dit component de cue zelf leest en niet
 *      `useNarrated(id)` gebruikt: het is één element met genummerde delen.
 *   2. **met de hand** — je klikt een stap aan.
 *   3. **automatisch** — de doorloopknop, voor wie het plaatje zonder audio wil zien bewegen.
 * Zonder alle drie is het een plaat; met alle drie is het iets waar je doorheen kunt lopen.
 *
 * De opname wint van de hand: zolang er een `vis`-cue loopt, volgt het plaatje de stem. Anders
 * zou een klik de markering laten vechten met de audio, en dan staat het plaatje stil op het
 * verkeerde vakje terwijl de stem doorpraat.
 */
export type VisualLabels = {
  /** Boven het plaatje: "Zo ziet het uit". */
  kicker: string;
  /** De doorloopknop, aan en uit. */
  walk: string;
  walkStop: string;
  /** Voor de schermlezer: "stap {n} van {total}". */
  step: string;
};

/** `vis` → 0 (alles), `vis-3` → 3, iets anders → null (dit plaatje is niet aan de beurt). */
function stepFromCue(id: string | null): number | null {
  if (!id) return null;
  if (id === 'vis') return 0;
  const m = /^vis-(\d+)$/.exec(id);
  return m ? Number(m[1]) : null;
}

export default function LessonVisual({
  spec, labels,
}: { spec: Spec; labels: VisualLabels }) {
  const total = useMemo(() => stepCount(spec), [spec]);
  const { id: cueId, note: cueNote } = useNarrationCue();
  const fromCue = stepFromCue(cueId);
  const [picked, setPicked] = useState<number | null>(null);
  const [walking, setWalking] = useState(false);

  /* De opname wint. Zolang de stem in het plaatje zit, is de hand en de doorloop uitgeschakeld —
     twee dingen die tegelijk een andere stap aanwijzen is geen aanwijzing meer. */
  const narrating = fromCue !== null;
  const active = narrating ? fromCue : picked;

  useEffect(() => {
    if (narrating) { setWalking(false); setPicked(null); }
  }, [narrating]);

  useEffect(() => {
    if (!walking) return;
    const id = window.setInterval(() => {
      setPicked(prev => (prev === null || prev >= total ? 1 : prev + 1));
    }, 2200);
    return () => window.clearInterval(id);
  }, [walking, total]);

  const pick = useCallback((n: number) => {
    if (narrating) return;
    setWalking(false);
    setPicked(prev => (prev === n ? null : n));
  }, [narrating]);

  return (
    <figure
      /* `active === 0` is "de stem praat over het plaatje als geheel": dan licht de kaart op en
         dooft er binnenin niets. Het doven van de niet-actieve stappen hangt aan de stappen zelf
         (`is-off`), niet aan een klasse hier — één plek die beslist wat er terugtreedt. */
      className={`les-vis${active !== null ? ' is-narrating' : ''}`}
      data-narrate="vis"
      data-step={active ?? ''}
      /* **Altijd LTR, ook in het Arabisch.** Alles in dit plaatje is Nederlands — de zin, de
         vormen, het onderschrift — en lescontent is per afspraak Nederlands. In een RTL-chrome
         spiegelde de zinsbalk mee: plaats één kwam rechts te staan en de leestekens sprongen
         naar de verkeerde kant. Een plaatje dat vertelt waar plaats twee staat, mag niet zelf
         van kant wisselen. Dezelfde regel als voor een annotatie op een vaste afbeelding. */
      dir="ltr"
    >
      <div className="lv-head">
        <span className="lv-kicker">{labels.kicker}</span>
        <button
          type="button"
          className={`lv-walk${walking ? ' is-on' : ''}`}
          onClick={() => { setWalking(w => !w); if (!walking) setPicked(1); }}
          aria-label={walking ? labels.walkStop : labels.walk}
          disabled={narrating}
        >
          {walking
            ? <Pause size={13} strokeWidth={2.6} aria-hidden />
            : <Play size={13} strokeWidth={2.6} aria-hidden />}
          <span>{walking ? labels.walkStop : labels.walk}</span>
        </button>
      </div>

      <div className="lv-body">
        <Body spec={spec} active={active} onPick={pick} stepLabel={labels.step} total={total} />
      </div>

      {/* De onderschrift-regel is de regel van de les in één zin. Hij staat eronder en niet
          erboven: eerst het beeld, dan de woorden — dat is de hele reden dat dit plaatje
          bestaat. */}
      <figcaption>{spec.caption}</figcaption>

      {/* De extra uitleg van de opname hoort bij de stap die oplicht, dus staat hij in het
          plaatje en niet ernaast. Alleen tijdens een `vis`-cue: een noot van de vorige cue die
          onder een plaatje blijft hangen leest als een noot over dít plaatje. */}
      {narrating && cueNote && (
        <p className="lv-note">
          <Lightbulb size={13} strokeWidth={2.4} aria-hidden />
          <span>{cueNote}</span>
        </p>
      )}
    </figure>
  );
}

type BodyProps = {
  spec: Spec;
  /** 0 = alles, n = stap n, null = niets. */
  active: number | null;
  onPick: (n: number) => void;
  stepLabel: string;
  total: number;
};

function Body({ spec, ...rest }: BodyProps) {
  switch (spec.kind) {
    case 'zinslots':   return <Zinslots spec={spec} {...rest} />;
    case 'bijzin':     return <Bijzin spec={spec} {...rest} />;
    case 'vervoeging': return <Vervoeging spec={spec} {...rest} />;
    case 'bouwer':     return <Bouwer spec={spec} {...rest} />;
    case 'tijdbalk':   return <Tijdbalk spec={spec} {...rest} />;
    case 'sorteer':    return <Sorteer spec={spec} {...rest} />;
    case 'trap':       return <Trap spec={spec} {...rest} />;
    case 'paren':      return <Paren spec={spec} {...rest} />;
    case 'ruimte':     return <Ruimte spec={spec} {...rest} />;
    case 'frequentie': return <Frequentie spec={spec} {...rest} />;
    default: {
      const never: never = spec;
      throw new Error(`geen renderer voor lesplaatje ${JSON.stringify(never)}`);
    }
  }
}

/* ── gedeeld ──────────────────────────────────────────────────────────────── */

/** Is stap `n` aan de beurt? Stap 0 uit de cue betekent "alles". */
function on(active: number | null, n: number): boolean {
  return active === 0 || active === n;
}

/** De klasse van een stap: aan, of teruggetreden omdat een ándere stap aan is. */
function stepClass(active: number | null, n: number): string {
  if (on(active, n)) return ' is-on';
  return active !== null && active > 0 ? ' is-off' : '';
}

/**
 * Eén aanklikbare stap.
 *
 * Een `button` en geen `div` met een onClick: dit is de enige manier om met een toetsenbord
 * door het plaatje te lopen, en een plaatje dat alleen met een muis werkt is voor de helft van
 * deze doelgroep — die het portaal op een telefoon met een screenreader gebruikt — geen plaatje.
 */
function Step({
  n, active, onPick, stepLabel, total, className = '', children,
}: {
  n: number;
  active: number | null;
  onPick: (n: number) => void;
  stepLabel: string;
  total: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`lv-step ${className}${stepClass(active, n)}`}
      onClick={() => onPick(n)}
      aria-pressed={on(active, n)}
      aria-label={stepLabel.replace('{n}', String(n)).replace('{total}', String(total))}
    >
      {children}
    </button>
  );
}

/* ── de zinsbalk: waar staat het werkwoord? ───────────────────────────────── */

/**
 * Genummerde vakjes met de woorden erin, één rij per zin.
 *
 * Dit is het plaatje waar blok B om draait, en de vorm ervan draagt de hele regel: de plaatsen
 * zijn *vakjes* en geen woorden, dus "Mijn oude buurvrouw" is één vakje met een 1 erboven. Dat
 * is de enige manier om te laten zien dat plaats twee niet het tweede woord is — de fout die
 * volgens de docent het vaakst gemaakt wordt.
 *
 * Het werkwoord is navy en de rest niet. Eén kleur voor één ding: in elke rij van elke les
 * kijk je naar het navy vakje en zie je meteen waar het staat.
 */
function Zinslots({
  spec, active, onPick, stepLabel, total,
}: BodyProps & { spec: Extract<Spec, { kind: 'zinslots' }> }) {
  return (
    <div className="lv-rows">
      {spec.rows.map((row, i) => (
        <Step
          key={i}
          n={i + 1}
          active={active}
          onPick={onPick}
          stepLabel={stepLabel}
          total={total}
          className={`lv-row${row.wrong ? ' is-wrong' : ''}`}
        >
          {row.label && (
            <span className="lv-row-label">
              {row.wrong
                ? <X size={12} strokeWidth={3} aria-hidden />
                : <Check size={12} strokeWidth={3} aria-hidden />}
              {row.label}
            </span>
          )}
          <SlotStrip row={row} />
          {row.note && <span className="lv-row-note">{row.note}</span>}
        </Step>
      ))}
    </div>
  );
}

function SlotStrip({ row }: { row: SlotRow }) {
  return (
    <span className="lv-strip">
      {row.slots.map((slot, i) => (
        <span
          key={i}
          className={`lv-slot lv-${slot.role}${
            row.swap && slot.place !== null && row.swap.includes(slot.place) ? ' is-moved' : ''
          }`}
        >
          {/* Het plaatsnummer boven het vakje. Een voegwoord heeft er geen, en dat gat is
              informatie: het staat buiten de nummering. */}
          <span className="lv-place">{slot.place ?? '·'}</span>
          <span className="lv-word">{slot.text}</span>
          {slot.tag && <span className="lv-tag">{slot.tag}</span>}
        </span>
      ))}
    </span>
  );
}

/* ── de bijzin: het werkwoord schuift naar achter ─────────────────────────── */

/**
 * Hoofdzin · voegwoord · bijzin, met het werkwoord aan het eind van de bijzin.
 *
 * De vorm is een balk in drie stukken, want dat is de vorm van de zin. Het werkwoord staat
 * rechts in navy, met een pijl vanaf de plek waar het in de losse zin stond — die pijl ís de
 * regel. De losse zin staat eronder als bewijs: "Ik ben ziek" wordt "… omdat ik ziek ben".
 */
function Bijzin({
  spec, active, onPick, stepLabel, total,
}: BodyProps & { spec: Extract<Spec, { kind: 'bijzin' }> }) {
  return (
    <div className="lv-bijzin">
      <div className="lv-bz-strip">
        <Step n={1} active={active} onPick={onPick} stepLabel={stepLabel} total={total} className="lv-bz-main">
          <span className="lv-bz-kick">hoofdzin</span>
          <span className="lv-word">{spec.main}</span>
        </Step>

        <Step n={2} active={active} onPick={onPick} stepLabel={stepLabel} total={total} className="lv-bz-hinge">
          <span className="lv-bz-kick">voegwoord</span>
          <span className="lv-word">{spec.hinge}</span>
        </Step>

        <Step n={3} active={active} onPick={onPick} stepLabel={stepLabel} total={total} className="lv-bz-sub">
          <span className="lv-bz-kick">bijzin — werkwoord achteraan</span>
          <span className="lv-bz-inner">
            <span className="lv-slot lv-rest"><span className="lv-word">{spec.sub.front}</span></span>
            <span className="lv-bz-arrow" aria-hidden>
              <ArrowRight size={14} strokeWidth={2.6} className="rtl-flip" />
            </span>
            <span className="lv-slot lv-werkwoord"><span className="lv-word">{spec.sub.verb}</span></span>
          </span>
        </Step>
      </div>

      {spec.plain && (
        <p className="lv-bz-plain">
          <span>los</span> {spec.plain}
        </p>
      )}
      {spec.note && <p className="lv-body-note">{spec.note}</p>}
    </div>
  );
}

/* ── de vervoegingstabel: stam plus uitgang ───────────────────────────────── */

/**
 * De persoon links, de vorm rechts, en de uitgang apart gezet.
 *
 * De uitgang is een eigen stukje in een eigen kleur, want dát is wat er verandert. Als
 * "werkt" één woord is, moet je zelf zien waar de -t vandaan komt; los erachter is het een
 * blokje dat er bij hoort of niet — en "ik werk" is dan zichtbaar het geval waar er géén
 * blokje staat, in plaats van een uitzondering die je uit je hoofd leert.
 */
function Vervoeging({
  spec, active, onPick, stepLabel, total,
}: BodyProps & { spec: Extract<Spec, { kind: 'vervoeging' }> }) {
  return (
    <div className="lv-verv">
      <p className="lv-verv-top">
        <b>{spec.infinitive}</b>
        {spec.stem && (
          <>
            <ArrowRight size={13} strokeWidth={2.6} className="rtl-flip" aria-hidden />
            <span>stam: <b>{spec.stem}</b></span>
          </>
        )}
      </p>
      <div className="lv-verv-rows">
        {spec.rows.map((row, i) => (
          <Step
            key={i}
            n={i + 1}
            active={active}
            onPick={onPick}
            stepLabel={stepLabel}
            total={total}
            className="lv-verv-row"
          >
            <span className="lv-verv-person">{row.person}</span>
            <span className="lv-verv-form">
              <span className="lv-verv-base">{row.base}</span>
              {row.ending
                ? <span className="lv-verv-end">{row.ending}</span>
                : <span className="lv-verv-end is-empty" aria-label="geen uitgang">—</span>}
            </span>
            {row.note && <span className="lv-verv-note">{row.note}</span>}
          </Step>
        ))}
      </div>
    </div>
  );
}

/* ── de bouwer: hoe zet je de vorm in elkaar? ─────────────────────────────── */

/**
 * Blokken die aan elkaar geklikt worden: ge + werk + t → gewerkt.
 *
 * Een lege, gedempte plek is een geldig blok en dat is het hele punt bij les 17: "betaald"
 * heeft géén ge-, en een leeg vak met "geen ge-" eronder zegt dat, terwijl een weggelaten blok
 * niets zegt. De laatste stap is het resultaat, want dat is waar de bouw naartoe loopt.
 */
function Bouwer({
  spec, active, onPick, stepLabel, total,
}: BodyProps & { spec: Extract<Spec, { kind: 'bouwer' }> }) {
  return (
    <div className="lv-bouwer">
      <p className="lv-verv-top"><b>{spec.from}</b></p>

      <div className="lv-blocks">
        {spec.parts.map((part, i) => (
          <Step
            key={i}
            n={i + 1}
            active={active}
            onPick={onPick}
            stepLabel={stepLabel}
            total={total}
            className={`lv-block${part.muted ? ' is-muted' : ''}`}
          >
            <span className="lv-word">{part.text || '—'}</span>
            <span className="lv-tag">{part.tag}</span>
          </Step>
        ))}
        <span className="lv-eq" aria-hidden>=</span>
        <Step
          n={spec.parts.length + 1}
          active={active}
          onPick={onPick}
          stepLabel={stepLabel}
          total={total}
          className="lv-result"
        >
          <span className="lv-word">{spec.result}</span>
        </Step>
      </div>

      {spec.more && spec.more.length > 0 && (
        <ul className="lv-more">
          {spec.more.map((m, i) => (
            <li key={i}>
              <span>{m.from}</span>
              <ArrowRight size={12} strokeWidth={2.6} className="rtl-flip" aria-hidden />
              <b>{m.result}</b>
            </li>
          ))}
        </ul>
      )}
      {spec.note && <p className="lv-body-note">{spec.note}</p>}
    </div>
  );
}

/* ── de tijdbalk: wanneer gebeurt het? ────────────────────────────────────── */

/**
 * Een rail van gisteren naar later, met per punt de vorm die daar hoort.
 *
 * **Verticaal, en dat is een reparatie.** Horizontaal gemeten viel de as bij vijf punten in
 * twee rijen, en de lijn liep alleen achter de eerste rij door: wat overbleef was een raster dat
 * zich voordeed als een tijdlijn. Verticaal is de rail altijd één lijn, bij elke breedte, en
 * hij hoeft niet vast te staan op LTR — van boven naar beneden betekent in elke taal
 * "daarna".
 */
function Tijdbalk({
  spec, active, onPick, stepLabel, total,
}: BodyProps & { spec: Extract<Spec, { kind: 'tijdbalk' }> }) {
  return (
    <div className="lv-tijd">
      <span className="lv-tijd-rail" aria-hidden />
      <div className="lv-tijd-points">
        {spec.points.map((point, i) => (
          <Step
            key={i}
            n={i + 1}
            active={active}
            onPick={onPick}
            stepLabel={stepLabel}
            total={total}
            className={`lv-tijd-p${point.here ? ' is-here' : ''}`}
          >
            <span className="lv-tijd-dot" aria-hidden />
            <span className="lv-tijd-when">{point.when}</span>
            <span className="lv-word">{point.form}</span>
            {point.note && <span className="lv-row-note">{point.note}</span>}
          </Step>
        ))}
      </div>
    </div>
  );
}

/* ── de sorteerbakken: in welk bakje hoort dit? ───────────────────────────── */

/**
 * Twee of drie bakjes met woorden erin, en de uitzonderingen apart.
 *
 * De uitzonderingen staan in een eigen vak met zoveel woorden erbij. In een bakje gegooid
 * zouden ze de regel van dat bakje tegenspreken — en dan is elk bakje een gok in plaats van
 * een regel.
 */
function Sorteer({
  spec, active, onPick, stepLabel, total,
}: BodyProps & { spec: Extract<Spec, { kind: 'sorteer' }> }) {
  return (
    <div className="lv-sorteer">
      <div className="lv-buckets" data-n={spec.buckets.length}>
        {spec.buckets.map((bucket, i) => (
          <Step
            key={i}
            n={i + 1}
            active={active}
            onPick={onPick}
            stepLabel={stepLabel}
            total={total}
            className="lv-bucket"
          >
            <span className="lv-bucket-name">{bucket.name}</span>
            {bucket.rule && <span className="lv-bucket-rule">{bucket.rule}</span>}
            <span className="lv-chips">
              {bucket.words.map((word, j) => (
                <span key={j} className="lv-chip">{word}</span>
              ))}
            </span>
          </Step>
        ))}
      </div>

      {spec.exceptions && (
        <Step
          n={spec.buckets.length + 1}
          active={active}
          onPick={onPick}
          stepLabel={stepLabel}
          total={total}
          className="lv-exc"
        >
          <span className="lv-chips">
            {spec.exceptions.words.map((word, j) => (
              <span key={j} className="lv-chip">{word}</span>
            ))}
          </span>
          <span className="lv-exc-note">{spec.exceptions.note}</span>
        </Step>
      )}
    </div>
  );
}

/* ── de trap: hoeveel meer? ───────────────────────────────────────────────── */

/**
 * Oplopende balken: groot · groter · het grootst.
 *
 * De hoogte is de betekenis. Drie chips naast elkaar zouden drie woorden zijn; drie balken die
 * oplopen zijn een trap, en dan hoef je "vergrotende trap" niet meer uit te leggen.
 */
function Trap({
  spec, active, onPick, stepLabel, total,
}: BodyProps & { spec: Extract<Spec, { kind: 'trap' }> }) {
  return (
    <div className="lv-trap">
      <div className="lv-trap-steps" data-n={spec.steps.length}>
        {spec.steps.map((step, i) => (
          <Step
            key={i}
            n={i + 1}
            active={active}
            onPick={onPick}
            stepLabel={stepLabel}
            total={total}
            className="lv-trap-step"
          >
            {/* De balk groeit met de trap: 1 van n, 2 van n, n van n. Als CSS-variabele en niet
                als hoogte, want smal wordt dezelfde trap een bréédte — zie `.lv-trap-bar`. Een
                tweede getal in de CSS zou hetzelfde feit twee keer opschrijven. */}
            <span
              className="lv-trap-bar"
              style={{ '--lv-trap': Math.round(((i + 1) / spec.steps.length) * 100) } as React.CSSProperties}
              aria-hidden
            />
            <span className="lv-word">{step.form}</span>
            <span className="lv-tag">{step.tag}</span>
            <span className="lv-row-note">{step.example}</span>
          </Step>
        ))}
      </div>

      {spec.irregular && spec.irregular.length > 0 && (
        <div className="lv-irr">
          <span className="lv-irr-kick">niet volgens de regel</span>
          <ul>
            {spec.irregular.map((row, i) => (
              <li key={i}>
                <span>{row.base}</span>
                <b>{row.comp}</b>
                <b>{row.sup}</b>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ── de paren: welke twee woorden horen vast bij elkaar? ──────────────────── */

/**
 * Twee chips die in elkaar grijpen, met het voorbeeld ernaast.
 *
 * De twee helften raken elkaar — geen ruimte, één afgeronde vorm samen. Dat is de hele
 * boodschap bij "wachten op": het zijn niet twee woorden die je los leert, het is één woord met
 * een naad erin.
 */
function Paren({
  spec, active, onPick, stepLabel, total,
}: BodyProps & { spec: Extract<Spec, { kind: 'paren' }> }) {
  return (
    <div className="lv-paren">
      <div className="lv-paren-heads" aria-hidden>
        <span>{spec.heads[0]}</span>
        <span>{spec.heads[1]}</span>
      </div>
      <div className="lv-paren-rows">
        {spec.pairs.map((pair, i) => (
          <Step
            key={i}
            n={i + 1}
            active={active}
            onPick={onPick}
            stepLabel={stepLabel}
            total={total}
            className="lv-paar"
          >
            <span className="lv-paar-pair">
              <span className="lv-paar-l">{pair.left}</span>
              <span className="lv-paar-r">{pair.right}</span>
            </span>
            <span className="lv-row-note">{pair.example}</span>
          </Step>
        ))}
      </div>
      {spec.note && <p className="lv-body-note">{spec.note}</p>}
    </div>
  );
}

/* ── de ruimte: waar ligt het? ────────────────────────────────────────────── */

/**
 * Een doos en een stip, en het voorzetsel is waar de stip ligt.
 *
 * Dit is het enige plaatje dat iets *afbeeldt*, en het is de reden dat het geen illustratie is:
 * een doos en een stip zijn twee rechthoeken uit CSS, geen tekening, en de plaatsing van de
 * stip is niet decoratief — het is de betekenis van het woord. "Naast" uitleggen in tekst kost
 * een zin die je moet lezen in een taal die je nog niet kent; hier zie je het.
 *
 * De richting staat vast op LTR — dat regelt de `figure` voor het hele plaatje — en dat is hier
 * niet cosmetisch: "naast" en "voor" hebben een vaste kant, en meespiegelen zou van "voor" stil
 * "achter" maken.
 */
function Ruimte({
  spec, active, onPick, stepLabel, total,
}: BodyProps & { spec: Extract<Spec, { kind: 'ruimte' }> }) {
  return (
    <div className="lv-ruimte">
      {spec.items.map((item, i) => (
        <Step
          key={i}
          n={i + 1}
          active={active}
          onPick={onPick}
          stepLabel={stepLabel}
          total={total}
          className="lv-rm"
        >
          <span className={`lv-rm-scene is-${item.spot}`} aria-hidden>
            <span className="lv-rm-box" />
            <span className="lv-rm-dot" />
            {item.spot === 'tussen' && <span className="lv-rm-box2" />}
          </span>
          <span className="lv-word">{item.word}</span>
          <span className="lv-row-note">{item.example}</span>
        </Step>
      ))}
    </div>
  );
}

/* ── de frequentie-as: hoe vaak? ──────────────────────────────────────────── */

/**
 * Een as van nooit naar altijd, met de woorden op hun plek.
 *
 * "Soms" en "vaak" zijn in elke taal anders verdeeld, en een lijst met vertalingen lost dat
 * niet op — een plek op een as wel. De percentages zijn geen feit over de taal maar de ordening
 * die de docent aanhoudt, en daarom staat er geen getal bij: alleen de plek.
 */
function Frequentie({
  spec, active, onPick, stepLabel, total,
}: BodyProps & { spec: Extract<Spec, { kind: 'frequentie' }> }) {
  return (
    <div className="lv-freq">
      <div className="lv-freq-axis">
        <span className="lv-freq-line" aria-hidden />
        {spec.words.map((word, i) => (
          <span key={i} className="lv-freq-mark" style={{ left: `${word.pct}%` }} aria-hidden />
        ))}
        <span className="lv-freq-ends" aria-hidden>
          <span>0%</span>
          <span>100%</span>
        </span>
      </div>
      <div className="lv-freq-rows">
        {spec.words.map((word, i) => (
          <Step
            key={i}
            n={i + 1}
            active={active}
            onPick={onPick}
            stepLabel={stepLabel}
            total={total}
            className="lv-freq-row"
          >
            <span className="lv-freq-bar" aria-hidden>
              <i style={{ width: `${Math.max(word.pct, 3)}%` }} />
            </span>
            <span className="lv-word">{word.word}</span>
            <span className="lv-row-note">{word.example}</span>
          </Step>
        ))}
      </div>
      {spec.note && <p className="lv-body-note">{spec.note}</p>}
    </div>
  );
}
