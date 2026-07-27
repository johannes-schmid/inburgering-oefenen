'use client';

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, AreaChart, Area,
  ResponsiveContainer, Tooltip,
} from 'recharts';

interface DayData { date: string; cents: number }

interface RevenueData {
  todayCount: number;
  todayRevenueCents: number;
  todayTrend: number;
  weekCount: number;
  weekRevenueCents: number;
  weekTrend: number;
  totalCount: number;
  totalRevenueCents: number;
  weekDailyData: DayData[];
  chartData: DayData[];
}

function formatEur(cents: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

function TrendBadge({ pct }: { pct: number }) {
  const up = pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
        up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
      }`}
    >
      {up ? '↑' : '↓'} {up ? '+' : ''}{pct}%
    </span>
  );
}

const DAY_LABELS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

function filterChartData(data: DayData[], period: '7d' | '30d' | '3m') {
  const now = new Date();
  const cutoff = new Date(now);
  if (period === '7d') cutoff.setDate(now.getDate() - 7);
  else if (period === '30d') cutoff.setDate(now.getDate() - 30);
  else cutoff.setMonth(now.getMonth() - 3);
  const cutStr = cutoff.toISOString().slice(0, 10);
  return data.filter((d) => d.date >= cutStr);
}

export function RevenueDashboard({ data }: { data: RevenueData }) {
  const [period, setPeriod] = useState<'7d' | '30d' | '3m'>('3m');

  const filteredChart = filterChartData(data.chartData, period);

  const weekBarData = data.weekDailyData.map((d, i) => ({
    label: DAY_LABELS[i],
    cents: d.cents,
  }));

  const periodLabel: Record<string, string> = {
    '7d': 'Laatste 7 dagen',
    '30d': 'Laatste 30 dagen',
    '3m': 'Laatste 3 maanden',
  };

  return (
    <div className="rounded-2xl overflow-hidden mb-8 bg-white border border-black/6" style={{ boxShadow: '0 2px 24px rgba(0,43,109,0.06)' }}>
      {/* Stat cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-black/6">
        {/* Today */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-on-surface-variant text-sm font-medium">Vandaag</span>
            <TrendBadge pct={data.todayTrend} />
          </div>
          <p className="text-3xl font-headline font-bold text-on-surface mb-1">
            {formatEur(data.todayRevenueCents)}
          </p>
          <p className="text-on-surface-variant text-xs">{data.todayCount} {data.todayCount === 1 ? 'verkoop' : 'verkopen'}</p>
          <p className="text-on-surface-variant/60 text-xs mt-0.5">vs. gisteren</p>
        </div>

        {/* This week — with mini bar chart */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-on-surface-variant text-sm font-medium">Deze week</span>
            <TrendBadge pct={data.weekTrend} />
          </div>
          <p className="text-3xl font-headline font-bold text-on-surface mb-1">
            {formatEur(data.weekRevenueCents)}
          </p>
          <p className="text-on-surface-variant text-xs">{data.weekCount} {data.weekCount === 1 ? 'verkoop' : 'verkopen'}</p>

          {/* Mini bar chart Mon–Sun */}
          <div className="mt-4 h-20">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekBarData} barCategoryGap="20%">
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'rgba(0,0,0,0.35)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(0,43,109,0.04)' }}
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className="bg-white border border-black/8 shadow-md text-on-surface text-xs px-2 py-1 rounded-lg">
                        {formatEur(payload[0].value as number)}
                      </div>
                    ) : null
                  }
                />
                <Bar dataKey="cents" fill="var(--color-primary, #002b6d)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Total */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-on-surface-variant text-sm font-medium">Totale omzet</span>
            <span className="text-xs text-on-surface-variant/60">all time</span>
          </div>
          <p className="text-3xl font-headline font-bold text-on-surface mb-1">
            {formatEur(data.totalRevenueCents)}
          </p>
          <p className="text-on-surface-variant text-xs">{data.totalCount} {data.totalCount === 1 ? 'betaling' : 'betalingen'}</p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-black/6" />

      {/* Area chart */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-on-surface font-semibold text-sm">Omzet over tijd</p>
            <p className="text-on-surface-variant/60 text-xs mt-0.5">{periodLabel[period]}</p>
          </div>
          <div className="flex gap-1 bg-black/4 rounded-lg p-1">
            {(['3m', '30d', '7d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  period === p
                    ? 'bg-white text-on-surface shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {p === '3m' ? '3 maanden' : p === '30d' ? '30 dagen' : '7 dagen'}
              </button>
            ))}
          </div>
        </div>

        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredChart} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#002b6d" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#002b6d" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fill: 'rgba(0,0,0,0.35)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: string) => {
                  const d = new Date(v);
                  return `${d.getDate()} ${d.toLocaleString('nl-NL', { month: 'short' })}`;
                }}
                interval="preserveStartEnd"
              />
              <Tooltip
                cursor={{ stroke: 'rgba(0,43,109,0.15)', strokeWidth: 1 }}
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div className="bg-white border border-black/8 shadow-md text-on-surface text-xs px-3 py-2 rounded-xl">
                      <p className="text-on-surface-variant mb-1">{label}</p>
                      <p className="font-bold">{formatEur(payload[0].value as number)}</p>
                    </div>
                  ) : null
                }
              />
              <Area
                type="monotone"
                dataKey="cents"
                stroke="#002b6d"
                strokeWidth={2}
                fill="url(#revenueGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
