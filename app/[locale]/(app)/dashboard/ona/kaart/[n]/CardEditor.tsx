'use client';

import { useEffect, useRef, useState, useTransition, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, Check, Compass, HelpCircle, ListChecks } from 'lucide-react';
import { getOnaCard } from '@/data/ona/cards';
import { cardProgress, isAnswered, ONA_ANSWER_MAX, type OnaFlag } from '@/lib/ona/rules';
import { markOnaCardDone, saveOnaCard } from '../../_actions';
import { track } from '@/lib/analytics';

/**
 * De schrijfvlakken van één kaart, met automatisch opslaan.
 *
 * Opslaan gebeurt 900 ms na de laatste toetsaanslag en bij het verlaten van een veld — de
 * kandidaat hoeft nooit aan een knop te denken om zijn tekst te bewaren. De check leest daarna de
 * opgeslagen versie (`/api/ona/check`), dus "Laat nakijken" wacht eerst tot alles is bewaard.
 */
const SAVE_DELAY_MS = 900;

const FLAG_ICON = { doorvragen: HelpCircle, beroep: Compass, onvolledig: ListChecks } as const;

export default function CardEditor({
  locale, cardNo, nextCardNo, initialAnswers, initialEvidence, initialStatus,
  initialFlags, initialCheckedAt, initialUpdatedAt, aside,
}: {
  locale: string;
  cardNo: number;
  nextCardNo: number | null;
  initialAnswers: Record<string, string>;
  initialEvidence: Record<string, boolean>;
  initialStatus: 'concept' | 'klaar';
  initialFlags: OnaFlag[] | null;
  initialCheckedAt: string | null;
  initialUpdatedAt: string | null;
  aside: ReactNode;
}) {
  const t = useTranslations('ona');
  const card = getOnaCard(cardNo)!;

  const [answers, setAnswers] = useState(initialAnswers);
  const [evidence, setEvidence] = useState(initialEvidence);
  const [status, setStatus] = useState(initialStatus);
  const [flags, setFlags] = useState<OnaFlag[] | null>(initialFlags);
  const [checkedAt, setCheckedAt] = useState(initialCheckedAt);
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt);
  const [saveState, setSaveState] = useState<'idle' | 'dirty' | 'saving' | 'saved' | 'error'>('idle');
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const latest = useRef({ answers, evidence });
  latest.current = { answers, evidence };
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflight = useRef<Promise<boolean> | null>(null);

  async function save(): Promise<boolean> {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    setSaveState('saving');
    const run = saveOnaCard({ cardNo, ...latest.current }).then(res => {
      if (!res.ok) { setSaveState('error'); setMessage(res.error); return false; }
      setSaveState('saved');
      setMessage(null);
      if (res.savedAt) setUpdatedAt(res.savedAt);
      return true;
    }).catch(() => { setSaveState('error'); return false; });
    inflight.current = run;
    return run;
  }

  function schedule() {
    setSaveState('dirty');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { void save(); }, SAVE_DELAY_MS);
  }

  useEffect(() => {
    function beforeUnload(e: BeforeUnloadEvent) {
      if (timer.current) { e.preventDefault(); }
    }
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, []);

  const progress = cardProgress(card, {
    cardNo, answers, evidence, status, aiFlags: flags, aiCheckedAt: checkedAt, updatedAt,
  });
  const flagsStale = !!checkedAt && !!updatedAt && Date.parse(updatedAt) > Date.parse(checkedAt) + 1000;

  async function runCheck() {
    setChecking(true);
    setMessage(null);
    const ok = timer.current || saveState === 'dirty' ? await save() : await (inflight.current ?? Promise.resolve(true));
    if (!ok) { setChecking(false); return; }
    try {
      const res = await fetch('/api/ona/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardNo }),
      });
      const data = await res.json();
      if (!res.ok) { setMessage(data.error ?? t('check_failed')); return; }
      setFlags(data.flags ?? []);
      setCheckedAt(data.checkedAt ?? new Date().toISOString());
      track('ona_check_run', { card: cardNo, flags: (data.flags ?? []).length });
    } catch {
      setMessage(t('check_failed'));
    } finally {
      setChecking(false);
    }
  }

  function toggleDone() {
    startTransition(async () => {
      if (timer.current || saveState === 'dirty') { if (!(await save())) return; }
      const done = status !== 'klaar';
      const res = await markOnaCardDone({ cardNo, done });
      if (!res.ok) { setMessage(res.error); return; }
      setStatus(done ? 'klaar' : 'concept');
      track('ona_card_saved', { card: cardNo, done });
      if (done && nextCardNo) window.location.href = `/${locale}/dashboard/ona/kaart/${nextCardNo}`;
    });
  }

  const required = card.evidence.filter(e => e.required);

  return (
    <div className="ona-split">
      <div className="ona-col">
        {aside}
        <section className="ona-panel flex flex-col gap-3.5">
          <div className="flex justify-between items-baseline gap-3">
            <h2 className="ona-h3">{t('evidence_title')}</h2>
            {required.length > 0 && (
              <span className="ona-sub">{t('evidence_count', { done: progress.requiredEvidenceDone, total: required.length })}</span>
            )}
          </div>
          {card.evidence.length === 0 ? (
            <p className="ona-muted">{t('no_evidence')}</p>
          ) : (
            <>
              <p className="ona-muted">{t('evidence_body')}</p>
              {card.evidence.map(ev => (
                <label key={ev.id} className={`ona-option${evidence[ev.id] ? ' on' : ''}`}>
                  <input
                    type="checkbox"
                    checked={!!evidence[ev.id]}
                    onChange={e => { setEvidence(prev => ({ ...prev, [ev.id]: e.target.checked })); schedule(); }}
                  />
                  <span>
                    {ev.label}
                    <span className="ona-sub" style={{ display: 'block', fontSize: '0.8rem' }}>
                      {ev.required ? t('evidence_required') : t('evidence_optional')}
                    </span>
                  </span>
                </label>
              ))}
            </>
          )}
        </section>
      </div>

      <section className="ona-panel flex flex-col gap-6">
        <div className="flex justify-between items-baseline gap-3 flex-wrap">
          <h2 className="ona-h3">{t('answers_title')}</h2>
          <span className="ona-sub" aria-live="polite">
            {saveState === 'saving' ? t('saving_short')
              : saveState === 'error' ? t('save_failed')
              : saveState === 'saved' ? t('saved')
              : t('answered_count', { n: progress.answered, total: progress.total })}
          </span>
        </div>

        {card.prompts.map(p => {
          const flag = flags?.find(f => f.promptId === p.id);
          const Icon = flag ? FLAG_ICON[flag.type] : null;
          const id = `ona-${cardNo}-${p.id}`;
          return (
            <div key={p.id} className="ona-q">
              <label htmlFor={id}>{p.label}</label>
              {p.hint && <span id={`${id}-hint`} className="hint">{p.hint}</span>}
              <textarea
                id={id}
                className="ona-textarea"
                value={answers[p.id] ?? ''}
                maxLength={ONA_ANSWER_MAX}
                aria-describedby={p.hint ? `${id}-hint` : undefined}
                lang="nl"
                onChange={e => { const v = e.target.value; setAnswers(prev => ({ ...prev, [p.id]: v })); schedule(); }}
                onBlur={() => { if (timer.current) void save(); }}
              />
              {flag && Icon && (
                <div className="ona-flag">
                  <Icon size={20} strokeWidth={2} aria-hidden />
                  <div>
                    <strong>{t(`flag_${flag.type}`)}</strong>
                    <span>{flag.question}</span>
                  </div>
                </div>
              )}
              {!flag && checkedAt && isAnswered(answers[p.id]) && !flagsStale && (
                <span className="ona-noflag"><Check size={15} strokeWidth={2.4} aria-hidden />{t('no_flags')}</span>
              )}
            </div>
          );
        })}

        {flagsStale && <p className="ona-notice info" role="note">{t('stale_flags')}</p>}
        {message && <p className="ona-error" role="alert">{message}</p>}

        <div className="ona-bar">
          <p className="ona-muted">{progress.complete || status === 'klaar' ? t('check_note') : t('done_hint')}</p>
          <div className="ona-bar-actions">
            <button
              type="button"
              className="ona-btn secondary"
              onClick={toggleDone}
              disabled={pending || (status !== 'klaar' && !progress.complete)}
            >
              {status === 'klaar' ? t('undone_cta') : t('done_cta')}
              {status !== 'klaar' && nextCardNo && <ArrowRight size={16} strokeWidth={2.2} className="rtl-flip" aria-hidden />}
            </button>
            <button
              type="button"
              className="ona-btn primary"
              onClick={runCheck}
              disabled={checking || progress.answered === 0}
            >
              {checking ? t('checking') : t('check_cta')}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
