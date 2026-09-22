'use client';

import { Bar, CartesianGrid, Line, ComposedChart, ReferenceLine, XAxis, YAxis } from 'recharts';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { MrrMonth } from '@/lib/admin/mrr';

/**
 * De MRR-beweging: vijf gestapelde blokken per maand, verlies onder de nullijn, MRR als lijn erover.
 *
 * Eén stapel en één lijn in hetzelfde assenstelsel — de lijn staat op een tweede y-as, want de MRR
 * is een niveau (honderden euro's) en de bewegingen zijn het verschil (tientallen). Op één as zou de
 * stapel tot een streepje onder de lijn platgedrukt worden, en dan is er niets te zien van wat deze
 * grafiek nu juist moet tonen.
 */
const chartConfig = {
  newCents: { label: 'Nieuw', color: '#002b6d' },
  expansionCents: { label: 'Uitbreiding', color: '#4a6a9d' },
  reactivationCents: { label: 'Terugkeer', color: '#9fb3cd' },
  contractionCents: { label: 'Afbouw', color: '#e0a3a3' },
  churnCents: { label: 'Opzegging', color: '#ba1a1a' },
  mrrCents: { label: 'MRR', color: '#a24000' },
} satisfies ChartConfig;

/**
 * Eigen legenda in plaats van `ChartLegend`.
 *
 * Recharts bouwt zijn legenda op in de volgorde waarin de reeksen klaar zijn, en dat zette
 * "Opzegging" vóór "Nieuw" — de omgekeerde leesrichting van de stapel eronder. In recharts 3 is
 * `payload` op `Legend` geen prop meer, dus de volgorde is hier vastgelegd.
 */
const LEGEND = (Object.keys(chartConfig) as (keyof typeof chartConfig)[]).map(key => ({
  key,
  label: chartConfig[key].label,
  color: chartConfig[key].color,
}));

const eur = (cents: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(cents / 100);

export function MrrMovementChart({ data }: { data: MrrMonth[] }) {
  const last = data[data.length - 1];

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>MRR-beweging</CardTitle>
        <CardDescription>
          Waar de maandelijkse omzet vandaan komt en waar hij weglekt — {data.length} maanden.
          {last && ` Netto deze maand: ${last.netCents >= 0 ? '+' : ''}${eur(last.netCents)}.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[280px] w-full">
          <ComposedChart data={data} stackOffset="sign" maxBarSize={56} margin={{ left: 4, right: 4 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis
              yAxisId="movement"
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(v: number) => eur(v)}
            />
            <YAxis yAxisId="mrr" orientation="right" hide />
            <ReferenceLine yAxisId="movement" y={0} stroke="rgba(0,0,0,0.25)" />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <div className="flex w-full items-center justify-between gap-3">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                          style={{ background: chartConfig[name as keyof typeof chartConfig]?.color }}
                        />
                        {chartConfig[name as keyof typeof chartConfig]?.label ?? name}
                      </span>
                      <span className="font-mono font-medium tabular-nums">{eur(Number(value))}</span>
                    </div>
                  )}
                />
              }
            />
            <Bar isAnimationActive={false} yAxisId="movement" dataKey="newCents" stackId="m" fill="var(--color-newCents)" radius={[2, 2, 0, 0]} />
            <Bar isAnimationActive={false} yAxisId="movement" dataKey="expansionCents" stackId="m" fill="var(--color-expansionCents)" />
            <Bar isAnimationActive={false} yAxisId="movement" dataKey="reactivationCents" stackId="m" fill="var(--color-reactivationCents)" />
            <Bar isAnimationActive={false} yAxisId="movement" dataKey="contractionCents" stackId="m" fill="var(--color-contractionCents)" />
            <Bar isAnimationActive={false} yAxisId="movement" dataKey="churnCents" stackId="m" fill="var(--color-churnCents)" radius={[0, 0, 2, 2]} />
            <Line
              isAnimationActive={false}
              yAxisId="mrr"
              dataKey="mrrCents"
              type="monotone"
              stroke="var(--color-mrrCents)"
              strokeWidth={2}
              dot={{ r: 3, fill: 'var(--color-mrrCents)' }}
            />
          </ComposedChart>
        </ChartContainer>

        <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          {LEGEND.map(({ key, label, color }) => (
            <li key={key} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                style={{ background: color, borderRadius: key === 'mrrCents' ? '9999px' : undefined }}
              />
              {label}
            </li>
          ))}
        </ul>

        <p className="mt-4 text-xs text-muted-foreground">
          De lijn is de MRR, teruggerekend vanaf vandaag. Afbouw is vandaag altijd nul: opzeggen is
          alles-of-niets, er is geen deel-opzegging. Een opzegging telt in de maand waarin de laatste
          betaalde periode afloopt, niet in de maand van de opzegging zelf.
        </p>
      </CardContent>
    </Card>
  );
}
