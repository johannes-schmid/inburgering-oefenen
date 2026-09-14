'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight, Check, RotateCcw, RefreshCw, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  practiceOrder,
  WORD_CARD_LANGS,
  WORD_CARD_LANG_LABEL,
  type LessonWord,
  type WordCardLang,
  type WordStatus,
} from '@/lib/lessons/words';

/**
 * De woordkaartendeck van de leerlaag.
 *
 * ── DEZELFDE KAART ALS KNM, EN WAT ER ANDERS BLIJFT ──────────────────────────
 * Overgenomen van `components/woordkaarten/WoordkaartDeck.tsx` in `knm-website` (besluit
 * eigenaar, 10-09): de foto links, de tekst rechts, en de uitspraak als een eigen blok met
 * *Normaal* en *Langzaam* eronder. Een kandidaat die van KNM naar A2 loopt hoort niet halverwege
 * een andere kaart te leren lezen — dat was de hele reden om de vorm te kopiëren in plaats van er
 * een eigen versie van te maken.
 *
 * Twee dingen blijven bewust anders, en beide komen uit de data:
 *
 * - **`usage` staat op de kaart.** Receptief of productief is het leerdoel van dít woord, en het
 *   is het enige wat deze kaarten hebben en de 366 KNM-kaarten niet (CLAUDE.md §3). KNM zet daar
 *   het woordsoort ("zelfstandig naamwoord"); dat leidt hij af uit het lidwoord en het zegt de
 *   kandidaat niets wat hij niet al ziet. De chip blijft dus `usage`.
 * - **De Nederlandse betekenis staat bóven de vertaling.** Dat is de kant die van de docent is;
 *   de vertaling is machinaal en zegt dat er zelf bij zolang `translationsReviewed` false is.
 *
 * ── DE FOTO BLIJFT STAAN ALS DE KAART OMDRAAIT ───────────────────────────────
 * Alleen het rechterpaneel wisselt. Het beeld is de aanleiding om je het woord te herinneren, en
 * dat weghalen op het moment dat je de betekenis leest haalt de brug weg waar de kaart voor
 * bestaat. Zonder foto vervalt het paneel en is de kaart één kolom — dat is de normale toestand
 * voor een woord dat nog niet is gevuld, geen fout, en geen grijs vlak.
 *
 * ── LANGZAAM IS GEEN TWEEDE BESTAND ──────────────────────────────────────────
 * `playbackRate = 0.6` op dezelfde mp3, precies zoals `WordAudioButton` in `knm-website`. Een
 * tweede TTS-run op lagere snelheid zou 410 woorden × 2 opnames extra kosten voor iets wat de
 * browser gratis doet. De keuze staat in `localStorage`, want wie langzaam nodig heeft, heeft dat
 * bij elke kaart nodig.
 *
 * De voortgang gaat per markering naar de database en niet aan het eind van een ronde: iemand die
 * op de tram zijn telefoon wegdrukt hoort zijn twaalf kaarten terug te vinden. De schrijfactie is
 * `upsert` op `(user_id, lesson_word_id)` — de unique constraint is wat dit idempotent maakt.
 *
 * **Een gast kan hier komen kijken maar niets bewaren.** `userId` is dan null en de deck werkt
 * verder gewoon; de markeringen blijven in de state van deze sessie. Een deck die weigert te
 * openen zou niets te verkopen hebben.
 */
