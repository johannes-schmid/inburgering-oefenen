import Link from 'next/link';
import { ArrowLeft, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { categoryLabel, MAX_CRITERION_SCORE, type RubricCriterion } from '@/lib/rubrics';
import {
  biasLabel,
  confidenceNote,
  summariseAgreement,
  type ScoreRow,
} from '@/lib/grading-evals';
import RunEval from './RunEval';

export const revalidate = 0;

/**
 * Does the model agree with the docent?
 *
 * Reads the pairs that `open_criterion_scores` keeps deliberately side by side. The headline number
 * is **not** accuracy — it is signed bias per criterion, because "the model is 0.6 too mild on
 * grammatica" tells the docent which anchors to rewrite, while "71% agreement" tells her nothing
 * she can act on.
 *
 * The train/test split is stated on the page on purpose: `grading_examples.use_as_fewshot = true`
 * is fed to the grader, `false` is held back. Promoting a held-back example into the few-shot set
 * makes the next eval look better without the model having got better, and somebody who does not
 * know that will do it.
 */
export default async function EvalsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  const { data: scoreRows } = await supabase
    .from('open_criterion_scores')
    .select('submission_id, criterion_key, score, feedback, source, rubric_id, rubric_version');

  const summary = summariseAgreement((scoreRows ?? []) as unknown as ScoreRow[]);
  const confidence = confidenceNote(summary.total);

  // Criterion keys are database slugs; the docent named them something readable.
  const { data: rubrics } = await supabase.from('rubrics').select('id, task_type, criteria');
  const criterionName = new Map<string, string>();
  const criterionCategory = new Map<string, string>();
  for (const r of (rubrics ?? []) as { id: number; task_type: string; criteria: unknown }[]) {
    for (const c of (Array.isArray(r.criteria) ? r.criteria : []) as RubricCriterion[]) {
      if (!criterionName.has(c.key)) {
        criterionName.set(c.key, c.criterion);
        criterionCategory.set(c.key, r.task_type);
      }
    }
  }

  const { count: fewshotCount } = await supabase
    .from('grading_examples')
    .select('id', { count: 'exact', head: true })
    .eq('use_as_fewshot', true);

  const { count: testCount } = await supabase
    .from('grading_examples')
    .select('id', { count: 'exact', head: true })
    .eq('use_as_fewshot', false);

  return (
    <div className="space-y-7 max-w-4xl">
      <div>
        <Link
          href={`/${locale}/admin/beoordeling`}
          className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <ArrowLeft size={15} aria-hidden />
          Beoordelen
        </Link>
        <h1 className="font-headline text-2xl font-extrabold text-on-surface tracking-tight mt-3">
          Overeenkomst met jouw beoordeling
        </h1>
        <p className="text-sm text-on-surface-variant mt-1.5 leading-relaxed max-w-2xl">
          Elke inzending die jij nakijkt levert per criterium een vergelijking op tussen de
          voorbeoordeling en jouw cijfer. Hieronder staat waar het model van je afwijkt, en in welke
          richting.
        </p>
      </div>

      <RunEval skills={['schrijven', 'spreken']} />

      <div
        className={`rounded-xl border p-4 text-sm leading-relaxed ${
          confidence.level === 'good'
            ? 'border-outline-variant bg-surface-container-low text-on-surface-variant'
            : 'border-secondary-container/40 bg-secondary-container/10 text-on-surface'
        }`}
      >
        {confidence.text}
      </div>

      {summary.total > 0 && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Zelfde cijfer" value={`${summary.exact_pct}%`} />
            <Stat label="Maximaal 1 ernaast" value={`${summary.within_one_pct}%`} />
            <Stat
              label="Gemiddeld verschil"
              value={`${summary.mean_bias > 0 ? '+' : ''}${summary.mean_bias}`}
              hint={
                Math.abs(summary.mean_bias) < 0.15
                  ? 'even streng als jij'
                  : summary.mean_bias > 0
                    ? 'model is milder'
                    : 'model is strenger'
              }
            />
          </div>

          <section className="space-y-2">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-outline">
              Per criterium — grootste afwijking eerst
            </h2>
            <div className="rounded-xl border border-outline-variant overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface-container-low">
                  <tr className="text-left">
                    <th className="px-4 py-2.5 font-semibold text-on-surface">Criterium</th>
                    <th className="px-3 py-2.5 font-semibold text-on-surface text-right">n</th>
                    <th className="px-3 py-2.5 font-semibold text-on-surface text-right">
                      Zelfde
                    </th>
                    <th className="px-3 py-2.5 font-semibold text-on-surface text-right">±1</th>
                    <th className="px-4 py-2.5 font-semibold text-on-surface">
                      Richting van de afwijking
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/60">
                  {summary.perCriterion.map(c => (
                    <tr key={c.criterion_key}>
                      <td className="px-4 py-2.5">
                        <span className="font-medium text-on-surface">
                          {criterionName.get(c.criterion_key) ?? c.criterion_key}
                        </span>
                        {criterionCategory.has(c.criterion_key) && (
                          <span className="block text-xs text-outline">
                            {categoryLabel(criterionCategory.get(c.criterion_key)!)}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-on-surface-variant">
                        {c.n}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-on-surface-variant">
                        {c.exact_pct}%
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-on-surface-variant">
                        {c.within_one_pct}%
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1.5 text-on-surface-variant">
                          {Math.abs(c.mean_bias) < 0.15 ? (
                            <Minus size={13} className="text-outline" aria-hidden />
                          ) : c.mean_bias > 0 ? (
                            <TrendingUp size={13} className="text-secondary" aria-hidden />
                          ) : (
                            <TrendingDown size={13} className="text-primary" aria-hidden />
                          )}
                          {biasLabel(c.mean_bias)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Een criterium waar het model structureel milder of strenger is, is meestal een
              criterium waarvan de ankerbeschrijvingen te ruim zijn. Herschrijf het anker bij het
              cijfer waar de meeste verwarring zit — dat werkt beter dan meer voorbeelden.
            </p>
          </section>

          {summary.worst.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-outline">
                Grootste meningsverschillen ({summary.worst.length})
              </h2>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Twee of meer punten verschil op een schaal van 0–{MAX_CRITERION_SCORE}. Deze zijn de
                moeite waard om als ijkvoorbeeld toe te voegen.
              </p>
              <ul className="space-y-1.5">
                {summary.worst.map(p => (
                  <li
                    key={`${p.submission_id}-${p.criterion_key}`}
                    className="rounded-xl border border-outline-variant p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-medium text-on-surface">
                        {criterionName.get(p.criterion_key) ?? p.criterion_key}
                      </span>
                      <span className="text-xs tabular-nums text-on-surface-variant">
                        model {p.ai} · jij {p.teacher}
                      </span>
                      <span className="text-xs text-outline ml-auto">
                        inzending #{p.submission_id}
                      </span>
                    </div>
                    {p.ai_feedback && (
                      <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                        <span className="font-semibold">Model:</span> {p.ai_feedback}
                      </p>
                    )}
                    {p.teacher_feedback && (
                      <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                        <span className="font-semibold">Jij:</span> {p.teacher_feedback}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <section className="space-y-2">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-outline">
          Voorbeelden: wat leert en wat meet
        </h2>
        <div className="rounded-xl border border-outline-variant p-4 space-y-2 text-sm leading-relaxed">
          <p className="text-on-surface-variant">
            <strong className="text-on-surface font-semibold tabular-nums">
              {fewshotCount ?? 0} ijkvoorbeelden
            </strong>{' '}
            gaan mee naar het model bij elke voorbeoordeling.{' '}
            <strong className="text-on-surface font-semibold tabular-nums">
              {testCount ?? 0} achtergehouden
            </strong>{' '}
            voorbeelden doen dat niet.
          </p>
          <p className="text-on-surface-variant">
            Die scheiding is opzettelijk. Een achtergehouden voorbeeld meet of het model beter
            geworden is; zet je het bij de ijkvoorbeelden, dan kent het model het antwoord al en
            gaat het cijfer omhoog zonder dat er iets verbeterd is. Verplaats een voorbeeld dus niet
            om de score te zien stijgen.
          </p>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface p-4">
      <p className="text-xs font-extrabold uppercase tracking-widest text-outline">{label}</p>
      <p className="font-headline text-2xl font-extrabold text-primary tabular-nums tracking-tight mt-1">
        {value}
      </p>
      {hint && <p className="text-xs text-on-surface-variant mt-0.5">{hint}</p>}
    </div>
  );
}
