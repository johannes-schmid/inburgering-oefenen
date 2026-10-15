import type { ComponentProps, ReactNode } from 'react';
import { ArrowRight, Check, Clock, Lock, X } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

/**
 * Examenkaart = slot (§G5, glas.html §07): **één kaart overal** — de lijst op de publieke
 * oefenexamenpagina en het raster in het portaal zijn dezelfde kaart, alleen de link verschilt.
 * Nummer linksboven, één rond staticoon rechtsboven, geen streep eronder.
 *
 * | state | icoon | betekent |
 * |---|---|---|
 * | `gratis` | pill (`pillLabel`) | gratis met account — navy inset-ring |
 * | `open` | pijl | starten |
 * | `bezig` | ring met % | verder waar je was — Nacht-verloop |
 * | `gehaald` | vinkje | gehaald — groen |
 * | `niet` | kruis | nog niet gehaald — wit, rood icoon |
 * | `pakket` | slot | **niet openbaar: niet in je pakket** — halfwit, nummer gedimd |
 * | `nog` | klok | **niet openbaar: nog niet gepubliceerd** — gestippelde rand, géén link |
 *
 * De drie redenen waarom iets niet opengaat (niet gepubliceerd · niet in je pakket · al gehaald)
 * blijven zo visueel verschillend; maak er nooit één "locked" van (CLAUDE.md §4).
 *
 * Alle tekst komt van de aanroeper (i18n): `numberLabel` ("Examen"), `title`, `sub`, `pillLabel`.
 * Het raster: `<div className="g-slots">` (5 kolommen, 2 onder 860px).
 */
export type ExamSlotState = 'gratis' | 'open' | 'bezig' | 'gehaald' | 'niet' | 'pakket' | 'nog';

type Props = {
  number: number;
  state: ExamSlotState;
  title: ReactNode;
  sub?: ReactNode;
  numberLabel: ReactNode;
  /** Alleen voor `gratis`: de tekst in de pill ("Gratis"). */
  pillLabel?: ReactNode;
  /** Voortgang 0–100, alleen voor `bezig`. */
  progress?: number;
  /** Waar de kaart heen gaat. Bij `nog` genegeerd: een niet-gepubliceerd examen is geen link. */
  href?: ComponentProps<typeof Link>['href'];
  /** Toegankelijke naam als de zichtbare tekst niet genoeg zegt. */
  ariaLabel?: string;
  className?: string;
};

export default function ExamSlotCard({
  number,
  state,
  title,
  sub,
  numberLabel,
  pillLabel,
  progress = 0,
  href,
  ariaLabel,
  className,
}: Props) {
  const body = (
    <>
      <div className="g-slot-top">
        <span className="g-slot-nr">
          <small>{numberLabel}</small>
          <b>{number}</b>
        </span>
        {state === 'gratis' ? <span className="g-slot-pill">{pillLabel}</span> : <StateIcon state={state} progress={progress} />}
      </div>
      <div className="g-slot-bt">
        <b>{title}</b>
        {sub && <small>{sub}</small>}
      </div>
    </>
  );

  const cls = cn('g-slot', `g-slot-${state}`, className);
  if (state === 'nog' || !href) {
    return <div className={cls} aria-label={ariaLabel}>{body}</div>;
  }
  return (
    <Link href={href} className={cls} aria-label={ariaLabel}>
      {body}
    </Link>
  );
}

function StateIcon({ state, progress }: { state: Exclude<ExamSlotState, 'gratis'>; progress: number }) {
  if (state === 'bezig') {
    const f = Math.min(100, Math.max(0, progress)) / 100;
    const r = 17;
    const C = 2 * Math.PI * r;
    const a = ((f * 360 - 90) * Math.PI) / 180;
    return (
      <span className="g-slot-ic">
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="3.5" />
          <circle
            cx="20" cy="20" r={r} fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"
            strokeDasharray={`${(C * f).toFixed(1)} ${C.toFixed(1)}`} transform="rotate(-90 20 20)"
          />
          <circle cx={(20 + r * Math.cos(a)).toFixed(2)} cy={(20 + r * Math.sin(a)).toFixed(2)} r="3.2" fill="#fe762c" />
        </svg>
        <span className="g-tnum">{Math.round(f * 100)}%</span>
      </span>
    );
  }
  const Icon = { open: ArrowRight, gehaald: Check, niet: X, pakket: Lock, nog: Clock }[state];
  return (
    <span className="g-slot-ic" aria-hidden="true">
      <Icon strokeWidth={2.25} className={state === 'open' ? 'rtl-flip' : undefined} />
    </span>
  );
}
