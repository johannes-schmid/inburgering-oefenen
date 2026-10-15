import { ArrowRight } from 'lucide-react';
import Field, { type FieldVariant } from '@/components/glas/Field';
import ExamMark, { type Track } from '@/components/horizon/ExamMark';

/**
 * De track-kaart (glas.html §08 "Track-kaart"): een kop op een veld met het grote track-merk, de
 * badge en één mono-regel; daaronder titel, uitleg en een voet met pijl.
 *
 * `chips` staan ín die mono-regel, als links (naar de onderdeelpagina's — de homepage moet alle
 * vier de taalonderdelen linken, CLAUDE.md §3); zonder chips toont de regel `meta`. **De kaart is
 * geen anker**, want een link in een link is ongeldige HTML: de voet is de link van de kaart, zijn
 * `::after` spant de hele kaart en de onderdeellinks liggen erboven.
 *
 * `variant` van de kop: alleen `gracht`, `nevel` of `dageraad` (glas.html: "op de kaartkop alleen
 * Gracht, Nevel of Dageraad"). Beschikbaarheid staat in de tekst (`note`, `badge`), nooit in de kleur.
 */
export default function TrackCard({
  track,
  title,
  desc,
  meta,
  badge,
  chips,
  note,
  ctaLabel,
  href,
  variant = 'gracht',
  muted,
  headingLevel: H = 'h3',
}: {
  track: Track;
  title: string;
  desc?: string;
  meta?: string;
  badge?: string;
  chips?: { key: string | number; name: string; href: string }[];
  note?: string;
  ctaLabel: string;
  href: string;
  variant?: FieldVariant;
  muted?: boolean;
  headingLevel?: 'h2' | 'h3';
}) {
  return (
    <div className="g-track">
      <Field variant={variant} className="g-track-hd">
        <div className="g-track-top">
          <ExamMark track={track} size={72} muted={muted} />
          {badge && <span className="g-bdg g-bdg-glas g-bdg-mono">{badge}</span>}
        </div>
        {chips && chips.length > 0 ? (
          <ul className="g-track-meta g-track-links">
            {chips.map(chip => (
              <li key={chip.key}>
                <a href={chip.href}>{chip.name}</a>
              </li>
            ))}
          </ul>
        ) : (
          meta && <span className="g-track-meta">{meta}</span>
        )}
      </Field>
      <div className="g-track-bd">
        <H>{title}</H>
        {desc && <p>{desc}</p>}
        {note && <p className="g-track-note">{note}</p>}
        <a href={href} className="g-track-ft">
          {ctaLabel}
          <span className="g-track-go" aria-hidden="true"><ArrowRight className="rtl-flip" /></span>
        </a>
      </div>
    </div>
  );
}
