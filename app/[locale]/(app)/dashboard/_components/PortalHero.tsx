import { ArrowLeft } from 'lucide-react';
import { HorizonBanner } from '@/components/horizon';
import ReadinessRing from './ReadinessRing';

export type HeroTile = { label: string; value: string; sub?: string };

/**
 * De kop van elk portaalscherm — en de reden dat het portaal er nu bij hoort.
 *
 * Het portaal was vier witte kaarten op een grijze pagina: geen enkel element uit
 * `components/horizon/`, terwijl de publieke site niets anders doet. Dat is precies wat
 * CLAUDE.md's harde regel verbiedt ("bouw elke nieuwe pagina uit de officiële elementen"), en het
 * gevolg was dat het ingelogde deel van het product als een ander product las dan de pagina waar
 * de bezoeker vandaan kwam.
 *
 * Eén component voor alle vier de schermen, want het verschil tussen die schermen is de *inhoud*
 * van de kop en niet zijn vorm: kicker, titel, lede, een rij feiten en — waar het van toepassing
 * is — de examenklaar-ring. Vier keer dezelfde vier lagen met de hand samenstellen is precies hoe
 * dit repo eerder aan zes verschillende paginakoppen kwam.
 *
 * De skyline is laag (56px) en de zon staat uit: de rechterflank draagt de tegels, en §7.3
 * verbiedt een graphic achter de tekst. De oranje band sluit de kop af — dat is de rand die de
 * mockup van de eigenaar ook trekt.
 */
export default function PortalHero({
  back,
  kicker,
  title,
  lede,
  tiles = [],
  ring,
  seed = 0,
}: {
  /** De weg terug, ín de kop. Buiten de kop staat hij los boven de eerste kaart en leest hij
      als een zwevend stukje tekst dat bij niets hoort. */
  back?: { href: string; label: string };
  kicker: string;
  title: string;
  lede?: string;
  tiles?: HeroTile[];
  /** De examenklaar-ring. `pct: null` rendert een streepje — zie `ReadinessRing`. */
  ring?: { pct: number | null; label: string; note: string; aria: string };
  seed?: number;
}) {
  return (
    <header className="portal-hero">
      <HorizonBanner
        desktopHouses={16}
        mobileHouses={7}
        desktopHeight={56}
        mobileHeight={40}
        seed={seed}
        sun={false}
      />

      <div className="ph-body">
        <div className="ph-copy">
          {back && (
            <a href={back.href} className="ph-back">
              <ArrowLeft size={13} strokeWidth={2.4} className="rtl-flip" aria-hidden />
              {back.label}
            </a>
          )}
          <p className="ph-kicker">{kicker}</p>
          <h1 className="ph-title">{title}</h1>
          {lede && <p className="ph-lede">{lede}</p>}
        </div>

        {(ring || tiles.length > 0) && (
          <div className="ph-side">
            {ring && (
              <div className="ph-ring">
                <ReadinessRing pct={ring.pct} size={78} onDark label={ring.aria} />
                <div className="min-w-0">
                  <p className="ph-ring-label">{ring.label}</p>
                  <p className="ph-ring-note">{ring.note}</p>
                </div>
              </div>
            )}
            {tiles.length > 0 && (
              <dl className="ph-tiles">
                {tiles.map(tile => (
                  <div key={tile.label}>
                    <dt>{tile.label}</dt>
                    <dd>{tile.value}</dd>
                    {tile.sub && <p>{tile.sub}</p>}
                  </div>
                ))}
              </dl>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
