import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, Check, Clock, Lock, LockOpen, RotateCcw, X } from 'lucide-react';
import { PassChanceCard, type PassChanceLevel } from '@/components/glas';
import CategoryMark, { type Category } from '@/components/horizon/CategoryMark';
import type { SkillWeakness } from '@/lib/vaardigheden-server';
import { MAX_CRITERION_SCORE } from '@/lib/rubrics';
import { euro, MODULE_PRICE_CENTS } from '@/lib/pricing';
import type { ExamCardView } from './exam-slots';

/**
 * De onderdeelpagina in Glas: **"S1 · twee banen"** (DESIGN_SYSTEM §G5, glas.html §09b).
 *
 * Een kop met de grote slaagkanskaart, en daaronder twee kolommen naast elkaar: *Leren* (de
 * blokken A–E als modules, elk met een eigen merk) en *Oefenexamens* (alle tien als rijen, met
 * per rij één knop). Gedeeld door de taalonderdelen (`dashboard/[level]/[skill]`) en KNM
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
  /** Het merk in het tegeltje: elke module heeft zijn eigen icoon, geen letter. */
  mark: Category;
  title: string;
  sub: string;
  /** "2/9" — rechts in mono. */
  count: string | null;
  /** 0–1 voor de balk onder de titel; `null` = geen balk (dicht, of nog niets te tellen). */
  progress: number | null;
  href: string | null;
  /** `d` klaar · `c` hier ga je verder · `lk` niet in je pakket · `soon` nog niet open · `open`. */
  state: 'd' | 'c' | 'lk' | 'soon' | 'open';
};

/**
 * Leren en oefenexamens naast elkaar, zonder nummering of pijl ertussen (eigenaar, 15-10): het
 * zijn twee dingen die je allebei doet, geen stap 1 en stap 2.
 */
export function Lanes({ children }: { children: ReactNode }) {
  return <div className="g-lanes">{children}</div>;
}

