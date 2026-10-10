import { Check, Lock } from 'lucide-react';
import CategoryMark, { type Category } from '@/components/horizon/CategoryMark';
import type { SideBlock, SideItem } from './GrammarCourseSide';

export type SideLevel = { key: string; label: string; href: string; on: boolean };
export type SideSkill = { key: string; label: string; href: string; on: boolean };

/**
 * De tweede kolom van het grammaticaonderwerp (schets eigenaar, 10-10): bovenaan het niveau,
 * dan de vier onderdelen, dan de vijf blokken van deze cursus met blok B uitgeklapt.
 *
 * Dezelfde `SideBlock`s als `GrammarCourseSide`, die op smallere schermen als inklapbare kaart
 * blijft staan. De navy portaalzijbalk links blijft ongemoeid — die navigeert tussen modules.
 */
export default function GrammarSideNav({
  levels, skills, lessonsLabel, done, total, blocks, labels,
}: {
  levels: SideLevel[];
  skills: SideSkill[];
  lessonsLabel: string;
  done: number;
  total: number;
  blocks: SideBlock[];
  labels: { levelsAria: string; skillsAria: string; blocksAria: string };
}) {
  return (
    <div className="gsn">
      <nav className="gsn-levels" aria-label={labels.levelsAria}>
        {levels.map(l => (
          <a key={l.key} href={l.href} className={l.on ? 'is-on' : undefined} aria-current={l.on ? 'page' : undefined}>
            {l.label}
          </a>
        ))}
      </nav>

      <nav className="gsn-skills" aria-label={labels.skillsAria}>
        {skills.map(s => (
          <a key={s.key} href={s.href} className={s.on ? 'is-on' : undefined} aria-current={s.on ? 'page' : undefined}>
            <CategoryMark category={s.key as Category} size={24} />
            <span className="gsn-skill-lb">{s.label}</span>
          </a>
        ))}
      </nav>

      <p className="gsn-label">
        <span>{lessonsLabel}</span>
        <span className="gsn-count">{done} / {total}</span>
      </p>

      <nav aria-label={labels.blocksAria}>
        <ol className="gsn-blocks">
          {blocks.map(b => {
            const head = (
              <>
                <span className="gsn-bname">
                  <span className={`gsn-letter${b.complete ? ' is-done' : ''}`} aria-hidden>
                    {b.complete ? <Check size={11} strokeWidth={3.2} /> : b.letter}
                  </span>
                  <span className="sr-only">{b.letter} · </span>
                  {b.name}
                </span>
                <span className="gsn-bcount">{b.done}/{b.total}</span>
              </>
            );
            return (
              <li key={b.letter} className={b.open ? 'is-open' : undefined}>
                {b.href && !b.open
                  ? <a href={b.href} className="gsn-brow">{head}</a>
                  : <div className="gsn-brow">{head}</div>}
                {b.open && (
                  <ul className="gsn-items">
                    {b.items.map(it => <Row key={it.key} item={it} />)}
                    {b.extras && b.extras.items.length > 0 && (
                      <>
                        <li className="gsn-extras">{b.extras.title}</li>
                        {b.extras.items.map(it => <Row key={it.key} item={it} />)}
                      </>
                    )}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}

function Row({ item }: { item: SideItem }) {
  return (
    <li>
      <a
        href={item.href}
        className={`gsn-item${item.now ? ' is-now' : ''}${item.locked ? ' is-locked' : ''}${item.done ? ' is-done' : ''}`}
        aria-current={item.now ? 'page' : undefined}
      >
        <span className="gsn-dot" aria-hidden>
          {item.done ? <Check size={10} strokeWidth={3.4} /> : item.locked ? <Lock size={9} strokeWidth={2.8} /> : null}
        </span>
        <span className="gsn-ilabel">
          {item.code && <span className="gsn-icode">{item.code} · </span>}
          {item.label}
        </span>
      </a>
    </li>
  );
}
