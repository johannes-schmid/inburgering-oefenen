import { ArrowRight } from 'lucide-react';

/**
 * Eén track als rij: de ring, waar je gebleven bent, en één knop.
 *
 * De rij en niet de tegel, omdat er naast de ring iets te zeggen valt — welke les je hierna
 * doet. Vier tegels konden dat niet dragen zonder drie regels tekst onder een cirkel te
 * proppen; een rij heeft de breedte al.
 *
 * **Eén rij is de huidige** (`accent`): die van de les waar je het laatst aan werkte, anders de
 * eerste die van jou is. Dat is het enige oranje vlak op het scherm — de sun-disc-regel geldt
 * ook voor een gevulde kaart, dus als deze rij oranje is, is de rest dat niet.
 *
 * `pct: null` is ONA: niet gebouwd, dus een gestippelde ring en geen uitgang. Een link zou
 * beloven dat er iets achter zit, een prijs of een slot dat betalen het opent.
 */
export default function TrackRow({
  mark, title, note, pct, soonLabel, cta, href, accent = false,
}: {
  mark: React.ReactNode;
  title: string;
  note: string;
  pct: number | null;
  soonLabel: string;
  cta: string | null;
  href: string | null;
  accent?: boolean;
}) {
  const R = 42;
  const C = 2 * Math.PI * R;
  const shown = pct == null ? 0 : Math.max(0, Math.min(100, pct));

  return (
    <div className={`trow${pct == null ? ' is-soon' : ''}${accent ? ' is-now' : ''}`}>
      <div className="trow-ring">
        {pct == null ? (
          <span className="trow-soon">{soonLabel}</span>
        ) : (
          <>
            <svg viewBox="0 0 100 100" aria-hidden>
              <circle className="trow-track" cx="50" cy="50" r={R} />
              {/* Bij 0 geen boog: een ronde streepdop tekent op nul nog steeds een stip, en
                  die stip leest als "je bent al een klein beetje". */}
              {shown > 0 && (
                <circle
                  className="trow-arc"
                  cx="50" cy="50" r={R}
                  strokeDasharray={`${(shown / 100) * C} ${C}`}
                  transform="rotate(-90 50 50)"
                />
              )}
            </svg>
            <span className="trow-pct">{shown}%</span>
          </>
        )}
      </div>

      <div className="trow-body">
        <span className="trow-title">
          <span className="trow-mark" aria-hidden>{mark}</span>
          {title}
        </span>
        <span className="trow-note">{note}</span>
      </div>

      {cta && href && (
        <a href={href} className="trow-cta">
          {cta}
          <ArrowRight size={14} strokeWidth={2.6} className="rtl-flip" aria-hidden />
        </a>
      )}
    </div>
  );
}
