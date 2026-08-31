import { ArrowRight } from 'lucide-react';
import { SkylineTopper, type TopperTint } from '@/components/horizon';

/**
 * Eén module op het portaaloverzicht: A2, B1, KNM of ONA.
 *
 * De vorm is de **modulekaart van het ontwerpsysteem** (§7.2) en niet een eigen doosje: skyline-
 * topper, het merkteken dat over de straatlijn heen valt, dan de tekst en de twee meters. Dat is
 * dezelfde kaart als `SkillCard` op de homepage — wie inlogt komt niet in een ander product
 * terecht. Elke kaart heeft een eigen `tint` en `seed`, dus vier kaarten zijn vier straten in één
 * stad; variatie komt uit tint en geometrie, **nooit uit een nieuwe kleur** (§7.3).
 *
 * Drie toestanden, en ze moeten verschillen — dezelfde discipline als de drie niet-openbare
 * examenslots: **van jou** (link, volle topper), **te koop** (link naar het aanbod, dezelfde
 * topper, prijs in de chip) en **nog niet gebouwd** (`locked`: de topper valt terug op de neutrale
 * ramp, geen link, "binnenkort"). Nooit een slot bij iets dat niet bestaat — dat belooft dat
 * betalen het opent. En nooit `opacity`: zichtbare scope is de belofte van het platform (§7.2b).
 */
export default function ModuleCard({
  mark,
  title,
  sub,
  href,
  badge,
  learn,
  practice,
  learnLabel,
  practiceLabel,
  cta,
  soon = false,
  soonBody,
  index = 0,
}: {
  /** `LevelMark` of `CategoryMark` — het merkteken, op ware grootte doorgegeven. */
  mark: React.ReactNode;
  title: string;
  sub: string;
  href: string | null;
  badge?: string;
  learn: { done: number; total: number; label: string };
  practice: { done: number; total: number; label: string };
  learnLabel: string;
  practiceLabel: string;
  cta?: string;
  soon?: boolean;
  /** Wat er in plaats van de meters staat bij een module die nog niet bestaat. */
  soonBody?: string;
  index?: number;
}) {
  const tint = (['gradient', 'reverse', 'primary', 'container'] as const)[index % 4] as TopperTint;
  const body = (
    <>
      <SkylineTopper height={64} houses={6} seed={index * 3} tint={tint} locked={soon} band={false}>
        {badge && (
          <span
            className="absolute end-4 top-4 rounded-full px-2.5 py-1 text-[0.66rem] font-bold uppercase"
            style={{
              letterSpacing: '0.1em',
              background: soon ? 'var(--color-surface-container-high)' : 'rgba(248,249,251,0.18)',
              backdropFilter: soon ? undefined : 'blur(20px)',
              color: soon ? 'var(--color-on-surface-variant)' : '#fff',
            }}
          >
            {badge}
          </span>
        )}
      </SkylineTopper>

      {/* Het merkteken valt over de straatlijn heen — dat is wat de topper aan de kaart vastmaakt
          in plaats van er een strip bovenop te leggen. Zie `SkillCard`. */}
      <div className="px-5 -mt-6 relative">{mark}</div>

      <div className="flex flex-1 flex-col gap-3 p-5 pt-3">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h3
              className="font-headline font-extrabold text-on-surface"
              style={{ fontSize: '1.075rem', letterSpacing: '-0.015em' }}
            >
              {title}
            </h3>
            <p className="text-xs text-outline mt-0.5">{sub}</p>
          </div>
          {cta && (
            <span className="mod-cta" aria-hidden>
              {cta}<ArrowRight size={14} strokeWidth={2.6} className="rtl-flip" />
            </span>
          )}
        </div>

        {/* Twee lege meters onder een module die niet bestaat zeggen twee keer niets. Eén zin
            zegt wat er aan de hand is — en belooft niets dat betalen zou openen. */}
        {soon
          ? (
            <p className="mt-auto text-[0.82rem] text-on-surface-variant" style={{ lineHeight: 1.6 }}>
              {soonBody}
            </p>
          )
          : (
            <div className="mt-auto flex flex-col gap-2.5">
              <Meter label={learnLabel} value={learn.label} pct={pct(learn)} />
              <Meter label={practiceLabel} value={practice.label} pct={pct(practice)} accent />
            </div>
          )}
      </div>
    </>
  );

  const cls = 'mod-card no-underline flex flex-col overflow-hidden';
  return href ? <a href={href} className={cls}>{body}</a> : <div className={cls}>{body}</div>;
}

function pct(m: { done: number; total: number }): number {
  return m.total > 0 ? Math.round((m.done / m.total) * 100) : 0;
}

function Meter({ label, value, pct, accent = false }: { label: string; value: string; pct: number; accent?: boolean }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[0.72rem] font-bold text-on-surface-variant">{label}</span>
        <span className="text-[0.72rem] font-bold text-on-surface" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {value}
        </span>
      </div>
      {/* Geen `HorizonBand`: die is de sluitrand van een compositie en vult altijd de volle
          breedte. Twee ervan op één kaart zouden als twee kaartranden lezen. */}
      <span className="mod-bar" aria-hidden>
        <i style={{ width: `${pct}%`, background: accent ? 'var(--color-secondary-container)' : 'var(--color-primary-container)' }} />
      </span>
    </div>
  );
}
