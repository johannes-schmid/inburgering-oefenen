'use client';

import { useMemo } from 'react';

import type { ContentRow } from '@/lib/admin/content-rows';
import { isBacklog } from '@/lib/admin/backlog';
import { formatOf, levelLabel, type Level, type OnderdeelSlug } from '@/data/skills';

/**
 * How much of one onderdeel's catalogue exists, and how it is spread over the categories.
 *
 * The target is `itemCount × examCount` from `data/skills.ts` — 25 × 10 = 250 Lezen vragen for
 * A2's ten oefenexamens. It is deliberately the *only* number this panel measures against:
 * how many gesprekken versus mededelingen a DUO exam holds is not something anyone has verified
 * (see CLAUDE.md, "there is deliberately no per-tekstsoort quota"), so the per-category counts
 * are reported and the docent judges the balance. Inventing a quota here would silently become
 * the standard her work is measured against.
 *
 * `itemCount` is `null` at B1, which means unverified — the bar is then hidden rather than drawn
 * against a guess, and the counts stand on their own.
 *
 * The category axis differs per onderdeel because the content does: Lezen and Luisteren are filed
 * under a tekstsoort (`sections`, inherited from the fragment), while `sections` is retired for
 * Schrijven and Spreken — their axis is the soort opgave, which is what `typeLabel` already holds.
 */
export default function CatalogueProgress({
  rows,
  level,
  skill,
}: {
  /** Every item of this (level, skill) — unfiltered, so the panel does not move with the filters. */
  rows: ContentRow[];
  /** `null` is the KNM catalogue. */
  level: Level | null;
  skill: string;
}) {
  const isOpenSkill = skill === 'schrijven' || skill === 'spreken';
  const format = formatOf(level, skill as OnderdeelSlug);
  const target =
    format?.itemCount != null ? format.itemCount * format.examCount : null;

  const { total, backlog, categories } = useMemo(() => {
    const counts = new Map<string, number>();
    let backlog = 0;
    for (const r of rows) {
      if (isBacklog(r.examNumber)) backlog += 1;
      const key = (isOpenSkill ? r.typeLabel : r.sectionName) ?? '';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return {
      total: rows.length,
      backlog,
      categories: [...counts.entries()].sort(
        (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
      ),
    };
  }, [rows, isOpenSkill]);

  const pct = target ? Math.min(100, Math.round((total / target) * 100)) : null;

  return (
    <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="m-0 font-headline text-sm font-bold text-on-surface">
          Voortgang catalogus
        </p>
        <p className="m-0 text-xs text-on-surface-variant">
          {target != null ? (
            <>
              <span className="tabular-nums font-semibold text-on-surface">{total}</span> van{' '}
              <span className="tabular-nums">{target}</span>{' '}
              {isOpenSkill ? 'opgaven' : 'vragen'} voor {format?.examCount} examens ({pct}%)
            </>
          ) : (
            <>
              <span className="tabular-nums font-semibold text-on-surface">{total}</span>{' '}
              {isOpenSkill ? 'opgaven' : 'vragen'} · doel voor {level === null ? 'KNM' : levelLabel(level)} nog niet
              vastgesteld
            </>
          )}
          {backlog > 0 && <> · {backlog} in de backlog</>}
        </p>
      </div>

      {pct != null && (
        <div
          className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-outline-variant"
          role="progressbar"
          aria-valuenow={total}
          aria-valuemin={0}
          aria-valuemax={target ?? undefined}
          aria-label={`${total} van ${target} items geschreven`}
        >
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${pct}%`, transition: 'width .28s cubic-bezier(0.22, 1, 0.36, 1)' }}
          />
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {categories.length === 0 ? (
          <span className="text-xs text-on-surface-variant">Nog geen items geschreven.</span>
        ) : (
          categories.map(([name, n]) => (
            // An uncategorised item is called out rather than omitted: it is invisible in the
            // exam's Opbouw panel, so this is the only place the gap shows up.
            <span
              key={name || 'geen'}
              className={
                name
                  ? 'inline-flex items-center gap-1.5 rounded-full border border-outline-variant bg-surface-container-lowest px-2.5 py-1 text-xs text-on-surface-variant'
                  : 'inline-flex items-center gap-1.5 rounded-full border border-[#a24000]/30 bg-[#fcecdd] px-2.5 py-1 text-xs font-semibold text-[#a24000]'
              }
            >
              {name || 'Geen tekstsoort'}
              <span className="tabular-nums font-semibold">{n}</span>
            </span>
          ))
        )}
      </div>
    </div>
  );
}
