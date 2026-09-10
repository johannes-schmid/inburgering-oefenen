import { ArrowRight, Check, Lock } from 'lucide-react';
import type { ExamCardView } from './exam-slots';

/**
 * Eén oefenexamen als kaartje: navy kop met de score of het nummer, lichte voet met de naam,
 * wat het examen inhoudt, en één knop.
 *
 * **De vier redenen dat een kaartje niet gestart kan worden blijven van elkaar te onderscheiden**
 * (§4): niet gepubliceerd is doffer en zegt "binnenkort", buiten je pakket draagt een slot,
 * gehaald draagt een vinkje, en gedaan-maar-niet-gehaald draagt zijn score. Eén grijze staat voor
 * alle vier zou de kandidaat niets vertellen. Een gehaald of gedaan examen blijft klikbaar — je
 * mag het herhalen.
 *
 * **Eén oranje knop per scherm**: het eerstvolgende examen dat je nu kunt doen (§8, één
 * zonneschijf per compositie). De andere kaartjes dragen hun status als tonale chip, geen knop.
 *
 * Geen groen en geen slaagnorm. Gehaald is navy, nog niet gehaald is de kleibalk, en het vinkje
 * draagt de betekenis voor wie de twee niet kan scheiden (§8). DUO publiceert geen zak-slaaggrens
 * en die van ons is per examen een kolom in de database — geen getal om hier als norm te zetten (§9).
 */
export default function ExamCard({
  card, factLine, startLabel,
}: {
  card: ExamCardView;
  factLine: string;
  /** "Oefenexamen starten" — alleen het eerstvolgende kaartje draagt het. */
  startLabel: string;
}) {
  const Tile = card.href ? 'a' : 'div';

  return (
    <Tile
      {...(card.href ? { href: card.href } : {})}
      className={`es-card is-${card.state} no-underline`}
    >
      <span className="es-cap">
        <b>
          {card.state === 'passed' && <Check size={13} strokeWidth={3.2} aria-hidden />}
          {card.state === 'locked' && <Lock size={12} strokeWidth={2.4} aria-hidden />}
          {card.cap}
        </b>
        <i>{card.capNote}</i>
      </span>

      <span className="es-body">
        <span className="es-nm">{card.title}</span>
        <span className="es-fact">{factLine}</span>
        <span className={`es-act${card.isNext ? ' is-now' : ''}`}>
          {card.isNext ? startLabel : card.capNote}
          {card.isNext && <ArrowRight size={13} strokeWidth={2.6} className="rtl-flip" aria-hidden />}
        </span>
      </span>
    </Tile>
  );
}
