'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Headphones, Pause, Play, TextSelect } from 'lucide-react';
import { useLessonProgress } from './LessonProgressScope';
import { type NarrationCue, useNarrationSetter } from './NarrationScope';

/** Eén woord van het script met zijn starttijd. Spiegelt `lesson_narration.word_times`. */
export type NarrationWord = { w: string; t: number; p: number };

export type NarrationLabels = {
  kicker: string;
  play: string;
  pause: string;
  speed: string;
  pendingNote: string;
  /** De meeleesschakelaar, en de twee standen die in de statusregel van de kaart staan. */
  followLabel: string;
  followOn: string;
  followOff: string;
  /** "nu: {what}" — welk deel van de les de stem nu bespreekt. */
  nowAt: string;
  back10: string;
  fwd10: string;
  chapters: string;
  wave: string;
};

type Props = {
  audioUrl: string;
  /** Uit de database, zodat de kaart een duur toont vóór de browser het bestand heeft. */
  durationSeconds: number | null;
  /** Op tijd gesorteerd. Leeg = de opname markeert niets. */
  cues: NarrationCue[];
  /** Het script woord voor woord. Leeg = geen meelezen, en dan is er geen schakelaar. */
  words: NarrationWord[];
  /** Per cue-id hoe dat deel van de les heet, voor de "nu:"-regel op de kaart. */
  cueNames: Record<string, string>;
  reviewed: boolean;
  labels: NarrationLabels;
  /**
   * `hero` zet de opname als blok bovenaan de les (mockup van de eigenaar, 08-09): één groot
   * vlak met de speelknop erin, en de regelbalk eronder. `card` is de compacte kaart naast de
   * lestitel, die de preview in `/admin/lessen` gebruikt.
   */
  layout?: 'card' | 'hero';
  /**
   * De uitleg die ín het blok staat (`LessonStage`). Server-gerenderd doorgegeven, want de
   * dia's komen uit de items en die kent de pagina.
   */
  children?: React.ReactNode;
};

const RATES = [1, 1.25, 1.5];
const FOLLOW_KEY = 'les-meelezen';

function clock(s: number): string {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

/** Het laatste woord dat al begonnen is, of -1 vóór het eerste. Binair, want dit loopt per frame. */
function wordAt(words: NarrationWord[], time: number): number {
  let lo = 0;
  let hi = words.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (words[mid].t <= time) { found = mid; lo = mid + 1; }
    else hi = mid - 1;
  }
  return found;
}

/**
 * De ingesproken uitleg van een les: de speler, en het meelezen eronder.
 *
 * ── DE KAART IS NAVY, EN DAT IS EEN BESLISSING OVER WAT ZE IS ────────────────
 * Hij was een lichte `aside` in de rechterkolom naast de lestitel, met een hint van twee
 * regels erin. Dat las als een randverschijnsel — een kadertje naast de les. De uitleg
 * *ínspreken* is precies wat deze laag toevoegt, dus staat de kaart nu onder de inleiding in de
 * volle kolom, in navy: op deze pagina is navy het niveau "dit is van ons, dit is de docent".
 * De hint is weg, want de kaart doet nu wat de hint uitlegde, en één oranje accent — de
 * speelknop — is het enige oranje in het beeld.
 *
 * ── DRIE DINGEN DIE HIJ VERTELT, EN GEEN VIERDE ──────────────────────────────
 *   1. hoe lang het duurt en waar je bent    — `0:58 / 1:28`
 *   2. of het meelezen aan staat             — `· meelezen aan`
 *   3. waar de stem nu is                    — `nu: de regel`
 * Die derde is de reden dat dit component de cue-namen krijgt in plaats van alleen de id's: de
 * markering op de pagina laat zien *dat* er iets oplicht, maar als je naar de speler kijkt en
 * niet naar de pagina, weet je niet wat. Eén regel tekst is dat verschil.
 *
 * ── HET MEELEZEN LOOPT OP requestAnimationFrame, NIET OP timeupdate ──────────
 * `timeupdate` vuurt ~4× per seconde. Dat is genoeg voor een balk en voor acht element-cues,
 * en zichtbaar te weinig voor een woordmarkering: de markering blijft dan één woord achter en
 * springt met twee woorden mee. Een rAF-lus draait alleen zolang er audio speelt en zet state
 * alleen als de woordindex écht verandert, dus hij hertekent net zo vaak als de stem woorden
 * zegt — en niet 60× per seconde.
 */
