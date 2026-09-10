import { ArrowRight } from 'lucide-react';

/**
 * De rechterkolom van het portaaloverzicht: hoe ver ben je, en wat komt er in het traject na dit
 * oefenen?
 *
 * Het waren drie kaarten op een rij onder de modules ("pak dit op", "klaar om te doen", "jouw
 * termijn"). Die rij herhaalde wat de modulekaarten al zeggen en zette de termijn — het enige
 * onderdeel van dit scherm met een datum eraan — als derde kaart onderaan. In de mockup staat de
 * vraag "wat nu?" naast de modules en beantwoordt hij twee dingen: een getal, en waar dat getal
 * je in het traject brengt.
 */

/**
 * Vanaf welk deel van de oefenexamens wij zeggen dat je je kunt aanmelden.
 *
 * **Dit is onze richtlijn, geen DUO-norm.** DUO publiceert geen cesuur (zie `SEO/facts.md` §9), en
 * de copy zegt daarom "onze richtlijn" en nooit "je bent geslaagd". Verander dit getal niet zonder
 * de zin die het draagt mee te veranderen.
 */
export const READY_THRESHOLD_PCT = 80;

export function ReadinessCard({
  title, pct, body,
}: { title: string; pct: number; body: string }) {
  return (
    <div className="wn-card">
      <div className="wn-top">
        <h3 className="wn-title">{title}</h3>
        <span className="wn-pct">{pct}%</span>
      </div>
      <span className="mod-bar" aria-hidden>
        <i style={{ width: `${Math.min(100, pct)}%`, background: 'var(--color-secondary-container)' }} />
      </span>
      <p className="wn-body">{body}</p>
    </div>
  );
}

export type TrajectStep = {
  title: string;
  /** Eén regel eronder: waar je bent, een datum, of de onderdelen. Nooit een geraden datum. */
  note: string;
  current?: boolean;
};

export function TrajectCard({
  title, until, steps, cta, href,
}: {
  title: string;
  /** "t/m maart 2029" — alleen als de kandidaat een tijdlijn heeft opgeslagen. */
  until: string | null;
  steps: TrajectStep[];
  cta: string;
  href: string;
}) {
  return (
    <div className="wn-card">
      <div className="wn-top">
        <h3 className="wn-title">{title}</h3>
        {until && <span className="wn-until">{until}</span>}
      </div>

      <ol className="wn-steps">
        {steps.map(s => (
          <li key={s.title} className={s.current ? 'is-now' : undefined}>
            <span className="wn-dot" aria-hidden />
            <span className="min-w-0">
              <span className="wn-step-title">{s.title}</span>
              <span className="wn-step-note">{s.note}</span>
            </span>
          </li>
        ))}
      </ol>

      <a href={href} className="wn-cta no-underline">
        {cta}<ArrowRight size={14} strokeWidth={2.6} className="rtl-flip" />
      </a>
    </div>
  );
}
