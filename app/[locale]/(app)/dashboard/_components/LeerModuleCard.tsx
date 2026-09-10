import { ArrowRight } from 'lucide-react';
import { CategoryMark, type Category } from '@/components/horizon';
import ReadinessRing from './ReadinessRing';

/**
 * Eén stap van de leerroute, als kaart.
 *
 * De vorm komt van de KNM-woordkaartenkaarten, die op productie al blijken te werken: een navy
 * kop met de mark als groot watermerk, de stapchip erin, en daaronder het witte deel met de
 * feiten en de ring. De mark staat `bare` op de kop en niet op een tegel — een tegel binnen een
 * kop is een tweede rechthoek in dezelfde rechthoek.
 *
 * **De ring is `ReadinessRing`, niet een tweede ringcomponent.** Hij tekent al één percentage
 * met een streepje voor `null`, en dat is precies de toestand die een stap zonder content heeft.
 *
 * Let op de tegelregel in CLAUDE.md §7: een navy tegel is een module die je kóopt, een lichte
 * tegel is het oefenwerk erbinnen. Deze drie zitten ín één onderdeel, dus strikt genomen hoort
 * de mark hier op licht. De navy kop is een besluit van de eigenaar (02-09) omdat de kaart
 * daarmee als kaart leest; de mark zelf blijft een *category* mark, geen `ExamMark`, zodat de
 * laag waar hij bij hoort niet verschuift.
 */
export default function LeerModuleCard({
  category,
  title,
  facts,
  score,
  ringLabel,
  href,
  cta,
  masteryLabel,
  emptyNote,
}: {
  category: Category;
  title: string;
  /** Twee of drie regels "wat je hier hebt gedaan". Leeg is ook goed. */
  facts: { label: string; value: string }[];
  /** 0–100, of null als er over deze stap nog niets te zeggen valt. */
  score: number | null;
  ringLabel: string;
  /** Zonder `href` is de stap er nog niet: de kaart wordt een div en dooft. */
  href?: string;
  cta: string;
  masteryLabel: string;
  /** Wat er staat als deze stap nog geen content heeft. Alleen zichtbaar zonder `href`. */
  emptyNote?: string;
}) {
  const Root = href ? 'a' : 'div';

  return (
    <Root {...(href ? { href } : {})} className={`leer-card${href ? '' : ' is-empty'}`}>
      <span className="lc-cap">
        <span className="lc-mark" aria-hidden="true">
          {/* Op de navy kop is de ink wit; op de grijze kop van een lege stap moet hij navy
              zijn, anders is het watermerk wit op licht en dus onzichtbaar. */}
          <CategoryMark category={category} size={40} tone={href ? 'dark' : 'light'} bare />
        </span>
      </span>

      <span className="lc-body">
        <span className="lc-title">{title}</span>

        {/* Zonder `href` heeft de docent van deze stap nog geen concept vrijgegeven. Dat moet er
            stáan: een kaart met alleen een streepje leest als iets dat stuk is, en een 0% zou
            zeggen dat de kandidaat op nul staat in plaats van dat wij nog niets hebben. */}
        {!href && emptyNote && <span className="lc-soon">{emptyNote}</span>}

        {facts.length > 0 && (
          <span className="lc-facts">
            {facts.map(f => (
              <span key={f.label}>
                {f.label}
                <b>{f.value}</b>
              </span>
            ))}
          </span>
        )}

        <span className="lc-foot">
          <ReadinessRing pct={score} size={42} label={ringLabel} />
          <span className="lc-cap-label">
            {masteryLabel}
            <b>{score === null ? '—' : `${score} / 100`}</b>
          </span>
          {href && (
            <span className="lc-go">
              {cta}
              <ArrowRight size={15} strokeWidth={2.4} className="rtl-flip" />
            </span>
          )}
        </span>
      </span>
    </Root>
  );
}
