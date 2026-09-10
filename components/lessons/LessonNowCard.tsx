'use client';

import { ArrowRight, Check } from 'lucide-react';
import { useLessonProgress } from './LessonProgressScope';

export type NowCardLabels = {
  head: string;
  learn: string;
  listen: string;
  /** "Oefenen — {done} van {total}" */
  practice: string;
  cta: string;
  note: string;
};

/**
 * "Deze les": waar je in déze les staat, met de oefenknop erin (mockup van de eigenaar, 08-09).
 *
 * Het staat naast "Wat je leert" en niet eronder, omdat het de andere helft van dezelfde vraag
 * is: links wat de les je brengt, rechts wat er nog van je gevraagd wordt. De knop is de reden
 * dat de kaart bestaat — de opgaven staan onderaan een lange pagina, en de noot eronder zegt
 * precies dat: je hoeft er niet naar te zoeken.
 *
 * De drie regels zijn echte signalen (zie `LessonProgressScope`), geen aannames. Een regel die
 * niet van toepassing is — geen opname bij deze les — staat er niet.
 */
export default function LessonNowCard({
  hasNarration, labels,
}: {
  hasNarration: boolean;
  labels: NowCardLabels;
}) {
  const { seenLearn, listened, done, total } = useLessonProgress();
  if (total === 0 && !hasNarration) return null;

  const rows = [
    { key: 'learn', on: seenLearn, label: labels.learn },
    ...(hasNarration ? [{ key: 'listen', on: listened, label: labels.listen }] : []),
    ...(total > 0
      ? [{
          key: 'practice',
          on: done >= total,
          label: labels.practice.replace('{done}', String(done)).replace('{total}', String(total)),
        }]
      : []),
  ];

  return (
    <aside className="nowcard">
      <span className="nc-kick">{labels.head}</span>
      <ul className="nc-rows">
        {rows.map(r => (
          <li key={r.key} className={r.on ? 'is-on' : ''}>
            {/* Het vinkje draagt de betekenis, niet de kleur alleen (§8). Een lege bol is
                "nog niet" en geen tweede statuskleur. */}
            <span className="nc-dot" aria-hidden>
              {r.on && <Check size={12} strokeWidth={3.2} />}
            </span>
            {r.label}
          </li>
        ))}
      </ul>

      {total > 0 && (
        <>
          <a href="#oefenen" className="nc-cta no-underline">
            {labels.cta}
            <ArrowRight size={15} strokeWidth={2.6} className="rtl-flip" aria-hidden />
          </a>
          <p className="nc-note">{labels.note}</p>
        </>
      )}
    </aside>
  );
}
