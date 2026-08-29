'use client';

import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  ResponsiveContainer, Tooltip, CartesianGrid,
} from 'recharts';

/**
 * Aanmeldingen -> betalingen -> conversie, per week.
 *
 * Ported from knm-website's admin dashboard. It sits beside `RevenueDashboard` and deliberately
 * counts payments rather than summing them: revenue answers "how much", this answers "how many of
 * the people who arrived actually bought". The green line is the internal-only exception to the
 * no-new-hue rule that /admin's answer key already established.
 */
export interface WeekPoint {
  weekStart: string;
  label: string;
  signups: number;
  payments: number;
  conversionPct: number;
}

interface ConversionData {
  weeks: WeekPoint[];
  signupsThisWeek: number;
  signupsLastWeek: number;
  paymentsThisWeek: number;
  paymentsLastWeek: number;
  conversionThisWeek: number;
  conversionLastWeek: number;
}

function TrendBadge({ current, previous, unit = '' }: { current: number; previous: number; unit?: string }) {
  const diff = current - previous;
  const pct = previous === 0 ? (current > 0 ? 100 : 0) : Math.round((diff / previous) * 100);
  const up = diff >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
        up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
      }`}
    >
      {up ? '↑' : '↓'} {unit === 'pp' ? `${up ? '+' : ''}${diff.toFixed(1)} pp` : `${up ? '+' : ''}${pct}%`}
    </span>
  );
}

function StatCard({
  label, value, sub, current, previous, unit,
}: {
  label: string; value: string; sub: string; current: number; previous: number; unit?: string;
}) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-on-surface-variant text-sm font-medium">{label}</span>
        <TrendBadge current={current} previous={previous} unit={unit} />
      </div>
      <p className="text-3xl font-headline font-bold text-on-surface mb-1">{value}</p>
      <p className="text-on-surface-variant text-xs">{sub}</p>
      <p className="text-on-surface-variant/60 text-xs mt-0.5">vs. vorige week</p>
    </div>
  );
}

export function ConversionDashboard({ data }: { data: ConversionData }) {
  return (
    <div className="rounded-2xl overflow-hidden mb-8 bg-white border border-black/6" style={{ boxShadow: '0 2px 24px rgba(0,43,109,0.06)' }}>
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-black/6">
        <StatCard
          label="Aanmeldingen deze week"
          value={String(data.signupsThisWeek)}
          sub={`${data.signupsLastWeek} vorige week`}
          current={data.signupsThisWeek}
          previous={data.signupsLastWeek}
        />
        <StatCard
          label="Betalingen deze week"
          value={String(data.paymentsThisWeek)}
          sub={`${data.paymentsLastWeek} vorige week`}
          current={data.paymentsThisWeek}
          previous={data.paymentsLastWeek}
        />
        <StatCard
          label="Conversie deze week"
          value={`${data.conversionThisWeek.toFixed(1)}%`}
          sub={`${data.conversionLastWeek.toFixed(1)}% vorige week`}
          current={data.conversionThisWeek}
          previous={data.conversionLastWeek}
          unit="pp"
        />
      </div>

      <div className="border-t border-black/6" />

      <div className="p-6">
        <div className="mb-4">
          <p className="text-on-surface font-semibold text-sm">Conversie per week</p>
          <p className="text-on-surface-variant/60 text-xs mt-0.5">
            Aanmeldingen en betalingen per week — lijn toont conversiepercentage
          </p>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data.weeks} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: 'rgba(0,0,0,0.35)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: 'rgba(0,0,0,0.35)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: 'rgba(0,0,0,0.35)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={36}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip
                cursor={{ fill: 'rgba(0,43,109,0.04)' }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as WeekPoint;
                  return (
                    <div className="bg-white border border-black/8 shadow-md text-on-surface text-xs px-3 py-2 rounded-xl">
                      <p className="text-on-surface-variant mb-1">Week van {label}</p>
                      <p>{p.signups} aanmeldingen</p>
                      <p>{p.payments} betalingen</p>
                      <p className="font-bold mt-1">{p.conversionPct.toFixed(1)}% conversie</p>
                    </div>
                  );
                }}
              />
              <Bar yAxisId="left" dataKey="signups" fill="rgba(0,43,109,0.18)" radius={[3, 3, 0, 0]} />
              <Bar yAxisId="left" dataKey="payments" fill="#002b6d" radius={[3, 3, 0, 0]} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="conversionPct"
                stroke="#0f9d76"
                strokeWidth={2}
                dot={{ r: 2, fill: '#0f9d76' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-on-surface-variant">
          <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: 'rgba(0,43,109,0.18)' }} /> Aanmeldingen</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: '#002b6d' }} /> Betalingen</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-3 h-0.5 rounded-sm" style={{ background: '#0f9d76' }} /> Conversie %</span>
        </div>
      </div>
    </div>
  );
}
