import { cn } from '@/lib/utils';

/**
 * Een rij overlappende avatars bij een cursistenaantal.
 *
 * **Dit zijn geen mensen en het mogen er ook nooit worden.** Er is geen enkele foto van een echte
 * cursist, en een gegenereerd gezicht naast "1.000+ cursisten" is de verzonnen social proof die
 * §2 van `CLAUDE.md` verbiedt — er zijn eerder drie zulke portretten van deze site af gehaald.
 * Wat hier staat is daarom opgebouwd uit de primitieven van het ontwerpsysteem: een schijf voor
 * het hoofd en een boog voor de schouders, in vier tinten uit het palet. Het leest als "veel
 * mensen" zonder iemand voor te stellen. Komen er ooit échte portretten mét toestemming, dan
 * vervangen die dit component in één keer — niet één avatar tegelijk.
 *
 * De vormen zijn dekkend: doorschijnende schijven die elkaar overlappen geven maansikkels.
 */

/** Vier tinten uit het palet: twee navy, twee perzik. Geen enkele avatar is oranje — dat blijft
 *  het accent van de pagina en er is er maar één per compositie (§8). */
const TONES: { bg: string; fg: string }[] = [
  { bg: '#002b6d', fg: '#c8d6ea' },
  { bg: '#f9c9a6', fg: '#a24000' },
  { bg: '#1b4a92', fg: '#d8e3f2' },
  { bg: '#fcecdd', fg: '#a24000' },
];

function Avatar({ tone, size, ring }: { tone: { bg: string; fg: string }; size: number; ring: string }) {
  return (
    <span
      aria-hidden="true"
      className="rounded-full shrink-0 overflow-hidden block"
      style={{ width: size, height: size, background: tone.bg, boxShadow: `0 0 0 3px ${ring}` }}
    >
      <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
        <circle cx="20" cy="15.5" r="6.5" fill={tone.fg} />
        <path d="M6.5 40c0-7.7 6-13.5 13.5-13.5S33.5 32.3 33.5 40z" fill={tone.fg} />
      </svg>
    </span>
  );
}

export default function AvatarCluster({
  count = 5,
  size = 36,
  ring = 'var(--color-surface-container-low)',
  className,
}: {
  count?: number;
  size?: number;
  ring?: string;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center', className)}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} style={{ marginLeft: i === 0 ? 0 : -size * 0.3, zIndex: count - i }} className="block">
          <Avatar tone={TONES[i % TONES.length]} size={size} ring={ring} />
        </span>
      ))}
    </span>
  );
}
