'use client';

/**
 * De inhoudsopgave van een gids — de `<h2 id>`'s van het artikel, met scroll-spy.
 *
 * Glas (glas.html §14 "Artikel"): op desktop plakt hij in de linkerkolom van de witte leeskaart
 * (`variant="side"`), onder 860px is het een `<details>` boven de tekst (`variant="fold"`), één
 * regel tot je hem opent. De pagina zet beide; CSS toont er één.
 *
 * De lijst komt uit `guideSections(articleHtml)` — dezelfde `<h2 id>`'s als in het artikel, dus
 * een hernoemde kop verhuist hier mee.
 */
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import type { GuideSectionEntry } from '@/lib/guides/sections';

export default function GuideToc({ sections, variant, label }: { sections: GuideSectionEntry[]; variant: 'side' | 'fold'; label?: string }) {
  const t = useTranslations('guides');
  const title = label ?? t('toc_title');
  const [active, setActive] = useState<string | null>(sections[0]?.id ?? null);

  useEffect(() => {
    const heads = sections
      .map(s => document.getElementById(s.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (heads.length === 0) return;

    /* De bovenste kop die boven 40% van het scherm staat is de actieve. */
    const update = () => {
      const line = window.innerHeight * 0.4;
      let current = heads[0].id;
      for (const h of heads) {
        if (h.getBoundingClientRect().top <= line) current = h.id;
        else break;
      }
      setActive(current);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [sections]);

  if (sections.length < 2) return null;

  const items = (
    <ol>
      {sections.map((s, i) => (
        <li key={s.id}>
          <a href={`#${s.id}`} aria-current={s.id === active ? 'location' : undefined}>
            <span className="g-tnum">{String(i + 1).padStart(2, '0')}</span>
            {s.title}
          </a>
        </li>
      ))}
    </ol>
  );

  if (variant === 'fold') {
    return (
      <details className="g-guide-tocfold no-print">
        <summary>
          {title}
          <ChevronDown aria-hidden="true" />
        </summary>
        {items}
      </details>
    );
  }
  return (
    <nav aria-label={title} className="g-guide-toc no-print">
      <span className="g-mono px-3">{title}</span>
      {items}
    </nav>
  );
}
