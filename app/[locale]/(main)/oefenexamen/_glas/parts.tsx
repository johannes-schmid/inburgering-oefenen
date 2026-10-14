import type { ReactNode } from 'react';
import { ArrowRight, ChevronRight, Clock, ListChecks } from 'lucide-react';
import Field from '@/components/glas/Field';
import PageField from '@/components/glas/PageField';
import { glasButton } from '@/components/glas/Button';
import CategoryMark, { type Category } from '@/components/horizon/CategoryMark';

/**
 * De Glas-bouwstenen van de drie publieke overzichten onder `/oefenexamen` — het niveau, het
 * onderdeel en KNM. Alleen deze drie pagina's gebruiken ze; de klassen staan in
 * `app/glas-public-oefenexamen.css` (`g-ox-*`).
 */

/** Het kruimelpad. Gewone `<a>` met `localeHref`, omdat de tussenstappen dynamische routes zijn. */
export function OxCrumbs({ items, label }: { items: { label: string; href?: string }[]; label: string }) {
  return (
    <nav aria-label={label}>
      <ol className="g-crumb">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i}>
              {i > 0 && <ChevronRight aria-hidden="true" className="rtl-flip" />}
              {item.href && !last ? <a href={item.href}>{item.label}</a> : <span aria-current={last ? 'page' : undefined}>{item.label}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * De kop: een Gracht-veld met sluier dat onder de zwevende pil door loopt. Links de tekst, de
 * merken erboven, de feiten als metachips op glas en één vertrouwensregel (de docent) — die
 * regel staat één keer op de pagina.
 */
export function OxHeader({
  crumbs, marks, title, lead, note, facts, trust,
}: {
  crumbs: ReactNode;
  marks: ReactNode;
  title: string;
  lead: string;
  note?: string;
  facts?: { minutes?: number | null; items?: number | null; itemsLabel: string; minutesLabel: string; exams?: string };
  trust: string;
}) {
  return (
    <PageField variant="gracht" className="g-ox-head">
      {crumbs}
      <div className="g-ox-marks">{marks}</div>
      <h1 className="g-head g-head-1 g-ox-title">{title}</h1>
      <p className="g-lead mt-4">{lead}</p>
      {note && <p className="g-ox-note">{note}</p>}
      {/* Een ongeteld formaat (NULL) staat er niet als 0: dan valt de chip weg. */}
      {facts && (
        <ul className="g-metachips list-none p-0 m-0 mt-6">
          {facts.exams && <li className="g-metachip g-glass">{facts.exams}</li>}
          {facts.items != null && (
            <li className="g-metachip g-glass"><ListChecks aria-hidden="true" /><span><span className="g-tnum">{facts.items}</span> {facts.itemsLabel}</span></li>
          )}
          {facts.minutes != null && (
            <li className="g-metachip g-glass"><Clock aria-hidden="true" /><span><span className="g-tnum">{facts.minutes}</span> {facts.minutesLabel}</span></li>
          )}
        </ul>
      )}
      <span className="g-seal g-glass g-glass-strong mt-6">
        <img src="/images/amber-van-der-zalm-264.webp" alt="" width={30} height={30} />
        <b>{trust}</b>
      </span>
    </PageField>
  );
}

/** De band onder het rooster: Nacht stil met de ene oranje knop van de pagina (naar /premium). */
export function OxUnlockBand({ title, body, cta, href }: { title: string; body: string; cta: string; href: string }) {
  return (
    <Field variant="nacht-stil" className="g-block g-ox-band">
      <div>
        <h2 className="g-head g-head-3 !text-white">{title}</h2>
        <p className="g-body mt-2">{body}</p>
      </div>
      <a href={href} className={glasButton({ variant: 'oranje', size: 'lg' })}>
        {cta}
        <ArrowRight className="rtl-flip" aria-hidden="true" />
      </a>
    </Field>
  );
}

/** Een kleine verwijskaart naar een ander onderdeel of thema. */
export function OxLink({ href, category, title, sub }: { href: string; category: Category; title: string; sub?: string }) {
  return (
    <a href={href} className="g-ox-link">
      <CategoryMark category={category} size={44} />
      <span className="min-w-0 flex-1">
        <b>{title}</b>
        {sub && <small>{sub}</small>}
      </span>
      <ArrowRight aria-hidden="true" className="g-ox-link-go rtl-flip" />
    </a>
  );
}

/** Tekstlink met pijl (Glas `g-tlink`). */
export function OxTextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className="g-tlink">
      {children}
      <ArrowRight className="rtl-flip" aria-hidden="true" />
    </a>
  );
}
