'use client';

/**
 * De gidsenlijst van `/gidsen` — één raster kaarten, gefilterd door het zoekveld in de hero en
 * de onderwerpchips erboven.
 *
 * Herontwerp 05-10-2026 (eigenaar, referentie deel.com/resources): een hub is een *catalogus*,
 * en een catalogus is een zoekveld, een filter en gelijke kaarten. Het zoekveld staat in de band
 * bovenaan en de lijst eronder, dus de twee delen hun toestand via `GuideFilterProvider` — de
 * pagina blijft een servercomponent en zet alleen de drie client-stukjes erin.
 *
 * **Elke gepubliceerde gids houdt een zichtbare link, ook als er gefilterd is.** Het filter
 * verbergt met `hidden`, het verwijdert niet: `tests/public.spec.js` eist dat de Inburgering-
 * gidsen zichtbaar zijn op deze pagina, en een crawler moet ze alle drieëntwintig kunnen volgen.
 */
import { createContext, useContext, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, Search } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import FilterChip from '@/components/glas/FilterChip';
import SectionHeading from '@/components/glas/SectionHeading';
import { glasButton } from '@/components/glas/Button';
import BrochureCover, { type BrochureCoverData } from '@/components/guides/BrochureCover';
import type { GuideSection } from '@/data/guides/types';
import type { GuideRoute } from '@/data/guides/helpers';

export type IndexGuide = {
  slug: string;
  section: GuideSection;
  title: string;
  description: string;
  minutes: number;
  /* De link wordt op de server gemaakt (`guideHref`): alleen dáár is de vertaalde slug bekend, en
     een client die hem zelf samenstelt serveert onder /en en /ar een 308 naar de Nederlandse. */
  href: GuideRoute;
  /* De omslag van de PDF, als miniatuur: wat je op de kaart ziet is wat je downloadt. */
  cover: BrochureCoverData;
};

type Filter = { query: string; setQuery: (q: string) => void; section: GuideSection | 'all'; setSection: (s: GuideSection | 'all') => void };
const FilterContext = createContext<Filter | null>(null);

export function GuideFilterProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState('');
  const [section, setSection] = useState<GuideSection | 'all'>('all');
  return <FilterContext.Provider value={{ query, setQuery, section, setSection }}>{children}</FilterContext.Provider>;
}

function useFilter(): Filter {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('GuideFilterProvider ontbreekt');
  return ctx;
}

/** Het zoekveld in de hero. Zoekt in titel en beschrijving, zonder knop: typen is zoeken. */
export function GuideSearch() {
  const t = useTranslations('gidsen');
  const { query, setQuery } = useFilter();
  return (
    <form role="search" onSubmit={e => e.preventDefault()} className="g-search">
      <label htmlFor="guide-search" className="sr-only">
        {t('search_label')}
      </label>
      <Search aria-hidden="true" />
      <input
        id="guide-search"
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={t('search_placeholder')}
        autoComplete="off"
      />
    </form>
  );
}

/* Twee rijen van drie, dan een knop. Ook de verborgen kaarten staan in de DOM (`hidden`): de
   crawler en `tests/public.spec.js` moeten elke gids kunnen volgen. */
const INITIAL = 6;

const norm = (s: string) => s.toLocaleLowerCase('nl').normalize('NFD').replace(/\p{M}/gu, '');

export default function GuideIndex({
  guides,
  sections,
}: {
  guides: IndexGuide[];
  sections: { id: GuideSection; mark: 'gidsen' | 'lezen' | 'knm' }[];
}) {
  const t = useTranslations('gidsen');
  const tG = useTranslations('guides');
  const { query, section, setSection } = useFilter();
  const [expanded, setExpanded] = useState(false);
  const q = norm(query.trim());

  const matches = (g: IndexGuide) =>
    (section === 'all' || section === g.section) &&
    (q === '' || norm(`${g.title} ${g.description}`).includes(q));
  const matching = guides.filter(matches);
  const visible = matching.length;
  /* Zoeken of filteren toont alles wat past; alleen de ongefilterde lijst wordt ingeklapt. */
  const filtering = q !== '' || section !== 'all';
  const shown = new Set((filtering || expanded ? matching : matching.slice(0, INITIAL)).map(g => `${g.section}-${g.slug}`));

  const chips: { id: GuideSection | 'all'; label: string; count: number }[] = [
    { id: 'all', label: t('filter_all'), count: guides.length },
    ...sections.map(s => ({ id: s.id, label: t(`sec_${s.id}`), count: guides.filter(g => g.section === s.id).length })),
  ];
  const marks = new Map(sections.map(s => [s.id, s.mark]));

  return (
    <section className="g-sec g-sec-tier" aria-labelledby="gidsen-all">
      <div className="g-wrap">
        <SectionHeading id="gidsen-all" title={t('all_title')} aside={t('all_sub')} size="h1" className="mb-6" />
        {/* Knoppen, geen links: het filtert een lijst die al op de pagina staat. */}
        <div className="g-chips mb-6" role="group" aria-label={t('filter_label')}>
          {chips.map(chip => (
            <FilterChip
              key={chip.id}
              pressed={section === chip.id}
              onClick={() => setSection(chip.id)}
              category={chip.id === 'all' ? undefined : marks.get(chip.id)}
              count={chip.count}
              className="g-chip-wit"
            >
              {chip.label}
            </FilterChip>
          ))}
        </div>

        <ul className="g-grid3 list-none p-0 m-0" aria-live="polite">
          {guides.map(guide => (
            <li key={`${guide.section}-${guide.slug}`} hidden={!shown.has(`${guide.section}-${guide.slug}`)}>
              <Link href={guide.href} className="g-gbro">
                <span className={`g-gbro-stage is-${guide.section}`}>
                  <span className="g-gbro-sheet" aria-hidden="true" />
                  <BrochureCover cover={guide.cover} size="card" />
                </span>
                <span className="g-gbro-tx">
                  <h3>{guide.title}</h3>
                  <p>{guide.description}</p>
                  <span className="g-gbro-ft">
                    <span>
                      <span className="g-gbro-pdf">{t('pdf_tag')}</span>
                      {t(`sec_${guide.section}`)} · {tG('reading_time', { minutes: guide.minutes })}
                    </span>
                    <ArrowRight aria-hidden="true" className="rtl-flip" />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {visible === 0 && (
          <p className="g-body m-0 mt-2">{t('no_results', { query: query.trim() })}</p>
        )}
        {!filtering && guides.length > INITIAL && (
          <div className="flex justify-center mt-8">
            <button
              type="button"
              onClick={() => setExpanded(v => !v)}
              aria-expanded={expanded}
              className={glasButton({ variant: 'navy' })}
            >
              {expanded ? t('show_less') : t('show_more', { count: guides.length })}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
