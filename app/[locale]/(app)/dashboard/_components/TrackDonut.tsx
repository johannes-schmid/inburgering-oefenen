import { ArrowRight } from 'lucide-react';

/**
 * Eén tegel van het portaaloverzicht: een ring met het percentage, de trackmark en één uitgang.
 *
 * De ring en niet de balk, omdat er op dit scherm vier naast elkaar staan: vier balken onder
 * elkaar lezen als één tabel waarin je moet vergelijken, vier ringen als vier dingen waarvan er
 * één het verst is. De balk blijft binnen een module, waar er maar één is.
 *
 * `pct: null` is *niet* 0 — dat is ONA, dat niet bestaat. Die tegel krijgt een gestippelde ring
 * en geen uitgang: een link zou beloven dat er iets achter zit, en een prijs of een slot dat
 * betalen het opent. Zelfde regel als de ONA-tegel op de homepage.
 */
export default function TrackDonut({
  mark, title, pct, soonLabel, cta, href,
}: {
  mark: React.ReactNode;
  title: string;
  pct: number | null;
  soonLabel: string;
  cta: string | null;
  href: string | null;
}) {
  const R = 42;
  const C = 2 * Math.PI * R;
  const shown = pct == null ? 0 : Math.max(0, Math.min(100, pct));

  return (
    <div className={`tdon${pct == null ? ' is-soon' : ''}`}>
      <div className="tdon-ring">
        {pct == null ? (
          <span className="tdon-soon">{soonLabel}</span>
        ) : (
          <>
            <svg viewBox="0 0 100 100" aria-hidden>
              <circle className="tdon-track" cx="50" cy="50" r={R} />
              {/* -90° zodat de boog bovenaan begint: dat is waar een percentage hoort te
                  starten, en het is de enige plek waar hij op alle vier de tegels gelijk is.
                  Bij 0 helemaal geen boog: een ronde streepdop tekent op nul nog steeds een
                  stip, en die stip las als "je bent al een klein beetje". */}
              {shown > 0 && <circle
                className="tdon-arc"
                cx="50" cy="50" r={R}
                strokeDasharray={`${(shown / 100) * C} ${C}`}
                transform="rotate(-90 50 50)"
              />}
            </svg>
            <span className="tdon-pct">{shown}%</span>
          </>
        )}
      </div>

      <div className="tdon-name">
        <span className="tdon-mark" aria-hidden>{mark}</span>
        <span>{title}</span>
      </div>

      {cta && href && (
        <a href={href} className="tdon-cta">
          {cta}
          <ArrowRight size={13} strokeWidth={2.6} className="rtl-flip" aria-hidden />
        </a>
      )}
    </div>
  );
}
