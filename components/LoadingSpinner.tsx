'use client';

export default function LoadingSpinner({ label }: { size?: string; label?: string }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#f8f9fb', zIndex: 100 }}>
      <div className="flex flex-col items-center gap-6">
        {/* Logo mark — orange bar + wordmark */}
        <div className="flex items-center gap-3">
          <div
            className="rounded-full"
            style={{ width: 5, height: 36, background: 'linear-gradient(180deg,#fe762c 0%,#d94f00 100%)' }}
          />
          <span
            style={{
              fontFamily: 'var(--font-headline, Arial Black, sans-serif)',
              fontWeight: 800,
              fontSize: 26,
              color: '#002b6d',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            Inburgering Oefenen
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ width: 160, height: 3, borderRadius: 99, background: '#e0e3e5', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              borderRadius: 99,
              background: 'linear-gradient(90deg,#002b6d,#fe762c)',
              animation: 'knm-sweep 1.4s ease-in-out infinite',
            }}
          />
        </div>

        {label && (
          <p style={{ fontSize: 13, color: '#747782', marginTop: -8 }}>{label}</p>
        )}
      </div>
      <style>{`
        @keyframes knm-sweep {
          0%   { transform: translateX(-100%) scaleX(0.3); }
          50%  { transform: translateX(0%)    scaleX(1);   }
          100% { transform: translateX(100%)  scaleX(0.3); }
        }
      `}</style>
    </div>
  );
}