export default function LessonNarration({
  audioUrl, durationSeconds, cues, words, cueNames, reviewed, labels, layout = 'card', children,
}: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(durationSeconds ?? 0);
  const [rateIdx, setRateIdx] = useState(0);
  const [wordIdx, setWordIdx] = useState(-1);
  const [activeCueId, setActiveCueId] = useState<string | null>(null);
  const hasWords = words.length > 0;
  const [follow, setFollow] = useState(hasWords);

  const setActive = useNarrationSetter();
  const { report } = useLessonProgress();
  /* De laatst gepubliceerde cue, in een ref en niet in state: dit wordt per frame vergeleken en
     mag zelf geen render veroorzaken. De render gebeurt in de context, en alleen als de cue
     verandert. `activeCueId` ernaast is puur voor de "nu:"-regel op de kaart zelf. */
  const cueRef = useRef<NarrationCue | null>(null);

  /* De meeleesvoorkeur overleeft de pagina: wie hem uitzet wil hem in les 12 ook uit hebben. */
  useEffect(() => {
    if (!hasWords) return;
    try {
      const saved = window.localStorage.getItem(FOLLOW_KEY);
      if (saved === '0') setFollow(false);
    } catch { /* privémodus: dan blijft de standaard staan */ }
  }, [hasWords]);

  const toggleFollow = useCallback(() => {
    setFollow(v => {
      const next = !v;
      try { window.localStorage.setItem(FOLLOW_KEY, next ? '1' : '0'); } catch { /* zie boven */ }
      return next;
    });
  }, []);

  /**
   * Welke cue hoort bij deze seconde: de laatste die al begonnen is.
   *
   * Lineair van achteren en geen binary search — het zijn acht cues. En spoelen werkt hierdoor
   * gratis mee: er is geen "volgende cue"-teller die uit de bocht kan vliegen als je terug
   * sleept, wat precies de bug is die een teller wel had gehad.
   */
  const syncCue = useCallback((time: number) => {
    let next: NarrationCue | null = null;
    for (let i = cues.length - 1; i >= 0; i -= 1) {
      if (cues[i].at <= time) { next = cues[i]; break; }
    }
    if (next?.id !== cueRef.current?.id || next?.at !== cueRef.current?.at) {
      cueRef.current = next;
      setActive(next);
      setActiveCueId(next?.id ?? null);
    }
  }, [cues, setActive]);

  /* Pauze laat de markering staan — je pauzeert juist om te kijken naar wat er oplicht.
     Aan het eind gaat hij uit, want dan is er niets meer aan de hand. */
  const clearCue = useCallback(() => {
    cueRef.current = null;
    setActive(null);
    setActiveCueId(null);
    setWordIdx(-1);
  }, [setActive]);

  /**
   * De lus die de tijd, de cue en het woord bijhoudt terwijl er audio speelt.
   *
   * Eén lus voor alle drie, en niet drie handlers: ze lezen alle drie dezelfde `currentTime`,
   * en drie bronnen voor één klok is hoe de balk en de markering uit elkaar gaan lopen.
   */
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = () => {
      const el = audioRef.current;
      if (el) {
        const time = el.currentTime;
        setCurrent(time);
        syncCue(time);
        if (hasWords) setWordIdx(prev => {
          const next = wordAt(words, time);
          return next === prev ? prev : next;
        });
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [playing, syncCue, words, hasWords]);

  const toggle = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
  }, []);

  const cycleRate = useCallback(() => {
    const next = (rateIdx + 1) % RATES.length;
    setRateIdx(next);
    if (audioRef.current) audioRef.current.playbackRate = RATES[next];
  }, [rateIdx]);

  /** Spoelen naar een seconde, uit de balk en uit het meeleespaneel. */
  const seekTo = useCallback((time: number) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, time);
    setCurrent(el.currentTime);
    syncCue(el.currentTime);
    if (hasWords) setWordIdx(wordAt(words, el.currentTime));
  }, [syncCue, words, hasWords]);

  /** Tien seconden terug of vooruit — de twee knoppen naast play (mockup eigenaar, 08-09). */
  const nudge = useCallback((delta: number) => {
    const el = audioRef.current;
    if (!el) return;
    const max = Number.isFinite(el.duration) ? el.duration : Infinity;
    seekTo(Math.min(Math.max(el.currentTime + delta, 0), max));
  }, [seekTo]);

  /* Klikken op de balk spoelt. Een `range`-input zou dit toegankelijker maken, maar die is met
     de tokens van dit systeem niet te stylen zonder `appearance: none` en drie
     vendor-pseudo-elementen; de knop en de tijd blijven daarom het toetsenbordpad. */
  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current;
    if (!el || !Number.isFinite(el.duration)) return;
    const box = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - box.left) / box.width;
    seekTo(Math.min(Math.max(ratio, 0), 1) * el.duration);
  }, [seekTo]);

  /**
   * Het script in zinnen, voor de regel onder het lesblok.
   *
   * Niet het hele script maar de zin die nú klinkt, met het woord dat nú gezegd wordt eruit
   * gelicht (verzoek van de eigenaar, 08-09). Het meeleespaneel van 250 woorden was het
   * antwoord op "wat zei ze daar"; deze regel is het antwoord op "waar zijn we", en die
   * hoort in het blok en niet in een tweede kolom eronder.
   *
   * Zinsgrens = een woord dat op leesteken eindigt, óf de laatste van een alinea. Dat is de
   * hele heuristiek, en hij mag zo grof zijn omdat de uitslag alleen bepaalt hoeveel woorden er
   * op één regel staan.
   */
  const lines = useMemo(() => {
    const out: { from: number; to: number }[] = [];
    let start = 0;
    words.forEach((word, i) => {
      const endsSentence = /[.!?…:]["'”’)]?$/.test(word.w);
      const lastOfPara = words[i + 1] ? words[i + 1].p !== word.p : true;
      if (endsSentence || lastOfPara) {
        out.push({ from: start, to: i });
        start = i + 1;
      }
    });
    return out;
  }, [words]);

  /**
   * De staafjes van de balk.
   *
   * **Dit is geen golfvorm.** We hebben geen amplitudes van het bestand, en een golfvorm
   * tekenen die niet uit de opname komt is een plaatje dat iets belooft wat het niet weet — op
   * een site waarvan de hele claim is dat er niets verzonnen wordt, is dat de verkeerde
   * afkorting. De hoogte is wél echt: het is de woorddichtheid per vakje uit
   * `lesson_narration.word_times`, dus je ziet waar snel gepraat wordt en waar een stilte
   * valt. Zonder woordtijden zijn er geen staafjes en valt de kaart terug op de balk die hij
   * had.
   */
  const bars = useMemo(() => {
    const N = 44;
    if (!words.length || duration <= 0) return [];
    const buckets = new Array<number>(N).fill(0);
    words.forEach(w => {
      const i = Math.min(N - 1, Math.max(0, Math.floor((w.t / duration) * N)));
      buckets[i] += 1;
    });
    const max = Math.max(...buckets);
    if (max === 0) return [];
    return buckets.map(b => 0.3 + 0.7 * (b / max));
  }, [words, duration]);

  /**
   * De hoofdstukken: de cues die een naam hebben. Klikken spoelt erheen.
   *
   * De namen van de vormkaarten staan in kapitalen in de database (`GEWONE VOLGORDE`), omdat de
   * kaart ze zelf zo zet. Tussen "het plaatje, stap 1" en "de regel" schreeuwt dat, dus een
   * naam die geen kleine letter heeft gaat naar onderkast. Alleen die: een naam mét kleine
   * letters is zoals de docent hem geschreven heeft en blijft staan.
   */
  const chapters = useMemo(
    () => cues
      .map(cue => {
        const raw = cueNames[cue.id];
        return { id: cue.id, at: cue.at, name: raw && !/[a-z]/.test(raw) ? raw.toLowerCase() : raw };
      })
      .filter((c): c is { id: string; at: number; name: string } => Boolean(c.name)),
    [cues, cueNames],
  );

  const line = wordIdx >= 0
    ? lines.find(l => wordIdx >= l.from && wordIdx <= l.to) ?? null
    : null;

  const pct = duration > 0 ? Math.min((current / duration) * 100, 100) : 0;
  /** Eén keer gestart blijft gestart: de sluier hoort niet terug te komen bij een pauze. */
  const started = playing || current > 0;
  const nowName = activeCueId ? cueNames[activeCueId] : undefined;

  return (
    <div className={`nar-wrap${layout === 'hero' ? ' is-hero' : ''}`}>
      {/* ── het opnameblok ──
          Eén vlak met de speelknop in het midden, zoals de mockup het zet. Het is geen
          videospeler en het doet niet alsof: het onderschrift noemt wat het is — een
          ingesproken uitleg met zijn duur — en niet "docentopname", want de stem is een
          stem en niet die van de docent. De tekst is van haar; dat zegt de les zelf al. */}
      {layout === 'hero' && (
        /* ── het lesblok ──
           Hier staat de uitleg zelf in, en die verspringt met de stem mee (`LessonStage`). Het
           blok is dus geen plaatje van een speler: het ís de les, met de balk eronder.

           Vóór de eerste keer spelen ligt er een sluier met één knop over — dezelfde
           "druk op play"-laag die het KNM-portaal heeft. Hij laat de eerste dia zien in plaats
           van hem te verbergen, want dat is de belofte: dit gaat straks meelopen. De sluier
           laat kliks door (`pointer-events`), zodat je ook gewoon kunt gaan lezen. */
        <div className={`nar-hero${children ? '' : ' is-empty'}`}>
          {children}

          {!started && (
            <div className="nar-veil">
              <button
                type="button"
                onClick={toggle}
                className="nar-bigplay"
                aria-label={labels.play}
              >
                <Play size={26} strokeWidth={2.4} aria-hidden />
              </button>
              <p className="nar-cap">{labels.kicker} · {clock(duration)}</p>
            </div>
          )}
        </div>
      )}

      {/* ── de balk ──
          Mockup van de eigenaar (08-09): −10 · play · +10 links, de titel met de staafjesbalk
          in het midden, de tijd en de twee schakelaars rechts, en de hoofdstukken op een eigen
          regel. Compact gebleven — het is één rij plus die regel, niet een tweede blok.

          Wat er níet in staat is de chip "door Marieke": de stem is een ingesproken uitleg
          (ElevenLabs), niet de docent zelf. Haar naam op een stem zetten die niet van haar is,
          is precies de claim die dit product niet mag doen. De tekst is van haar, en dat zegt
          de les al. */}
      <aside className="nar-card">
        <div className="nar-ctrls">
          <button
            type="button"
            onClick={() => nudge(-10)}
            className="nar-jump"
            aria-label={labels.back10}
          >
            −10
          </button>
          <button
            type="button"
            onClick={toggle}
            className="nar-play"
            aria-label={playing ? labels.pause : labels.play}
          >
            {playing
              ? <Pause size={19} strokeWidth={2.6} aria-hidden />
              : <Play size={19} strokeWidth={2.6} aria-hidden />}
          </button>
          <button
            type="button"
            onClick={() => nudge(10)}
            className="nar-jump"
            aria-label={labels.fwd10}
          >
            +10
          </button>
        </div>

        <div className="nar-mid">
          <span className="nar-kicker">
            <Headphones size={13} strokeWidth={2.6} aria-hidden />
            {labels.kicker}
          </span>

          {bars.length > 0 ? (
            <div className="nar-wave" onClick={seek} role="presentation" aria-label={labels.wave}>
              {bars.map((h, i) => {
                const from = (i / bars.length) * duration;
                const to = ((i + 1) / bars.length) * duration;
                const state = current >= to ? ' is-said' : current >= from ? ' is-now' : '';
                return <i key={i} className={state} style={{ height: `${Math.round(h * 100)}%` }} />;
              })}
            </div>
          ) : (
            <div className="nar-bar" onClick={seek} role="presentation">
              <i style={{ width: `${pct}%` }} />
            </div>
          )}

          {/* Op een eigen regel, want een deelnaam kan lang zijn — zie `.nar-now`. */}
          {nowName && <span className="nar-now">{labels.nowAt.replace('{what}', nowName)}</span>}

          {/* De zin die nu klinkt, met het woord dat nu gezegd wordt eruit gelicht (verzoek van
              de eigenaar, 08-09). Niet het hele script: dat is een tweede tekstkolom, en de
              vraag hier is "waar zijn we", niet "wat staat er". `aria-hidden`, want een
              schermlezer die elke 300 ms een halve zin herhaalt is onbruikbaar — de tekst zelf
              staat in het meeleespaneel van de compacte opstelling. */}
          {line && follow && (
            <p className="nar-line" aria-hidden>
              {words.slice(line.from, line.to + 1).map((word, i) => {
                const idx = line.from + i;
                return (
                  <span key={idx} className={idx === wordIdx ? 'is-now' : idx < wordIdx ? 'is-said' : ''}>
                    {word.w}
                  </span>
                );
              })}
            </p>
          )}
        </div>

        <div className="nar-side">
          {/* Monospace en tabulaire cijfers: de tijd loopt, en een springende breedte onder een
              lopende opname leest als een haperende speler. */}
          <span className="nar-time">{clock(current)} / {clock(duration)}</span>
          <div className="nar-btns">
            <button type="button" onClick={cycleRate} className="nar-rate" aria-label={labels.speed}>
              {RATES[rateIdx]}×
            </button>
            {hasWords && (
              <button
                type="button"
                onClick={toggleFollow}
                className={`nar-follow${follow ? ' is-on' : ''}`}
                aria-pressed={follow}
                aria-label={labels.followLabel}
              >
                <TextSelect size={14} strokeWidth={2.4} aria-hidden />
                <span>{follow ? labels.followOn : labels.followOff}</span>
              </button>
            )}
          </div>
        </div>

        {/* De hoofdstukken staan op één rij die zijwaarts schuift en niet afbreekt: een les
            heeft er acht of negen, en drie regels pillen maakt van de balk een blok.

            Zonder tijdstip (verzoek eigenaar, 08-09): de pil is een sprong naar een onderdeel,
            en "0:13" is niet wat je zoekt als je naar de regel wil. De tijd staat rechts in de
            balk, één keer. */}
        {chapters.length > 0 && (
          <div className="nar-chaps">
            <span className="nc-lab">{labels.chapters}</span>
            <div className="nc-row">
              {chapters.map(c => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => seekTo(c.at)}
                  className={`nc-pill${activeCueId === c.id ? ' is-at' : ''}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* De waarschuwing hoort tegen de kaart aan en niet onder het meeleesvlak: hij gaat over
          de ópname, en onderaan een blok tekst van 250 woorden leest hij als een noot over die
          tekst. */}
      {!reviewed && <p className="nar-pending">{labels.pendingNote}</p>}

      {/* Het meeleespaneel is er alleen in de compacte opstelling. In het lesblok doet de
          regel onder de dia dat werk in één regel — zie `.nar-line`. Het hele script tussen de
          opname en "Wat je leert" duwde die tweedeling van het eerste beeld af. */}
      {hasWords && follow && layout === 'card' && (
        <FollowAlong words={words} activeIndex={wordIdx} playing={playing} onSeek={seekTo} />
      )}

      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); clearCue(); report({ listened: true }); }}
        /* De rAF-lus doet het werk tijdens het spelen; deze twee zijn voor de standen waarin
           die lus niet draait — gepauzeerd spoelen, en de eerste render. */
        onSeeked={e => {
          setCurrent(e.currentTarget.currentTime);
          syncCue(e.currentTarget.currentTime);
          if (hasWords) setWordIdx(wordAt(words, e.currentTarget.currentTime));
        }}
        onLoadedMetadata={e => {
          if (Number.isFinite(e.currentTarget.duration)) setDuration(e.currentTarget.duration);
        }}
      />
    </div>
  );
}

/**
 * Het meeleespaneel: het hele script, met het woord dat nu klinkt onder de markeerstift.
 *
 * ── WAAROM HET SCRIPT EN NIET DE LESPAGINA ───────────────────────────────────
 * De vraag "welk woord zegt ze nu" is alleen te beantwoorden over de tekst die de stem
 * gekregen heeft. De uitleg op de pagina is *een andere tekst* — korter, met andere
 * woordkeuze — en woorden daarin aanwijzen zou tekstmatching betekenen, precies de 452 regels
 * heuristiek waar de cue-markers voor in de plaats zijn gekomen. De pagina krijgt de
 * grove korrel (welk élement), dit paneel de fijne (welk wóord).
 *
 * ── DRIE STANDEN PER WOORD ───────────────────────────────────────────────────
 * gezegd (gedempt) · nu (markeerstift) · nog niet (normaal). Dat de gezegde woorden
 * *terugtreden* en niet oplichten is wat je oog naar de markering trekt in plaats van naar het
 * spoor erachter.
 *
 * ── HET MEEROLLEN, MET EEN NOODREM ───────────────────────────────────────────
 * Het paneel rolt het actieve woord in beeld, maar stopt daarmee zodra de lezer zelf rolt —
 * anders vecht de scrollpositie met de hand die net omhoog wilde kijken. Vijf seconden na de
 * laatste eigen rol pakt hij het weer op; die vertraging is de reden dat het geen schakelaar
 * hoeft te zijn.
 */
function FollowAlong({
  words, activeIndex, playing, onSeek,
}: {
  words: NarrationWord[];
  activeIndex: number;
  playing: boolean;
  onSeek: (t: number) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLButtonElement>(null);
  const heldUntil = useRef(0);

  /** De woorden per alinea, zodat het paneel de regelval van het script houdt. */
  const paragraphs = useMemo(() => {
    const out: { p: number; from: number; words: NarrationWord[] }[] = [];
    words.forEach((word, i) => {
      const last = out[out.length - 1];
      if (last && last.p === word.p) last.words.push(word);
      else out.push({ p: word.p, from: i, words: [word] });
    });
    return out;
  }, [words]);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const onScroll = () => { heldUntil.current = Date.now() + 5000; };
    box.addEventListener('wheel', onScroll, { passive: true });
    box.addEventListener('touchmove', onScroll, { passive: true });
    return () => {
      box.removeEventListener('wheel', onScroll);
      box.removeEventListener('touchmove', onScroll);
    };
  }, []);

  useEffect(() => {
    if (!playing || activeIndex < 0) return;
    if (Date.now() < heldUntil.current) return;
    const box = boxRef.current;
    const mark = markRef.current;
    if (!box || !mark) return;
    /* Zelf rekenen en niet `scrollIntoView`: die rolt in sommige browsers ook de *pagina*, en
       dan springt de hele les mee bij elk woord. Dit raakt alleen dit vlak. */
    const target = mark.offsetTop - box.clientHeight / 2 + mark.offsetHeight / 2;
    if (Math.abs(target - box.scrollTop) > 24) {
      box.scrollTo({ top: target, behavior: 'smooth' });
    }
  }, [activeIndex, playing]);

  return (
    /* LTR, ook in een RTL-chrome: dit is het voorgelezen Nederlandse script. Meegespiegeld las
       het als ".plaatje het naar eerst Kijk" — de woorden in de verkeerde volgorde en de punt
       aan de verkeerde kant. */
    <div className="nar-read" ref={boxRef} dir="ltr">
      {paragraphs.map(para => (
        <p key={para.p}>
          {para.words.map((word, i) => {
            const idx = para.from + i;
            const state = idx === activeIndex ? 'is-now'
              : idx < activeIndex ? 'is-said'
              : '';
            return (
              <button
                key={idx}
                type="button"
                ref={idx === activeIndex ? markRef : undefined}
                className={`nar-w ${state}`}
                /* Elk woord is een spoelknop. Dat is het antwoord op "wat zei ze daar" zonder
                   de balk te hoeven mikken: je klikt op het woord en hoort het opnieuw. */
                onClick={() => onSeek(word.t)}
                tabIndex={-1}
              >
                {word.w}
              </button>
            );
          })}
        </p>
      ))}
    </div>
  );
}
