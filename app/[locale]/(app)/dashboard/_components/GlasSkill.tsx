import type { ReactNode } from 'react';
import { ArrowRight, Check, Clock, Lock, X } from 'lucide-react';
import { PassChanceCard, type PassChanceLevel } from '@/components/glas';
import CategoryMark, { type Category } from '@/components/horizon/CategoryMark';
import type { SkillWeakness } from '@/lib/vaardigheden-server';
import { MAX_CRITERION_SCORE } from '@/lib/rubrics';
import type { ExamCardView } from './exam-slots';

/**
 * De onderdeelpagina in Glas: **"S1 · twee banen"** (DESIGN_SYSTEM §G5, glas.html §09b).
 *
 * Een kop met de grote slaagkanskaart, en daaronder twee genummerde kolommen: *1 Leren* (de
 * blokken A–E als rijen) → *2 Oefenexamens* (tien vierkantjes en één oranje kaart om te
 * ontgrendelen). Gedeeld door de taalonderdelen (`dashboard/[level]/[skill]`) en KNM
 * (`dashboard/knm`), zodat een module die zich anders gedraagt dan de andere niet bestaat.
 *
 * Servercomponenten zonder eigen data: de pagina rekent, dit tekent.
 */

export { passChanceLevel } from './pass-chance';

export function SkillHead({
  category, title, tagline, facts, kans,
}: {
  category: Category;
  title: string;
  tagline: string;
  facts: string;
  kans: { level: PassChanceLevel; label: string; word: string; line: string; scale: [string, string, string, string] };
}) {
  return (
    <header className="g-skhead">
      <CategoryMark category={category} size={64} />
      <div className="g-skhead-id">
        <h1>{title}</h1>
        <p>{tagline}</p>
        {facts && <p className="g-sk-facts">{facts}</p>}
      </div>
      <PassChanceCard level={kans.level} label={kans.label} word={kans.word} line={kans.line} scaleLabels={kans.scale} />
    </header>
  );
}

export type LearnRow = {
  key: string;
  /** De letter in het tegeltje: A–E. */
  letter: string;
  title: string;
  sub: string;
  /** "2/9" — rechts in mono. */
  count: string | null;
  href: string | null;
  /** `d` klaar · `c` hier ga je verder · `lk` niet in je pakket · `soon` nog niet open · `open`. */
  state: 'd' | 'c' | 'lk' | 'soon' | 'open';
};

export function Lanes({ children }: { children: ReactNode }) {
  return (
    <div className="g-lanes">
      {children}
      {/* "Eerst dit, dan dat": de pijl tussen de twee banen. Onder 860px staan ze onder elkaar
          en zegt de nummering het al. */}
      <span className="g-then" aria-hidden><ArrowRight strokeWidth={2.4} className="rtl-flip" /></span>
    </div>
  );
}

export function LearnLane({
  title, sub, rows, empty, continueLabel,
}: {
  title: string;
  sub: string;
  rows: LearnRow[];
  /** Wat er staat als er geen enkel blok is. */
  empty: string;
  continueLabel: string;
}) {
  return (
    <section className="g-lane" aria-labelledby="lane-learn">
      <div className="g-lt">
        <span className="g-lt-step" aria-hidden>1</span>
        <div>
          <h2 id="lane-learn">{title}</h2>
          <small>{sub}</small>
        </div>
      </div>
      {rows.length === 0 && <p className="g-lane-empty">{empty}</p>}
      {rows.map(row => {
        const cls = `g-brow${row.state === 'open' ? '' : ` g-${row.state}`}`;
        const body = (
          <>
            <span className="g-brow-L" aria-hidden>
              {row.state === 'd' ? <Check strokeWidth={3} /> : row.letter}
            </span>
            <span className="g-brow-t">
              <b>{row.title}</b>
              <small>{row.sub}</small>
            </span>
            <span className="g-brow-e">
              {row.state === 'lk'
                ? <Lock strokeWidth={2.4} aria-hidden />
                : row.state === 'soon'
                  ? <Clock strokeWidth={2.4} aria-hidden />
                  : row.count && <span className="g-tnum">{row.count}</span>}
              {row.state === 'c' && (
                <span className="g-btn g-btn-navy g-btn-sm" aria-hidden>{continueLabel}</span>
              )}
            </span>
          </>
        );
        return row.href
          ? <a key={row.key} href={row.href} className={cls}>{body}</a>
          : <div key={row.key} className={cls}>{body}</div>;
      })}
    </section>
  );
}

