import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * Een rij overlappende avatars bij een cursistenaantal.
 *
 * **De gezichten zijn stockportretten van Pexels en géén cursisten** (besluit eigenaar, 21-09).
 * Dat is een bewuste afweging die op deze site eerder de andere kant op viel: drie verzonnen
 * testimonials mét portret zijn er ooit af gehaald, want §2 van `CLAUDE.md` verbiedt verzonnen
 * social proof. Het verschil is wat er náást staat. Een portret bij een uitspraak zegt "dit heeft
 * deze persoon gezegd" en dat is dan gelogen; een rij avatars bij een aantal zegt "hier zitten
 * mensen achter" en noemt niemand. Daarom staat hier geen enkele naam, geen enkel citaat en geen
 * `alt` die iemand tot cursist bestempelt — de rij is `aria-hidden`, want voor een schermlezer
 * telt alleen het getal ernaast.
 *
 * **Wat hier niet mag komen:** een naam onder een gezicht, een quote ernaast, of een `alt` in de
 * geest van "cursist Fatima". Dat zet de claim terug die van deze site is verwijderd. De
 * herkomst per bestand staat in `public/images/avatars/CREDITS.json`, de afspraak zelf in
 * `SEO/facts.md` §12. Komen er échte portretten mét toestemming, dan vervangen die de map in één
 * keer en kan dit blok pas bij een naam gaan horen.
 *
 * Zonder foto valt hij terug op de getekende vorm: een schijf voor het hoofd en een boog voor de
 * schouders. De vormen zijn dekkend — doorschijnende schijven die elkaar overlappen geven
 * maansikkels.
 */

/** De zes portretten in `public/images/avatars/`. Volgorde is bewust gemengd, zodat een rij van
 *  drie op mobiel niet toevallig drie keer hetzelfde type toont. */
const PHOTOS = [1, 2, 3, 4, 5, 6].map(n => `/images/avatars/cursist-${n}.webp`);

/** Vier tinten uit het palet voor de val-terug: twee navy, twee perzik. Geen enkele avatar is
 *  oranje — dat blijft het accent van de pagina en er is er maar één per compositie (§8). */
const TONES: { bg: string; fg: string }[] = [
  { bg: '#002b6d', fg: '#c8d6ea' },
  { bg: '#f9c9a6', fg: '#a24000' },
  { bg: '#1b4a92', fg: '#d8e3f2' },
  { bg: '#fcecdd', fg: '#a24000' },
];

function Avatar({ tone, size, ring }: { tone: { bg: string; fg: string }; size: number; ring: string }) {
  return (
    <span
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
  photos = true,
  className,
}: {
  count?: number;
  size?: number;
  ring?: string;
  /** Uit voor de getekende val-terug — bijvoorbeeld op een vlak waar de foto's te druk worden. */
  photos?: boolean;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center', className)} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const src = photos ? PHOTOS[i % PHOTOS.length] : null;
        return (
          <span key={i} style={{ marginLeft: i === 0 ? 0 : -size * 0.3, zIndex: count - i }} className="block">
            {src ? (
              <Image
                src={src}
                alt=""
                width={size}
                height={size}
                /* `sizes` staat er omdat de rij op elk breekpunt even groot is: zonder deze hint
                   laadt next/image de 640px-variant van een schijf van 36px. */
                sizes={`${size}px`}
                className="rounded-full shrink-0 block object-cover"
                style={{ width: size, height: size, boxShadow: `0 0 0 3px ${ring}` }}
              />
            ) : (
              <Avatar tone={TONES[i % TONES.length]} size={size} ring={ring} />
            )}
          </span>
        );
      })}
    </span>
  );
}
