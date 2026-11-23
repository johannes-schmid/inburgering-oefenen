'use client';

import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, ExternalLink, Plus, Search, X } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { glasButton } from '@/components/glas/Button';

export type BrowserItem = {
  id: string;
  q: string;
  a: string;
  source?: { label: string; url: string };
  more?: { href: ComponentProps<typeof Link>['href']; label: string };
};
export type BrowserGroup = { id: string; label: string; items: BrowserItem[] };

/** Kleine letters, zonder accenten: "geslaagd?" vindt "Geslaagd", "een" vindt "één". */
function fold(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * Het doorzoekbare deel van de FAQ-hub. De server rendert alle vragen als `<details>`; dit
 * component filtert daarna alleen wat er al staat. Zonder JavaScript blijft dus alles zichtbaar en
 * leesbaar — de zoekbalk en de chips verbergt de pagina dan met een `<noscript>`-stijl.
 *
 * `contentLang` zet de vragen op LTR waar de route geen eigen vertaling heeft (Arabisch leest de
 * Engelse tekst); de zoekbalk en de chips volgen wel de taal van de pagina. De pijl in zo'n blok
 * draagt dan geen `.rtl-flip`: de tekst ernaast loopt van links naar rechts.
 */
export default function FaqBrowser({ groups, sourceLabel, contentLang }: { groups: BrowserGroup[]; sourceLabel: string; contentLang?: string }) {
  const t = useTranslations('faq_page');
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState<string | null>(null);

  const haystack = useMemo(() => {
    const map = new Map<string, string>();
    for (const g of groups) for (const it of g.items) map.set(it.id, fold(`${it.q} ${it.a}`));
    return map;
  }, [groups]);

  const words = fold(query).split(/\s+/).filter(Boolean);
  const visible = groups
    .filter(g => !topic || g.id === topic)
    .map(g => ({ ...g, items: g.items.filter(it => words.every(w => haystack.get(it.id)!.includes(w))) }))
    .filter(g => g.items.length > 0);
  const count = visible.reduce((n, g) => n + g.items.length, 0);
  const filtered = words.length > 0 || topic !== null;

  /* Een link naar één vraag (`#hoeveel-fouten`) klapt die vraag open. */
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    const el = document.getElementById(id);
    if (el instanceof HTMLDetailsElement) {
      el.open = true;
      el.scrollIntoView({ block: 'start' });
    }
  }, []);

  const reset = () => { setQuery(''); setTopic(null); };

  return (
    <>
      <div className="g-faq-filter" role="search">
        <div className="g-faq-search">
          <Search aria-hidden="true" />
          <input
            type="search"
            className="g-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('search_placeholder')}
            aria-label={t('search_label')}
            autoComplete="off"
            enterKeyHint="search"
          />
          {query && (
            <button type="button" className="g-faq-clear" onClick={() => setQuery('')} aria-label={t('reset')}>
              <X aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="g-chips" role="group" aria-label={t('topics_label')}>
          <button type="button" className="g-chip g-chip-plain" aria-pressed={topic === null} onClick={() => setTopic(null)}>
            {t('all')}
          </button>
          {groups.map(g => (
            <button key={g.id} type="button" className="g-chip g-chip-plain" aria-pressed={topic === g.id} onClick={() => setTopic(topic === g.id ? null : g.id)}>
              <span {...(contentLang ? { lang: contentLang, dir: 'ltr' as const } : {})}>{g.label}</span>
              <i className="g-chip-cnt">{g.items.length}</i>
            </button>
          ))}
        </div>
        <p className="g-faq-count" role="status" aria-live="polite">{filtered ? t('count', { count }) : ''}</p>
      </div>

      {count === 0 ? (
        <div className="g-faq-empty">
          <p>{t('no_results')}</p>
          <button type="button" className={glasButton({ variant: 'navy' })} onClick={reset}>{t('reset')}</button>
        </div>
      ) : (
        <div className="g-faq-groups" {...(contentLang ? { lang: contentLang, dir: 'ltr' as const } : {})}>
          {visible.map(g => (
            <section key={g.id} id={g.id} className="g-faq-group" aria-labelledby={`${g.id}-h`}>
              <h2 id={`${g.id}-h`}>{g.label}</h2>
              <div className="g-faq">
                {g.items.map(it => (
                  <details key={it.id} id={it.id}>
                    <summary>
                      {it.q}
                      <span className="g-faq-pm" aria-hidden="true"><Plus /></span>
                    </summary>
                    <div className="g-faq-a">
                      <p>{it.a}</p>
                      {(it.source || it.more) && (
                        <div className="g-faq-foot">
                          {it.more && (
                            <Link href={it.more.href} className="g-tlink">
                              {it.more.label}
                              <ArrowRight className={contentLang ? undefined : 'rtl-flip'} aria-hidden="true" />
                            </Link>
                          )}
                          {it.source && (
                            <a href={it.source.url} target="_blank" rel="noopener noreferrer" className="g-faq-src">
                              {sourceLabel}: {it.source.label}
                              <ExternalLink aria-hidden="true" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