export function ExamLane({
  title, sub, cards, freeNumbers, owns, allHref, allLabel, labels, upsell,
}: {
  title: string;
  sub: string;
  cards: ExamCardView[];
  /** De nummers die gratis zijn (oefenexamen 1 met een account), voor wie het onderdeel niet heeft. */
  freeNumbers: Set<number>;
  owns: boolean;
  allHref: string | null;
  allLabel: string;
  labels: { free: string; now: string; slot: (n: number, state: string) => string };
  upsell: ReactNode;
}) {
  return (
    <section className="g-lane" aria-labelledby="lane-exams">
      <div className="g-lt">
        <span className="g-lt-step g-l" aria-hidden>2</span>
        <div>
          <h2 id="lane-exams">{title}</h2>
          <small>{sub}</small>
        </div>
        {allHref && (
          <a href={allHref} className="g-tlink g-lt-all">
            {allLabel}
          </a>
        )}
      </div>

      {/* Tien vierkantjes. De drie redenen dat er een niet opengaat blijven drie vormen: het
          slotje (niet in je pakket), de klok op een gestippelde rand (nog niet gepubliceerd,
          géén link) en het groene vinkje (al gehaald — en blijft klikbaar om te herhalen). */}
      <ul className="g-sq10">
        {cards.map(card => {
          const free = !owns && freeNumbers.has(card.n) && (card.state === 'open' || card.state === 'next');
          const cls = {
            passed: 'g-sq g-sq-ok',
            sat: 'g-sq g-sq-no',
            next: 'g-sq g-sq-now',
            open: free ? 'g-sq g-sq-free' : 'g-sq',
            locked: 'g-sq g-sq-lk',
            empty: 'g-sq g-sq-nog',
          }[card.state];
          /* Het icoon blijft ook op een smalle telefoon staan; alleen de tekst ernaast valt weg.
             Gehaald en niet gehaald zijn nooit alleen groen en rood (§G3). */
          const text = (s: string) => <span className="g-sq-t">{s}</span>;
          const small =
            card.state === 'passed' ? <><Check strokeWidth={3} aria-hidden />{text(card.cap)}</>
              : card.state === 'sat' ? <><X strokeWidth={3} aria-hidden />{text(card.cap)}</>
                : card.state === 'locked' ? <Lock strokeWidth={2.4} aria-hidden />
                  : card.state === 'empty' ? <Clock strokeWidth={2.4} aria-hidden />
                    : card.state === 'next' ? text(labels.now)
                      : free ? text(labels.free) : null;
          const inner = (
            <>
              <span aria-hidden>{card.n}</span>
              {small && <small aria-hidden>{small}</small>}
            </>
          );
          const label = labels.slot(card.n, card.state === 'next' ? labels.now : card.capNote);
          return (
            <li key={card.n}>
              {card.href
                ? <a href={card.href} className={cls} aria-label={label}>{inner}</a>
                : <span className={cls} role="img" aria-label={label}>{inner}</span>}
            </li>
          );
        })}
      </ul>

      {upsell}
    </section>
  );
}

/**
 * Alle tien als examenkaarten (§G5 "Exam card = slot", `g-slot` uit de kit). Dezelfde markup als
 * `components/glas/ExamSlotCard`, maar met een gewone `<a>`: `buildExamSlots` levert al
 * gelokaliseerde paden (inclusief `/register?next=…` en het pakket-aanbod), en die passen niet
 * in de getypte `href` van next-intl's `Link`.
 */
