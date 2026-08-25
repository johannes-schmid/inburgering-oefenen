/**
 * The exam-list surface, shared by the levelled onderdeel page and KNM's.
 *
 * Extracted when KNM's list arrived: two copies of sixty lines of CSS is two places for the
 * lock state, the passed/sat badge colours and the reduced-motion escape to diverge, and the
 * divergence would only ever be visible on one of the two pages.
 */
export default function ExamListStyles() {
  return (
    <style>{`
        .stat-row { display:grid; grid-template-columns:repeat(2,1fr); gap:1px; background:var(--color-surface-container-high); border:1px solid var(--color-surface-container-high); border-radius:14px; overflow:hidden; }
        .stat-row > div { background:#fff; padding:12px 14px; }
        .stat-row dt { font-size:0.66rem; font-weight:800; letter-spacing:0.1em; text-transform:uppercase; color:var(--color-outline); }
        .stat-row dd { font-family:var(--font-headline); font-size:1.15rem; font-weight:800; color:var(--color-primary); margin-top:2px; font-variant-numeric:tabular-nums; letter-spacing:-0.02em; }
        @media (min-width:600px) { .stat-row { grid-template-columns:repeat(4,1fr); } }

        .rubric-note { font-size:0.8rem; line-height:1.6; color:var(--color-on-secondary-container); background:rgba(254,118,44,0.09); border-left:3px solid var(--color-secondary-container); border-radius:0 10px 10px 0; padding:10px 14px; }

        .exam-row { display:flex; align-items:center; gap:14px; padding:14px 16px; background:#fff; border:1.5px solid var(--color-surface-container-high); border-radius:14px; box-shadow:var(--shadow-card); transition:transform .2s cubic-bezier(0.22,1,0.36,1), box-shadow .2s ease, border-color .2s ease; }
        a.exam-row:hover { transform:translateY(-2px); border-color:#b8cef5; box-shadow:0 8px 22px rgba(0,43,109,0.11); }
        a.exam-row:focus-visible { outline:2px solid var(--color-secondary-container); outline-offset:2px; }
        a.exam-row:active { transform:translateY(0); }
        .exam-row.is-locked { background:var(--color-surface-container-low); }
        a.exam-row.is-locked:hover { border-color:#fdc9a3; box-shadow:0 8px 22px rgba(254,118,44,0.14); }

        .exam-num { display:flex; align-items:center; justify-content:center; flex-shrink:0; width:34px; height:34px; border-radius:11px; font-family:var(--font-headline); font-size:0.92rem; font-weight:800; font-variant-numeric:tabular-nums; background:rgba(0,43,109,0.06); color:var(--color-primary); }
        .exam-num.passed { background:linear-gradient(180deg,#1d428a,#002b6d); color:#fff; }
        .exam-num.sat { background:linear-gradient(180deg,#fe762c,#d94f00); color:#fff; }

        .exam-title { display:flex; align-items:center; gap:8px; font-family:var(--font-headline); font-size:0.94rem; font-weight:700; color:var(--color-on-surface); letter-spacing:-0.01em; }
        .exam-sub { display:block; font-size:0.76rem; color:var(--color-outline); margin-top:2px; }
        .badge { font-family:var(--font-body); font-size:0.62rem; font-weight:800; letter-spacing:0.06em; text-transform:uppercase; padding:2px 7px; border-radius:6px; }
        .badge-free { background:rgba(0,43,109,0.08); color:var(--color-primary); }
        .exam-action { display:flex; align-items:center; justify-content:center; flex-shrink:0; min-width:34px; height:34px; color:var(--color-primary); }
        .exam-row.is-locked .exam-action { color:var(--color-outline); }
        @media (prefers-reduced-motion: reduce) {
          .exam-row { transition:none; }
          a.exam-row:hover { transform:none; }
        }
    `}</style>
  );
}
