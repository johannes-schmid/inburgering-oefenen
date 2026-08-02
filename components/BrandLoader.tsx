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
          <svg width="72" height="72" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <rect width="100" height="100" rx="23" fill="#002b6d" />
            <rect className="io-loading-bar" x="28" y="29" width="13" height="43" rx="6.5" fill="#fe762c" />
            <circle cx="61" cy="50.5" r="16" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="11" />
            <circle
              className="io-loading-ring"
              cx="61"
              cy="50.5"
              r="16"
              fill="none"
              stroke="#ffffff"
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray="30 70.5"
            />
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
          transform-origin: 61px 50.5px;
          animation: io-loading-spin 1.1s cubic-bezier(0.22, 1, 0.36, 1) infinite;
        }
        .io-loading-bar {
          transform-origin: 34.5px 50.5px;
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
