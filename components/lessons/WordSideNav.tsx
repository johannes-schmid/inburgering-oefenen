'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, Check } from 'lucide-react';
import { SideSwitchers, type SideLevel, type SideSkill } from './GrammarSideNav';

export type WordSideTheme = { slug: string; label: string; href: string; known: number; total: number; now: boolean };

/** Het event dat `WordDeck` stuurt na elke markering, zodat de kolom meetelt zonder herladen. */
export const WORD_KNOWN_EVENT = 'wd:known';
export type WordKnownDetail = { theme: string; known: number };

type Labels = { levelsAria: string; skillsAria: string };

/**
 * De tweede kolom van de woordkaarten (eigenaar, 11-10): geen cursusblokken, maar de woorden
 * zelf — hoeveel je er in dit onderdeel kent, en per thema hoe ver je bent.
 *
 * Een clientstuk omdat de deck ernaast per kaart opslaat: zonder het event zou "Ken ik" pas na
 * een herlaadbeurt in de kolom zichtbaar worden. Alleen het huidige thema verandert hier.
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

export default function WordSideNav({
  levels, skills, themes: initial, courseHref, labels,
}: {
  levels: SideLevel[];
  skills: SideSkill[];
  themes: WordSideTheme[];
  courseHref: string;
  labels: Labels;
}) {
  const themes = useLiveThemes(initial);
  const t = useTranslations('portal');
  return (
    <div className="gsn">
      <SideSwitchers levels={levels} skills={skills} labels={labels} />
      <WordProgress themes={themes} />

      <p className="gsn-label"><span>{t('words_themes_label')}</span></p>
      <nav aria-label={t('words_themes_label')}>
        <ul className="gsn-items">
          {themes.map(th => {
            const done = th.total > 0 && th.known === th.total;
            return (
              <li key={th.slug}>
                <a
                  href={th.href}
                  className={`gsn-item wsn-item${th.now ? ' is-now' : ''}${done ? ' is-done' : ''}`}
                  aria-current={th.now ? 'page' : undefined}
                >
                  <span className="gsn-dot" aria-hidden>
                    {done ? <Check size={10} strokeWidth={3.4} /> : null}
                  </span>
                  <span className="wsn-body">
                    <span className="wsn-row">
                      <span className="gsn-ilabel">{th.label}</span>
                      <span className="wsn-count">{th.known}/{th.total}</span>
                    </span>
                    <span className="wsn-bar" aria-hidden>
                      <i style={{ transform: `scaleX(${th.total > 0 ? th.known / th.total : 0})` }} />
                    </span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <a href={courseHref} className="wsn-course">
        {t('words_course_link')}
        <ArrowRight size={14} strokeWidth={2.4} className="rtl-flip" aria-hidden />
      </a>
    </div>
  );
}

/** Op een telefoon staat de kolom er niet; dan alleen de voortgangskaart boven de deck. */
export function WordProgressCard({ themes: initial }: { themes: WordSideTheme[] }) {
  const themes = useLiveThemes(initial);
  return <WordProgress themes={themes} />;
}
