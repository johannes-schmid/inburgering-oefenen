'use client';

import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from 'recharts';
import { useTranslations } from 'next-intl';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { TrendingUp } from 'lucide-react';
import type { ProgressionPoint } from '@/lib/progression';

type Props = { points: ProgressionPoint[]; locale: string };

export default function ProgressionChart({ points, locale }: Props) {
  const t = useTranslations('dashboard');

  const config = {
    masteryPct: { label: t('progress_tooltip_mastery'), color: '#1d428a' },
  } satisfies ChartConfig;

  const fmtDate = (iso: string) => {
    try {
      return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(iso + 'T00:00:00'));
    } catch {
      return iso.slice(5);
    }
  };

  if (points.length < 2) {
    return (
      <div
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 10, minHeight: 200, textAlign: 'center', color: '#8a8fa0',
        }}
      >
        <TrendingUp size={30} strokeWidth={1.8} color="#c4c6d2" />
        <span style={{ fontSize: 13.5, maxWidth: 260 }}>{t('progress_empty')}</span>
      </div>
    );
  }

  const last = points[points.length - 1];

  return (
    <div dir="ltr">
      <ChartContainer config={config} className="w-full" style={{ aspectRatio: '16 / 7', minHeight: 220 }}>
        <AreaChart data={points} margin={{ top: 18, right: 16, left: -6, bottom: 0 }}>
          <defs>
            <linearGradient id="fillMastery" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1d428a" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#1d428a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#e6e9f0" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={fmtDate}
            tickLine={false}
            axisLine={false}
            minTickGap={44}
            tick={{ fontSize: 11, fill: '#8a8fa0' }}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 50, 100]}
            tickFormatter={v => `${v}%`}
            tickLine={false}
            axisLine={false}
            width={40}
            tick={{ fontSize: 11, fill: '#8a8fa0' }}
          />
          <ReferenceLine y={100} stroke="#c4c6d2" strokeDasharray="6 5" />
          <ReferenceLine
            y={70}
            stroke="#fe762c"
            strokeDasharray="6 5"
            label={{ value: t('progress_pass_line'), position: 'insideTopRight', fill: '#d94f00', fontSize: 10.5, fontWeight: 700 }}
          />
          <ChartTooltip
            cursor={{ stroke: '#c4c6d2', strokeWidth: 1 }}
            content={<ChartTooltipContent labelFormatter={(_, p) => fmtDate(String(p?.[0]?.payload?.date ?? ''))} />}
          />
          <Area
            dataKey="masteryPct"
            type="monotone"
            stroke="#1d428a"
            strokeWidth={2.6}
            fill="url(#fillMastery)"
            dot={false}
            activeDot={{ r: 5, fill: '#fe762c', stroke: '#fff', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ChartContainer>
      <div style={{ textAlign: 'right', marginTop: 4, fontSize: 12, color: '#8a8fa0', paddingRight: 4 }}>
        <span style={{ color: '#d94f00', fontWeight: 700 }}>{last.masteryPct}%</span> · {t('progress_today')}
      </div>
    </div>
  );
}
