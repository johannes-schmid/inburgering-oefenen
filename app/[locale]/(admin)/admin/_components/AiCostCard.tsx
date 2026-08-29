import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RATES_CHECKED_ON, formatEur } from '@/lib/ai/costs';
import type { AiSpend } from '@/lib/admin/ai-spend';

/**
 * AI spend for the month, and what one nakijkactie costs.
 *
 * The shape is the owner's reference: one card, stacked blocks, each an uppercase label over a
 * large figure with a rule under it and a two-column foot. Three deliberate choices:
 *
 * - **The bars are solid `HorizonBand`-style rules, and only the budget bar is a real meter.** The
 *   two skill bars compare the two averages against each other (the dearer one is full), which is
 *   the only comparison that matters here; labelling them as a fraction of anything would be a
 *   number with no denominator.
 * - **No green, no new hue.** Over budget is `--color-error`; everything else is `primary` on its
 *   own 10% tint, per the design rules.
 * - **The budget is the Gateway's credit balance, not a number anyone typed.** The meter reads this
 *   month's spend against spend + credits remaining, so it answers "hoeveel van wat ik heb liggen is
 *   deze maand opgegaan". When the balance is unreadable (no key, a 403, the API down) the figure is
 *   omitted and the block says so — never rendered as 0, which would read as "budget op".
 * - **Vercel's own figure sits in the footnote, never in a block.** It excludes Scribe and counts
 *   calls rather than nakijkacties, so it is a control on our total and not a replacement for it.
 */

const SKILL_LABEL: Record<string, string> = {
  schrijven: 'Schrijven — per nakijkactie',
  spreken: 'Spreken — per nakijkactie',
};

function Block({
  label,
  value,
  fillPct,
  over,
  left,
  right,
}: {
  label: string;
  value: string;
  fillPct: number;
  over?: boolean;
  left: string;
  right: string;
}) {
  return (
    <div className="rounded-xl bg-surface-container-low px-5 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
        {label}
      </p>
      <p className="mt-1 font-headline text-3xl font-bold tracking-[-0.03em] text-on-surface">
        {value}
      </p>
      {/* The track is an inline rgba, not `bg-primary/10`: in this admin bundle the opacity
          modifier on the brand tokens is dropped and the class renders **fully opaque** navy — so
          an almost-empty meter looked completely full. Same trap as the stat tiles above. */}
      <div
        className="mt-3 h-1.5 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: 'rgba(0, 43, 109, 0.12)' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            // A meter that has been used at all must be visible: 0,03% of a 315px bar is a third of
            // a pixel, which reads as "niets besteed" rather than as "bijna niets besteed".
            width: `${fillPct > 0 ? Math.max(1.5, Math.min(100, fillPct)) : 0}%`,
            backgroundColor: over ? 'var(--color-error)' : 'var(--color-primary)',
          }}
        />
      </div>
      <div className="mt-2 flex items-baseline justify-between text-xs text-on-surface-variant">
        <span>{left}</span>
        <span className="tabular-nums">{right}</span>
      </div>
    </div>
  );
}

export function AiCostCard({ spend }: { spend: AiSpend }) {
  const {
    spentEur,
    perSkill,
    calls,
    estimatedEur,
    creditsLeftEur,
    creditsUsedEur,
    gatewaySpentEur,
    gatewayCalls,
  } = spend;

  // The meter is this month against what is available: spend + what is left on the gateway.
  const available = creditsLeftEur === null ? null : spentEur + creditsLeftEur;
  const pctUsed = available && available > 0 ? (spentEur / available) * 100 : null;
  const over = creditsLeftEur !== null && creditsLeftEur <= 0;

  // The dearer of the two averages sets the full bar; the other is drawn in proportion to it.
  const maxAvg = Math.max(...perSkill.map(s => s.avgEur), 0);

  return (
    <Card className="mb-8 md:mb-10">
      <CardHeader>
        <CardTitle className="font-headline text-lg font-bold">AI-nakijkkosten</CardTitle>
        <CardDescription>
          {spend.monthLabel} — wat het automatisch nakijken van Schrijven en Spreken deze maand
          heeft gekost, en gemiddeld per nakijkactie.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        <Block
          label={`Besteed in ${spend.monthLabel}`}
          value={formatEur(spentEur)}
          fillPct={pctUsed ?? 0}
          over={over}
          left={`${calls} providercalls`}
          right={
            creditsLeftEur === null
              ? 'credits onbekend'
              : over
                ? 'credits op'
                : `${formatEur(creditsLeftEur)} credits over`
          }
        />
        {perSkill.map(s => (
          <Block
            key={s.skill}
            label={SKILL_LABEL[s.skill] ?? s.skill}
            value={s.checks > 0 ? formatEur(s.avgEur, 4) : '—'}
            fillPct={maxAvg > 0 ? (s.avgEur / maxAvg) * 100 : 0}
            left={s.checks > 0 ? `${s.checks} nakijkacties` : 'nog niets nagekeken'}
            right={formatEur(s.totalEur)}
          />
        ))}
      </CardContent>
      <CardContent className="pt-0">
        <p className="text-xs text-on-surface-variant">
          Bedragen zijn de door de AI Gateway gefactureerde kosten waar die ze meldt, anders een
          schatting op de tarieven van {RATES_CHECKED_ON}
          {estimatedEur >= 0.01 ? ` (${formatEur(estimatedEur)} van het maandtotaal is een schatting)` : ''}.
          Omgerekend van dollars.{' '}
          {creditsUsedEur !== null && `Gateway-credits: ${formatEur(creditsUsedEur)} ooit besteed. `}
          {gatewaySpentEur === null || !gatewayCalls
            ? 'De Gateway rapporteert deze maand nog niets terug voor deze tags.'
            : `Vercel rapporteert ${formatEur(gatewaySpentEur)} over ${gatewayCalls ?? 0} gradingcalls
               deze maand — daar zit ElevenLabs Scribe niet in, en die cijfers lopen enkele minuten
               achter.`}
        </p>
      </CardContent>
    </Card>
  );
}