export default function WordDeck({
  words,
  userId,
  backHref,
}: {
  words: LessonWord[];
  userId: string | null;
  backHref: string;
}) {
  const t = useTranslations('portal');

  /* De oefenvolgorde staat vast bij het openen. Hem live herschikken op de status die de
     kandidaat net heeft gezet zou de kaart onder zijn duim laten verspringen. */
  const deck = useMemo(() => practiceOrder(words), [words]);

  /**
   * De talen die déze deck echt heeft, in vaste volgorde.
   *
   * Op `'en'` beginnen was goed zolang Engels de enige was; met drie kolommen die per woord los
   * gevuld kunnen zijn zou een deck die alleen Arabisch heeft openen op een lege vertaling.
   */
  const langs = useMemo(
    () => WORD_CARD_LANGS.filter(l => words.some(w => w.translations[l])),
    [words],
  );

  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [lang, setLang] = useState<WordCardLang>(() => langs[0] ?? 'en');
  const [statuses, setStatuses] = useState<Record<number, WordStatus>>(() =>
    Object.fromEntries(words.map(w => [w.id, w.status])),
  );
  const [done, setDone] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);

  const card = deck[idx];
  const known = Object.values(statuses).filter(s => s === 'known').length;

  const save = useCallback(
    async (wordId: number, status: WordStatus) => {
      setStatuses(prev => ({ ...prev, [wordId]: status }));
      if (!userId) return;
      try {
        await createClient()
          .from('user_lesson_word_progress')
          .upsert(
            { user_id: userId, lesson_word_id: wordId, status, updated_at: new Date().toISOString() },
            { onConflict: 'user_id,lesson_word_id' },
          );
      } catch {
        /* Een mislukte opslag mag de deck niet stilzetten: de markering staat al in de state en
           de volgende kaart komt. Stil falen is hier beter dan een foutmelding over een tabel. */
      }
    },
    [userId],
  );

  const next = useCallback(() => {
    setFlipped(false);
    setIdx(i => {
      if (i + 1 >= deck.length) {
        setDone(true);
        return i;
      }
      return i + 1;
    });
  }, [deck.length]);

  const prev = useCallback(() => {
    setFlipped(false);
    setIdx(i => Math.max(0, i - 1));
  }, []);

  const mark = useCallback(
    (status: 'known' | 'learning') => {
      if (!card) return;
      void save(card.id, status);
      next();
    },
    [card, next, save],
  );

  /**
   * Omdraaien, en de kaart daarmee als gezien wegschrijven.
   *
   * Dit hoort in de handler en niet in een effect op `flipped`: omdraaien is een gebeurtenis, en
   * `setState` vanuit een effect is precies wat `react-hooks/set-state-in-effect` verbiedt — het
   * is een tweede render die niets nieuws weet. Alleen bij het tonen van de *achterkant*, want
   * doorklikken zonder kijken mag niet als "gezien" tellen.
   */
  const flip = useCallback(() => {
    setFlipped(f => {
      if (!f && card && (statuses[card.id] ?? 'unseen') === 'unseen') void save(card.id, 'seen');
      return !f;
    });
  }, [card, statuses, save]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(el.tagName)) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
      else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prev, next, flip]);

  if (deck.length === 0) return null;

  if (done) {
    return (
      <div className="wd-done panel">
        <p className="wd-done-h">{t('wd_done_head')}</p>
        <p className="wd-done-b">{t('wd_done_body', { known, total: words.length })}</p>
        <div className="wd-done-acts">
          <button
            type="button"
            className="wd-btn wd-btn-p"
            onClick={() => { setDone(false); setIdx(0); setFlipped(false); }}
          >
            <RotateCcw size={15} strokeWidth={2.3} />
            {t('wd_again')}
          </button>
          <a href={backHref} className="wd-link">{t('wd_back_to_themes')}</a>
        </div>
      </div>
    );
  }

  if (!card) return null;

  const status = statuses[card.id] ?? 'unseen';
  const translation = card.translations[lang];
  const head = card.article ? `${card.article} ${card.dutch}` : card.dutch;
  const nextLang = langs[(langs.indexOf(lang) + 1) % (langs.length || 1)];

  return (
    <div className="wd">
      {/* De teller en de balk: waar ben je in deze ronde. */}
      <div className="wd-top">
        <a href={backHref} className="wd-close" aria-label={t('wd_close')}>
          <X size={18} strokeWidth={2.3} />
        </a>
        <span className="wd-count">{t('wd_counter', { n: idx + 1, total: deck.length })}</span>
        <span className="wd-known">{t('wd_known_of', { known, total: words.length })}</span>
      </div>
      <div className="wd-bar" aria-hidden>
        <span style={{ width: `${((idx + 1) / deck.length) * 100}%` }} />
      </div>

      {/* Geen `<button>` om de hele kaart heen: er staan nu knoppen ín de kaart (de uitspraak, de
          twee snelheden), en een knop binnen een knop is geen geldige HTML — de browser mag de
          binnenste dan negeren. Omdraaien zit op de kaart als `role="button"`, en de
          audioknoppen stoppen hun eigen klik. */}
      <div
        role="button"
        tabIndex={0}
        aria-label={flipped ? t('wd_flip_back_hint') : t('wd_flip_hint')}
        className={`wd-card${flipped ? ' is-back' : ''}${card.imageUrl ? '' : ' is-plain'}`}
        onClick={flip}
        onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); } }}
        aria-live="polite"
      >
        {/* Het beeldpaneel staat buiten de wissel: het blijft staan als de kaart omdraait. */}
        {card.imageUrl && (
          <span className="wd-pane-img">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={card.imageUrl} alt="" loading="lazy" />
          </span>
        )}

        <span className="wd-pane-body">
          {!flipped ? (
            <>
              <span className="wd-chips">
                {card.article && <span className="wd-chip wd-chip-art">{card.article}</span>}
                <span className={`wd-chip wd-${card.usage}`}>{t(`wd_usage_${card.usage}`)}</span>
              </span>

              <span className="wd-word">{card.dutch}</span>
              {card.plural && (
                <span className="wd-plural">{t('wd_plural', { plural: card.plural })}</span>
              )}
              {card.frame && <span className="wd-frame">{card.frame}</span>}

              <span className="wd-spacer" />

              <span className="wd-foot-row">
                <SpeakBlock
                  src={card.audioUrl}
                  label={t('wd_speak')}
                  normalLabel={t('wd_speed_normal')}
                  slowLabel={t('wd_speed_slow')}
                  ariaLabel={t('wd_say_word')}
                  autoPlay={autoPlay && !flipped}
                />
                <span className="wd-flip-pill">
                  <RefreshCw size={13} strokeWidth={2.3} />
                  {t('wd_flip_hint')}
                </span>
              </span>
            </>
          ) : (
            <>
              <span className="wd-chips">
                <span className="wd-word-sm">{head}</span>
                <SpeakBlock
                  src={card.audioUrl}
                  label={t('wd_speak')}
                  normalLabel={t('wd_speed_normal')}
                  slowLabel={t('wd_speed_slow')}
                  ariaLabel={t('wd_say_word')}
                  compact
                />
              </span>

              <span className="wd-meaning">{card.meaningNl}</span>

              {card.example && (
                <span className="wd-example">
                  <span className="wd-example-t">&ldquo;{card.example}&rdquo;</span>
                  {/* De zin heeft zijn eigen spoor: klemtoon en een vaste constructie zijn pas
                      hoorbaar in een zin, en dat is het leerdoel van `frame`. */}
                  <SpeakBlock
                    src={card.exampleAudioUrl}
                    label={t('wd_speak')}
                    normalLabel={t('wd_speed_normal')}
                    slowLabel={t('wd_speed_slow')}
                    ariaLabel={t('wd_say_example')}
                    compact
                  />
                </span>
              )}

              {translation && (
                <span className="wd-trans" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                  <span className="wd-trans-lang" dir="ltr">{lang.toUpperCase()}</span>
                  {translation}
                </span>
              )}
              {/* De mededeling van de gidsvertalingen, hier op de kaart: de Nederlandse kant is
                  van de docent, de vertaling is machinaal en niet nagekeken. Verdwijnt zodra zij
                  `translations_reviewed` op true zet. */}
              {translation && !card.translationsReviewed && (
                <span className="wd-unreviewed">{t('wd_translation_unreviewed')}</span>
              )}

              <span className="wd-spacer" />

              <span className="wd-foot-row wd-foot-row-end">
                <span className="wd-flip-pill">
                  <RefreshCw size={13} strokeWidth={2.3} />
                  {t('wd_flip_back_hint')}
                </span>
              </span>
            </>
          )}
        </span>
      </div>

      {/* Ken ik / nog leren staan onder de kaart en niet erop: op de kaart tikken is omdraaien,
          en een knop binnen een tikbaar vlak dat iets anders doet is hoe je per ongeluk markeert. */}
      <div className="wd-marks">
        <button type="button" className="wd-btn wd-btn-learn" onClick={() => mark('learning')}>
          <RotateCcw size={15} strokeWidth={2.3} />
          {t('wd_mark_learning')}
        </button>
        <button type="button" className="wd-btn wd-btn-known" onClick={() => mark('known')}>
          <Check size={16} strokeWidth={2.8} />
          {t('wd_mark_known')}
        </button>
      </div>

      <div className="wd-nav">
        <button type="button" className="wd-arrow" onClick={prev} disabled={idx === 0} aria-label={t('wd_prev')}>
          <ArrowLeft size={17} strokeWidth={2.4} className="rtl-flip" />
        </button>

        <span className={`wd-status wd-status-${status}`}>{t(`wd_status_${status}`)}</span>

        {/* Automatisch afspelen: uit tenzij de kandidaat het aanzet. Aan als standaard zou een
            deck op een stille plek geluid laten maken zonder dat iemand erom vroeg. */}
        {card.audioUrl && (
          <button
            type="button"
            className={`wd-toggle${autoPlay ? ' is-on' : ''}`}
            aria-pressed={autoPlay}
            onClick={() => setAutoPlay(v => !v)}
          >
            {t('wd_autoplay')}
          </button>
        )}

        {/* De taalknop, alleen als er écht iets te wisselen is: één taal is geen keuze. Hij loopt
            rond in plaats van te wippen, want er zijn er sinds 10-09 drie — en hij noemt de taal
            waar je naartóe gaat, niet die je nu ziet. */}
        {langs.length > 1 && (
          <button type="button" className="wd-lang" onClick={() => setLang(nextLang)}>
            {WORD_CARD_LANG_LABEL[nextLang]}
          </button>
        )}

        <button type="button" className="wd-arrow" onClick={next} aria-label={t('wd_next')}>
          <ArrowRight size={17} strokeWidth={2.4} className="rtl-flip" />
        </button>
      </div>

      <p className="wd-keys">{t('wd_keys')}</p>
    </div>
  );
}

