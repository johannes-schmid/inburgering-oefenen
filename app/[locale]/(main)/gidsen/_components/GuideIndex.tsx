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
import { Search } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { CategoryMark } from '@/components/horizon';
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
    <form role="search" onSubmit={e => e.preventDefault()} className="relative max-w-xl">
      <label htmlFor="guide-search" className="sr-only">
        {t('search_label')}
      </label>
      <Search
        size={18}
        aria-hidden="true"
        className="absolute top-1/2 -translate-y-1/2 start-5 pointer-events-none"
        style={{ color: '#5c6170' }}
      />
      <input
        id="guide-search"
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={t('search_placeholder')}
        autoComplete="off"
        className="guide-search w-full rounded-full border-0 py-3.5 ps-13 pe-5 text-base text-on-surface bg-surface-container-lowest focus:outline-none"
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
    <section className="px-6 py-14 sm:py-16 bg-surface-container-low">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 mb-8">
          <div>
            <h2
              className="font-headline font-extrabold m-0 mb-1"
              style={{ color: '#002b6d', fontSize: 'clamp(1.6rem,3vw,2.1rem)', letterSpacing: '-0.02em' }}
            >
              {t('all_title')}
            </h2>
            <p className="text-base text-on-surface-variant leading-relaxed m-0">{t('all_sub')}</p>
          </div>
          {/* Knoppen, geen links: het filtert een lijst die al op de pagina staat. */}
          <div className="flex flex-wrap gap-2" role="group" aria-label={t('filter_label')}>
            {chips.map(chip => {
              const active = section === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setSection(chip.id)}
                  aria-pressed={active}
                  className="guide-chip inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold cursor-pointer border-0 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={
                    active
                      ? { background: '#002b6d', color: '#fff' }
                      : { background: 'var(--color-surface-container-lowest)', color: 'var(--color-on-surface-variant)' }
                  }
                >
                  {chip.label}
                  <span style={{ opacity: 0.6 }}>{chip.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 list-none p-0 m-0" aria-live="polite">
          {guides.map(guide => (
            <li key={`${guide.section}-${guide.slug}`} hidden={!shown.has(`${guide.section}-${guide.slug}`)}>
              <Link
                href={guide.href}
                className="guide-card-link flex h-full flex-col rounded-2xl p-6 no-underline bg-surface-container-lowest hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ boxShadow: 'var(--shadow-ambient)' }}
              >
                <span className="flex items-center justify-between">
                  <CategoryMark category={marks.get(guide.section) ?? 'gidsen'} size={28} />
                  <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#a24000' }}>
                    {t('pdf_tag')}
                  </span>
                </span>
                <span className="block font-headline font-bold text-base text-on-surface leading-snug mt-4" style={{ textWrap: 'balance' }}>
                  {guide.title}
                </span>
                <span className="block text-sm text-on-surface-variant leading-relaxed mt-2">
                  {guide.description}
                </span>
                <span className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mt-auto pt-4">
                  {t(`sec_${guide.section}`)} · {tG('reading_time', { minutes: guide.minutes })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {visible === 0 && (
          <p className="text-base text-on-surface-variant m-0 mt-2">{t('no_results', { query: query.trim() })}</p>
        )}
        {!filtering && guides.length > INITIAL && (
          <div className="flex justify-center mt-8">
            <button
              type="button"
              onClick={() => setExpanded(v => !v)}
              aria-expanded={expanded}
              className="guide-chip inline-flex items-center rounded-full px-6 py-3 text-sm font-bold cursor-pointer border-0 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ background: '#002b6d', color: '#fff' }}
            >
              {expanded ? t('show_less') : t('show_more', { count: guides.length })}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
