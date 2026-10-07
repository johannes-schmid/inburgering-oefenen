'use client';

import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Check, TriangleAlert } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from '@/components/ui/chart';
import {
  FUNNEL_STEPS, GOAL_ASSUMPTIONS, TRACKS, arpuEur, bottleneck, milestones, needsFor, netMonthlyEur,
  nextMilestone, requiredFunnel, stepRates,
  type FunnelActuals, type MonthNew, type Track,
} from '@/lib/admin/goal-model';

/**
 * Kleuren per spoor, gevalideerd met de dataviz-validator (licht, alle paren): A2 en B1 blauw in
 * twee stappen, KNM het oranje. B1 haalt geen 3:1 tegen wit, dus de grafiek heeft altijd een legenda
 * en een tooltip met het getal.
 */
const TRACK_COLOR: Record<Track, string> = { a2: '#2f5fb3', b1: '#3aa0c8', knm: '#d9692a' };

const nf = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 0 });
const eur = (n: number) => `€${nf.format(Math.round(n))}`;
const int = (n: number) => (Number.isFinite(n) ? nf.format(Math.round(n)) : '—');
const pct = (n: number) => `${(n * 100).toFixed(n < 0.1 ? 1 : 0).replace('.', ',')}%`;

type Props = {
  mrrCents: number;
  active: Record<Track, number> & { total: number };
  newByMonth: MonthNew[];
  visitorsByMonth: { month: string; users: number }[] | null;
  ga4Error: string | null;
  funnel: FunnelActuals;
};

