'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import type { Level, OnderdeelSlug } from '@/data/skills';

/**
 * "Dit verklaart je fouten" — de brug van een gezakt examen naar de les die het repareert.
 *
 * ── WAAROM DIT NAAST DE TEKSTSOORT-UITSPLITSING STAAT ────────────────────────
 * Het resultaatscherm zegt al hoe je het per tekstsoort deed ("Brief 2/4"). Dat is nuttig en
 * het is geen leerdoel: "je bent slecht in brieven" vertelt je niet wat je moet dóen. Een
 * concept wél — `omdat`-woordorde is iets dat je in tien minuten kunt oefenen, en er is een les
 * die precies dat doet.
 *
 * ── HET LAADT NA, EN DAT IS EEN KEUZE ────────────────────────────────────────
 * De foute vragen zijn pas bekend na inzending, dus dit haalt zijn advies dan pas op. Zolang
 * dat loopt staat er niets — geen skeleton en geen spinner: dit is een aanvulling op een scherm
 * dat al compleet is, en een lege plek die volloopt leest beter dan een grijs blok dat belooft.
 *
 * Bij een leeg antwoord rendert de component **niets**. Een examen waarvan de items nog niet
 * aan concepten hangen kan niets aanbevelen, en een kop met een lege lijst eronder leest als
 * een fout.
 */

type Advice = {
  slug: string;
  name: string;
  one_liner: string;
  misses: number;
  href: string;
  lessonTitle: string | null;
};

type Props = {
  level: Level;
  onderdeel: OnderdeelSlug;
  wrongQuestionIds: number[];
  labels: { head: string; misses: string; lesson: string };
};

export default function ConceptAdvice({ level, onderdeel, wrongQuestionIds, labels }: Props) {
  // De locale uit de context in plaats van als prop: `ExamShell` heeft er geen en hem daar
  // doorheen rijgen raakt vier componenten voor één string.
  const locale = useLocale();
  const [advice, setAdvice] = useState<Advice[] | null>(null);

  useEffect(() => {
    if (!wrongQuestionIds.length) { setAdvice([]); return; }
    let alive = true;

    fetch('/api/lesson-advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wrongQuestionIds, level, onderdeel }),
    })
      .then(async r => {
        if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
        return r.json();
      })
      .then(d => { if (alive) setAdvice(d.advice ?? []); })
      .catch(e => {
        // Nooit stil: een weggegooid resultaat is een verdwenen feature tot je het tegendeel
        // hebt gecontroleerd. Wel zichtbaar niets, want dit is een aanvulling.
        console.error('[lessons] conceptadvies niet geladen', e);
        if (alive) setAdvice([]);
      });

    return () => { alive = false; };
    // De lijst foute vragen verandert niet meer zodra het resultaatscherm staat.
  }, [level, onderdeel, wrongQuestionIds]);

  if (!advice?.length) return null;

  return (
    <div
      className="rounded-2xl bg-surface-container-lowest"
      style={{ padding: '1.375rem 1.5rem', boxShadow: 'var(--shadow-ambient)' }}
    >
      <p className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/70 m-0 mb-3">
        {labels.head}
      </p>
      <ul className="list-none m-0 p-0 flex flex-col gap-2">
        {advice.map(a => (
          <li key={a.slug}>
            <a href={`/${locale}${a.href}`} className="les-row" style={{ padding: '0.7rem 0.9rem' }}>
              <span className="min-w-0 flex-1">
                <span className="block font-extrabold text-on-surface">{a.name}</span>
                <span className="block text-xs text-on-surface-variant">{a.one_liner}</span>
                <span className="block text-[0.7rem] font-bold uppercase tracking-wider text-secondary mt-0.5">
                  {labels.misses.replace('{n}', String(a.misses))}
                  {a.lessonTitle && <> · {labels.lesson}</>}
                </span>
              </span>
              <ArrowRight size={16} strokeWidth={2.5} className="shrink-0 text-secondary rtl-flip" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
