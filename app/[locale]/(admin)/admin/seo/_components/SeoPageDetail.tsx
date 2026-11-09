'use client';

import { useState, type ReactNode } from 'react';
import { Check, ClipboardCopy, ExternalLink, ListChecks, Sparkles, TriangleAlert } from 'lucide-react';
import type { StructurePage } from '@/lib/admin/seo';
import { expectedImpressions } from '@/lib/admin/seo-score.mjs';
import { aiPrompt, manualSteps, type PromptPage } from '@/lib/admin/seo-prompts';

/**
 * Het uitgeklapte detail van één pagina in de tabel van `/admin/seo`: waarom de score, de
 * zoekcijfers, wat de concurrenten beter doen, en twee knoppen — een prompt voor Claude Code of de
 * stappen om het zelf te doen. De teksten worden pas bij die klik gebouwd (`seo-prompts.ts`).
 */

const nf = new Intl.NumberFormat('en-GB');
const ORIGIN = 'https://inburgeringoefenen.nl';

export const OWNER: Record<string, { label: string; cls: string }> = {
  eigenaar: { label: 'You', cls: 'bg-primary text-white' },
  amber: { label: 'Amber', cls: 'bg-[#fcecdd] text-[#a24000]' },
  agent: { label: 'Agent', cls: 'bg-surface-container text-on-surface' },
};

export function scoreTone(score: number) {
  if (score >= 8) return 'bg-[var(--goed-tint)] text-[var(--goed-ink)]';
  if (score >= 5) return 'bg-[#fcecdd] text-[#a24000]';
  return 'bg-[var(--fout-tint)] text-[var(--fout)]';
}

export const weekNo = (w?: string) => (w ? `week ${Number(w.split('-W')[1])}` : null);

/** De volgende stap in één regel: de to-dolijst eerst, dan het plan van de triage, dan de score zelf. */
export function nextAction(p: StructurePage): { text: string; owner: string | null; when: string | null } {
  const rec = p.recs[0];
  if (rec) return { text: rec.task, owner: rec.owner, when: rec.priority === 'now' ? 'now' : weekNo(p.plan?.week) };
  const owner = p.plan?.owner ?? null;
  const when = weekNo(p.plan?.week);
  switch (p.verdict) {
    case 'remove': return { text: 'Noindex it and drop it from the sitemap', owner, when };
    case 'consolidate': return { text: `Merge into ${p.plan?.into ?? 'the stronger page'}`, owner, when };
    case 'improve': return { text: 'Teacher rewrite with a real demonstration', owner, when };
    case 'watch': return { text: 'Decide: merge, noindex or enrich', owner, when };
  }
  const snippet = p.factors.find(f => f.key === 'snippet');
  if (snippet) return { text: snippet.label.startsWith('Title') ? 'Fix the title length' : 'Fix the meta description length', owner: 'agent', when: null };
  if (p.factors.some(f => f.key === 'technical')) return { text: 'Fix the technical error', owner: 'agent', when: null };
  if (p.factors.length) return { text: 'Find out why Google shows it less', owner: 'agent', when: null };
  return { text: 'Nothing to do', owner: null, when: null };
}

