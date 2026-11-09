'use client';

import { Fragment, useMemo, useRef, useState, type ReactNode } from 'react';
import { ChevronRight, Search, X } from 'lucide-react';
import type { PlannedPage, SiteStructure, StructurePage, Window28 } from '@/lib/admin/seo';
import {
  indexState, kindOfSection, rate, rollupByKind, weakestStep,
  type FunnelCounts, type FunnelStep, type IndexRecord, type IndexState, type PageKind,
} from '@/lib/admin/seo-funnel-model';
import type { LiveFunnel } from '@/lib/admin/seo-funnel';
import { OWNER, PageDetail, nextAction, scoreTone, weekNo, whyLine } from './SeoPageDetail';

/**
 * Het bord van `/admin/seo` (besluit eigenaar, 09-11): bovenaan widgets, eronder één tabel met alle
 * pagina's. Drie widgets zíjn filters op die tabel — actie nodig, voorgestelde pagina's, niet
 * geïndexeerd — en de funnelkaart klapt een uitsplitsing per soort pagina open. Voorgestelde nieuwe
 * pagina's staan als rij in dezelfde tabel, met zoekvraag in plaats van klikken.
 */

const nf = new Intl.NumberFormat('en-GB');
const eur = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' });
const pct = (x: number | null) => (x === null ? '—' : `${(x * 100).toFixed(x < 0.1 ? 1 : 0)}%`);

type Filter = 'action' | 'suggested' | 'noindex';
type KindTab = 'all' | PageKind;

/** Vanaf deze zoekbezoeken zonder één oefenstart is een pagina een lek, geen toeval. */
const LEAK_VISITS = 20;

type Row = {
  key: string;
  path: string;
  kind: PageKind;
  page: StructurePage | null;
  planned: PlannedPage | null;
  index: IndexState | 'noindex';
  indexNote: string | null;
  funnel: FunnelCounts | null;
  leak: boolean;
  action: boolean;
};

export type BoardProps = {
  structure: SiteStructure;
  funnel: LiveFunnel | { error: string };
  indexing: { checkedAt: string; pages: Record<string, IndexRecord> } | null;
  google: { clicks: number; prev: number } | null;
  bing: Window28 | null;
  geoNote: string;
};

