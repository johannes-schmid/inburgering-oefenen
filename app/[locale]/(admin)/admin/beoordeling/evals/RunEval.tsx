'use client';

import { useState } from 'react';
import { Loader2, PlayCircle, TriangleAlert } from 'lucide-react';

type CriterionResult = {
  key: string;
  n: number;
  exactPct: number;
  within1Pct: number;
  bias: number;
  meanAbsError: number;
};

type EvalRun = {
  skill: string;
  testSize: number;
  trainSize: number;
  compared: number;
  maxScore: number;
  criteria: CriterionResult[];
  failures: { id: number; error: string }[];
  audioEvaluated: boolean;
};

/**
 * Re-grade the held-out set and show how far the model lands from the docent.
 *
 * The numbers above this component are *passive* — they only move when the docent reviews
 * something new, and they mix rubric versions. This runs the same inputs every time, so the effect
 * of editing a rubric or promoting a few-shot example can actually be read off.
 *
 * The train/test sizes are printed with the result, not hidden in a tooltip: a score that jumps
 * because somebody moved three examples from test to train looks identical to a real improvement
 * unless both numbers are on screen.
 */
export default function RunEval({ skills }: { skills: ('schrijven' | 'spreken')[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runs, setRuns] = useState<Record<string, EvalRun>>({});

  async function run(skill: string) {
    setBusy(skill);
    setError(null);
    try {
      const res = await fetch('/api/admin/run-eval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'De eval is niet gelukt.');
      setRuns(prev => ({ ...prev, [skill]: json as EvalRun }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'De eval is niet gelukt.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
      <h2 className="font-headline text-base font-bold text-on-surface m-0">Actieve eval</h2>
      <p className="text-sm text-on-surface-variant mt-1.5 mb-4" style={{ lineHeight: 1.6 }}>
        Beoordeelt de <strong>achtergehouden</strong> voorbeelden opnieuw met de rubriek en de
        voorbeelden van dit moment, en vergelijkt met jouw cijfers. Elke run kost een modelaanroep
        per voorbeeld. Er wordt niets weggeschreven naar de beoordeling van een kandidaat.
      </p>

      <div className="flex flex-wrap gap-2">
        {skills.map(s => (
          <button
            key={s}
            type="button"
            onClick={() => run(s)}
            disabled={busy !== null}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-container disabled:opacity-50"
          >
            {busy === s ? (
              <Loader2 size={15} className="animate-spin" aria-hidden />
            ) : (
              <PlayCircle size={15} aria-hidden />
            )}
            Run eval — {s}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-3 flex items-start gap-2 text-sm text-error">
          <TriangleAlert size={15} className="mt-0.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      {Object.entries(runs).map(([skill, r]) => (
        <div key={skill} className="mt-5 rounded-xl border border-outline-variant p-4">
          <p className="m-0 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            {skill}
          </p>
          <p className="mt-1 mb-3 text-xs text-on-surface-variant">
            {r.testSize} testvoorbeelden · {r.trainSize} als voorbeeld gebruikt · {r.compared} criteria vergeleken
            {!r.audioEvaluated && skill === 'spreken' && (
              // Stated, because the number would otherwise be read as a measurement of the
              // audio-native grading path — and it is not.
              <> · <strong>zonder audio</strong>, alleen op transcript</>
            )}
          </p>

          {r.criteria.length === 0 ? (
            <p className="m-0 text-sm text-on-surface-variant">Niets te vergelijken.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-on-surface-variant">
                  <th className="pb-1.5 font-semibold">Criterium</th>
                  <th className="pb-1.5 text-right font-semibold">Afwijking</th>
                  <th className="pb-1.5 text-right font-semibold">Bias</th>
                  <th className="pb-1.5 text-right font-semibold">Exact</th>
                  <th className="pb-1.5 text-right font-semibold">±1</th>
                </tr>
              </thead>
              <tbody>
                {r.criteria.map(c => (
                  <tr key={c.key} className="border-t border-outline-variant">
                    <td className="py-1.5 font-medium text-on-surface">{c.key}</td>
                    <td className="py-1.5 text-right tabular-nums">{c.meanAbsError.toFixed(2)}</td>
                    <td className="py-1.5 text-right tabular-nums">
                      {c.bias > 0 ? '+' : ''}
                      {c.bias.toFixed(2)}{' '}
                      <span className="text-xs text-on-surface-variant">
                        {c.bias > 0.15 ? 'milder' : c.bias < -0.15 ? 'strenger' : 'gelijk'}
                      </span>
                    </td>
                    <td className="py-1.5 text-right tabular-nums">{c.exactPct}%</td>
                    <td className="py-1.5 text-right tabular-nums">{c.within1Pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {r.failures.length > 0 && (
            <ul className="mt-3 list-none p-0 m-0 space-y-1 text-xs text-error">
              {r.failures.map(f => (
                <li key={f.id}>#{f.id} — {f.error}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </section>
  );
}
