'use client';

import { useMemo, useState } from 'react';
import { Check, TriangleAlert } from 'lucide-react';
import ExamMark from '@/components/horizon/ExamMark';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  FUNNEL_STEPS, GOAL_ASSUMPTIONS, PERIODS, SCENARIOS, TRACKS, conversion, focusStep, periodGoal, scenarios,
  type Focus, type FunnelActuals, type FunnelStepKey, type PeriodActuals, type PeriodGoal, type PeriodKey,
  type ScenarioKey, type Track,
} from '@/lib/admin/goal-model';

export type PeriodData = PeriodActuals & { funnel: FunnelActuals };

type Props = {
  mrrEur: number;
  subscribers: number;
  periods: Record<PeriodKey, PeriodData>;
  ga4Error: string | null;
};

/** Gevalideerd met de dataviz-validator: A2 en B1 blauw in twee stappen, KNM oranje. */
const TRACK_COLOR: Record<Track, string> = { a2: '#2f5fb3', b1: '#3aa0c8', knm: '#d9692a' };
const EASE = 'transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none';

const nf0 = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 1 });
const eur = (n: number) => `€${nf0.format(Math.round(n))}`;
/** Doelen per dag zijn vaak kleiner dan tien; daar telt de decimaal. */
const num = (n: number) => (n < 10 ? nf1.format(n) : nf0.format(Math.round(n)));
const pct = (n: number) => `${(n * 100).toFixed(n < 0.1 && n > 0 ? 1 : 0).replace('.', ',')}%`;
/** Een fractie voor een balk: 0–1, en net zichtbaar zodra er iets is. */
const fill = (actual: number, goal: number) => (actual <= 0 || goal <= 0 ? 0 : Math.max(Math.min(actual / goal, 1), 0.03));
const targetRate = (key: FunnelStepKey) => (key === 'visitors' ? null : GOAL_ASSUMPTIONS.targetStepRates[key]);

