import { ArrowRight } from 'lucide-react';

export type ModuleMeter = { done: number; total: number; label: string };

/**
 * Eén module op het portaaloverzicht: A2, B1, KNM of ONA.
 *
 * Herbouwd naar de mockup van de eigenaar (01-09). De kaart droeg een skyline-topper met het
 * merkteken erover — vier daarvan naast elkaar was meer graphic dan tekst, en de vraag die deze
 * kaart moet beantwoorden ("waar sta ik en wat zit erin?") stond eronder. Nu staat dat antwoord
 * bovenaan: wat er in je pakket zit als chips, dan de naam met het percentage, dan de twee meters.
 *
 * De graphic taal is niet ingeruild voor een eigen doosje maar teruggebracht tot wat ze hier
 * zegt: geen rand (§2 — wit op een tonale pagina plus de ambient schaduw van §4), de klei-oranje
 * meter voor voortgang, en géén tweede statuskleur. `SkylineTopper` staat nog op elke andere
 * portaalkop, dus het portaal leest nog steeds als hetzelfde product.
 *
 * Drie toestanden, en ze moeten verschillen — dezelfde discipline als de drie niet-openbare
 * examenslots: **van jou** (link, chips in de merkkleur), **te koop** (link naar het aanbod, chips
 * doffer, prijs in de chip) en **nog niet gebouwd** (`soon`: gestippelde rand, geen link, geen
 * prijs). Nooit een slot bij iets dat niet bestaat — dat belooft dat betalen het opent.
 */
export default function ModuleCard({
  mark,
  title,
  sub,
  href,
  pct,
  chipsLabel,
  chips,
  learnLabel,
  practiceLabel,
  learn,
  practice,
  cta,
  badge,
  owned = true,
  soon = false,
  soonBody,
}: {
  /**
   * `ExamMark` (een track) of `CategoryMark` (een onderdeel), op ware grootte doorgegeven.
   *
   * Het merkteken is de icoonlaag van het systeem en geen lucide-glyph: het benoemt *iets dat het
   * product verkoopt* — een niveau, een onderdeel — en dat is precies waar `components/horizon/`
   * voor is. Een chevron of een boekje hier zou de twee iconensets door elkaar halen.
   */
  mark: React.ReactNode;
  title: string;
  sub: string;
  href: string | null;
  /** De voortgang van de module in één getal: de oefenexamens. `null` bij een module die er niet is. */
  pct: number | null;
  /** "In je pakket" of "Niet in je pakket" — het label boven de chips. */
  chipsLabel: string;
  chips: string[];
  learnLabel: string;
  practiceLabel: string;
  learn: ModuleMeter;
  practice: ModuleMeter;
  cta?: string;
  badge?: string;
  /** Zit deze module in het pakket? Bepaalt of de chips de merkkleur dragen of doffer staan. */
  owned?: boolean;
  soon?: boolean;
  /** Wat er in plaats van de meters staat bij een module die nog niet bestaat. */
  soonBody?: string;
}) {
  const body = (
    <>
      <div className="mod-chiprow">
        <span className="mod-chiplab">{chipsLabel}</span>
        {chips.map(c => (
          <span key={c} className="mod-chip">{c}</span>
        ))}
        {/* Bij een module die er nog niet is hoort het merk "binnenkort" bij de naam, niet bij de
            chips: er is geen voortgang om rechts van de titel te zetten, en onderaan de chiprij
            valt hij op een tweede regel. Een prijs hoort wél bij de chips — die zeggen samen
            "dit zit er niet in, en dit kost het". */}
        {badge && !soon && <span className="mod-badge">{badge}</span>}
      </div>

      <div className="mod-title">
        <span className="mod-mark" aria-hidden>{mark}</span>
        <h3>
          {title}
          <span className="mod-sub"> · {sub}</span>
        </h3>
        {pct !== null && <span className="mod-pct">{pct}%</span>}
        {badge && soon && <span className="mod-badge">{badge}</span>}
      </div>

      {soon
        ? <p className="mod-soon">{soonBody}</p>
        : (
          <div className="mod-meters">
            <Meter label={learnLabel} value={learn.label} pct={meterPct(learn)} />
            <Meter label={practiceLabel} value={practice.label} pct={meterPct(practice)} accent />
          </div>
        )}

      {cta && (
        <span className="mod-cta" aria-hidden>
          {cta}<ArrowRight size={14} strokeWidth={2.6} className="rtl-flip" />
        </span>
      )}
    </>
  );

  const cls = `mod-card${soon ? ' soon' : ''}${owned ? '' : ' unowned'} no-underline`;
  return href ? <a href={href} className={cls}>{body}</a> : <div className={cls}>{body}</div>;
}

function meterPct(m: { done: number; total: number }): number {
  return m.total > 0 ? Math.round((m.done / m.total) * 100) : 0;
}

function Meter({ label, value, pct, accent = false }: { label: string; value: string; pct: number; accent?: boolean }) {
  return (
    <div className="mod-meter">
      <div className="mod-meter-row">
        <span className="mod-meter-lab">{label}</span>
        <span className="mod-meter-val">{value}</span>
      </div>
      {/* Geen `HorizonBand`: die is de sluitrand van een compositie en vult altijd de volle
          breedte. Twee ervan op één kaart zouden als twee kaartranden lezen. */}
      <span className="mod-bar" aria-hidden>
        <i style={{ width: `${pct}%`, background: accent ? 'var(--color-secondary-container)' : 'var(--color-primary-container)' }} />
      </span>
    </div>
  );
}
