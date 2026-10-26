'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Check, ChevronDown, ClipboardCopy, ExternalLink, ListChecks, Sparkles, TriangleAlert } from 'lucide-react';
import type { SiteStructure, StructurePage } from '@/lib/admin/seo';
import { expectedImpressions } from '@/lib/admin/seo-score.mjs';
import { aiPrompt, manualSteps, type PromptPage } from '@/lib/admin/seo-prompts';

/**
 * De sitestructuur van `/admin/seo`: elke sitemap-pagina in haar sectie, met een score op 10, de
 * reden en de volgende stap. Een klik klapt de pagina open: waarom de score, de zoekcijfers, wat de
 * concurrenten beter doen, en twee knoppen — een prompt voor Claude Code of de stappen om het zelf
 * te doen. De teksten worden pas bij die klik gebouwd (`seo-prompts.ts`).
 */

const nf = new Intl.NumberFormat('en-GB');
const ORIGIN = 'https://inburgeringoefenen.nl';

const OWNER: Record<string, { label: string; cls: string }> = {
  eigenaar: { label: 'You', cls: 'bg-primary text-white' },
  amber: { label: 'Amber', cls: 'bg-[#fcecdd] text-[#a24000]' },
  agent: { label: 'Agent', cls: 'bg-surface-container text-on-surface' },
};

function scoreTone(score: number) {
  if (score >= 8) return 'bg-[var(--goed-tint)] text-[var(--goed-ink)]';
  if (score >= 5) return 'bg-[#fcecdd] text-[#a24000]';
  return 'bg-[var(--fout-tint)] text-[var(--fout)]';
}

const weekNo = (w?: string) => (w ? `week ${Number(w.split('-W')[1])}` : null);