export function SeoBoard({ structure, funnel, indexing, google, bing, geoNote }: BoardProps) {
  const [filter, setFilter] = useState<Filter | null>(null);
  const [kind, setKind] = useState<KindTab>('all');
  const [q, setQ] = useState('');
  const [funnelOpen, setFunnelOpen] = useState(false);
  const tableRef = useRef<HTMLElement>(null);
  const live = 'error' in funnel ? null : funnel;

  const rows = useMemo<Row[]>(() => {
    const live = 'error' in funnel ? null : funnel;
    const pages = structure.pages.map(p => {
      const f = live ? live.byPage[p.path] ?? { visits: 0, practice: 0, account: 0, checkout: 0, paid: 0, revenue: 0 } : null;
      const rec = indexing?.pages[p.path];
      const index: Row['index'] = p.verdict === 'remove' ? 'noindex' : indexing ? indexState(rec) : 'unknown';
      const leak = !!f && f.visits >= LEAK_VISITS && f.practice === 0;
      return {
        key: p.path, path: p.path, kind: kindOfSection(p.section), page: p, planned: null,
        index, indexNote: rec && index !== 'indexed' && index !== 'canonical' ? rec.coverage : null,
        funnel: f, leak,
        action: (p.score <= 7 && p.verdict !== 'remove') || leak,
      } satisfies Row;
    });
    const planned = structure.planned.map(p => ({
      key: `planned:${p.id}`, path: p.title, kind: kindOfSection(p.section), page: null, planned: p,
      index: 'unknown' as const, indexNote: null, funnel: null, leak: false, action: false,
    }));
    return [...planned, ...pages.sort((a, b) => b.page.weight - a.page.weight)];
  }, [structure, funnel, indexing]);

  const counts = {
    action: rows.filter(r => r.action).length,
    suggested: rows.filter(r => r.planned).length,
    noindex: rows.filter(r => r.index === 'not-indexed' || r.index === 'discovered').length,
  };

  const visible = rows.filter(r => {
    if (filter === 'action' && !r.action) return false;
    if (filter === 'suggested' && !r.planned) return false;
    if (filter === 'noindex' && r.index !== 'not-indexed' && r.index !== 'discovered') return false;
    if (kind !== 'all' && r.kind !== kind) return false;
    if (q && !decodeURI(r.path).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const choose = (f: Filter) => {
    const next = filter === f ? null : f;
    setFilter(next);
    if (next) tableRef.current?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  };

  const sectionOf = useMemo(() => new Map(structure.pages.map(p => [p.path, p.section])), [structure.pages]);
  const byKind = live ? rollupByKind(live.byPage, p => { const s = sectionOf.get(p); return s ? kindOfSection(s) : null; }) : null;
  const sections = useMemo(() => new Map(structure.sections.map(s => [s.key, s])), [structure.sections]);

  const last = structure.history.at(-1);
  const healthDelta = structure.site !== null && last?.site != null ? structure.site - last.site : null;

  return (
    <>
      <section aria-label="Overview" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="min-w-0 rounded-2xl bg-primary p-5 text-white shadow-[var(--shadow-ambient)]">
          <p className="text-xs font-semibold text-white/70">Site health</p>
          <p className="mt-1 flex items-baseline gap-1.5">
            <span className="font-headline text-4xl font-extrabold tracking-tight tabular-nums">{structure.site ?? '—'}</span>
            <span className="text-sm text-white/60">/100</span>
          </p>
          <p className="mt-1 text-xs font-semibold text-[#9fd8bf]">
            {healthDelta === null ? 'First week measured' : `${healthDelta >= 0 ? '+' : ''}${healthDelta} vs last Friday's data pull`}
          </p>
        </div>

        <Widget label="Search clicks · 28 days">
          <div className="mt-2 flex gap-6">
            <Pair value={google ? nf.format(google.clicks) : '—'} label="Google" now={google?.clicks} before={google?.prev} />
            <Pair value={bing ? nf.format(bing.clicks) : '—'} label="Bing" now={bing?.clicks} before={bing?.prevClicks} />
          </div>
        </Widget>

        <Widget label={live ? `AI assistants · ${nf.format(live.ai.reduce((s, a) => s + a.sessions, 0))} visits, 28 days` : 'AI assistants'}>
          {live ? (
            live.ai.length ? (
              <ul className="mt-2 space-y-1.5">
                {live.ai.slice(0, 3).map(a => (
                  <li key={a.engine} className="grid grid-cols-[84px_minmax(0,1fr)_40px] items-center gap-2 text-xs text-on-surface-variant">
                    <span>{a.engine}</span>
                    <span className="h-1.5 overflow-hidden rounded-full bg-surface-container">
                      <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.max(4, (a.sessions / live.ai[0].sessions) * 100)}%` }} />
                    </span>
                    <span className="text-right tabular-nums text-on-surface">{nf.format(a.sessions)}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-2 text-sm text-on-surface-variant">No visits from AI assistants yet.</p>
          ) : <Unknown what="GA4" detail={(funnel as { error: string }).error} />}
          <p className="mt-2 text-[11px] text-on-surface-variant">{geoNote}</p>
        </Widget>

        <button
          type="button"
          onClick={() => setFunnelOpen(o => !o)}
          aria-expanded={funnelOpen}
          aria-controls="funnel-detail"
          className={pressable(funnelOpen)}
        >
          <span className="absolute top-4 right-4 inline-flex items-center gap-0.5 text-[11px] font-semibold text-on-surface-variant">
            Details <ChevronRight className={`size-3.5 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${funnelOpen ? 'rotate-90' : ''}`} aria-hidden />
          </span>
          <p className="text-xs font-semibold text-on-surface-variant">Search to paid · 28 days</p>
          {live ? (
            <>
              <p className="mt-1 flex items-baseline gap-2">
                <span className="font-headline text-2xl font-extrabold tracking-tight tabular-nums text-on-surface">{eur.format(live.total.revenue)}</span>
                <span className="text-xs text-on-surface-variant">{live.total.paid} paid</span>
              </p>
              <MiniFunnel c={live.total} />
            </>
          ) : <Unknown what="GA4" detail={(funnel as { error: string }).error} />}
        </button>
      </section>

      <div id="funnel-detail" className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${funnelOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          {live && byKind && <FunnelDetail total={live.total} byKind={byKind} />}
        </div>
      </div>

      <section aria-label="Filters" className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <FilterCard on={filter === 'action'} onClick={() => choose('action')} n={counts.action} tone="text-[var(--fout)]"
          title="Pages that need action" note="Score 7 or lower, or search visitors who never start practising" />
        <FilterCard on={filter === 'suggested'} onClick={() => choose('suggested')} n={counts.suggested} tone="text-primary"
          title="Suggested new pages" note="Articles and gidsen worth writing next" />
        <FilterCard on={filter === 'noindex'} onClick={() => choose('noindex')} n={indexing ? counts.noindex : null} tone="text-[#a24000]"
          title="Not indexed" note={indexing ? `Pages that should be in Google but aren't · checked ${dayLabel(indexing.checkedAt)}` : 'Not checked yet. Runs with the Friday data pull.'} />
      </section>

      <section ref={tableRef} aria-labelledby="pages" className="mt-6 scroll-mt-4 rounded-2xl bg-surface-container-lowest p-2 shadow-[var(--shadow-ambient)]">
        <div className="flex flex-wrap items-center justify-between gap-3 px-3 pt-3 pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="pages" className="font-headline text-lg font-bold tracking-tight text-on-surface">Pages</h2>
            {filter && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary py-1 pr-1 pl-3 text-xs font-semibold text-white">
                {FILTER_LABEL[filter]} · {visible.length}
                <button type="button" onClick={() => setFilter(null)} aria-label="Clear filter"
                  className="grid size-5 place-items-center rounded-full bg-white/20 transition-transform duration-150 ease-out hover:bg-white/30 focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_white] active:scale-[0.9] motion-reduce:transition-none">
                  <X className="size-3" aria-hidden />
                </button>
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div role="radiogroup" aria-label="Kind of page" className="inline-flex rounded-lg bg-surface-container-low p-0.5 text-xs">
              {KIND_TABS.map(([k, label]) => (
                <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)}
                  className={`rounded-md px-2.5 py-1 font-semibold transition-transform duration-150 ease-out focus-visible:outline-none focus-visible:shadow-[var(--ring-selected)] active:scale-[0.97] motion-reduce:transition-none ${kind === k ? 'bg-surface-container-lowest text-primary shadow-[var(--shadow-ambient)]' : 'text-on-surface-variant hover:text-on-surface'}`}>
                  {label}
                </button>
              ))}
            </div>
            <label className="relative">
              <span className="sr-only">Search pages</span>
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-on-surface-variant" aria-hidden />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="/nl/oefenen"
                className="h-8 w-48 rounded-lg bg-surface-container-low pr-3 pl-8 text-[13px] text-on-surface placeholder:text-on-surface-variant/70 focus-visible:outline-none focus-visible:shadow-[var(--ring-selected)]" />
            </label>
          </div>
        </div>
        <PagesTable rows={visible} sections={sections} funnelKnown={!!live} />
      </section>
    </>
  );
}

const FILTER_LABEL: Record<Filter, string> = { action: 'Needs action', suggested: 'Suggested', noindex: 'Not indexed' };
const KIND_TABS: [KindTab, string][] = [['all', 'All'], ['gids', 'Gidsen'], ['blog', 'Blog'], ['practice', 'Practice'], ['other', 'Other']];
const KIND_LABEL: Record<PageKind, string> = { gids: 'Gidsen', blog: 'Blog', practice: 'Practice pages', other: 'Other pages' };
const STEP_LABEL: Record<FunnelStep, string> = { visits: 'Search visits', practice: 'Started practising', account: 'Started sign-in', checkout: 'Checkout', paid: 'Paid' };

const dayLabel = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Europe/Amsterdam' });

function pressable(on: boolean) {
  return `relative min-w-0 w-full rounded-2xl bg-surface-container-lowest p-5 text-left transition-transform duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none active:scale-[0.985] motion-reduce:transition-none hover:bg-surface-container-lowest/80 ${on ? 'shadow-[inset_0_0_0_2px_#002b6d,var(--shadow-ambient)]' : 'shadow-[var(--shadow-ambient)] focus-visible:shadow-[var(--ring-selected),var(--shadow-ambient)]'}`;
}

function Widget({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 rounded-2xl bg-surface-container-lowest p-5 shadow-[var(--shadow-ambient)]">
      <p className="text-xs font-semibold text-on-surface-variant">{label}</p>
      {children}
    </div>
  );
}

function Pair({ value, label, now, before }: { value: string; label: string; now?: number; before?: number }) {
  const d = now !== undefined && before ? (now - before) / before : null;
  return (
    <div>
      <p className="font-headline text-xl font-extrabold tracking-tight tabular-nums text-on-surface">{value}</p>
      <p className="text-xs text-on-surface-variant">
        {label}{' '}
        {d !== null && <span className={`font-semibold ${d >= 0 ? 'text-[var(--goed-ink)]' : 'text-[var(--fout)]'}`}>{d >= 0 ? '+' : ''}{Math.round(d * 100)}%</span>}
      </p>
    </div>
  );
}

function Unknown({ what, detail }: { what: string; detail: string }) {
  return <p className="mt-2 text-sm text-on-surface-variant" title={detail}>Unknown: {what} didn&apos;t answer.</p>;
}

function MiniFunnel({ c }: { c: FunnelCounts }) {
  const max = Math.max(c.visits, 1);
  const steps: FunnelStep[] = ['visits', 'practice', 'account', 'checkout', 'paid'];
  return (
    <div className="mt-3" aria-hidden>
      <div className="flex h-12 items-end gap-1">
        {steps.map(s => (
          <span key={s} className={`flex-1 rounded-t-[5px] rounded-b-[2px] ${s === 'paid' ? 'bg-[#fe762c]' : 'bg-[rgba(0,43,109,0.14)]'}`}
            style={{ height: `${Math.max(6, Math.sqrt(c[s] / max) * 100)}%` }} />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-on-surface-variant"><span>Visit</span><span>Practice</span><span>Sign-in</span><span>Checkout</span><span>Paid</span></div>
    </div>
  );
}

function FunnelDetail({ total, byKind }: { total: FunnelCounts; byKind: Record<PageKind, FunnelCounts> }) {
  const steps: FunnelStep[] = ['visits', 'practice', 'account', 'checkout', 'paid'];
  const weakest = weakestStep(total);
  const kinds = (['gids', 'blog', 'practice', 'other'] as PageKind[]).filter(k => byKind[k].visits > 0);
  const best = [...kinds].filter(k => byKind[k].visits >= 20).sort((a, b) => (rate(byKind[b].practice, byKind[b].visits) ?? 0) - (rate(byKind[a].practice, byKind[a].visits) ?? 0));
  return (
    <div className="mt-3 rounded-2xl bg-surface-container-lowest p-5 shadow-[var(--shadow-ambient)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-headline text-base font-bold tracking-tight text-on-surface">Search to paid, by kind of page</h3>
          <p className="mt-0.5 text-xs text-on-surface-variant">GA4, last 28 days, visitors from Google, Bing and AI assistants, by the page they landed on. Shaded: the weakest step in each row. Someone who landed twice counts twice.</p>
        </div>
        {weakest && <span className="rounded-full bg-[#fcecdd] px-2.5 py-1 text-xs font-semibold text-[#a24000]">Weakest step overall: {STEP_LABEL[weakest].toLowerCase()}</span>}
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] border-separate border-spacing-0.5 text-[13px] tabular-nums">
          <thead>
            <tr className="text-left text-[11px] font-semibold text-on-surface-variant">
              <th className="px-3 pb-1 font-semibold" />
              {steps.map(s => <th key={s} className="px-3 pb-1 font-semibold">{STEP_LABEL[s]}</th>)}
            </tr>
          </thead>
          <tbody>
            {kinds.map(k => <FunnelRow key={k} label={KIND_LABEL[k]} c={byKind[k]} />)}
            <FunnelRow label="Total" c={total} total />
          </tbody>
        </table>
      </div>
      {best.length > 1 && (
        <p className="mt-4 rounded-xl bg-surface-container-low px-4 py-3 text-[13px] text-on-surface">
          <span className="font-semibold">{KIND_LABEL[best[0]]}</span> turn the most search visitors into practice ({pct(rate(byKind[best[0]].practice, byKind[best[0]].visits))});
          {' '}<span className="font-semibold">{KIND_LABEL[best.at(-1)!].toLowerCase()}</span> the fewest ({pct(rate(byKind[best.at(-1)!].practice, byKind[best.at(-1)!].visits))}).
        </p>
      )}
    </div>
  );
}

function FunnelRow({ label, c, total = false }: { label: string; c: FunnelCounts; total?: boolean }) {
  const steps: FunnelStep[] = ['visits', 'practice', 'account', 'checkout', 'paid'];
  const weak = weakestStep(c);
  return (
    <tr>
      <th scope="row" className="px-3 py-2 text-left font-semibold text-primary">{label}</th>
      {steps.map((s, i) => {
        const r = i ? rate(c[s], c[steps[i - 1]]) : null;
        const leak = !total && weak === s;
        return (
          <td key={s} className={`px-3 py-2 ${total ? 'bg-[rgba(0,43,109,0.10)] font-bold' : leak ? 'bg-[#fcecdd] font-semibold text-[#a24000]' : 'bg-surface-container-low'}`}>
            {nf.format(c[s])}{s === 'paid' && c.revenue > 0 && <> · {eur.format(c.revenue)}</>}
            {r !== null && <span className={`block text-[11px] font-medium ${leak ? 'text-[#a24000]' : 'text-on-surface-variant'}`}>{pct(r)}</span>}
          </td>
        );
      })}
    </tr>
  );
}

function FilterCard({ on, onClick, n, tone, title, note }: { on: boolean; onClick: () => void; n: number | null; tone: string; title: string; note: string }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={`${pressable(on)} flex items-center gap-4`}>
      <span className={`min-w-10 font-headline text-3xl font-extrabold tracking-tight tabular-nums ${n === null ? 'text-on-surface-variant' : tone}`}>{n ?? '—'}</span>
      <span className="min-w-0">
        <span className="block font-headline text-sm font-bold text-on-surface">{title}</span>
        <span className="mt-0.5 block text-xs text-on-surface-variant">{note}</span>
      </span>
    </button>
  );
}

function IndexCell({ r }: { r: Row }) {
  if (r.planned) return <span className="text-on-surface-variant">—</span>;
  const chip = (cls: string, text: string) => <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${cls}`}>{text}</span>;
  return (
    <span className="block">
      {r.index === 'indexed' && chip('bg-[var(--goed-tint)] text-[var(--goed-ink)]', 'Indexed')}
      {r.index === 'not-indexed' && chip('bg-[var(--fout-tint)] text-[var(--fout)]', 'Not indexed')}
      {r.index === 'discovered' && chip('bg-[#fcecdd] text-[#a24000]', 'Discovered')}
      {r.index === 'canonical' && chip('bg-surface-container text-on-surface-variant', 'Canonical elsewhere')}
      {r.index === 'noindex' && chip('bg-surface-container text-on-surface-variant', 'Leaves the index')}
      {r.index === 'unknown' && <span className="text-xs text-on-surface-variant">Not checked</span>}
      {r.indexNote && <span className="mt-0.5 block truncate text-[11px] text-on-surface-variant" title={r.indexNote}>{r.indexNote}</span>}
    </span>
  );
}

const COLS = 10;

function PagesTable({ rows, sections, funnelKnown }: { rows: Row[]; sections: Map<string, SiteStructure['sections'][number]>; funnelKnown: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!rows.length) return <p className="px-3 py-10 text-center text-sm text-on-surface-variant">No pages match this filter.</p>;
  const th = 'bg-surface-container-low px-3 py-2.5 text-left text-[11px] font-semibold whitespace-nowrap text-on-surface-variant first:rounded-l-xl last:rounded-r-xl';
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] table-fixed border-separate border-spacing-0 text-[13px] tabular-nums">
        <thead>
          <tr>
            <th className={`${th} w-10`}><span className="sr-only">Open</span></th>
            <th className={`${th} w-[250px]`}>Page</th>
            <th className={`${th} w-[150px]`}>Index</th>
            <th className={`${th} w-16`}>Score</th>
            <th className={`${th} w-[84px] text-right`}>Clicks 28d</th>
            <th className={`${th} w-[72px] text-right`}>Position</th>
            <th className={`${th} w-[92px] text-right`} title="Visits from Google, Bing and AI assistants that landed here (GA4)">Search visits</th>
            <th className={`${th} w-[84px] text-right`}>Practising</th>
            <th className={`${th} w-[68px] text-right`}>Paid</th>
            <th className={th}>Next step</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const isOpen = open === r.key;
            const toggle = () => setOpen(isOpen ? null : r.key);
            const td = `px-3 py-2.5 align-middle transition-colors duration-150 first:rounded-l-xl last:rounded-r-xl ${isOpen ? 'bg-[rgba(0,43,109,0.06)]' : 'group-hover:bg-[rgba(0,43,109,0.04)]'}`;
            return (
              <Fragment key={r.key}>
                <tr className="group cursor-pointer" onClick={toggle}>
                  <td className={td}>
                    <button type="button" aria-expanded={isOpen} aria-controls={`d-${r.key}`} aria-label={`Details for ${r.path}`} onClick={e => { e.stopPropagation(); toggle(); }}
                      className="grid size-6 place-items-center rounded-md text-on-surface-variant focus-visible:outline-none focus-visible:shadow-[var(--ring-selected)]">
                      <ChevronRight className={`size-4 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${isOpen ? 'rotate-90' : ''}`} aria-hidden />
                    </button>
                  </td>
                  {r.planned ? <PlannedCells r={r} td={td} /> : <PageCells r={r} td={td} funnelKnown={funnelKnown} />}
                </tr>
                {isOpen && (
                  <tr id={`d-${r.key}`}>
                    <td colSpan={COLS} className="px-1 pb-3">
                      <div className="rounded-xl bg-surface-container-low/60 pt-3">
                        {r.page
                          ? <PageDetail id={`p-${r.key}`} p={r.page} sectionLabel={sections.get(r.page.section)?.label ?? r.page.section} insights={sections.get(r.page.section)?.insights ?? []} />
                          : r.planned && <PlannedDetail p={r.planned} />}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PageCells({ r, td, funnelKnown }: { r: Row; td: string; funnelKnown: boolean }) {
  const p = r.page!;
  const action = r.index === 'not-indexed' || r.index === 'discovered'
    ? { text: 'Not in Google: request indexing and link to it from an indexed page', owner: 'eigenaar', when: null }
    : r.leak && p.score > 7
      ? { text: 'Search visitors never start practising: add a taster link', owner: 'agent', when: null }
      : nextAction(p);
  const owner = action.owner ? OWNER[action.owner] : null;
  const f = r.funnel;
  const none = <span className="text-on-surface-variant">—</span>;
  return (
    <>
      <td className={td}>
        <span className="block truncate font-mono text-[13px] font-medium text-primary" dir="auto">{decodeURI(p.path)}</span>
        <span className="block truncate text-xs text-on-surface-variant">{whyLine(p)}</span>
      </td>
      <td className={td}><IndexCell r={r} /></td>
      <td className={td}><span className={`inline-flex h-7 min-w-9 items-center justify-center rounded-lg px-1.5 text-sm font-bold ${scoreTone(p.score)}`}>{p.score}</span></td>
      <td className={`${td} text-right`}>{p.now ? nf.format(p.now.clicks) : none}</td>
      <td className={`${td} text-right`}>{p.now?.position != null ? p.now.position.toFixed(1) : none}</td>
      <td className={`${td} text-right`}>{funnelKnown && f ? nf.format(f.visits) : none}</td>
      <td className={`${td} text-right ${r.leak ? 'font-semibold text-[var(--fout)]' : ''}`}>
        {funnelKnown && f ? <>{nf.format(f.practice)}{f.visits >= LEAK_VISITS && <span className="block text-[11px] font-medium text-on-surface-variant">{pct(rate(f.practice, f.visits))}</span>}</> : none}
      </td>
      <td className={`${td} text-right`}>{funnelKnown && f ? (f.paid ? <>{f.paid}<span className="block text-[11px] text-on-surface-variant">{eur.format(f.revenue)}</span></> : '0') : none}</td>
      <td className={td}>
        <span className={`block truncate ${action.text === 'Nothing to do' ? 'text-on-surface-variant' : 'font-medium text-on-surface'}`} title={action.text}>{action.text}</span>
        {(owner || action.when) && (
          <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-on-surface-variant">
            {owner && <span className={`rounded-full px-2 py-px font-semibold ${owner.cls}`}>{owner.label}</span>}
            {action.when}
          </span>
        )}
      </td>
    </>
  );
}

function PlannedCells({ r, td }: { r: Row; td: string }) {
  const p = r.planned!;
  const owner = OWNER[p.owner];
  return (
    <>
      <td className={td}>
        <span className="block truncate font-medium text-on-surface italic">{p.title}</span>
        <span className="block truncate text-xs text-on-surface-variant">{p.why}</span>
      </td>
      <td className={td}><span className="rounded-full bg-[rgba(0,43,109,0.10)] px-2 py-0.5 text-[11px] font-semibold text-primary">Suggested</span></td>
      <td className={td}><span className="text-on-surface-variant">—</span></td>
      <td className={`${td} text-right`} colSpan={5}>
        <span className="text-xs text-on-surface-variant">Search demand </span>
        <span className="font-semibold">{p.demand ? `${nf.format(p.demand)} impressions` : 'none measured yet'}</span>
      </td>
      <td className={td}>
        <span className="block font-medium text-on-surface">Write it</span>
        <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-on-surface-variant">
          {owner && <span className={`rounded-full px-2 py-px font-semibold ${owner.cls}`}>{owner.label}</span>}
          {weekNo(p.week)}
        </span>
      </td>
    </>
  );
}

function PlannedDetail({ p }: { p: PlannedPage }) {
  return (
    <div className="grid grid-cols-1 gap-5 px-4 pb-4 text-[13px] leading-relaxed text-on-surface md:grid-cols-3 lg:pl-[52px]">
      <div><h4 className="text-xs font-semibold text-on-surface-variant">Why this page</h4><p className="mt-1.5">{p.why}</p></div>
      <div><h4 className="text-xs font-semibold text-on-surface-variant">Evidence</h4><p className="mt-1.5">{p.evidence}</p></div>
      <div><h4 className="text-xs font-semibold text-on-surface-variant">When</h4><p className="mt-1.5">Planned for {weekNo(p.week)}, starting {p.starts}. Owner: {OWNER[p.owner]?.label ?? p.owner}.</p></div>
    </div>
  );
}
