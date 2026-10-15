'use client';

import { useEffect, useId, useState } from 'react';
import AnimatedNumber from '@/components/glas/AnimatedNumber';
import { addDays, addMonths, addYears, diffDays, fromISO, isAfter, isBefore, type PlainDate } from '@/lib/tijdlijn/engine/dates';
import UitlegShell, { type UitlegBron } from './UitlegShell';

/**
 * Termijn — vul de datum van je PIP in en zie wanneer je termijn begint, wanneer hij afloopt en
 * hoeveel dagen je nog hebt. Dezelfde rekenregel als de tijdlijntool (`resolveTermijn`): de
 * termijn begint de dag ná de dagtekening en duurt drie jaar. De datumrekening komt uit
 * `lib/tijdlijn/engine/dates`, nooit uit een JS `Date` — een termijn die een dag verschuift is
 * erger dan geen rekenhulp.
 *
 * De 36 vakjes zijn de maanden van de termijn; voorbije maanden zijn waas, deze maand is oranje.
 * "Vandaag" wordt pas na het laden gelezen, zodat server en browser dezelfde HTML tonen.
 */
type Props = {
  title: string;
  intro?: string;
  bron?: UitlegBron | UitlegBron[];
  locale?: string;
  defaultDate?: string;
  toolHref?: string;
  labels?: {
    input: string; inputHelp: string; left: string; start: string; end: string;
    notYet: string; over: string; year: string; tool: string; empty: string;
  };
};

const DEF = {
  input: 'Datum op je PIP', inputHelp: 'De dagtekening staat bovenaan de brief van de gemeente.',
  left: 'dagen over van je termijn', start: 'Termijn begint', end: 'Termijn eindigt',
  notYet: 'Je termijn is nog niet begonnen.', over: 'Je termijn is voorbij. Lees wat er dan gebeurt.',
  year: 'Jaar', tool: 'Maak je hele planning met de tijdlijn', empty: 'Vul een datum in.',
};

function today(): PlainDate {
  const d = new Date();
  return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() };
}

export default function Termijn({ title, intro, bron, locale = 'nl', defaultDate = '2025-03-12', toolHref, labels = DEF }: Props) {
  const id = useId();
  const [iso, setIso] = useState(defaultDate);
  const [nu, setNu] = useState<PlainDate | null>(null);
  useEffect(() => { setNu(today()); }, []);

  const pip = fromISO(iso);
  const start = pip ? addDays(pip, 1) : null;
  const end = start ? addYears(start, 3) : null;
  const fmt = (p: PlainDate) =>
    new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(Date.UTC(p.y, p.m - 1, p.d));

  const left = start && end && nu ? Math.max(0, diffDays(isBefore(nu, start) ? start : nu, end)) : null;
  const status = !start || !end || !nu ? null : isBefore(nu, start) ? 'nog' : isAfter(nu, end) ? 'voorbij' : 'loopt';
  const maandNu = start && nu && status === 'loopt'
    ? Array.from({ length: 36 }, (_, k) => k).findLast(k => !isAfter(addMonths(start, k), nu)) ?? 0
    : status === 'voorbij' ? 36 : -1;

  return (
    <UitlegShell title={title} intro={intro} bron={bron}>
      <div className="g-uit-tm">
        <div className="g-uit-sheet g-uit-tm-in">
          <label htmlFor={id}>{labels.input}</label>
          <input id={id} type="date" value={iso} onChange={e => setIso(e.target.value)} />
          <small>{labels.inputHelp}</small>
          {toolHref ? <a className="g-tlink" href={toolHref} style={{ marginTop: 6, fontSize: 14 }}>{labels.tool}</a> : null}
        </div>
        <div className="g-uit-tm-out" aria-live="polite">
          {start && end ? (
            <>
              <div className="g-uit-tm-big">
                <b>{left === null ? '–' : <AnimatedNumber value={left} locales={locale} />}</b>
                <span>{labels.left}</span>
              </div>
              <div>
                <div className="g-uit-tm-months" aria-hidden>
                  {Array.from({ length: 36 }, (_, k) => (
                    <i key={k} data-past={k < maandNu ? 'true' : undefined} data-now={k === maandNu ? 'true' : undefined} />
                  ))}
                </div>
                <div className="g-uit-tm-years" aria-hidden><span>{labels.year} 1</span><span>{labels.year} 2</span><span>{labels.year} 3</span></div>
              </div>
              <div className="g-uit-tm-dates">
                <div><small>{labels.start}</small><b>{fmt(start)}</b></div>
                <div><small>{labels.end}</small><b>{fmt(end)}</b></div>
              </div>
              {status === 'nog' ? <p className="g-uit-tm-note">{labels.notYet}</p> : null}
              {status === 'voorbij' ? <p className="g-uit-tm-note">{labels.over}</p> : null}
            </>
          ) : (
            <p className="g-uit-tm-note">{labels.empty}</p>
          )}
        </div>
      </div>
    </UitlegShell>
  );
}
