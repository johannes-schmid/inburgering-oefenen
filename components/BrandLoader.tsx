'use client';

type BrandLoaderProps = {
  /** Cover the viewport (route-level loading) or sit inline in the flow */
  fullPage?: boolean;
  label?: string;
};

export default function BrandLoader({ fullPage = true, label }: BrandLoaderProps) {
  return (
    <div
      className={
        fullPage
          ? 'io-loading fixed inset-0 z-50 flex items-center justify-center bg-[#f8f9fb]'
          : 'io-loading flex items-center justify-center py-16'
      }
      role="status"
      aria-live="polite"
      aria-label={label ?? 'Laden'}
    >
      <div className="flex flex-col items-center gap-5">
        <div className="io-loading-mark">
          {/* The mark, with one arc **orbiting outside the tile**.

              The old loader spun the logo's own outlined ring, which the mark no longer has — it is
              a solid sun disc now (2026-08-22). Putting a spinner ring back *inside* the tile
              undoes that change here and shows a logo the rest of the site retired; it also lands
              on the bar, because a ring around the disc at any useful radius reaches x=40 and the
              bar starts at x=26. So the arc sits outside the tile at r=80, clear of the corners
              (which are 70.7 from the centre) — the lens ring of §7.1, on the one surface where
              motion is the point.

              `strokeDasharray` sums to the full circumference (2π·80 = 502.65) on purpose: any
              other total makes the dash pattern repeat and a second stub arc appears opposite the
              first. */}
          <svg width="112" height="112" viewBox="-36 -36 172 172" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <circle cx="50" cy="50" r="80" fill="none" stroke="rgba(0,43,109,0.12)" strokeWidth="5" />
            <circle
              className="io-loading-ring"
              cx="50"
              cy="50"
              r="80"
              fill="none"
              stroke="#002b6d"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray="125 377.65"
            />
            <rect width="100" height="100" rx="23" fill="#002b6d" />
            <rect className="io-loading-bar" x="26" y="27" width="17" height="46" rx="8.5" fill="#ffffff" />
            <circle cx="65" cy="50" r="17" fill="#fe762c" />
          </svg>
        </div>

        <span
          className="font-headline"
          style={{ fontWeight: 800, fontSize: 18, color: '#002b6d', letterSpacing: '-0.02em', lineHeight: 1 }}
        >
          Inburgering Oefenen
        </span>

        {label && <p style={{ fontSize: 13, color: '#747782', marginTop: -6 }}>{label}</p>}
      </div>

      <style>{`
        .io-loading-mark {
          filter: drop-shadow(0 10px 24px rgba(0,43,109,0.18));
          animation: io-loading-breathe 2.4s cubic-bezier(0.22, 1, 0.36, 1) infinite;
        }
        .io-loading-ring {
          transform-origin: 50px 50px;
          animation: io-loading-spin 1.1s cubic-bezier(0.22, 1, 0.36, 1) infinite;
        }
        .io-loading-bar {
          transform-origin: 34.5px 50px;
          animation: io-loading-pulse 1.6s cubic-bezier(0.22, 1, 0.36, 1) infinite;
        }
        @keyframes io-loading-spin { to { transform: rotate(360deg); } }
        @keyframes io-loading-breathe {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.04); }
        }
        @keyframes io-loading-pulse {
          0%, 100% { transform: scaleY(1);    opacity: 1; }
          50%      { transform: scaleY(0.72); opacity: 0.75; }
        }
        @media (prefers-reduced-motion: reduce) {
          .io-loading-mark, .io-loading-ring, .io-loading-bar { animation: none; }
        }
      `}</style>
    </div>
  );
}
