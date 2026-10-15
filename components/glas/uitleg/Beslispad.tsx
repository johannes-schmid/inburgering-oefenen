'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Check, Info, RotateCcw, ArrowUpRight, CornerDownRight } from 'lucide-react';
import UitlegShell, { type UitlegBron } from './UitlegShell';

/**
 * Beslispad — "geldt dit voor mij?" als een reeks vragen die eindigt op één antwoord.
 *
 * Twee weergaven van dezelfde boom:
 * - `stap`: één vraag tegelijk, de gegeven antwoorden als spoor erboven (klik erop om terug te
 *   gaan). Werkt voor elke boom, ook met vertakkingen.
 * - `ladder`: alle vragen tegelijk in beeld, elk met de uitgang ernaast ("Ja: je hoeft niet").
 *   Alleen voor een rechte reeks, waar elke vraag één uitgang heeft en één weg verder — en dat is
 *   precies de vorm van de meeste vrijstellingsregels. De lezer ziet vooraf hoe lang het pad is.
 *
 * Een uitkomst heeft een toon, geen oordeel: `vrij` (groen: in orde, je hoeft niets), `moet`
 * (navy: het geldt voor je — geen rood, er is niets fout), `check` (klei: navragen bij DUO).
 * De uitkomst zegt altijd wie beslist; het element vervangt de brief van DUO niet.
 */
export type BeslisVraag = {
  id: string;
  vraag: string;
  hint?: string;
  opties: { label: string; naar: string }[];
};

export type BeslisUitkomst = {
  id: string;
  toon: 'vrij' | 'moet' | 'check';
  titel: string;
  tekst: string;
  link?: { href: string; label: string };
};

type Labels = { again: string; question: string; yes: string; no: string; leadsTo: string };

type Props = {
  title: string;
  intro?: string;
  start: string;
  vragen: BeslisVraag[];
  uitkomsten: BeslisUitkomst[];
  variant?: 'stap' | 'ladder';
  bron?: UitlegBron | UitlegBron[];
  labels?: Labels;
};

const DEF: Labels = { again: 'Opnieuw', question: 'Vraag', yes: 'Ja', no: 'Nee', leadsTo: 'Ja:' };
const ICON = { vrij: Check, moet: ArrowRight, check: Info } as const;

export default function Beslispad({ variant = 'stap', labels = DEF, ...p }: Props) {
  return variant === 'ladder' ? <Ladder labels={labels} {...p} /> : <Stap labels={labels} {...p} />;
}

type Inner = Omit<Props, 'variant' | 'labels'> & { labels: Labels };

function useTree(vragen: BeslisVraag[], uitkomsten: BeslisUitkomst[]) {
  return useMemo(() => {
    const v = new Map(vragen.map(q => [q.id, q]));
    const u = new Map(uitkomsten.map(o => [o.id, o]));
    return { v, u };
  }, [vragen, uitkomsten]);
}

function Uitkomst({ o, onReset, againLabel }: { o: BeslisUitkomst; onReset: () => void; againLabel: string }) {
  const Icon = ICON[o.toon];
  return (
    <div className="g-uit-out" data-tone={o.toon} role="status">
      <div className="g-uit-out-top">
        <span className="g-uit-out-ic" aria-hidden><Icon /></span>
        <h4>{o.titel}</h4>
      </div>
      <p>{o.tekst}</p>
      <div className="g-uit-out-actions">
        {o.link ? (
          <a className="g-uit-btn is-light" href={o.link.href} target={o.link.href.startsWith('http') ? '_blank' : undefined} rel="noopener">
            {o.link.label}<ArrowUpRight aria-hidden />
          </a>
        ) : null}
        <button type="button" className="g-uit-btn" onClick={onReset}><RotateCcw aria-hidden />{againLabel}</button>
      </div>
    </div>
  );
}