export function DoelenDashboard(props: Props) {
  return (
    <div className="max-w-6xl">
      <header className="mb-6">
        <h1 className="text-2xl font-headline font-bold tracking-tight text-on-surface">Doelen</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Nederland · Taal A2, Taal B1 en KNM · omzet excl. btw en na betaalkosten
        </p>
      </header>

      <Tabs defaultValue="sales">
        <TabsList variant="line" className="mb-6">
          <TabsTrigger value="sales" className="px-3">Sales</TabsTrigger>
          <TabsTrigger value="doelen" className="px-3">Doelen</TabsTrigger>
        </TabsList>
        <TabsContent value="sales"><SalesTab {...props} /></TabsContent>
        <TabsContent value="doelen"><GoalsTab {...props} /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ── Gedeelde bouwstenen ─────────────────────────────────────────────────── */

function Panel({ title, note, children, className = '' }: { title?: string; note?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-2xl bg-surface-container-lowest p-5 shadow-[var(--shadow-ambient)] sm:p-6 ${className}`}>
      {title && (
        <div className="mb-5">
          <h2 className="text-base font-headline font-bold tracking-tight text-on-surface">{title}</h2>
          {note && <p className="mt-1 text-xs text-on-surface-variant">{note}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

function Unknown({ children }: { children: React.ReactNode }) {
  return <span className="text-on-surface-variant/70">{children}</span>;
}

/* ── Sales ───────────────────────────────────────────────────────────────── */

function SalesTab({ mrrCents, active, newByMonth, visitorsByMonth, ga4Error, funnel }: Props) {
  const rates = stepRates(funnel);
  const stuck = bottleneck(rates);
  const overall = funnel.visitors ? (funnel.paid ?? 0) / funnel.visitors : null;

  const kpis: { label: string; value: string; sub: string }[] = [
    { label: 'Netto MRR', value: eur(netMonthlyEur(mrrCents)), sub: `${eur(mrrCents / 100)} incl. btw` },
    { label: 'Lopende abonnees', value: int(active.total), sub: `A2 ${active.a2} · B1 ${active.b1} · KNM ${active.knm}` },
    { label: 'Nieuwe klanten', value: int(funnel.paid ?? 0), sub: 'laatste 30 dagen' },
    { label: 'Bezoekers', value: funnel.visitors === null ? '—' : int(funnel.visitors), sub: funnel.visitors === null ? 'GA4 niet gekoppeld' : 'laatste 30 dagen · GA4' },
    { label: 'Bezoeker → klant', value: overall === null ? '—' : pct(overall), sub: 'over dezelfde 30 dagen' },
  ];

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-x-6 gap-y-5 rounded-2xl bg-surface-container-lowest p-5 shadow-[var(--shadow-ambient)] sm:p-6 lg:grid-cols-5">
        {kpis.map((k, i) => (
          <div key={k.label} className={i === 0 ? 'col-span-2 lg:col-span-1' : ''}>
            <p className="text-xs font-medium text-on-surface-variant">{k.label}</p>
            <p className="mt-1 text-2xl font-headline font-bold tracking-tight text-on-surface tabular-nums">{k.value}</p>
            <p className="mt-0.5 text-xs text-on-surface-variant/80">{k.sub}</p>
          </div>
        ))}
      </section>

      <Panel title="Funnel, laatste 30 dagen" note="Elke stap tegen zijn streefconversie. De stap die het verst achterblijft is waar de funnel lekt.">
        <ol className="space-y-1.5">
          {FUNNEL_STEPS.map((step, i) => {
            const value = funnel[step.key];
            const rate = i === 0 ? null : rates[i - 1];
            const isStuck = stuck !== null && rate?.key === stuck.key;
            const width = value && funnel.visitors ? Math.max(value / funnel.visitors, 0.006) : 0;
            return (
              <li
                key={step.key}
                className={`grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 rounded-xl px-3 py-3 sm:grid-cols-[180px_1fr_80px_170px] ${isStuck ? 'bg-[rgba(254,118,44,0.09)]' : ''}`}
              >
                <div>
                  <p className="text-sm font-semibold text-on-surface">{step.label}</p>
                  <p className="text-[11px] text-on-surface-variant/80">{step.source}</p>
                </div>
                <div className="order-last col-span-2 h-2.5 rounded-full bg-surface-container sm:order-none sm:col-span-1">
                  <div
                    className="h-full origin-left rounded-full bg-[#2f5fb3] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                    style={{ transform: `scaleX(${width})` }}
                  />
                </div>
                <p className="text-right text-lg font-headline font-bold text-on-surface tabular-nums">
                  {value === null ? <Unknown>—</Unknown> : int(value)}
                </p>
                <div className="col-span-2 text-xs sm:col-span-1 sm:text-right">
                  {rate === null ? (
                    <span className="text-on-surface-variant/70">startpunt</span>
                  ) : rate.current === null ? (
                    <Unknown>conversie onbekend · streef {pct(rate.target)}</Unknown>
                  ) : (
                    <span className={isStuck ? 'font-semibold text-[#a24000]' : 'text-on-surface-variant'}>
                      {isStuck && <TriangleAlert className="mr-1 inline size-3.5 -translate-y-px" aria-hidden />}
                      {pct(rate.current)} <span className="font-normal opacity-80">· streef {pct(rate.target)}</span>
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
        {ga4Error && (
          <p className="mt-4 rounded-xl bg-surface-container-low px-4 py-3 text-xs text-on-surface-variant">
            GA4 gaf geen cijfers ({ga4Error}). Bezoekers en oefenaars staan daarom op onbekend, niet op nul.
          </p>
        )}
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Bezoekers per maand" note="GA4 · gebruikers · de lopende maand is nog niet compleet">
          {visitorsByMonth ? <VisitorsChart data={visitorsByMonth} /> : <EmptyChart text="GA4 is niet gekoppeld." />}
        </Panel>
        <Panel title="Nieuwe betalende klanten per maand" note="Supabase · eerste betaling · wie twee sporen koopt telt bij allebei">
          <NewCustomersChart data={newByMonth} />
        </Panel>
      </div>
    </div>
  );
}

function EmptyChart({ text }: { text: string }) {
  return <div className="grid h-56 place-items-center rounded-xl bg-surface-container-low text-sm text-on-surface-variant">{text}</div>;
}

const monthShort = (m: string) => new Date(`${m}-01T00:00:00Z`).toLocaleString('nl-NL', { month: 'short', timeZone: 'UTC' });

function VisitorsChart({ data }: { data: { month: string; users: number }[] }) {
  const config = { users: { label: 'Bezoekers', color: TRACK_COLOR.a2 } } satisfies ChartConfig;
  const rows = data.map(d => ({ ...d, label: monthShort(d.month) }));
  return (
    <ChartContainer config={config} className="h-56 w-full">
      <BarChart data={rows} margin={{ left: -16, right: 4, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="2 4" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
        <ChartTooltip cursor={{ fill: 'rgba(0,43,109,0.05)' }} content={<ChartTooltipContent />} />
        <Bar dataKey="users" isAnimationActive={false} fill="var(--color-users)" radius={[4, 4, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ChartContainer>
  );
}

function NewCustomersChart({ data }: { data: MonthNew[] }) {
  const config = Object.fromEntries(TRACKS.map(t => [t.key, { label: t.label, color: TRACK_COLOR[t.key] }])) satisfies ChartConfig;
  if (data.every(d => d.a2 + d.b1 + d.knm === 0)) return <EmptyChart text="Nog geen betalingen in deze periode." />;
  return (
    <ChartContainer config={config} className="h-56 w-full">
      <BarChart data={data} margin={{ left: -16, right: 4, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="2 4" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
        <ChartTooltip cursor={{ fill: 'rgba(0,43,109,0.05)' }} content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        {TRACKS.map((t, i) => (
          <Bar
            key={t.key}
            dataKey={t.key}
            stackId="new"
            isAnimationActive={false}
            fill={`var(--color-${t.key})`}
            stroke="var(--color-surface-container-lowest)"
            strokeWidth={2}
            radius={i === TRACKS.length - 1 ? [4, 4, 0, 0] : 0}
            maxBarSize={36}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}

/* ── Doelen ──────────────────────────────────────────────────────────────── */

function GoalsTab({ mrrCents, funnel }: Props) {
  const [lifetime, setLifetime] = useState(GOAL_ASSUMPTIONS.lifetimeMonths);
  const list = useMemo(() => milestones(lifetime), [lifetime]);
  const rates = stepRates(funnel);
  const needs = needsFor(list, rates);
  const stuck = bottleneck(rates);

  const current = netMonthlyEur(mrrCents);
  const next = nextMilestone(list, current);
  const target = list[list.length - 1];
  const nextNeed = needs.find(n => n.milestone.key === next?.key) ?? null;

  // Wat het oplevert als alleen de bottleneck zijn streefwaarde haalt.
  const fixed = stuck && next
    ? requiredFunnel(next.newPerMonth, rates.map(r => ({ key: r.key, rate: r.key === stuck.key ? Math.max(r.used, r.target) : r.used })))
    : null;
  const stuckIdx = stuck ? FUNNEL_STEPS.findIndex(s => s.key === stuck.key) : -1;
  const assumedSteps = rates.filter(r => r.assumed);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-on-surface-variant">
          Stabiele maandomzet zodra instroom en opzeggingen in evenwicht zijn: nieuw per maand × looptijd × opbrengst.
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-on-surface-variant">Gem. looptijd</span>
          <ToggleGroup
            value={[String(lifetime)]}
            onValueChange={v => v[0] && setLifetime(Number(v[0]))}
            variant="outline"
            size="sm"
            spacing={0}
            aria-label="Gemiddelde looptijd in maanden"
          >
            {[1, 2, 3, 4].map(m => (
              <ToggleGroupItem key={m} value={String(m)} className="px-3 tabular-nums">{m} mnd</ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>

      <Panel>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-on-surface-variant">
              {next ? <>Volgende mijlpaal: <span className="text-on-surface">{next.label}</span></> : 'Alle mijlpalen gehaald'}
            </p>
            <p className="mt-1 text-4xl font-headline font-extrabold tracking-tight text-on-surface tabular-nums">
              {eur(current)}<span className="ml-1.5 text-base font-semibold text-on-surface-variant">/ mnd nu</span>
            </p>
          </div>
          {next && (
            <p className="text-sm text-on-surface-variant sm:text-right">
              nog <span className="font-semibold text-on-surface tabular-nums">{eur(next.revenueEur - current)}</span> tot {eur(next.revenueEur)}
              <br />
              <span className="tabular-nums">{pct(current / next.revenueEur)}</span> van {next.label.toLowerCase()} · <span className="tabular-nums">{pct(current / target.revenueEur)}</span> van het doel
            </p>
          )}
        </div>

        <div className="relative mx-2 mt-8 h-3 rounded-full bg-surface-container sm:mb-7" role="img" aria-label={`Huidige omzet ${eur(current)} van het doel ${eur(target.revenueEur)}`}>
          <div
            className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-primary transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            style={{ transform: `scaleX(${Math.min(current / target.revenueEur, 1)})` }}
          />
          {list.map(m => (
            <span key={m.key} className="absolute top-1/2" style={{ left: `${(m.revenueEur / target.revenueEur) * 100}%` }}>
              <span className="absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface-container-lowest shadow-[inset_0_0_0_3px_#002b6d]" />
              <span className={`absolute top-3 hidden whitespace-nowrap text-[11px] font-semibold text-on-surface-variant tabular-nums sm:block ${m.key === 'target' ? 'right-0' : '-translate-x-1/2'}`}>
                {eur(m.revenueEur)}
              </span>
            </span>
          ))}
        </div>

        <ol className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {list.map(m => {
            const reached = current >= m.revenueEur;
            const isNext = m.key === next?.key;
            return (
              <li key={m.key} className={`rounded-xl px-4 py-3 ${isNext ? 'bg-surface-container-lowest shadow-[var(--ring-selected)]' : 'bg-surface-container-low'}`}>
                <p className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant">
                  {reached && <Check className="size-3.5 text-secondary" aria-label="gehaald" />}
                  {m.label}
                </p>
                <p className="mt-1 text-lg font-headline font-bold text-on-surface tabular-nums">{eur(m.revenueEur)}</p>
                <p className="text-[11px] text-on-surface-variant tabular-nums">{int(m.newPerMonth)} nieuw / mnd · {int(m.active)} lopend</p>
              </li>
            );
          })}
        </ol>
      </Panel>

      {next && nextNeed && (
        <Panel title={stuck ? `Werk eerst aan: ${FUNNEL_STEPS[stuckIdx - 1].label.toLowerCase()} → ${FUNNEL_STEPS[stuckIdx].label.toLowerCase()}` : `Wat ${next.label.toLowerCase()} vraagt`}>
          <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
            <div className="space-y-3 text-sm leading-relaxed text-on-surface-variant">
              {stuck && stuck.current !== null && (
                <p>
                  Deze stap converteert <span className="font-semibold text-[#a24000] tabular-nums">{pct(stuck.current)}</span> tegen een streefwaarde
                  van <span className="font-semibold text-on-surface tabular-nums">{pct(stuck.target)}</span> — het verst achter van alle stappen.
                </p>
              )}
              <p>
                Voor {next.label.toLowerCase()} zijn <span className="font-semibold text-on-surface tabular-nums">{int(next.newPerMonth)}</span> nieuwe
                abonnees per maand nodig. Bij de huidige conversie vraagt dat <span className="font-semibold text-on-surface tabular-nums">{int(nextNeed.atCurrent.visitors)}</span> bezoekers
                per maand{funnel.visitors !== null && <> — je hebt er nu <span className="font-semibold text-on-surface tabular-nums">{int(funnel.visitors)}</span></>}.
              </p>
              {stuck?.current === 0 && (
                <p>
                  In 30 dagen heeft nog niemand betaald. De aantallen rekenen daarom met de streefwaarde voor
                  deze stap; tot de eerste betalingen binnen zijn, is dit de stap om aan te werken.
                </p>
              )}
              {fixed && fixed.visitors < nextNeed.atCurrent.visitors * 0.98 && (
                <p>
                  Haalt alleen deze stap zijn streefwaarde, dan is dat <span className="font-semibold text-on-surface tabular-nums">{int(fixed.visitors)}</span> bezoekers per maand.
                </p>
              )}
              {assumedSteps.length > 0 && (
                <p className="rounded-xl bg-surface-container-low px-4 py-3 text-xs">
                  Gerekend met de streefwaarde omdat de meting nul of onbekend is: {assumedSteps.map(r => FUNNEL_STEPS.find(s => s.key === r.key)!.label.toLowerCase()).join(', ')}.
                </p>
              )}
            </div>

            <ol className="space-y-2">
              {FUNNEL_STEPS.map(step => {
                const need = nextNeed.atCurrent[step.key];
                const have = funnel[step.key];
                const share = have !== null && need > 0 ? Math.min(have / need, 1) : null;
                return (
                  <li key={step.key} className="rounded-xl bg-surface-container-low px-4 py-3">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-medium text-on-surface">{step.label}</span>
                      <span className="tabular-nums text-on-surface-variant">
                        {have === null ? '—' : int(have)} <span className="opacity-70">/ {int(need)} nodig</span>
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-surface-container-high">
                      <div
                        className="h-full w-full origin-left rounded-full bg-primary transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                        style={{ transform: `scaleX(${share ?? 0})` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </Panel>
      )}

      <Panel title="Wat elke mijlpaal vraagt" note="Per maand. Bezoekers bij de huidige conversie per stap, en als elke stap zijn streefwaarde haalt.">
        <div className="-mx-2 overflow-x-auto">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow className="border-0 hover:bg-transparent">
                <TableHead>Mijlpaal</TableHead>
                <TableHead className="text-right">Omzet</TableHead>
                <TableHead className="text-right">Nieuw</TableHead>
                <TableHead className="text-right">A2 · B1 · KNM</TableHead>
                <TableHead className="text-right">Lopend</TableHead>
                <TableHead className="text-right">Bezoekers nu</TableHead>
                <TableHead className="text-right">Bij streef</TableHead>
                <TableHead className="text-right">× huidig verkeer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {needs.map(({ milestone: m, atCurrent, atTarget }) => (
                <TableRow key={m.key} className={`border-0 ${m.key === next?.key ? 'bg-surface-container-low' : ''}`}>
                  <TableCell className="font-semibold text-on-surface">{m.label}</TableCell>
                  <TableCell className="text-right tabular-nums">{eur(m.revenueEur)}</TableCell>
                  <TableCell className="text-right tabular-nums">{int(m.newPerMonth)}</TableCell>
                  <TableCell className="text-right tabular-nums text-on-surface-variant">{m.tracks.map(t => int(t.newPerMonth)).join(' · ')}</TableCell>
                  <TableCell className="text-right tabular-nums">{int(m.active)}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold text-on-surface">{int(atCurrent.visitors)}</TableCell>
                  <TableCell className="text-right tabular-nums">{int(atTarget.visitors)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {funnel.visitors ? `${(atCurrent.visitors / funnel.visitors).toFixed(1).replace('.', ',')}×` : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Panel>

      <Panel title="Aannames" note="Geen metingen. Ze staan in lib/admin/goal-model.ts — vervang ze door echte cijfers zodra er een paar maanden betalingen zijn.">
        <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          {[
            ['Doel', `${eur(GOAL_ASSUMPTIONS.targetEurPerMonth)} per maand excl. btw`],
            ['Betaalkosten', pct(GOAL_ASSUMPTIONS.feesPct)],
            ['Opbrengst taalabonnee', `${eur(arpuEur('a2'))} / mnd excl. btw · ${pct(GOAL_ASSUMPTIONS.languageMix.bundle)} bundel, ${pct(GOAL_ASSUMPTIONS.languageMix.two)} twee, ${pct(GOAL_ASSUMPTIONS.languageMix.one)} één module`],
            ['Opbrengst KNM-abonnee', `${eur(arpuEur('knm'))} / mnd excl. btw`],
            ['Verdeling taal', `${pct(GOAL_ASSUMPTIONS.a2ShareOfLanguage)} A2 · ${pct(1 - GOAL_ASSUMPTIONS.a2ShareOfLanguage)} B1`],
            ['Streefconversie', rates.map(r => `${FUNNEL_STEPS.find(s => s.key === r.key)!.label.toLowerCase()} ${pct(r.target)}`).join(' · ')],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs font-medium text-on-surface-variant">{k}</dt>
              <dd className="text-on-surface">{v}</dd>
            </div>
          ))}
        </dl>
      </Panel>
    </div>
  );
}
