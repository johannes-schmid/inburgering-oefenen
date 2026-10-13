'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, Check, MessageSquare, RotateCcw } from 'lucide-react';
import type { GesprekFeedbackItem, GesprekTurn } from '@/lib/ona/ai';
import { track } from '@/lib/analytics';

type CardOption = { number: number; title: string; available: boolean };

/**
 * Het oefengesprek in de browser. Het transcript dat hier staat is een afdruk van wat de server
 * heeft — elke beurt komt terug uit `/api/ona/eindgesprek`, nooit uit lokale state alleen.
 */
export default function Practice({
  locale, cards, canStart, maxQuestions,
}: {
  locale: string;
  cards: CardOption[];
  canStart: boolean;
  maxQuestions: number;
}) {
  const t = useTranslations('ona');
  const available = cards.filter(c => c.available);
  const [chosen, setChosen] = useState<number[]>(available.slice(0, 2).map(c => c.number));
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [turns, setTurns] = useState<GesprekTurn[]>([]);
  const [feedback, setFeedback] = useState<GesprekFeedbackItem[] | null>(null);
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [turns.length, feedback]);

  async function call(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/ona/eindgesprek', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? t('check_failed')); return null; }
      setSessionId(data.sessionId);
      setTurns(data.transcript ?? []);
      if (data.done) setFeedback(data.feedback ?? []);
      return data;
    } catch {
      setError(t('check_failed'));
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function start() {
    const data = await call({ action: 'start', cardNos: chosen });
    if (data) track('ona_practice_started', { cards: chosen });
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!answer.trim()) return;
    const data = await call({ action: 'answer', sessionId, answer });
    if (data) setAnswer('');
  }

  function reset() {
    setSessionId(null);
    setTurns([]);
    setFeedback(null);
    setAnswer('');
  }

  const asked = turns.filter(x => x.role === 'vraag').length;
  const questions = turns.filter((x): x is Extract<GesprekTurn, { role: 'vraag' }> => x.role === 'vraag');

  if (sessionId === null) {
    return (
      <section className="ona-panel flex flex-col gap-4">
        <h2 className="ona-h3">{t('choose_title')}</h2>
        {available.length === 0 ? (
          <p className="ona-muted">{t('no_cards_yet')}</p>
        ) : (
          <>
            <div className="ona-chips">
              {cards.map(c => (
                <button
                  key={c.number}
                  type="button"
                  className="ona-chip"
                  aria-pressed={chosen.includes(c.number)}
                  disabled={!c.available}
                  title={c.title}
                  onClick={() => setChosen(prev => prev.includes(c.number) ? prev.filter(n => n !== c.number) : [...prev, c.number])}
                >
                  {c.number}. {c.title}
                </button>
              ))}
            </div>
            <p className="ona-muted">{t('choose_hint')}</p>
          </>
        )}
        {!canStart && (
          <div className="flex flex-col gap-3">
            <p className="ona-notice info" role="note">{t('paywall_practice')}</p>
            <div>
              <a className="ona-btn secondary" href={`/${locale}/dashboard/pakketten?onderdeel=ona`}>{t('locked_cta')}</a>
            </div>
          </div>
        )}
        {error && <p className="ona-error" role="alert">{error}</p>}
        {canStart && available.length > 0 && (
          <div>
            <button type="button" className="ona-btn primary" onClick={start} disabled={busy || chosen.length === 0}>
              {busy ? t('starting') : t('start_cta')}
              {!busy && <ArrowRight size={18} strokeWidth={2.2} className="rtl-flip" aria-hidden />}
            </button>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="ona-panel flex flex-col gap-5" aria-label={t('gesprek_title')}>
      <div className="ona-chat" aria-live="polite">
        {turns.map((turn, i) => turn.role === 'vraag' ? (
          <div key={i} className="ona-msg">
            <span className="ona-avatar" aria-hidden><MessageSquare size={17} strokeWidth={2} /></span>
            <div>
              <span className="who">{t('examiner', { n: turn.cardNo })}</span>
              <p className="bubble" lang="nl">{turn.text}</p>
            </div>
          </div>
        ) : (
          <div key={i} className="ona-msg me">
            <div>
              <span className="who">{t('you')}</span>
              <p className="bubble" lang="nl">{turn.text}</p>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {feedback ? (
        <div className="flex flex-col gap-4">
          <h2 className="ona-h3">{t('fb_title')}</h2>
          <ul className="ona-fb">
            {feedback.map(item => (
              <li key={item.vraag}>
                <span className="ona-sub" lang="nl">{questions[item.vraag]?.text}</span>
                <strong style={{ color: item.uitgelegd === 'ja' ? 'var(--color-secondary)' : 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {item.uitgelegd === 'ja' && <Check size={16} strokeWidth={2.6} aria-hidden />}
                  {t(`fb_${item.uitgelegd}`)}
                </strong>
                <span lang="nl">{item.denkvraag}</span>
              </li>
            ))}
          </ul>
          <div>
            <button type="button" className="ona-btn secondary" onClick={() => { reset(); window.location.reload(); }}>
              <RotateCcw size={16} strokeWidth={2.2} aria-hidden />
              {t('fb_again')}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={send} className="flex flex-col gap-3">
          <div className="flex justify-between items-baseline gap-3">
            <label htmlFor="ona-answer" className="ona-h3" style={{ fontSize: '0.95rem' }}>{t('answer_label')}</label>
            <span className="ona-sub">{t('question_count', { n: asked, max: maxQuestions })}</span>
          </div>
          <textarea
            id="ona-answer"
            className="ona-textarea"
            lang="nl"
            value={answer}
            maxLength={1500}
            onChange={e => setAnswer(e.target.value)}
            disabled={busy}
          />
          {error && <p className="ona-error" role="alert">{error}</p>}
          <div className="flex flex-wrap gap-3 justify-between items-center">
            <button type="button" className="ona-btn secondary" onClick={() => call({ action: 'finish', sessionId })} disabled={busy}>
              {t('stop')}
            </button>
            <button type="submit" className="ona-btn primary" disabled={busy || !answer.trim()}>
              {busy ? t('starting') : t('send')}
              {!busy && <ArrowRight size={18} strokeWidth={2.2} className="rtl-flip" aria-hidden />}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
