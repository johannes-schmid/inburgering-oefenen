'use client';

/**
 * De inhoudsopgave van een gids — de `<h2 id>`'s van het artikel, met scroll-spy.
 *
 * Sinds 05-10 (eigenaar) zweeft hij: op desktop een melkglazen paneel linksonder dat ingeklapt
 * standaard de hele lijst toont en ingeklapt alleen de huidige sectie, zodat de leeskolom de volle breedte
 * krijgt. Onder `lg` is het een `<details>` boven het artikel, één regel tot je hem opent.
 *
 * De lijst komt uit `guideSections(articleHtml)` — dezelfde `<h2 id>`'s als in het artikel, dus
 * een hernoemde kop verhuist hier mee.
 */
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronUp, List } from 'lucide-react';
import type { GuideSectionEntry } from '@/lib/guides/sections';

export default function GuideToc({ sections }: { sections: GuideSectionEntry[] }) {
  const t = useTranslations('guides');
  const [active, setActive] = useState<string | null>(sections[0]?.id ?? null);
  /* Standaard open (eigenaar, 05-10); de knop klapt hem in als hij in de weg zit. */
  const [open, setOpen] = useState(true);

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

  const list = (
    <ol className="list-none m-0 p-0 flex flex-col gap-0.5">
      {sections.map((s, i) => {
        const on = s.id === active;
        return (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              aria-current={on ? 'location' : undefined}
              className="guide-toc-link flex gap-2.5 rounded-[10px] px-3 py-2 text-sm leading-snug no-underline"
              style={
                on
                  ? { background: 'rgba(0,43,109,0.08)', color: '#002b6d', fontWeight: 700 }
                  : { color: 'var(--color-on-surface-variant)', fontWeight: 600 }
              }
            >
              <span className="tabular-nums" style={{ opacity: 0.55 }}>{String(i + 1).padStart(2, '0')}</span>
              {s.title}
            </a>
          </li>
        );
      })}
    </ol>
  );

  const current = sections.find(s => s.id === active) ?? sections[0];

  return (
    <>
      <nav aria-label={t('toc_title')} className="guide-float-toc no-print hidden lg:block" data-open={open || undefined}>
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          aria-expanded={open}
          className="guide-float-toc-toggle"
        >
          <List size={16} aria-hidden="true" />
          <span className="flex flex-col items-start min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ opacity: 0.6 }}>{t('toc_title')}</span>
            <span className="truncate max-w-[220px] text-sm font-bold" style={{ color: '#002b6d' }}>{current.title}</span>
          </span>
          <ChevronUp size={16} aria-hidden="true" className="guide-float-toc-chevron" />
        </button>
        {open && <div className="guide-float-toc-list">{list}</div>}
      </nav>
      <details className="guide-toc-fold lg:hidden rounded-2xl px-4 py-1 bg-surface-container-low">
        <summary className="cursor-pointer list-none py-3 text-sm font-bold" style={{ color: '#002b6d' }}>
          {t('toc_title')}
        </summary>
        <div className="pb-3">{list}</div>
      </details>
    </>
  );
}
