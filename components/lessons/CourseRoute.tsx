'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowRight, BookOpen, Check, ChevronDown, ClipboardCheck, Info, Layers, ListChecks, Lock, type LucideIcon, Puzzle,
  SquarePlay, Target,
} from 'lucide-react';
import { WORD_KNOWN_EVENT, type WordKnownDetail } from './WordSideNav';
import type { SideBlock, SideItem, SideKind } from './GrammarCourseSide';

export type RouteSkill = { key: string; label: string; href: string; on: boolean };

const ICONS: Record<string, LucideIcon> = { A: Layers, B: Puzzle, C: Info, D: Target, E: ClipboardCheck };
const KIND_ICONS: Record<SideKind, LucideIcon> = { video: SquarePlay, uitleg: BookOpen, opdracht: ListChecks, woorden: Layers };

/**
 * De cursus als route, in de chrome naast de portaalzijbalk (eigenaar, 15-10): kop met de
 * voortgangsring en het onderdeel, dan de vijf blokken als stations op één lijn, met alleen
 * het blok van deze pagina open. Onder de lijn de weg naar de oefenexamens.
 *
 * Het niveau staat hier niet meer: de zijbalk ernaast zegt al "Niveau A2 › Lezen". Het
 * onderdeel wel, als keuzelijst in de kop, zodat je binnen de leerlaag kunt wisselen.
 *
 * Een clientstuk om twee redenen: de keuzelijst sluit bij een klik ernaast, en op de
 * woordkaarten telt een thema mee zodra `WordDeck` een kaart markeert (`WORD_KNOWN_EVENT`).
 */
export default function CourseRoute({
  courseLabel, done, total, skills, blocks: initial, examsHref,
}: {
  courseLabel: string;
  done: number;
  total: number;
  skills: RouteSkill[];
  blocks: SideBlock[];
  examsHref: string;
}) {
  const t = useTranslations('grammar');
  const blocks = useLiveWords(initial);
  const pct = total > 0 ? done / total : 0;

  return (
    <div className="cr">
      <div className="cr-head">
        <span className="cr-ring" aria-hidden>
          <svg viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="18" className="cr-ring-bg" />
            {done > 0 && (
              <circle
                cx="22" cy="22" r="18" className="cr-ring-fg"
                pathLength={100} strokeDasharray={`${Math.max(pct * 100, 3)} 100`}
              />
            )}
          </svg>
          <b>{done}</b>
        </span>
        <div className="cr-head-txt">
          <p className="cr-kicker">{t('route_kicker', { done, total })}</p>
          <SkillSwitch label={courseLabel} skills={skills} aria={t('skills_aria')} />
        </div>
      </div>

      <nav aria-label={t('blocks_aria')} className="cr-nav">
        <ol className="cr-route">
          {blocks.map(b => <Station key={b.letter} block={b} sub={t(`route_sub_${b.letter}` as 'route_sub_A')} />)}
        </ol>
      </nav>

      <a href={examsHref} className="cr-next">
        <span>
          <span className="cr-next-k">{t('route_next_kicker')}</span>
          <span className="cr-next-t">{t('route_next')}</span>
        </span>
        <ArrowRight size={17} strokeWidth={2.2} className="rtl-flip" aria-hidden />
      </a>
    </div>
  );
}

function Station({ block: b, sub }: { block: SideBlock; sub: string }) {
  const Icon = ICONS[b.letter] ?? Info;
  const head = (
    <>
      <span className={`cr-tile${b.open ? ' is-on' : b.complete ? ' is-done' : ''}`} aria-hidden>
        {b.complete && !b.open ? <Check size={16} strokeWidth={2.8} /> : <Icon size={16} strokeWidth={2.1} />}
      </span>
      <span className="cr-st-txt">
        <span className="cr-st-name"><span className="sr-only">{b.letter} · </span>{b.name}</span>
        <span className="cr-st-sub">{sub}</span>
      </span>
      <span className="cr-st-count">{b.done}/{b.total}</span>
    </>
  );
  return (
    <li className={`cr-st${b.open ? ' is-open' : ''}`}>
      {b.href && !b.open
        ? <a href={b.href} className="cr-st-row">{head}</a>
        : <div className="cr-st-row" aria-current="step">{head}</div>}
      {b.open && (
        <ul className="cr-items">
          {b.items.map(it => <Item key={it.key} item={it} />)}
          {b.extras && b.extras.items.length > 0 && (
            <>
              <li className="cr-extras">{b.extras.title}</li>
              {b.extras.items.map(it => <Item key={it.key} item={it} />)}
            </>
          )}
        </ul>
      )}
    </li>
  );
}

/**
 * Eén rij onder het open blok, naar Coursera (eigenaar, 15-10): het type als icoon en als vet
 * woord vóór de titel — "Video: Ontkenning" — met de duur of het aantal opgaven eronder.
 */
function Item({ item }: { item: SideItem }) {
  const Icon = KIND_ICONS[item.kind ?? 'woorden'];
  const meta = item.meta ?? null;
  return (
    <li className="cr-li">
      <a
        href={item.href}
        className={`cr-item${item.now ? ' is-now' : ''}${item.done ? ' is-done' : ''}${item.locked ? ' is-locked' : ''}`}
        aria-current={item.now ? 'page' : undefined}
      >
        <span className="cr-kind" aria-hidden><Icon size={14} strokeWidth={2.2} /></span>
        <span className="cr-item-txt">
          <span className="cr-item-lb">
            {item.prefix && <b>{item.prefix}: </b>}
            {item.label}
          </span>
          {meta && <span className="cr-item-meta">{meta}</span>}
        </span>
        {item.done
          ? <Check size={15} strokeWidth={2.8} className="cr-item-end is-ok" aria-hidden />
          : item.locked
            ? <Lock size={13} strokeWidth={2.4} className="cr-item-end" aria-hidden />
            : item.count
              ? <span className="cr-item-n">{item.count.known}/{item.count.total}</span>
              : null}
      </a>
    </li>
  );
}

function SkillSwitch({ label, skills, aria }: { label: string; skills: RouteSkill[]; aria: string }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (ref.current?.open && !ref.current.contains(e.target as Node)) ref.current.open = false;
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  return (
    <details ref={ref} className="cr-switch">
      <summary aria-label={`${label} · ${aria}`}>
        <span>{label}</span>
        <ChevronDown size={15} strokeWidth={2.6} aria-hidden />
      </summary>
      <ul className="cr-menu">
        {skills.map(s => (
          <li key={s.key}>
            <a href={s.href} className={s.on ? 'is-on' : undefined} aria-current={s.on ? 'page' : undefined}>
              {s.label}
              {s.on && <Check size={14} strokeWidth={2.6} aria-hidden />}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}

/** Een woordkaartthema telt mee zonder herladen; alleen items met een `theme` luisteren. */
function useLiveWords(initial: SideBlock[]) {
  const [blocks, setBlocks] = useState(initial);
  useEffect(() => {
    const on = (e: Event) => {
      const { theme, known } = (e as CustomEvent<WordKnownDetail>).detail;
      setBlocks(prev => prev.map(b => {
        if (!b.items.some(it => it.theme === theme)) return b;
        const items = b.items.map(it => it.theme === theme && it.count
          ? { ...it, count: { ...it.count, known }, done: known === it.count.total }
          : it);
        const doneNow = items.filter(it => it.done).length;
        return { ...b, items, done: doneNow, complete: doneNow === b.total };
      }));
    };
    window.addEventListener(WORD_KNOWN_EVENT, on);
    return () => window.removeEventListener(WORD_KNOWN_EVENT, on);
  }, []);
  return blocks;
}