export function SlotGrid({
  cards, freeNumbers, owns, numberLabel, freeLabel, sub,
}: {
  cards: ExamCardView[];
  freeNumbers: Set<number>;
  owns: boolean;
  numberLabel: string;
  freeLabel: string;
  /** De regel onder de status: wat een examen inhoudt, of je score. */
  sub: (card: ExamCardView) => string;
}) {
  return (
    <div className="g-slots">
      {cards.map(card => {
        const free = !owns && freeNumbers.has(card.n) && (card.state === 'open' || card.state === 'next');
        const state = card.state === 'passed' ? 'gehaald'
          : card.state === 'sat' ? 'niet'
            : card.state === 'empty' ? 'nog'
              : card.state === 'locked' ? 'pakket'
                : free ? 'gratis' : 'open';
        const Icon = { open: ArrowRight, gehaald: Check, niet: X, pakket: Lock, nog: Clock, gratis: null }[state];
        const body = (
          <>
            <div className="g-slot-top">
              <span className="g-slot-nr">
                <small>{numberLabel}</small>
                <b>{card.n}</b>
              </span>
              {state === 'gratis'
                ? <span className="g-slot-pill">{freeLabel}</span>
                : Icon && (
                  <span className="g-slot-ic" aria-hidden>
                    <Icon strokeWidth={2.25} className={state === 'open' ? 'rtl-flip' : undefined} />
                  </span>
                )}
            </div>
            <div className="g-slot-bt">
              <b>{card.capNote}</b>
              <small>{sub(card)}</small>
            </div>
          </>
        );
        const cls = `g-slot g-slot-${state}`;
        return card.href
          ? <a key={card.n} href={card.href} className={cls}>{body}</a>
          : <div key={card.n} className={cls}>{body}</div>;
      })}
    </div>
  );
}

/** De ene oranje kaart onder de examens: wat dicht is, en één knop om het te openen. */
export function UnlockCard({ title, sub, cta, href }: { title: string; sub: string; cta: string; href: string }) {
  return (
    <div className="g-upsell">
      <div>
        <b>{title}</b>
        <small>{sub}</small>
      </div>
      <a href={href} className="g-btn g-btn-oranje g-btn-sm">
        {cta}
        <ArrowRight strokeWidth={2.4} className="rtl-flip" aria-hidden />
      </a>
    </div>
  );
}

/**
 * Waar je punten laat liggen, per vaardigheid (of per KNM-thema). Dezelfde rijen als
 * `components/exam/SkillWeakness`, in Glas-vorm: een balk en een getal; een rij onder 40% krijgt
 * de klei-tint van "let op", nooit rood — rood is alleen een fout antwoord.
 */
export function WeaknessCard({ title, data }: { title: string; data: SkillWeakness }) {
  if (data.rows.length === 0) return null;
  return (
    <section className="g-card">
      <div className="g-card-h"><h2>{title}</h2></div>
      <ul className="g-weak-list">
        {data.rows.map(r => {
          const focus = r.pct !== null && r.pct < 40;
          return (
            <li key={r.key} className={`g-weak-row${focus ? ' g-focus' : ''}`}>
              <span className="g-weak-lb" title={r.label}>{r.label}</span>
              {r.pct !== null ? (
                <span className="g-prog" role="img" aria-label={`${r.label}: ${r.detail}`}>
                  <i style={{ width: `${r.pct}%` }} />
                </span>
              ) : (
                <span className="g-prog g-prog-empty" role="img" aria-label={`${r.label}: ${r.detail}`} />
              )}
              <span className="g-weak-val">
                {r.score !== null
                  ? <>{r.score.toFixed(1)}<small> / {MAX_CRITERION_SCORE}</small></>
                  : r.pct !== null
                    ? <>{r.pct}<small>%</small></>
                    : <small>—</small>}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
