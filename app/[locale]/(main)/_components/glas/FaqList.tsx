import type { ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FaqItem = { question: string; answer: ReactNode; link?: { href: string; label: string } };

/**
 * De FAQ in Glas (glas.html §08 "FAQ"): één witte kaart, vragen als `<details>`, gescheiden door
 * een witte binnenlijn in plaats van een rand. Native `<details>`: werkt zonder JavaScript, is met
 * het toetsenbord te bedienen en de antwoorden staan in de HTML (de FAQPage-JSON-LD op de pagina
 * moet dezelfde tekst dragen). Het plusje draait naar een kruisje; de inhoud springt open zonder
 * hoogte-animatie — hoogte animeren is layout, en een antwoord lezen wacht niet op een overgang.
 */
export default function FaqList({ items, className, firstOpen = false }: { items: FaqItem[]; className?: string; firstOpen?: boolean }) {
  return (
    <div className={cn('g-faq', className)}>
      {items.map((item, i) => (
        <details key={i} open={firstOpen && i === 0}>
          <summary>
            {item.question}
            <span className="g-faq-pm" aria-hidden="true"><Plus /></span>
          </summary>
          <div className="g-faq-a">
            {typeof item.answer === 'string' ? <p className="m-0">{item.answer}</p> : item.answer}
            {item.link && (
              <a href={item.link.href} className="g-ilink mt-2 inline-block">{item.link.label}</a>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}
