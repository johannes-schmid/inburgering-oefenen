/**
 * The landing page, which is also the indexable page.
 *
 * The hero is the **thesis, drawn**: a live example of a bar whose result-wait pushes through the
 * wall, animating once on load. Not a stock illustration, not a big number in a gradient. Someone who
 * arrives from a search for *"inburgering deadline"* should understand the problem before they read a
 * sentence — and the picture is also the honest answer to "why do I need a tool for this?".
 *
 * The privacy line sits directly under the CTA in body text, not in the footer. For an audience that
 * is rightly wary of anything resembling an official form, "geen DigiD, geen BSN" is a feature.
 *
 * The example is computed by the **real engine** from a fabricated but realistic input, rather than
 * being hand-drawn. If a lead time changes in the rules file, the marketing picture changes with it —
 * a hardcoded illustration would keep claiming an old wait long after the tool stopped using it.
 */
'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, Check, ShieldCheck } from 'lucide-react';
import { computeTimeline } from '@/lib/tijdlijn/engine/compute';
import { emptyInput } from '@/lib/tijdlijn/engine/input';
import { RULES } from '@/lib/tijdlijn/rules';
import { pd, type PlainDate } from '@/lib/tijdlijn/engine/dates';
import type { UiLocale } from '@/lib/tijdlijn/format';
import TimelineChart from './TimelineChart';
import { Panel } from './ui';
import { glasButton } from '@/components/glas/Button';

export default function Landing({
  onStart,
  onResume,
  hasSaved,
  today,
  locale,
}: {
  onStart: () => void;
  onResume: () => void;
  hasSaved: boolean;
  today: PlainDate;
  locale: UiLocale;
}) {
  const t = useTranslations('tijdlijn.hero');
  const te = useTranslations('tijdlijn.example');

  /* A family migrant on the A2 set with a term ending in about eighteen months, studying a realistic
   * six hours a week. Spreken and Schrijven carry the 16-week notice, so their bars are the ones that
   * hit the wall — which is exactly the case the picture needs to make. */
  const example = useMemo(() => {
    const input = {
      ...emptyInput(),
      law: 'wi2021' as const,
      status: 'gezin_overig' as const,
      route: 'b1' as const,
      anchor: { kind: 'pip' as const, date: pd(today.y - 2, today.m, 1), precision: 'month' as const },
      targetLevel: 'a2' as const,
      currentLevel: 'a1' as const,
      courseHoursPerWeek: 6,
      selfStudyHoursPerWeek: 2,
      residenceStart: pd(today.y - 3, today.m, 1),
    };
    return { input, timeline: computeTimeline(input, RULES, today) };
  }, [today]);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
      <div>
        {/* Geen kicker boven de kop (Glas): de kop draagt zichzelf. `hero.eyebrow` blijft bestaan. */}
        <h1 className="g-head g-head-1">{t('title')}</h1>
        <p className="g-lead mt-5">{t('sub')}</p>

        <div className="mt-7 flex flex-wrap gap-3">
          {/* De ene oranje wijzer van dit scherm: het veld (Gracht) heeft geen gloed. */}
          <button type="button" onClick={onStart} className={glasButton({ variant: 'oranje', size: 'lg' })}>
            {t('cta')}
            <ArrowRight className="rtl-flip" aria-hidden="true" />
          </button>
          {hasSaved && (
            <button type="button" onClick={onResume} className={glasButton({ variant: 'ghost', size: 'lg' })}>
              {t('cta_resume')}
            </button>
          )}
        </div>

        <p className="mt-5 flex items-start gap-2 text-sm leading-relaxed text-ink">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-navy" aria-hidden="true" />
          {t('privacy')}
        </p>
        <p className="mt-1.5 text-[13px] text-ink-2">{t('meta_line')}</p>

        <div className="mt-9">
          <h2 className="g-head g-head-3 !text-navy">{t('how_title')}</h2>
          <ul className="mt-4 space-y-3">
            {(['how_1', 'how_2', 'how_3'] as const).map(k => (
              <li key={k} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink">
                <span className="g-yes !size-[22px] mt-0.5" aria-hidden="true">
                  <Check className="!size-3" strokeWidth={3} />
                </span>
                {t(k)}
              </li>
            ))}
          </ul>
        </div>

        {/* Het vertrouwensblok ligt óp het veld, dus glas (sterk, regel 06). */}
        <div className="g-glass g-glass-strong mt-7 p-5">
          <h2 className="font-headline text-sm font-bold text-navy">{t('trust_title')}</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">{t('trust_body')}</p>
          <p className="mt-3 text-[13px] font-semibold text-ink-2">
            {t('rules_checked', { date: RULES.version })}
          </p>
        </div>
      </div>

      {/* The thesis, drawn — by the same component the wizard and the result screen use, from a
          realistic input run through the real engine. A hand-drawn illustration would keep claiming
          an old waiting time long after the rules file stopped using it. */}
      <Panel className="p-5 sm:p-7 shadow-zweef">
        <TimelineChart timeline={example.timeline} input={example.input} today={today} locale={locale} animate />
        <p className="g-tl-sep mt-4 pt-4 text-sm leading-relaxed text-ink-2">
          {te('caption')}
        </p>
      </Panel>
    </div>
  );
}