function LaneHead({ id, mark, title, sub, link }: {
  id: string; mark: Category; title: string; sub: string; link?: ReactNode;
}) {
  return (
    <div className="g-lt">
      <CategoryMark category={mark} size={40} />
      <div>
        <h2 id={id}>{title}</h2>
        <small>{sub}</small>
      </div>
      {link}
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
      <LaneHead id="lane-learn" mark="leren" title={title} sub={sub} />
      {rows.length === 0 && <p className="g-lane-empty">{empty}</p>}
      {rows.map(row => {
        const cls = `g-brow${row.state === 'open' ? '' : ` g-${row.state}`}`;
        const body = (
          <>
            <span className="g-brow-L">
              <CategoryMark category={row.mark} size={44} />
            </span>
            <span className="g-brow-t">
              <b>{row.title}</b>
              <small>{row.sub}</small>
              {row.progress !== null && row.state !== 'lk' && row.state !== 'soon' && (
                <span className="g-prog" aria-hidden><i style={{ width: `${Math.round(row.progress * 100)}%` }} /></span>
              )}
            </span>
            <span className="g-brow-e">
              {row.state === 'lk'
                ? <Lock strokeWidth={2.4} aria-hidden />
                : row.state === 'soon'
                  ? <Clock strokeWidth={2.4} aria-hidden />
                  : row.state === 'd'
                    ? <Check strokeWidth={3} className="g-ok" aria-hidden />
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

/**
 * De tien oefenexamens als rijen (variant E, eigenaar 15-10). Alle tien staan er altijd, ook wat
 * nog niet gepubliceerd is: de kandidaat moet zien dat de hele reeks er is.
 *
 * Elke rij zegt drie dingen: welk examen en hoe het ervoor staat (het nummertegeltje met een
 * vinkje, kruisje of slotje), wat er aan de hand is in woorden, en wat je nu doet — de score rechts
 * en één knop met een werkwoord. De drie redenen dat een examen niet opengaat blijven drie vormen:
 * het slotje (niet in je pakket, klikt door naar het aanbod), de gestippelde rij zonder knop (nog
 * niet gepubliceerd, géén link) en het groene vinkje (gehaald, en klikbaar om te herhalen).
 *
 * Eén oranje knop per scherm: het eerstvolgende examen, of — wie niets meer kan openen en het
 * onderdeel niet heeft — het eerste examen achter het slot.
 */
export async function ExamLane({
  title, sub, cards, freeNumbers, owns, isGuest, factLine, allHref,
}: {
  title: string;
  sub: string;
  cards: ExamCardView[];
  /** De nummers die gratis zijn (oefenexamen 1 met een account), voor wie het onderdeel niet heeft. */
  freeNumbers: Set<number>;
  owns: boolean;
  isGuest: boolean;
  /** "25 vragen · 65 minuten" — wat een examen inhoudt. */
  factLine: string;
  allHref: string | null;
}) {
  const t = await getTranslations('portal');
  const primary = cards.find(c => c.state === 'next')?.n
    ?? (owns ? null : cards.find(c => c.state === 'locked')?.n ?? null);
  const withFacts = (s: string) => [s, factLine].filter(Boolean).join(' · ');

  return (
    <section className="g-lane" aria-labelledby="lane-exams">
      <LaneHead
        id="lane-exams"
        mark="oefenexamens"
        title={title}
        sub={sub}
        link={allHref && <a href={allHref} className="g-tlink g-lt-all">{t('exams_all')}</a>}
      />

      <ul className="g-xr-list">
        {cards.map(card => {
          const free = !owns && freeNumbers.has(card.n) && (card.state === 'open' || card.state === 'next');
          const tries = t('glas.exam_attempts', { n: card.attempts });
          const line =
            card.state === 'passed' ? <><Check strokeWidth={3} aria-hidden />{`${t('leg_passed')} · ${tries}`}</>
              : card.state === 'sat' ? <><X strokeWidth={3} aria-hidden />{`${t('leg_not_passed')} · ${tries}`}</>
                : card.state === 'next' ? withFacts(t('glas.exam_next'))
                  : card.state === 'open' ? (free ? factLine : withFacts(t('glas.exam_not_made')))
                    : card.state === 'locked'
                      ? (isGuest ? t('glas.exam_locked_guest') : t('glas.exam_locked', { price: euro(MODULE_PRICE_CENTS) }))
                      : t('glas.exam_soon');
          const act =
            card.state === 'passed' || card.state === 'sat' ? { label: t('glas.act_again'), Icon: RotateCcw }
              : card.state === 'locked' ? { label: isGuest ? t('glas.act_account') : t('glas.act_unlock'), Icon: LockOpen }
                : card.state === 'empty' ? null
                  : { label: t('glas.act_start'), Icon: ArrowRight };
          const isPrimary = card.n === primary;
          const Badge = card.state === 'passed' ? Check : card.state === 'sat' ? X : card.state === 'locked' ? Lock : null;
          const cls = `g-xr g-xr-${card.state}${free ? ' g-xr-free' : ''}`;
          const body = (
            <>
              <span className="g-xr-nr" aria-hidden>
                <CategoryMark category="oefenexamens" size={68} bare className="g-xr-wm" />
                {card.state === 'empty' ? <Clock strokeWidth={2.4} /> : <b>{card.n}</b>}
                {Badge && <span className="g-xr-badge"><Badge strokeWidth={3} /></span>}
              </span>
              <span className="g-xr-t">
                <b>
                  <span className="g-xr-lg">{t('exam_row_title', { number: card.n })}</span>
                  <span className="g-xr-sm">{`${t('glas.exam')} ${card.n}`}</span>
                  {free && <span className="g-xr-pill">{t('glas.free')}</span>}
                </b>
                <small>{line}</small>
              </span>
              {card.pct != null && <span className="g-xr-sc">{card.pct}%</span>}
              {act && (
                <span className={`g-xr-act${isPrimary ? ' g-xr-act-or' : card.state === 'locked' ? ' g-xr-act-lt' : ''}`}>
                  <act.Icon strokeWidth={2.4} className={act.Icon === ArrowRight ? 'rtl-flip' : undefined} aria-hidden />
                  <span>{act.label}</span>
                </span>
              )}
            </>
          );
          return (
            <li key={card.n}>
              {card.href
                ? <a href={card.href} className={cls}>{body}</a>
                : <div className={cls}>{body}</div>}
            </li>
          );
        })}
      </ul>
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
