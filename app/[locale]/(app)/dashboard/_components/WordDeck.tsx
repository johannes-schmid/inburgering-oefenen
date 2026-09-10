'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight, Check, RotateCcw, RefreshCw, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { practiceOrder, type LessonWord, type WordCardLang, type WordStatus } from '@/lib/lessons/words';

/**
 * De woordkaartendeck van de leerlaag.
 *
 * Overgenomen van de KNM-deck (`components/woordkaarten/WoordkaartDeck.tsx` in `knm-website`), met
 * drie verschillen die uit de data komen en niet uit smaak:
 *
 * - **Geen plaatje.** `lesson_words` heeft geen `image_url`. De voorkant is daarom het woord zelf,
 *   groot, met lidwoord en meervoud — en niet een halve kaart met een grijs vlak erin.
 * - **De Nederlandse betekenis staat bóven de vertaling.** Dat is de kant die van de docent is;
 *   de vertaling is machinaal en zegt dat er zelf bij zolang `translationsReviewed` false is.
 * - **`usage` staat op de kaart.** Receptief of productief is het leerdoel van het woord, en het is
 *   het enige wat deze kaarten hebben en de 366 KNM-kaarten niet.
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

  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [lang, setLang] = useState<WordCardLang>('en');
  const [statuses, setStatuses] = useState<Record<number, WordStatus>>(() =>
    Object.fromEntries(words.map(w => [w.id, w.status])),
  );
  const [done, setDone] = useState(false);

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
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
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

      <button
        type="button"
        className={`wd-card${flipped ? ' is-back' : ''}`}
        onClick={flip}
        aria-live="polite"
      >
        <span className={`wd-chip wd-${card.usage}`}>{t(`wd_usage_${card.usage}`)}</span>

        {!flipped ? (
          <span className="wd-front">
            <span className="wd-word">{head}</span>
            {card.plural && <span className="wd-plural">{t('wd_plural', { plural: card.plural })}</span>}
            {card.frame && <span className="wd-frame">{card.frame}</span>}
            <span className="wd-hint">
              <RefreshCw size={13} strokeWidth={2.3} />
              {t('wd_flip_hint')}
            </span>
          </span>
        ) : (
          <span className="wd-back">
            <span className="wd-word-sm">{head}</span>
            <span className="wd-meaning">{card.meaningNl}</span>
            {card.example && <span className="wd-example">&ldquo;{card.example}&rdquo;</span>}

            {translation && (
              <span className="wd-trans" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                <span className="wd-trans-lang" dir="ltr">{lang.toUpperCase()}</span>
                {translation}
              </span>
            )}
            {/* De mededeling van de gidsvertalingen, hier op de kaart: de Nederlandse kant is van
                de docent, de vertaling is machinaal en niet nagekeken. Verdwijnt zodra zij
                `translations_reviewed` op true zet. */}
            {translation && !card.translationsReviewed && (
              <span className="wd-unreviewed">{t('wd_translation_unreviewed')}</span>
            )}

            <span className="wd-hint">
              <RefreshCw size={13} strokeWidth={2.3} />
              {t('wd_flip_back_hint')}
            </span>
          </span>
        )}
      </button>

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

        {/* De taalknop, alleen als er iets te wisselen is. */}
        {(card.translations.en || card.translations.ar) && (
          <button
            type="button"
            className="wd-lang"
            onClick={() => setLang(l => (l === 'en' ? 'ar' : 'en'))}
          >
            {lang === 'en' ? 'العربية' : 'English'}
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
