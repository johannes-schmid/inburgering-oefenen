/**
 * De examenklaar-ring.
 *
 * Een dataweergave, geen decoratie — daarom staat hij hier en niet in `components/horizon/`,
 * dat de grafische taal is (huisjes, zon, band, stippen). Hij tekent één percentage als
 * `conic-gradient`, wat geen SVG en geen library kost en met `--v` één variabele heeft.
 *
 * `null` is een echte toestand en rendert een streepje: er is over dit onderdeel nog niets te
 * zeggen. Een 0% zou zeggen dat de kandidaat op nul staat, en dat is iets anders dan dat wij
 * er niets van weten — dezelfde regel als `formatCount` en als de nulmeting in
 * `docs/BASELINE.md`.
 */
export default function ReadinessRing({
  pct,
  size = 56,
  onDark = false,
  label,
}: {
  pct: number | null;
  size?: number;
  onDark?: boolean;
  label: string;
}) {
  const track = onDark ? 'rgba(255,255,255,0.22)' : 'var(--color-surface-container-high)';
  const hole = onDark ? 'var(--color-primary)' : 'var(--color-surface-container-lowest)';
  const ink = onDark ? '#fff' : 'var(--color-on-surface)';
  const ring = pct === null ? track : 'var(--color-secondary-container)';

  return (
    <span
      role="img"
      aria-label={label}
      className="inline-grid place-items-center shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${ring} ${(pct ?? 0) * 3.6}deg, ${track} 0)`,
      }}
    >
      <span
        className="grid place-items-center rounded-full font-headline font-extrabold"
        style={{
          width: size - 14,
          height: size - 14,
          background: hole,
          color: ink,
          fontSize: size >= 72 ? '1rem' : size >= 56 ? '0.8rem' : '0.72rem',
          fontVariantNumeric: 'tabular-nums',
        }}
        aria-hidden
      >
        {/* Mét procentteken: "24" alleen leest als een positie of een aantal, en dit getal is
            een percentage. Op de kleinste maat past het en het is de enige plek waar de lezer
            kan zien wát er gemeten wordt. */}
        {pct === null ? '—' : `${pct}%`}
      </span>
    </span>
  );
}
