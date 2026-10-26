'use client';

import { useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { DayPoint } from '@/lib/admin/seo-model';

/** Gevalideerd met de dataviz-validator (dezelfde twee als op /admin/doelen): blauw en klei. */
const GOOGLE = '#2f5fb3';
const BING = '#d9692a';

/** De Google spam-update van september 2026, volgens het Search Status Dashboard. */
const SPAM_UPDATE = { from: '2026-09-24', to: '2026-10-08' };

const config = {
  google: { label: 'Google', color: GOOGLE },
  googlePrelim: { label: 'Google (preliminary)', color: GOOGLE },
  bing: { label: 'Bing', color: BING },
} satisfies ChartConfig;

type Metric = 'impressions' | 'clicks';
export type ChangeMark = { date: string; change: string };

const nf = new Intl.NumberFormat('en-GB');
const short = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const long = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', timeZone: 'UTC' });

export function SeoTrendChart({ points, changes }: { points: DayPoint[]; changes: ChangeMark[] }) {
  const [metric, setMetric] = useState<Metric>('impressions');
  // De voorlopige dagen krijgen een eigen, gestippelde reeks die aansluit op de laatste vaste dag.
  const firstPrelim = points.findIndex(p => p.preliminary);
  const data = points.map((p, i) => {
    const g = metric === 'impressions' ? p.google : p.googleClicks;
    const joins = firstPrelim > 0 && i === firstPrelim - 1;
    return {
      date: p.date,
      preliminary: !!p.preliminary,
      google: p.preliminary ? null : g,
      googlePrelim: p.preliminary || joins ? g : null,
      bing: metric === 'impressions' ? p.bing : p.bingClicks,
    };
  });
  const first = points[0]?.date;
  const last = points.at(-1)?.date;
  const inRange = (d: string) => !!first && !!last && d >= first && d <= last;
  const marks = changes.filter(c => inRange(c.date));
  const byDate = new Map<string, string[]>();
  for (const c of marks) byDate.set(c.date, [...(byDate.get(c.date) ?? []), c.change]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant" aria-label="Legend">
          <li className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded-full" style={{ background: GOOGLE }} aria-hidden />Google</li>
          <li className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded-full" style={{ background: BING }} aria-hidden />Bing</li>
          {firstPrelim >= 0 && (
            <li className="flex items-center gap-1.5"><span className="w-4 border-t-2 border-dotted" style={{ borderColor: GOOGLE }} aria-hidden />Preliminary</li>
          )}
          <li className="flex items-center gap-1.5"><span className="h-3 w-4 rounded-sm bg-[rgba(162,64,0,0.10)]" aria-hidden />Google spam update</li>
          <li className="flex items-center gap-1.5"><span className="h-3 w-px border-l border-dashed border-on-surface-variant/60" aria-hidden />Our change</li>
        </ul>
        <ToggleGroup
          value={[metric]}
          onValueChange={v => v[0] && setMetric(v[0] as Metric)}
          variant="outline"
          size="sm"
          spacing={0}
          aria-label="Metric"
          className="bg-surface-container-lowest"
        >
          <ToggleGroupItem value="impressions" className="px-3">Impressions</ToggleGroupItem>
          <ToggleGroupItem value="clicks" className="px-3">Clicks</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <ChartContainer config={config} className="aspect-auto h-[260px] w-full">
        <LineChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
          <CartesianGrid vertical={false} />
          {inRange(SPAM_UPDATE.from) && (
            <ReferenceArea x1={SPAM_UPDATE.from} x2={SPAM_UPDATE.to} fill="rgba(162,64,0,0.10)" strokeOpacity={0} ifOverflow="hidden" />
          )}
          {marks.map(m => (
            <ReferenceLine key={`${m.date}-${m.change}`} x={m.date} stroke="var(--ink-3)" strokeOpacity={0.6} strokeDasharray="3 3" />
          ))}
          <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={40} tickFormatter={short} />
          <YAxis tickLine={false} axisLine={false} width={40} tickFormatter={v => nf.format(v)} allowDecimals={false} />
          <Tooltip
            cursor={{ stroke: 'var(--ink-3)', strokeOpacity: 0.4 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const d = String(label);
              const notes = byDate.get(d);
              const spam = d >= SPAM_UPDATE.from && d <= SPAM_UPDATE.to;
              const prelim = data.find(x => x.date === d)?.preliminary;
              const rows = payload.filter(p => p.value !== null && p.value !== undefined && !(p.dataKey === 'googlePrelim' && !prelim));
              return (
                <div className="max-w-64 rounded-lg bg-surface-container-lowest px-3 py-2 text-xs shadow-[var(--zweef)]">
                  <p className="font-semibold text-on-surface">{long(d)}</p>
                  <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 tabular-nums">
                    {rows.map(p => (
                      <div key={String(p.dataKey)} className="contents">
                        <dt className="flex items-center gap-1.5 text-on-surface-variant">
                          <span className="size-2 rounded-full" style={{ background: p.color }} aria-hidden />
                          {p.dataKey === 'bing' ? 'Bing' : 'Google'}
                        </dt>
                        <dd className="text-right font-semibold text-on-surface">{nf.format(Number(p.value))}</dd>
                      </div>
                    ))}
                  </dl>
                  {prelim && <p className="mt-1.5 text-on-surface-variant">Preliminary: Google still revises this day</p>}
                  {spam && <p className="mt-1.5 text-[#a24000]">Google spam update was rolling out</p>}
                  {notes?.map(n => <p key={n} className="mt-1.5 text-on-surface-variant">{n}</p>)}
                </div>
              );
            }}
          />
          <Line dataKey="google" type="monotone" stroke={GOOGLE} strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
          <Line dataKey="googlePrelim" type="monotone" stroke={GOOGLE} strokeWidth={2} strokeDasharray="2 4" dot={false} connectNulls={false} isAnimationActive={false} />
          <Line dataKey="bing" type="monotone" stroke={BING} strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
