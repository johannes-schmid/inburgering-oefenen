/**
 * De omslag van een gids als brochure (glas.html "Gids als PDF-brochure").
 *
 * Eén component voor twee maten: als A4 op pagina 1 van de PDF (`size="a4"`) en als miniatuur op
 * de gidskaart in `/gidsen` (`size="card"`). Alles binnenin is in `em` gezet en de basisgrootte
 * is een twintigste van de breedte, dus de omslag schaalt als één plaat — er is geen tweede
 * layout voor de kaart, en wat de lezer op de kaart ziet is de omslag die hij downloadt.
 *
 * Het veld is CSS, geen foto en geen tekening (DESIGN_SYSTEM §7.3). Per gids verschilt alleen de
 * plek van de gloed, afgeleid van de slug: een rooster van zes kaarten met zes gelijke omslagen
 * leest als één afbeelding die zes keer laadt. De **oranje** gloed is voor de pijlergidsen; de
 * andere krijgen perzik — in een rooster is het rooster de compositie, en zes oranje gloeden
 * naast elkaar is precies wat "één gloed per view" verbiedt.
 */
import LogoMark from '@/components/site/LogoMark';
import { cn } from '@/lib/utils';

export type BrochureCoverData = {
  title: string;
  subtitle: string;
  kind: string;
  reviewer: string;
  role: string;
  version: string;
  section: 'inburgering' | 'knm' | 'taalexamens';
  pillar: boolean;
  slug: string;
};

function variant(slug: string): number {
  let h = 0;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % 4;
}

export default function BrochureCover({
  cover,
  size,
  className,
}: {
  cover: BrochureCoverData;
  size: 'a4' | 'card';
  className?: string;
}) {
  const Title = size === 'a4' ? 'h1' : 'span';
  return (
    <div
      className={cn('bc', `bc-${size}`, `bc-s-${cover.section}`, `bc-v-${variant(cover.slug)}`, cover.pillar && 'bc-pillar', className)}
      aria-hidden={size === 'card' ? true : undefined}
    >
      <div className="bc-field">
        <span className="bc-brand">
          <LogoMark size={24} />
          Inburgering Oefenen
        </span>
        <div className="bc-main">
          <span className="bc-kind">{cover.kind}</span>
          <Title className="bc-title">{cover.title}</Title>
          <p className="bc-sub">{cover.subtitle}</p>
          {/* Zonder `reviewer` geen foto: het tekstboekje van een examen noemt geen persoon. */}
          {cover.reviewer && (
            <span className="bc-by">
              <img src="/images/amber-van-der-zalm-264.webp" alt="" width={66} height={66} />
              <span>
                <b>{cover.reviewer}</b>
                {cover.role}
              </span>
            </span>
          )}
        </div>
      </div>
      <div className="bc-foot">
        <span>{cover.version}</span>
        <span dir="ltr">inburgeringoefenen.nl</span>
      </div>
    </div>
  );
}
