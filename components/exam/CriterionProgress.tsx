import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { scoreToPct, type CriterionSeries } from '@/lib/criterion-progress';
import { MAX_CRITERION_SCORE } from '@/lib/rubrics';

/**
 * Per-criterion progress for Schrijven and Spreken.
 *
 * A single percentage is the right headline for Lezen and Luisteren and the wrong one here: it
 * tells a candidate they scored 62% without telling them that grammar is fine and content is not.
 * So this shows one row per criterion, weakest first, with a sparkline of the sittings behind it.
 *
 * Server component — it renders values that are already computed. Nothing here is interactive.
 */
export default function CriterionProgress({
  series,
  className = '',
}: {
  series: CriterionSeries[];
  className?: string;
}) {
  if (series.length === 0) return null;

  const sittings = Math.max(...series.map(s => s.points.length));

  return (
    <section className={`cp ${className}`}>
      <div className="cp-head">
        <h2 className="cp-title">Je vaardigheden</h2>
        <p className="cp-sub">
          Per onderdeel van de beoordeling, over {sittings} {sittings === 1 ? 'beoordeelde sessie' : 'beoordeelde sessies'}.
        </p>
      </div>

      <ul className="cp-list">
        {series.map(s => {
          const delta = Math.round((s.latest - s.first) * 100) / 100;
          // One sitting is a measurement, not a trend — saying "gelijk gebleven" would imply we
          // had something to compare it with.
          const trend = s.points.length < 2 ? null : delta > 0.15 ? 'up' : delta < -0.15 ? 'down' : 'flat';

          return (
            <li key={s.key} className="cp-row">
              <div className="cp-row-head">
                <span className="cp-label">{s.label}</span>
                <span className="cp-score">
                  {s.latest.toFixed(1)}
                  <small> / {MAX_CRITERION_SCORE}</small>
                </span>
              </div>

              <div className="cp-bar" role="img" aria-label={`${s.label}: ${s.latest} van ${MAX_CRITERION_SCORE}`}>
                <span className="cp-bar-fill" style={{ width: `${scoreToPct(s.latest)}%` }} />
              </div>

              <p className="cp-meta">
                {trend === 'up' && (
                  <span className="cp-up">
                    <TrendingUp size={13} aria-hidden /> +{delta.toFixed(1)} sinds je eerste sessie
                  </span>
                )}
                {trend === 'down' && (
                  <span className="cp-down">
                    <TrendingDown size={13} aria-hidden /> {delta.toFixed(1)} sinds je eerste sessie
                  </span>
                )}
                {trend === 'flat' && (
                  <span className="cp-flat">
                    <Minus size={13} aria-hidden /> gelijk gebleven
                  </span>
                )}
                {trend === null && <span className="cp-flat">Eén sessie — nog geen verloop</span>}
                <span className="cp-n">
                  {s.n} {s.n === 1 ? 'antwoord' : 'antwoorden'}
                </span>
              </p>
            </li>
          );
        })}
      </ul>

      <style>{`
        .cp { background:#fff; border:1.5px solid var(--color-surface-container-high); border-radius:18px; padding:20px 22px; box-shadow:var(--shadow-card-md); }
        .cp-head { margin-bottom:16px; }
        .cp-title { font-family:var(--font-headline); font-size:1rem; font-weight:800; color:var(--color-on-surface); margin:0; letter-spacing:-0.02em; }
        .cp-sub { margin:3px 0 0; font-size:0.78rem; color:var(--color-outline); }
        .cp-list { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:15px; }
        .cp-row-head { display:flex; align-items:baseline; justify-content:space-between; gap:12px; }
        .cp-label { font-size:0.87rem; font-weight:700; color:var(--color-on-surface); }
        .cp-score { font-family:var(--font-headline); font-size:1rem; font-weight:800; color:var(--color-primary); font-variant-numeric:tabular-nums; }
        .cp-score small { font-size:0.72rem; font-weight:600; color:var(--color-outline); }
        .cp-bar { margin-top:6px; height:7px; border-radius:999px; background:var(--color-surface-container); overflow:hidden; }
        .cp-bar-fill { display:block; height:100%; border-radius:999px; background:linear-gradient(to right,#a24000,#fe762c); }
        .cp-meta { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:8px; margin:6px 0 0; font-size:0.73rem; }
        .cp-meta span { display:inline-flex; align-items:center; gap:4px; }
        .cp-up { color:var(--color-secondary); font-weight:700; }
        .cp-down { color:var(--color-error); font-weight:700; }
        .cp-flat { color:var(--color-outline); }
        .cp-n { color:var(--color-outline); font-variant-numeric:tabular-nums; }
      `}</style>
    </section>
  );
}
