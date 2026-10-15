'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

export type WordSideTheme = { slug: string; label: string; href: string; known: number; total: number; now: boolean };

/** Het event dat `WordDeck` stuurt na elke markering, zodat de kolom meetelt zonder herladen. */
export const WORD_KNOWN_EVENT = 'wd:known';
export type WordKnownDetail = { theme: string; known: number };

/**
 * De woordvoortgang op een telefoon: hoeveel woorden je in dit onderdeel kent, en hoeveel
 * thema's af zijn. Vanaf 1024px staat dat in de cursusroute (`CourseRoute`), die naar
 * hetzelfde event luistert.
 *
 * Een clientstuk omdat de deck per kaart opslaat: zonder het event zou "Ken ik" pas na een
 * herlaadbeurt zichtbaar worden.
 */
function useLiveThemes(initial: WordSideTheme[]) {
  const [themes, setThemes] = useState(initial);
  useEffect(() => {
    const on = (e: Event) => {
      const { theme, known } = (e as CustomEvent<WordKnownDetail>).detail;
      setThemes(prev => prev.map(t => (t.slug === theme ? { ...t, known } : t)));
    };
    window.addEventListener(WORD_KNOWN_EVENT, on);
    return () => window.removeEventListener(WORD_KNOWN_EVENT, on);
  }, []);
  return themes;
}

function WordProgress({ themes }: { themes: WordSideTheme[] }) {
  const t = useTranslations('portal');
  const known = themes.reduce((n, x) => n + x.known, 0);
  const total = themes.reduce((n, x) => n + x.total, 0);
  const full = themes.filter(x => x.total > 0 && x.known === x.total).length;
  const pct = total > 0 ? known / total : 0;
  return (
    <div className="wsn-prog">
      <p className="wsn-prog-title">{t('words_side_title')}</p>
      <p className="wsn-prog-num">
        <b>{known}</b>
        <span> / {total} {t('words_side_unit')}</span>
      </p>
      <span className="gt-rail" aria-hidden><i style={{ transform: `scaleX(${pct})` }} /></span>
      <p className="wsn-prog-line">{t('words_side_themes', { done: full, total: themes.length })}</p>
    </div>
  );
}

/** Op een telefoon staat de kolom er niet; dan alleen de voortgangskaart boven de deck. */
export function WordProgressCard({ themes: initial }: { themes: WordSideTheme[] }) {
  const themes = useLiveThemes(initial);
  return <WordProgress themes={themes} />;
}
