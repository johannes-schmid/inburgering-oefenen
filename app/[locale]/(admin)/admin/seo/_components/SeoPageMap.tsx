'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, Plus } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { squarify, type Rect } from '@/lib/admin/seo-model';
import type { PageCell, PageMap, PlannedPage } from '@/lib/admin/seo';

type Verdict = PageCell['verdict'];

/**
 * Gevalideerd met de dataviz-validator (licht, vijf categorieën): de normal-vision- en CVD-checks
 * slagen; grijs voor "watch" is bewust kleurloos (er is nog niets over te zeggen). Elke tegel en de
 * lade dragen het label ook in tekst, dus kleur is nooit de enige drager.
 */
const VERDICT: Record<Verdict, { label: string; color: string; solid: string; tint: string }> = {
  healthy: { label: 'Healthy', color: '#2b8a63', solid: '#22704f', tint: 'rgba(43,138,99,0.16)' },
  improve: { label: 'Keep & improve', color: '#2f5fb3', solid: '#2a54a0', tint: 'rgba(47,95,179,0.16)' },
  consolidate: { label: 'Consolidate', color: '#b07d12', solid: '#8a610c', tint: 'rgba(176,125,18,0.18)' },
  remove: { label: 'Remove', color: '#c2416b', solid: '#a3365a', tint: 'rgba(194,65,107,0.15)' },
  watch: { label: 'Watch', color: '#8a94ad', solid: '#5f6a87', tint: 'rgba(138,148,173,0.18)' },
};
const ORDER: Verdict[] = ['healthy', 'improve', 'consolidate', 'remove', 'watch'];

/** Een pagina zonder vertoningen krijgt toch een tegel: anders verdwijnt precies de massa die we opruimen. */
const FLOOR = 14;
const HEADER = 22;
const GAP = 3;

type Tile =
  | { kind: 'page'; page: PageCell; value: number }
  | { kind: 'planned'; planned: PlannedPage; value: number };

const nf = new Intl.NumberFormat('en-GB');
const nf1 = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 });
const dateLabel = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const weekLabel = (week?: string, starts?: string) => (week ? `wk ${Number(week.split('-W')[1])}${starts ? ` · from ${dateLabel(starts)}` : ''}` : '');
const slug = (path: string) => path.split('/').filter(Boolean).slice(-1)[0] ?? path;
const OWNER: Record<string, string> = { eigenaar: 'You', amber: 'Amber', agent: 'Agent' };

/** Groot genoeg om iets te tonen: de vraag vóór de val, of nu, wat het grootst is. Zonder live cijfers: de audit. */
function demand(p: PageCell) {
  return p.before ? Math.max(p.before.impressions, p.now?.impressions ?? 0) : p.demand;
}

export function SeoPageMap({ map }: { map: PageMap }) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [open, setOpen] = useState<Tile | null>(null);
  const [focus, setFocus] = useState<Verdict | null>(null);
  const live = map.pages.some(p => p.now !== null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const height = width === 0 ? 0 : width < 640 ? Math.round(width * 1.7) : Math.max(460, Math.min(Math.round(width * 0.56), 640));

  const layout = useMemo(() => {
    if (width === 0) return [];
    const groups = map.sections.map(s => {
      const tiles: Tile[] = [
        ...map.pages.filter(p => p.section === s.key).map(p => ({ kind: 'page' as const, page: p, value: Math.max(demand(p), FLOOR) })),
        ...map.planned.filter(p => p.section === s.key).map(p => ({ kind: 'planned' as const, planned: p, value: Math.max(p.demand, FLOOR * 3) })),
      ];
      return { section: s, tiles, value: tiles.reduce((a, t) => a + t.value, 0) };
    }).filter(g => g.value > 0);

    return squarify(groups.map(g => ({ value: g.value, item: g })), { x: 0, y: 0, w: width, h: height }).map(g => {
      const inner: Rect = { x: g.x + GAP, y: g.y + HEADER, w: Math.max(g.w - 2 * GAP, 0), h: Math.max(g.h - HEADER - GAP, 0) };
      return {
        ...g,
        tiles: squarify(g.item.tiles.map(t => ({ value: t.value, item: t })), inner),
      };
    });
  }, [map, width, height]);

  return (
    <div>
      <Summary map={map} focus={focus} onFocus={setFocus} />

      <div
        ref={box}
        className="relative mt-4 w-full overflow-hidden rounded-2xl bg-surface-container-low"
        style={{ height: height || 460 }}
        role="group"
        aria-label="Treemap of all pages, grouped by section. Size is search demand, colour is the verdict."
      >
        {layout.map(g => (
          <div key={g.item.section.key}>
            <div
              className="pointer-events-none absolute truncate px-2 pt-1 text-[11px] font-semibold text-on-surface"
              style={{ left: g.x, top: g.y, width: g.w }}
              title={g.item.section.note}
            >
              {g.item.section.label} <span className="font-normal text-on-surface-variant">{g.item.tiles.filter(t => t.kind === 'page').length}</span>
            </div>
            {g.tiles.map(t => (
              <TileButton key={t.item.kind === 'page' ? t.item.page.path : t.item.planned.id} rect={t} tile={t.item} dim={focus} live={live} onOpen={setOpen} />
            ))}
          </div>
        ))}
      </div>

      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-on-surface-variant">
        <span>{live ? 'Size: Google impressions before the drop or now, whichever is bigger.' : 'Size: Google impressions in Aug and Sep, from the audit (no live data right now).'}</span>
        {live && <span>Solid: Google still shows it. Pale: Google stopped showing it.</span>}
        <span className="inline-flex items-center gap-1"><span className="inline-block h-2.5 w-3.5 rounded-[3px] border border-dashed border-on-surface-variant/70" aria-hidden />Dotted: a page we plan to create.</span>
      </p>

      <PageDrawer tile={open} windows={map.windows} onClose={() => setOpen(null)} />
    </div>
  );
}

