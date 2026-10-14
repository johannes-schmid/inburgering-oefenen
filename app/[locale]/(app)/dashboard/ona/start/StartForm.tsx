'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { ONA_VRIJSTELLING_URL } from '@/data/ona/cards';
import { saveOnaBeroep } from '../_actions';

type Law = 'before2015' | '2015_2021' | '2022' | 'voluntary' | 'unknown';
type Exempt = 'work' | 'self' | 'map' | 'entree' | 'none';

const LAWS: Law[] = ['before2015', '2015_2021', '2022', 'voluntary', 'unknown'];
const EXEMPTS: Exempt[] = ['work', 'self', 'map', 'entree', 'none'];

/**
 * De regels van de vrijstellingscheck, in volgorde van wat het eerst beslist.
 *
 * - Vóór 2015 begonnen: ONA hoorde toen nog niet bij het examen.
 * - Vanaf 2022: Wet inburgering 2021, dus MAP bij de gemeente en geen ONA. Zelfde acht thema's.
 * - Werk, eigen bedrijf, MAP afgerond of entreediploma: mogelijk vrijstelling, aan te vragen bij DUO.
 * Alleen DUO beslist; daarom mag de kandidaat altijd doorgaan.
 */
function verdictFor(law: Law | null, exempt: Exempt | null) {
  if (!law) return null;
  if (law === 'before2015') return 'before2015' as const;
  if (law === '2022') return '2022' as const;
  if (!exempt) return null;
  if (exempt !== 'none') return 'exempt' as const;
  return law === 'unknown' ? 'unknown' as const : 'do' as const;
}

export default function StartForm({
  locale, isGuest, initialBeroep, initialRoute, hasPortfolio,
}: {
  locale: string;
  isGuest: boolean;
  initialBeroep: string;
  initialRoute: 'wi2013' | 'map' | 'onbekend';
  hasPortfolio: boolean;
}) {
  const t = useTranslations('ona');
  const [law, setLaw] = useState<Law | null>(hasPortfolio ? (initialRoute === 'map' ? '2022' : initialRoute === 'wi2013' ? '2015_2021' : 'unknown') : null);
  const [exempt, setExempt] = useState<Exempt | null>(hasPortfolio && initialRoute !== 'map' ? 'none' : null);
  const [beroep, setBeroep] = useState(initialBeroep);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const verdict = verdictFor(law, exempt);
  const askExempt = law !== null && law !== 'before2015' && law !== '2022';

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const route = law === '2022' ? 'map' : law === '2015_2021' || law === 'voluntary' ? 'wi2013' : 'onbekend';
    start(async () => {
      const res = await saveOnaBeroep({ beroep, route });
      if (!res.ok) { setError(res.error); return; }
      window.location.href = hasPortfolio ? `/${locale}/dashboard/ona` : `/${locale}/dashboard/ona/kaart/1`;
    });
  }

  return (
    <>
      <section className="ona-panel flex flex-col gap-5">
        <div>
          <h1 className="g-head gl-ona-h1">
            {t('start_title')}
          </h1>
          <p className="ona-body" style={{ marginTop: 6, color: 'var(--color-on-surface-variant)' }}>{t('start_body')}</p>
        </div>

        <fieldset className="flex flex-col gap-2.5" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="ona-h3" style={{ marginBottom: 10 }}>{t('q_law')}</legend>
          {LAWS.map(l => (
            <label key={l} className={`ona-option${law === l ? ' on' : ''}`}>
              <input type="radio" name="law" checked={law === l} onChange={() => { setLaw(l); setExempt(null); }} />
              {t(`law_${l}`)}
            </label>
          ))}
        </fieldset>

        {askExempt && (
          <fieldset className="flex flex-col gap-2.5" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="ona-h3" style={{ marginBottom: 10 }}>{t('q_exempt')}</legend>
            {EXEMPTS.map(x => (
              <label key={x} className={`ona-option${exempt === x ? ' on' : ''}`}>
                <input type="radio" name="exempt" checked={exempt === x} onChange={() => setExempt(x)} />
                {t(`ex_${x}`)}
              </label>
            ))}
          </fieldset>
        )}

        {verdict && (
          <div className={`ona-notice${verdict === 'do' || verdict === '2022' ? ' info' : ''}`} role="status">
            <div className="flex flex-col gap-2">
              <span>{t(`verdict_${verdict}`)}</span>
              {verdict === 'exempt' && (
                <a href={ONA_VRIJSTELLING_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-bold" style={{ color: 'inherit' }}>
                  {t('exempt_link')}
                  <ExternalLink size={14} strokeWidth={2.2} aria-hidden />
                </a>
              )}
            </div>
          </div>
        )}
      </section>

      {verdict && verdict !== 'before2015' && (
        <section className="ona-panel">
          {isGuest ? (
            <div className="flex flex-col gap-4">
              <h2 className="ona-h2">{t('guest_title')}</h2>
              <p className="ona-body">{t('guest_body')}</p>
              <div>
                <a className="ona-btn primary" href={`/${locale}/register?next=/${locale}/dashboard/ona/start`}>
                  {t('guest_cta')}
                  <ArrowRight size={18} strokeWidth={2.2} className="rtl-flip" aria-hidden />
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-4">
              <h2 className="ona-h2">{t('beroep_title')}</h2>
              <p className="ona-body" style={{ color: 'var(--color-on-surface-variant)' }}>{t('beroep_body')}</p>
              <div className="ona-q">
                <label htmlFor="ona-beroep">{t('beroep_label')}</label>
                <span id="ona-beroep-help" className="hint">{t('beroep_help')}</span>
                <input
                  id="ona-beroep"
                  className="ona-input"
                  value={beroep}
                  onChange={e => setBeroep(e.target.value)}
                  maxLength={120}
                  required
                  aria-describedby="ona-beroep-help"
                  autoComplete="organization-title"
                />
              </div>
              {hasPortfolio && beroep.trim() !== initialBeroep && (
                <p className="ona-notice" role="note">{t('beroep_change_warning')}</p>
              )}
              {error && <p className="ona-error" role="alert">{error}</p>}
              <div>
                <button type="submit" className="ona-btn primary" disabled={pending || beroep.trim().length < 2}>
                  {pending ? t('saving') : hasPortfolio ? t('beroep_update') : t('beroep_save')}
                  {!pending && <ArrowRight size={18} strokeWidth={2.2} className="rtl-flip" aria-hidden />}
                </button>
              </div>
            </form>
          )}
        </section>
      )}
    </>
  );
}