/**
 * De uitspraak: één ronde knop met een equalizer erin, en daarnaast *Normaal* / *Langzaam*.
 *
 * `stopPropagation` op alles: dit blok staat ín de kaart, en de kaart draait om bij een klik.
 * Zonder dat draait afspelen de kaart om, wat leest als een bug in het omdraaien.
 *
 * **Langzaam is `playbackRate` en geen tweede opname** (0.6, zoals `WordAudioButton` in
 * `knm-website`). De keuze staat in `localStorage`: wie langzaam nodig heeft, heeft dat bij elke
 * kaart nodig en hoort het niet per woord opnieuw aan te wijzen.
 */
const RATE_KEY = 'io_wd_audio_rate';
const SLOW_RATE = 0.6;

function SpeakBlock({
  src,
  label,
  normalLabel,
  slowLabel,
  ariaLabel,
  compact = false,
  autoPlay = false,
}: {
  src: string | null;
  label: string;
  normalLabel: string;
  slowLabel: string;
  ariaLabel: string;
  compact?: boolean;
  autoPlay?: boolean;
}) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [slow, setSlow] = useState(false);
  const [ready, setReady] = useState(false);
  const slowRef = useRef(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(RATE_KEY) === 'slow') { setSlow(true); slowRef.current = true; }
    } catch {
      /* Een privévenster mag de knop niet slopen — dan staat hij op Normaal. */
    }
    // Pas autoplayen als de bewaarde snelheid bekend is, anders klinkt de eerste kaart verkeerd.
    setReady(true);
  }, []);

  useEffect(() => { slowRef.current = slow; }, [slow]);

  const play = useCallback((useSlow: boolean) => {
    const el = ref.current;
    if (!el || !src) return;
    el.pause();
    el.currentTime = 0;
    el.playbackRate = useSlow ? SLOW_RATE : 1;
    /* Stil falen: een geblokkeerde autoplay of een ontbrekend bestand in Storage mag geen
       foutmelding over een kaart heen zetten. */
    el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [src]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!autoPlay || !src || !ready) {
      el.pause();
      el.currentTime = 0;
      setPlaying(false);
      return;
    }
    play(slowRef.current);
  }, [autoPlay, src, ready, play]);

  if (!src) return null;

  function pickRate(useSlow: boolean) {
    setSlow(useSlow);
    try { localStorage.setItem(RATE_KEY, useSlow ? 'slow' : 'normal'); } catch {}
    play(useSlow);
  }

  return (
    <span
      className={compact ? 'wd-speak wd-speak-sm' : 'wd-speak'}
      onClick={e => e.stopPropagation()}
      onKeyDown={e => e.stopPropagation()}
    >
      <audio
        ref={ref}
        src={src}
        preload="none"
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
      />
      <button
        type="button"
        aria-label={ariaLabel}
        title={ariaLabel}
        className={`wd-eq${playing ? ' is-playing' : ''}`}
        onClick={() => (playing ? (ref.current?.pause(), setPlaying(false)) : play(slow))}
      >
        {[0, 1, 2, 3].map(i => <span key={i} aria-hidden />)}
      </button>

      {!compact && (
        <span className="wd-speak-body">
          <span className="wd-speak-label">{label}</span>
          <span className="wd-speeds">
            <button
              type="button"
              className={`wd-speed${slow ? '' : ' is-on'}`}
              aria-pressed={!slow}
              onClick={() => pickRate(false)}
            >
              {normalLabel}
            </button>
            <button
              type="button"
              className={`wd-speed${slow ? ' is-on' : ''}`}
              aria-pressed={slow}
              onClick={() => pickRate(true)}
            >
              {slowLabel}
            </button>
          </span>
        </span>
      )}
    </span>
  );
}