function Summary({ map, focus, onFocus }: { map: PageMap; focus: Verdict | null; onFocus: (v: Verdict | null) => void }) {
  const total = map.pages.length;
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="text-3xl font-headline font-bold tracking-tight text-on-surface tabular-nums">{total}</p>
        <p className="text-sm text-on-surface-variant">pages in the sitemap · {map.planned.length} planned · click a colour to highlight it</p>
      </div>
      <div className="mt-3 flex h-3 w-full gap-0.5 overflow-hidden rounded-full" aria-hidden>
        {ORDER.map(v => map.counts[v] > 0 && (
          <div key={v} className="h-full transition-opacity duration-200 ease-out" style={{ flex: map.counts[v], background: VERDICT[v].color, opacity: focus && focus !== v ? 0.25 : 1 }} />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {ORDER.map(v => {
          const on = focus === v;
          return (
            <li key={v}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onFocus(on ? null : v)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-transform duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-[var(--ring-selected)] motion-reduce:transition-none ${on ? 'bg-surface-container-lowest shadow-[var(--ring-selected)]' : 'bg-surface-container-low hover:bg-surface-container'}`}
              >
                <span className="size-2.5 rounded-full" style={{ background: VERDICT[v].color }} aria-hidden />
                <span className="font-semibold text-on-surface">{VERDICT[v].label}</span>
                <span className="text-on-surface-variant tabular-nums">{map.counts[v]} · {Math.round((map.counts[v] / total) * 100)}%</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function TileButton({ rect, tile, dim, live, onOpen }: {
  rect: Rect; tile: Tile; dim: Verdict | null; live: boolean; onOpen: (t: Tile) => void;
}) {
  const w = rect.w - GAP;
  const h = rect.h - GAP;
  if (w < 2 || h < 2) return null;
  const showLabel = w > 64 && h > 26;
  const showMeta = w > 84 && h > 44;

  if (tile.kind === 'planned') {
    const p = tile.planned;
    // Een geplande pagina is altijd klein (er is nog geen vraag); het label mag dus eerder verschijnen.
    const plannedLabel = w > 40 && h > 34;
    return (
      <button
        type="button"
        onClick={() => onOpen(tile)}
        className="absolute overflow-hidden rounded-lg border-[1.5px] border-dashed border-primary/50 bg-surface-container-lowest/70 p-1.5 text-left transition-[transform,opacity] duration-150 ease-out hover:bg-surface-container-lowest focus-visible:outline-none focus-visible:shadow-[var(--ring-selected)] active:scale-[0.98] motion-reduce:transition-none"
        style={{ left: rect.x, top: rect.y, width: w, height: h, opacity: dim ? 0.3 : 1 }}
        aria-label={`Planned page: ${p.title}, ${weekLabel(p.week)}`}
      >
        {plannedLabel && (
          <span className="flex items-start gap-1 text-[10px] leading-tight font-semibold text-primary sm:text-[11px]">
            <Plus className="mt-px size-3 shrink-0" aria-hidden /> <span className="line-clamp-3 break-words">{p.title}</span>
          </span>
        )}
        {showMeta && <span className="mt-0.5 block truncate text-[10px] text-on-surface-variant">{weekLabel(p.week)}</span>}
      </button>
    );
  }

  const p = tile.page;
  const v = VERDICT[p.verdict];
  const shown = !live || (p.now?.impressions ?? 0) > 0;
  const dimmed = dim !== null && dim !== p.verdict;
  return (
    <button
      type="button"
      onClick={() => onOpen(tile)}
      className="absolute overflow-hidden rounded-md p-1.5 text-left transition-[transform,opacity,filter] duration-150 ease-out hover:brightness-110 focus-visible:z-10 focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--ink)] active:scale-[0.98] motion-reduce:transition-none"
      style={{
        left: rect.x, top: rect.y, width: w, height: h,
        background: shown ? v.solid : v.tint,
        color: shown ? '#fff' : 'var(--ink)',
        opacity: dimmed ? 0.18 : 1,
      }}
      title={`${p.path} · ${v.label}`}
      aria-label={`${p.path}, ${v.label}${p.now ? `, ${p.now.impressions} impressions now` : ''}`}
    >
      {showLabel && <span className="block truncate text-[11px] leading-tight font-semibold" dir="auto">{slug(p.path)}</span>}
      {showMeta && p.before && (
        <span className="mt-0.5 block truncate text-[10px] tabular-nums opacity-85">
          {nf.format(p.before.impressions)} → {nf.format(p.now?.impressions ?? 0)}
        </span>
      )}
    </button>
  );
}

/* ── De lade: zoekdata, waarom, plan en wanneer ──────────────────────────── */

function PageDrawer({ tile, windows, onClose }: { tile: Tile | null; windows: PageMap['windows']; onClose: () => void }) {
  return (
    <Sheet open={tile !== null} onOpenChange={o => !o && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        {tile?.kind === 'page' && <PageDetail page={tile.page} windows={windows} />}
        {tile?.kind === 'planned' && <PlannedDetail p={tile.planned} />}
      </SheetContent>
    </Sheet>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl bg-surface-container-low px-4 py-3.5">
      <h3 className="text-xs font-semibold text-on-surface-variant">{title}</h3>
      <div className="mt-1.5 text-sm leading-relaxed text-on-surface">{children}</div>
    </section>
  );
}

function PageDetail({ page: p, windows }: { page: PageCell; windows: PageMap['windows'] }) {
  const v = VERDICT[p.verdict];
  const max = Math.max(p.before?.impressions ?? 0, p.now?.impressions ?? 0, 1);
  return (
    <>
      <SheetHeader>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white" style={{ background: v.solid }}>{v.label}</span>
        <SheetTitle className="font-mono text-sm break-all" dir="auto">{p.path}</SheetTitle>
        <SheetDescription>{p.reason}</SheetDescription>
      </SheetHeader>
      <div className="space-y-3 px-4 pb-6">
        <Block title="Google, before the drop and now">
          {p.before && p.now ? (
            <div className="space-y-2.5">
              {([['Before', p.before, windows?.before], ['Now', p.now, windows?.now]] as const).map(([label, d, win]) => (
                <div key={label}>
                  <div className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="font-semibold">{label}{win && <span className="font-normal text-on-surface-variant"> · {dateLabel(win.start)} to {dateLabel(win.end)}</span>}</span>
                    <span className="tabular-nums text-on-surface-variant">
                      <span className="font-semibold text-on-surface">{nf.format(d.impressions)}</span> impr.{d.position !== null && <> · pos {nf1.format(d.position)}</>}
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-container">
                    <div className="h-full origin-left rounded-full" style={{ transform: `scaleX(${d.impressions / max})`, background: v.color }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-on-surface-variant">No live Search Console data on this server.</p>
          )}
        </Block>

        {p.queries.length > 0 && (
          <Block title="What people searched (since July)">
            <ul className="space-y-1">
              {p.queries.map(q => (
                <li key={q.query} className="flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="min-w-0 truncate">{q.query}</span>
                  <span className="shrink-0 text-xs text-on-surface-variant tabular-nums">{nf.format(q.impressions)} · pos {nf1.format(q.position)}</span>
                </li>
              ))}
            </ul>
          </Block>
        )}

        <Block title="Plan">
          {p.plan ? (
            <>
              <p>{p.plan.action}</p>
              <p className="mt-2 text-xs text-on-surface-variant">
                {OWNER[p.plan.owner] ?? p.plan.owner}{p.plan.week && <> · {weekLabel(p.plan.week, p.plan.starts)}</>}
              </p>
            </>
          ) : (
            <p className="text-on-surface-variant">Nothing to do. Keep it, and link to it from the guides.</p>
          )}
        </Block>

        <a
          href={`https://inburgeringoefenen.nl${encodeURI(p.path)}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-sm text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:shadow-[var(--ring-selected)]"
        >
          Open the page <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </div>
    </>
  );
}

function PlannedDetail({ p }: { p: PlannedPage }) {
  return (
    <>
      <SheetHeader>
        <span className="inline-flex w-fit items-center gap-1 rounded-full border border-dashed border-primary/60 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
          <Plus className="size-3" aria-hidden /> Planned page
        </span>
        <SheetTitle>{p.title}</SheetTitle>
        <SheetDescription>{weekLabel(p.week, p.starts)} · {OWNER[p.owner] ?? p.owner} drafts, Amber reviews</SheetDescription>
      </SheetHeader>
      <div className="space-y-3 px-4 pb-6">
        <Block title="Search evidence">{p.evidence}</Block>
        <Block title="Why this page">{p.why}</Block>
        <Block title="Why not sooner">
          New pages during recovery are the pattern Google punished. It comes after the cleanup, at one page at a time, and only if it adds something only we can add.
        </Block>
      </div>
    </>
  );
}