export function DoelenDashboard({ mrrEur, subscribers, periods, ga4Error }: Props) {
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>('conservative');
  const [period, setPeriod] = useState<PeriodKey>('day');

  const all = useMemo(() => scenarios(), []);
  const scenario = all.find(s => s.key === scenarioKey)!;
  const goals = useMemo(
    () => Object.fromEntries(PERIODS.map(p => [p.key, periodGoal(scenario, p.days)])) as Record<PeriodKey, PeriodGoal>,
    [scenario],
  );
  const data = periods[period];
  const goal = goals[period];
  const focus = focusStep(data.funnel, goal);
  const periodLabel = PERIODS.find(p => p.key === period)!.label;

  return (
    <div className="max-w-6xl">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-headline font-bold tracking-tight text-on-surface">Doelen</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Nederland · omzet excl. btw en na betaalkosten</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            items={Object.fromEntries(SCENARIOS.map(s => [s.key, s.label]))}
            value={scenarioKey}
            onValueChange={v => v && setScenarioKey(v as ScenarioKey)}
          >
            <SelectTrigger className="min-w-40 bg-surface-container-lowest" aria-label="Scenario">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {all.map(s => (
                <SelectItem key={s.key} value={s.key}>
                  {s.label} <span className="text-on-surface-variant tabular-nums">· {eur(s.mrrEur)} MRR</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ToggleGroup
            value={[period]}
            onValueChange={v => v[0] && setPeriod(v[0] as PeriodKey)}
            variant="outline"
            size="sm"
            spacing={0}
            aria-label="Periode"
            className="bg-surface-container-lowest"
          >
            {PERIODS.map(p => (
              <ToggleGroupItem key={p.key} value={p.key} className="px-3">{p.label}</ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <MrrCard
          mrrEur={mrrEur}
          subscribers={subscribers}
          target={scenario.mrrEur}
          scenarioLabel={scenario.label}
          periods={periods}
          goals={goals}
          period={period}
          onPeriod={setPeriod}
        />
        <FunnelCard data={data} goal={goal} focus={focus} periodLabel={periodLabel} ga4Error={ga4Error} />
      </div>

      <ProductCard data={data} goal={goal} periodLabel={periodLabel} />

      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {FUNNEL_STEPS.map(step => (
          <StepCard key={step.key} stepKey={step.key} data={data} goal={goal} focused={focus?.step === step.key} />
        ))}
      </div>

      <p className="mt-6 max-w-3xl text-xs leading-relaxed text-on-surface-variant">
        Aannames, geen metingen: een abonnee blijft gemiddeld {GOAL_ASSUMPTIONS.lifetimeMonths} maanden, en het doel per
        stap volgt uit de streefconversie ({FUNNEL_STEPS.slice(1).map(s => `${s.label.toLowerCase()} ${pct(targetRate(s.key)!)}`).join(' · ')}).
        Een maand is 30 dagen en vandaag loopt nog. Aan te passen in <code className="font-mono">lib/admin/goal-model.ts</code>.
      </p>
    </div>
  );
}

/* ── Bouwstenen ──────────────────────────────────────────────────────────── */

function CardShell({ title, note, className = '', children }: {
  title: string; note?: string; className?: string; children: React.ReactNode;
}) {
  return (
    <section className={`min-w-0 rounded-2xl bg-surface-container-lowest p-5 shadow-[var(--shadow-ambient)] sm:p-6 ${className}`}>
      <div className="mb-5">
        <h2 className="text-base font-headline font-bold tracking-tight text-on-surface">{title}</h2>
        {note && <p className="mt-0.5 text-xs text-on-surface-variant">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function Bar({ value, color = 'var(--color-primary)', className = 'h-2' }: { value: number; color?: string; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-full bg-surface-container ${className}`}>
      <div className={`h-full origin-left rounded-full ${EASE}`} style={{ transform: `scaleX(${value})`, background: color }} />
    </div>
  );
}

function FocusChip() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#fcecdd] px-2 py-0.5 text-[11px] font-semibold text-[#a24000]">
      <TriangleAlert className="size-3" aria-hidden /> Focus
    </span>
  );
}

/* ── 1. MRR, met wat er vandaag, deze week en deze maand verkocht is ──────── */

function MrrCard({ mrrEur, subscribers, target, scenarioLabel, periods, goals, period, onPeriod }: {
  mrrEur: number; subscribers: number; target: number; scenarioLabel: string;
  periods: Record<PeriodKey, PeriodData>; goals: Record<PeriodKey, PeriodGoal>;
  period: PeriodKey; onPeriod: (p: PeriodKey) => void;
}) {
  return (
    <CardShell title="MRR" note={`${subscribers} lopende ${subscribers === 1 ? 'abonnee' : 'abonnees'} · doel ${scenarioLabel.toLowerCase()}`}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="text-4xl font-headline font-bold tracking-tight text-on-surface tabular-nums">{eur(mrrEur)}</p>
        <p className="text-sm text-on-surface-variant tabular-nums">van {eur(target)} · {pct(target > 0 ? mrrEur / target : 0)}</p>
      </div>
      <Bar value={fill(mrrEur, target)} className="mt-4 h-3" />

      <div className="mt-6 grid grid-cols-3 gap-2">
        {PERIODS.map(p => {
          const a = periods[p.key];
          const g = goals[p.key];
          const selected = p.key === period;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => onPeriod(p.key)}
              aria-pressed={selected}
              className={`min-w-0 rounded-xl px-3 py-3 text-left transition-transform duration-150 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:shadow-[var(--ring-selected)] motion-reduce:transition-none ${
                selected ? 'bg-surface-container-low shadow-[var(--ring-selected)]' : 'bg-surface-container-low/50 hover:bg-surface-container-low'
              }`}
            >
              <span className="block text-xs font-medium text-on-surface-variant">{p.label}</span>
              <span className="mt-1 block truncate text-lg font-headline font-bold text-on-surface tabular-nums">{eur(a.revenueEur)}</span>
              <span className="block truncate text-[11px] text-on-surface-variant tabular-nums">van {eur(g.revenueEur)}</span>
              <Bar value={fill(a.revenueEur, g.revenueEur)} className="mt-2 h-1.5" />
              <span className="mt-2 block text-[11px] text-on-surface-variant tabular-nums">
                <span className="font-semibold text-on-surface">{a.sales}</span> van {num(g.funnel.paid)} verkopen
              </span>
            </button>
          );
        })}
      </div>
    </CardShell>
  );
}

/* ── 2. Funnel, met de stap waar het vastzit ─────────────────────────────── */

function verdict(focus: Focus | null, data: PeriodData, goal: PeriodGoal): string {
  if (!focus) {
    return data.funnel.visitors === null
      ? 'Zonder GA4 is niet te zeggen of het aan verkeer of aan conversie ligt.'
      : 'Elke gemeten stap ligt op schema voor deze periode.';
  }
  if (focus.kind === 'traffic') {
    return `Verkeer: ${num(data.funnel.visitors ?? 0)} bezoekers, ${num(goal.funnel.visitors)} nodig. Eerst meer bezoekers.`;
  }
  const i = FUNNEL_STEPS.findIndex(s => s.key === focus.step);
  const rate = conversion(data.funnel, focus.step) ?? 0;
  return `Conversie: ${FUNNEL_STEPS[i - 1].label.toLowerCase()} → ${FUNNEL_STEPS[i].label.toLowerCase()} haalt ${pct(rate)}, streef ${pct(targetRate(focus.step)!)}.`;
}

function FunnelCard({ data, goal, focus, periodLabel, ga4Error }: {
  data: PeriodData; goal: PeriodGoal; focus: Focus | null; periodLabel: string; ga4Error: string | null;
}) {
  return (
    <CardShell title="Funnel" note={`${periodLabel} · de gestippelde rand is het doel`}>
      <p className={`mb-5 rounded-xl px-3 py-2.5 text-sm ${focus ? 'bg-[#fcecdd] text-[#a24000]' : 'bg-surface-container-low text-on-surface-variant'}`}>
        {focus && <TriangleAlert className="mr-1.5 inline size-4 -translate-y-px" aria-hidden />}
        {verdict(focus, data, goal)}
      </p>

      <ol className="grid grid-cols-4 gap-2 sm:gap-3">
        {FUNNEL_STEPS.map(step => {
          const actual = data.funnel[step.key];
          const target = goal.funnel[step.key];
          const isFocus = focus?.step === step.key;
          const rate = conversion(data.funnel, step.key);
          return (
            <li key={step.key} className="min-w-0 text-center">
              <p className="text-base font-headline font-bold text-on-surface tabular-nums sm:text-lg">
                {actual === null ? <span className="text-on-surface-variant/60">—</span> : num(actual)}
              </p>
              <div
                className={`relative mt-1.5 h-32 overflow-hidden rounded-lg border-[1.5px] border-dashed ${
                  isFocus ? 'border-[#a24000]/50 bg-[rgba(254,118,44,0.06)]' : 'border-on-surface-variant/25 bg-surface-container-low/50'
                }`}
              >
                <div
                  className={`absolute inset-x-0 bottom-0 h-full origin-bottom ${EASE}`}
                  style={{
                    transform: `scaleY(${actual === null ? 0 : fill(actual, target)})`,
                    background: isFocus ? '#fe762c' : 'var(--color-primary)',
                  }}
                />
              </div>
              <p className="mt-2 text-[11px] leading-tight font-semibold text-balance text-on-surface sm:text-xs">{step.label}</p>
              <p className="truncate text-[11px] text-on-surface-variant tabular-nums">doel {num(target)}</p>
              {step.key === 'visitors' ? (
                <span className="mt-2 inline-block rounded-full bg-surface-container px-2 py-0.5 text-[11px] text-on-surface-variant">start</span>
              ) : (
                <span
                  title={`Conversie vanaf ${FUNNEL_STEPS[FUNNEL_STEPS.findIndex(s => s.key === step.key) - 1].label.toLowerCase()} · streef ${pct(targetRate(step.key)!)}`}
                  className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
                    isFocus ? 'bg-[#fcecdd] text-[#a24000]' : 'bg-[rgba(0,43,109,0.08)] text-primary'
                  }`}
                >
                  {rate === null ? '—' : pct(rate)}
                </span>
              )}
              {isFocus && <div className="mt-1.5"><FocusChip /></div>}
            </li>
          );
        })}
      </ol>

      {ga4Error && (
        <p className="mt-4 text-xs text-on-surface-variant">
          GA4 gaf geen cijfers ({ga4Error}). Bezoekers en start oefenen staan op onbekend, niet op nul.
        </p>
      )}
    </CardShell>
  );
}

/* ── 3. Doel per product ─────────────────────────────────────────────────── */

function ProductCard({ data, goal, periodLabel }: { data: PeriodData; goal: PeriodGoal; periodLabel: string }) {
  return (
    <CardShell
      title="Doel per product"
      note={`${periodLabel} · nieuwe klanten per spoor · ${data.sales} van ${num(goal.funnel.paid)} nodig`}
      className="mt-5"
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
        <ul className="space-y-5">
          {TRACKS.map(t => {
            const actual = data.byTrack[t.key];
            const target = goal.byTrack[t.key];
            return (
              <li key={t.key} className="grid grid-cols-[32px_1fr] items-center gap-x-3">
                <ExamMark track={t.key} size={32} />
                <div className="min-w-0">
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <p className="text-sm font-semibold text-on-surface">{t.label}</p>
                    <p className="text-sm text-on-surface-variant tabular-nums">
                      {actual >= target && target > 0 && <Check className="mr-1 inline size-3.5 -translate-y-px text-secondary" aria-label="doel gehaald" />}
                      <span className="font-semibold text-on-surface">{actual}</span> van {num(target)}
                    </p>
                  </div>
                  <Bar value={fill(actual, target)} color={TRACK_COLOR[t.key]} className="h-2.5" />
                </div>
              </li>
            );
          })}
        </ul>

        <div className="rounded-xl bg-surface-container-low p-4">
          <h3 className="text-sm font-semibold text-on-surface">Meest verkocht</h3>
          <p className="text-[11px] text-on-surface-variant">{periodLabel} · nieuw en verlengd</p>
          {data.products.length === 0 ? (
            <p className="mt-4 text-sm text-on-surface-variant">
              Nog geen verkopen in deze periode. Zodra iemand betaalt, staat hier wat het best loopt.
            </p>
          ) : (
            <ol className="mt-3 space-y-2">
              {data.products.slice(0, 5).map((p, i) => (
                <li key={p.label} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-on-surface">
                    <span className="mr-2 text-on-surface-variant tabular-nums">{i + 1}</span>{p.label}
                  </span>
                  <span className="font-semibold text-on-surface tabular-nums">{p.count}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </CardShell>
  );
}

/* ── 4–7. Elke funnelstap tegen zijn doel ─────────────────────────────────── */

function StepCard({ stepKey, data, goal, focused }: { stepKey: FunnelStepKey; data: PeriodData; goal: PeriodGoal; focused: boolean }) {
  const step = FUNNEL_STEPS.find(s => s.key === stepKey)!;
  const actual = data.funnel[stepKey];
  const target = goal.funnel[stepKey];
  const rate = conversion(data.funnel, stepKey);
  const streef = targetRate(stepKey);

  return (
    <section
      className={`min-w-0 rounded-2xl p-5 ${
        focused ? 'bg-[#fff6ee] shadow-[var(--shadow-ambient),inset_0_0_0_2px_rgba(254,118,44,0.45)]' : 'bg-surface-container-lowest shadow-[var(--shadow-ambient)]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-headline font-bold text-on-surface">{step.label}</h2>
          <p className="truncate text-[11px] text-on-surface-variant">{step.source}</p>
        </div>
        {focused && <FocusChip />}
      </div>

      <p className="mt-4 text-3xl font-headline font-bold tracking-tight text-on-surface tabular-nums">
        {actual === null ? <span className="text-on-surface-variant/60">—</span> : num(actual)}
      </p>
      <p className="text-xs text-on-surface-variant tabular-nums">doel {num(target)}</p>
      <Bar value={actual === null ? 0 : fill(actual, target)} color={focused ? '#fe762c' : undefined} className="mt-3 h-2" />

      <p className="mt-3 text-xs text-on-surface-variant tabular-nums">
        {actual === null
          ? 'Onbekend: GA4 niet gekoppeld'
          : streef === null
            ? `${pct(actual / target)} van het doel`
            : rate === null
              ? `Conversie nog niet te meten · streef ${pct(streef)}`
              : <><span className={`font-semibold ${focused ? 'text-[#a24000]' : 'text-on-surface'}`}>{pct(rate)}</span> van vorige stap · streef {pct(streef)}</>}
      </p>
    </section>
  );
}