/** De volgende stap in één regel: de to-dolijst eerst, dan het plan van de triage, dan de score zelf. */
function nextAction(p: StructurePage): { text: string; owner: string | null; when: string | null } {
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

function whyLine(p: StructurePage): string {
  if (!p.factors.length) return p.demand > 0 ? 'No issues found' : 'No issues found, little search demand';
  return [...p.factors].sort((a, b) => a.delta - b.delta)[0].label;
}

type Filter = 'all' | 'action';

/** Een 9 met alleen een te lange titel is geen werk voor deze week; vanaf een 7 wel. */
const needsAction = (p: StructurePage) => p.score <= 7;

export function SeoSiteStructure({ structure }: { structure: SiteStructure }) {
  const [filter, setFilter] = useState<Filter>('all');
  const bySection = useMemo(() => {
    const m = new Map<string, StructurePage[]>();
    for (const p of structure.pages) m.set(p.section, [...(m.get(p.section) ?? []), p]);
    for (const list of m.values()) list.sort((a, b) => b.weight - a.weight);
    return m;
  }, [structure.pages]);
  const needAction = structure.pages.filter(needsAction).length;

  return (
    <section aria-labelledby="structure">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 id="structure" className="text-xl font-headline font-bold tracking-tight text-on-surface">Site structure</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Every page in the sitemap, grouped and scored out of 10. Open a group to see its pages, biggest first. {needAction} score 7 or lower and need an action.
            {!structure.live && ' Search numbers from Friday’s data pull.'}
          </p>
        </div>
        <div role="radiogroup" aria-label="Filter pages" className="inline-flex rounded-lg bg-surface-container-low p-0.5 text-sm">
          {([['all', 'All pages'], ['action', 'Needs action']] as const).map(([k, label]) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={filter === k}
              onClick={() => setFilter(k)}
              className={`rounded-md px-3 py-1.5 font-medium transition-transform duration-150 ease-out focus-visible:outline-none focus-visible:shadow-[var(--ring-selected)] active:scale-[0.97] motion-reduce:transition-none ${filter === k ? 'bg-surface-container-lowest text-on-surface shadow-[var(--shadow-ambient)]' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {structure.sections.map(s => {
          const all = bySection.get(s.key) ?? [];
          const rows = filter === 'all' ? all : all.filter(needsAction);
          return (
            <SectionBlock
              key={s.key}
              label={s.label}
              note={s.note}
              score={s.score}
              total={all.length}
              rows={rows}
              insights={s.insights}
              actions={all.filter(needsAction).length}
              forceOpen={filter === 'action' && rows.length > 0}
            />
          );
        })}
      </div>

      {structure.planned.length > 0 && (
        <div className="mt-4 rounded-2xl bg-surface-container-low px-5 py-4">
          <h3 className="text-sm font-headline font-bold text-on-surface">Planned new pages</h3>
          <ul className="mt-2 space-y-1.5 text-[13px] text-on-surface">
            {structure.planned.map(p => (
              <li key={p.id} className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-semibold">{p.title}</span>
                <span className="text-on-surface-variant">{weekNo(p.week)} · {p.why}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function SectionBlock({ label, note, score, total, rows, insights, actions, forceOpen }: {
  label: string; note: string; score: number | null; total: number; rows: StructurePage[]; insights: string[]; actions: number; forceOpen: boolean;
}) {
  const [toggled, setToggled] = useState<boolean | null>(null);
  const open = toggled ?? forceOpen;
  const id = `sec-${label.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-[var(--shadow-ambient)]">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setToggled(!open)}
        className="group grid w-full grid-cols-[1fr_auto] items-center gap-x-4 px-5 py-4 text-left transition-colors duration-150 hover:bg-surface-container-low/50 focus-visible:outline-none focus-visible:shadow-[inset_var(--ring-selected)] sm:px-6"
      >
        <span className="min-w-0">
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-[15px] font-headline font-bold tracking-tight text-on-surface">{label}</span>
            <span className="text-xs text-on-surface-variant tabular-nums">
              {total} {total === 1 ? 'page' : 'pages'} · {actions === 0 ? 'nothing urgent' : `${actions} need an action`}
            </span>
          </span>
          <span className="mt-0.5 block text-xs text-on-surface-variant">{note}</span>
        </span>
        <span className="flex items-center gap-3">
          {score !== null && (
            <span className={`rounded-lg px-2.5 py-1 text-sm font-bold tabular-nums ${scoreTone(score)}`}>
              {score.toFixed(1)}<span className="text-[11px] font-semibold opacity-70">/10</span>
            </span>
          )}
          <ChevronDown className={`size-4 text-on-surface-variant transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} aria-hidden />
        </span>
      </button>

      {open && (
        <div id={id} className="bg-surface-container-low/40 px-2 pb-2 sm:px-3 sm:pb-3">
          {rows.length === 0 ? (
            <p className="px-3 py-4 text-sm text-on-surface-variant">Every page here scores 8 or higher.</p>
          ) : (
            <>
              <div className="hidden grid-cols-[52px_minmax(0,1.3fr)_minmax(0,1.2fr)_minmax(0,1.5fr)_28px] gap-x-4 px-3 pt-3 pb-1.5 text-[11px] font-medium text-on-surface-variant lg:grid">
                <span>Score</span><span>Page</span><span>Why this score</span><span>Next action</span><span />
              </div>
              <ul className="space-y-1">
                {rows.map(p => <PageRow key={p.path} p={p} sectionLabel={label} insights={insights} />)}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function PageRow({ p, sectionLabel, insights }: { p: StructurePage; sectionLabel: string; insights: string[] }) {
  const [open, setOpen] = useState(false);
  const action = nextAction(p);
  const owner = action.owner ? OWNER[action.owner] : null;
  const panel = `row-${p.path}`;
  return (
    <li className={`rounded-xl transition-colors duration-150 ${open ? 'bg-surface-container-lowest shadow-[var(--shadow-ambient)]' : ''}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panel}
        onClick={() => setOpen(o => !o)}
        className="grid w-full grid-cols-[44px_minmax(0,1fr)_20px] items-start gap-x-3 gap-y-1 rounded-xl px-3 py-2.5 text-left transition-colors duration-150 hover:bg-surface-container-lowest focus-visible:outline-none focus-visible:shadow-[var(--ring-selected)] lg:grid-cols-[52px_minmax(0,1.3fr)_minmax(0,1.2fr)_minmax(0,1.5fr)_28px] lg:items-center lg:gap-x-4"
      >
        <span className={`row-span-3 flex h-8 w-11 items-center justify-center rounded-lg text-sm font-bold tabular-nums lg:row-span-1 ${scoreTone(p.score)}`}>
          {p.score}
        </span>
        <span className="min-w-0 truncate font-mono text-[13px] text-on-surface" dir="auto">{decodeURI(p.path)}</span>
        <span className="row-span-3 flex justify-end pt-1.5 lg:order-last lg:row-span-1 lg:pt-0" aria-hidden>
          <ChevronDown className={`size-4 shrink-0 text-on-surface-variant transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} />
        </span>
        <span className="col-start-2 min-w-0 truncate text-[13px] text-on-surface-variant lg:col-start-auto">{whyLine(p)}</span>
        <span className="col-start-2 flex min-w-0 items-center gap-2 lg:col-start-auto">
          <span className={`min-w-0 truncate text-[13px] ${action.text === 'Nothing to do' ? 'text-on-surface-variant' : 'font-medium text-on-surface'}`}>{action.text}</span>
          {owner && <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${owner.cls}`}>{owner.label}</span>}
          {action.when && <span className="hidden shrink-0 text-[11px] text-on-surface-variant xl:inline">{action.when}</span>}
        </span>
      </button>
      {open && <PageDetail id={panel} p={p} sectionLabel={sectionLabel} insights={insights} />}
    </li>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <h4 className="text-xs font-semibold text-on-surface-variant">{title}</h4>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function PageDetail({ id, p, sectionLabel, insights }: { id: string; p: StructurePage; sectionLabel: string; insights: string[] }) {
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