export function whyLine(p: StructurePage): string {
  if (!p.factors.length) return p.demand > 0 ? 'No issues found' : 'No issues found, little search demand';
  return [...p.factors].sort((a, b) => a.delta - b.delta)[0].label;
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <h4 className="text-xs font-semibold text-on-surface-variant">{title}</h4>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

export function PageDetail({ id, p, sectionLabel, insights }: { id: string; p: StructurePage; sectionLabel: string; insights: string[] }) {
  const [manual, setManual] = useState(false);
  const promptPage: PromptPage = { ...p, sectionLabel, insights };
  const expected = Math.round(expectedImpressions(p.demand));

  return (
    <div id={id} className="px-3 pt-1 pb-4 transition-opacity duration-200 ease-out starting:opacity-0 motion-reduce:transition-none sm:px-4 lg:pl-[80px]">
      <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
        <Block title="Why this score">
          <ul className="space-y-1 text-[13px] text-on-surface tabular-nums">
            <li className="flex justify-between gap-3 text-on-surface-variant"><span>Starts at</span><span>10</span></li>
            {p.factors.map(f => (
              <li key={f.key} className="flex justify-between gap-3"><span className="min-w-0">{f.label}</span><span className="shrink-0 font-semibold text-[var(--fout)]">{f.delta}</span></li>
            ))}
            <li className="flex justify-between gap-3 pt-1 font-semibold"><span>Score</span><span>{p.score}/10</span></li>
          </ul>
        </Block>

        <Block title="Google, last 28 days">
          {p.now ? (
            <p className="text-[13px] text-on-surface tabular-nums">
              <span className="font-semibold">{nf.format(p.now.impressions)}</span> impressions · <span className="font-semibold">{nf.format(p.now.clicks)}</span> clicks
              {p.now.position !== null && <> · position <span className="font-semibold">{p.now.position.toFixed(1)}</span></>}
              {expected > 0 && <span className="block text-xs text-on-surface-variant">At the Aug–Sep level this would be about {nf.format(expected)} impressions.</span>}
            </p>
          ) : (
            <p className="text-[13px] text-on-surface-variant">Unknown: no Search Console data right now.</p>
          )}
          {p.queries.length > 0 && (
            <ul className="mt-2 space-y-0.5 text-xs text-on-surface-variant tabular-nums">
              {p.queries.map(q => (
                <li key={q.query} className="flex justify-between gap-3"><span className="min-w-0 truncate text-on-surface">{q.query}</span><span className="shrink-0">#{Math.round(q.position)} · {nf.format(q.impressions)}</span></li>
              ))}
            </ul>
          )}
        </Block>

        <Block title="Recommended action">
          <div className="space-y-2 text-[13px] leading-relaxed text-on-surface">
            {p.recs.map(r => (
              <div key={r.id}>
                <p className="font-semibold">{r.task}</p>
                <p className="text-on-surface-variant">{r.why}</p>
                <p className="mt-0.5"><span className="font-semibold">We expect:</span> {r.expect}</p>
              </div>
            ))}
            {p.plan && (!p.recs.length || p.plan.action !== p.recs[0]?.task) && (
              <p>{p.plan.action}{p.plan.week && <span className="text-on-surface-variant"> · {weekNo(p.plan.week)}</span>}</p>
            )}
            {!p.recs.length && !p.plan && <p>{nextAction(p).text}.</p>}
            <p className="text-xs text-on-surface-variant">Triage: {p.reason}</p>
          </div>
        </Block>

        <Block title="What competitors do better">
          {p.competitor && <p className="mb-2 rounded-lg bg-[rgba(0,43,109,0.05)] px-3 py-2 text-[13px] leading-relaxed text-on-surface">{p.competitor}</p>}
          {insights.length ? (
            <ul className="list-disc space-y-1 pl-4 text-[13px] leading-relaxed text-on-surface marker:text-on-surface-variant">
              {insights.map(i => <li key={i}>{i}</li>)}
            </ul>
          ) : (
            <p className="text-[13px] text-on-surface-variant">No competitor insight for this section yet.</p>
          )}
        </Block>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <CopyButton text={() => aiPrompt(promptPage)} />
        <button
          type="button"
          aria-expanded={manual}
          onClick={() => setManual(m => !m)}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-surface-container-low px-3 text-sm font-medium text-on-surface transition-transform duration-150 ease-out hover:bg-surface-container focus-visible:outline-none focus-visible:shadow-[var(--ring-selected)] active:scale-[0.97] motion-reduce:transition-none"
        >
          <ListChecks className="size-4" aria-hidden /> Do it yourself
        </button>
        <a
          href={`${ORIGIN}${p.path}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:shadow-[var(--ring-selected)]"
        >
          Open page <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </div>

      {manual && (
        <ol className="mt-3 list-decimal space-y-1 rounded-xl bg-surface-container-low py-3 pr-4 pl-8 text-[13px] leading-relaxed text-on-surface marker:font-semibold marker:text-on-surface-variant">
          {manualSteps(promptPage).map(s => <li key={s}>{s}</li>)}
        </ol>
      )}
    </div>
  );
}

function CopyButton({ text }: { text: () => string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [fallback, setFallback] = useState<string | null>(null);
  const copy = async () => {
    const value = text();
    try {
      await navigator.clipboard.writeText(value);
      setState('copied');
      setFallback(null);
      setTimeout(() => setState('idle'), 1800);
    } catch {
      setState('failed');
      setFallback(value);
    }
  };
  return (
    <>
      <button
        type="button"
        onClick={copy}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-white transition-transform duration-150 ease-out hover:opacity-90 focus-visible:outline-none focus-visible:shadow-[var(--ring-selected)] active:scale-[0.97] motion-reduce:transition-none"
      >
        {state === 'copied' ? <Check className="size-4" aria-hidden /> : state === 'failed' ? <TriangleAlert className="size-4" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
        <span aria-live="polite">{state === 'copied' ? 'Prompt copied' : state === 'failed' ? 'Copy failed, select below' : 'Fix with AI: copy prompt'}</span>
        {state === 'idle' && <ClipboardCopy className="size-3.5 opacity-70" aria-hidden />}
      </button>
      {fallback && (
        <textarea
          readOnly
          value={fallback}
          onFocus={e => e.currentTarget.select()}
          className="mt-2 h-48 w-full rounded-xl bg-surface-container-low p-3 font-mono text-xs text-on-surface focus-visible:outline-none focus-visible:shadow-[var(--ring-selected)]"
        />
      )}
    </>
  );
}