function Stap({ title, intro, start, vragen, uitkomsten, bron, labels }: Inner) {
  const reduce = useReducedMotion();
  const { v, u } = useTree(vragen, uitkomsten);
  const [pad, setPad] = useState<{ vraag: string; keuze: number }[]>([]);
  const [dir, setDir] = useState(1);

  const huidig = pad.length ? v.get(pad[pad.length - 1].vraag)!.opties[pad[pad.length - 1].keuze].naar : start;
  const vraag = v.get(huidig);
  const uitkomst = u.get(huidig);

  function kies(k: number) { setDir(1); setPad(prev => [...prev, { vraag: huidig, keuze: k }]); }
  function terug(n: number) { setDir(-1); setPad(prev => prev.slice(0, n)); }

  const x = (d: number) => (reduce ? 'translateX(0px)' : `translateX(${d * 16}px)`);

  return (
    <UitlegShell title={title} intro={intro} bron={bron}>
      <div className="g-uit-sheet">
        {pad.length > 0 ? (
          <ol className="g-uit-trail" aria-label={labels.question}>
            {pad.map((stap, k) => {
              const q = v.get(stap.vraag)!;
              return (
                <li key={stap.vraag}>
                  <button type="button" onClick={() => terug(k)}>
                    <Check aria-hidden />
                    <span>{q.vraag} <b>{q.opties[stap.keuze].label}</b></span>
                  </button>
                </li>
              );
            })}
          </ol>
        ) : null}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={huidig}
            initial={{ opacity: 0, transform: x(dir) }}
            animate={{ opacity: 1, transform: 'translateX(0px)', transition: { duration: 0.22, ease: [0.23, 1, 0.32, 1] } }}
            exit={{ opacity: 0, transform: x(-dir), transition: { duration: 0.14, ease: [0.23, 1, 0.32, 1] } }}
          >
            {vraag ? (
              <div className="g-uit-q">
                <span className="g-uit-q-n">{labels.question} {pad.length + 1}</span>
                <h4>{vraag.vraag}</h4>
                {vraag.hint ? <p className="g-uit-q-hint">{vraag.hint}</p> : null}
                <div className="g-uit-opts" data-n={vraag.opties.length}>
                  {vraag.opties.map((o, k) => (
                    <button key={o.label} type="button" className="g-uit-opt" onClick={() => kies(k)}>
                      <span>{o.label}</span><ArrowRight className="rtl-flip" aria-hidden />
                    </button>
                  ))}
                </div>
              </div>
            ) : uitkomst ? (
              <Uitkomst o={uitkomst} onReset={() => terug(0)} againLabel={labels.again} />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </UitlegShell>
  );
}

function Ladder({ title, intro, start, vragen, uitkomsten, bron, labels }: Inner) {
  const { v, u } = useTree(vragen, uitkomsten);
  const reduce = useReducedMotion();

  const keten = useMemo(() => {
    const out: { q: BeslisVraag; uitgang: number; verder: number }[] = [];
    let id: string | undefined = start;
    const seen = new Set<string>();
    while (id && v.has(id) && !seen.has(id)) {
      seen.add(id);
      const q: BeslisVraag = v.get(id)!;
      const uitgang = q.opties.findIndex(o => u.has(o.naar));
      const verder = q.opties.findIndex((o, k) => k !== uitgang);
      out.push({ q, uitgang, verder });
      id = q.opties[verder]?.naar;
    }
    return out;
  }, [start, v, u]);

  const [keuzes, setKeuzes] = useState<number[]>([]);
  const actief = keuzes.length;
  const laatste = keuzes.length ? keten[keuzes.length - 1] : null;
  const einde = laatste ? laatste.q.opties[keuzes[keuzes.length - 1]].naar : null;
  const uitkomst = einde ? u.get(einde) : undefined;

  function kies(rij: number, k: number) {
    setKeuzes(prev => [...prev.slice(0, rij), k]);
  }

  return (
    <UitlegShell title={title} intro={intro} bron={bron}>
      <ol className="g-uit-ladder">
        {keten.map(({ q, uitgang }, rij) => {
          const state = uitkomst && rij >= actief ? 'later' : rij < actief ? 'klaar' : rij === actief ? 'nu' : 'later';
          const gekozen = keuzes[rij];
          const exitO = u.get(q.opties[uitgang]?.naar);
          return (
            <li key={q.id} className="g-uit-rung" data-state={state}>
              <span className="g-uit-rung-n" aria-hidden>{state === 'klaar' ? <Check size={14} /> : rij + 1}</span>
              <div className="g-uit-rung-q">
                <b>{q.vraag}</b>
                {exitO ? <small><CornerDownRight className="rtl-flip" aria-hidden />{q.opties[uitgang].label}: {exitO.titel.toLowerCase()}</small> : null}
              </div>
              <div className="g-uit-yn" role="group" aria-label={q.vraag}>
                {q.opties.map((o, k) => (
                  <button
                    key={o.label}
                    type="button"
                    aria-pressed={gekozen === k}
                    disabled={rij > actief}
                    onClick={() => kies(rij, k)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ol>
      <AnimatePresence initial={false}>
        {uitkomst ? (
          <motion.div
            key={uitkomst.id + actief}
            className="g-uit-ladder-out"
            initial={{ opacity: 0, transform: reduce ? 'translateY(0px)' : 'translateY(8px)' }}
            animate={{ opacity: 1, transform: 'translateY(0px)', transition: { duration: 0.24, ease: [0.23, 1, 0.32, 1] } }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
          >
            <Uitkomst o={uitkomst} onReset={() => setKeuzes([])} againLabel={labels.again} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </UitlegShell>
  );
}
