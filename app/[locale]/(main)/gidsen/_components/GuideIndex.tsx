'use client';

/**
 * De gidsenlijst van `/gidsen` — één raster kaarten, gefilterd door de onderwerpchips erboven.
 * Het zoekveld in de kop is op 15-10-2026 weggehaald (eigenaar).
 *
 * **Elke gepubliceerde gids houdt een zichtbare link, ook als er gefilterd is.** Het filter
 * verbergt met `hidden`, het verwijdert niet: `tests/public.spec.js` eist dat de Inburgering-
 * gidsen zichtbaar zijn op deze pagina, en een crawler moet ze alle drieëntwintig kunnen volgen.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
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

/* Twee rijen van drie, dan een knop. Ook de verborgen kaarten staan in de DOM (`hidden`): de
   crawler en `tests/public.spec.js` moeten elke gids kunnen volgen. */
const INITIAL = 6;

export default function GuideIndex({
  guides,
  sections,
}: {
  guides: IndexGuide[];
  sections: { id: GuideSection; mark: 'gidsen' | 'lezen' | 'knm' }[];
}) {
  const t = useTranslations('gidsen');
  const tG = useTranslations('guides');
  const [section, setSection] = useState<GuideSection | 'all'>('all');
  const [expanded, setExpanded] = useState(false);

  const matching = guides.filter(g => section === 'all' || section === g.section);
  /* Een filter toont alles wat past; alleen de ongefilterde lijst wordt ingeklapt. */
  const filtering = section !== 'all';
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
