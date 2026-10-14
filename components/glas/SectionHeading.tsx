import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Glas-kop met een stille tweede regel (§G2, glas.html §02): de kop zegt wat het is, de tweede regel
 * waarom — Manrope, gewicht 500, `ink-3` op mist/wit en `ink-2` op een veld. Geen kicker erboven,
 * geen `<br>` in een h1: de breuk komt van `text-wrap: balance`.
 *
 * `size`: `display` (96px, één per pagina) · `section` (58px) · `h1` (48px) · `h2` (30px) · `h3` (22px).
 * `aside` zet een alinea rechts naast de kop (de `.s-head` van glas.html), onder 860px eronder.
 */
type Props = {
  title: ReactNode;
  muted?: ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4';
  size?: 'display' | 'section' | 'h1' | 'h2' | 'h3';
  /** Op een kleurveld: de tweede regel wordt `ink-2`. */
  onField?: boolean;
  /** Op Nacht/navy: kop wit, tweede regel 55% wit. */
  onDark?: boolean;
  aside?: ReactNode;
  className?: string;
  id?: string;
};

const SIZE = { display: 'g-head-display', section: 'g-head-section', h1: 'g-head-1', h2: 'g-head-2', h3: 'g-head-3' };

export default function SectionHeading({
  title,
  muted,
  as: Tag = 'h2',
  size = 'section',
  onField = false,
  onDark = false,
  aside,
  className,
  id,
}: Props) {
  const heading = (
    <Tag id={id} className={cn('g-head', SIZE[size], onDark && 'g-on-dark', onField && !aside && 'g-on-field', !aside && className)}>
      {title}
      {muted && (
        <>
          {' '}
          <span className="g-head-muted">{muted}</span>
        </>
      )}
    </Tag>
  );
  if (!aside) return heading;
  return (
    <div className={cn('g-shead', onField && 'g-on-field', onDark && 'g-on-dark', className)}>
      {heading}
      <p>{aside}</p>
    </div>
  );
}
