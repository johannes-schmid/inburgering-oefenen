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
        <p className="font-headline text-[13px] font-bold uppercase tracking-[0.12em] text-secondary">{t('eyebrow')}</p>
        <h1 className="mt-3 font-headline text-[34px] font-extrabold leading-[1.1] tracking-[-0.03em] text-on-surface sm:text-[44px]">
          {t('title')}
        </h1>
        <p className="mt-5 text-base leading-[1.7] text-on-surface-variant">{t('sub')}</p>

        <div className="mt-7 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onStart}
            className="inline-flex min-h-12 items-center gap-2 rounded-lg px-6 font-headline text-base font-bold text-on-primary shadow-[var(--shadow-btn-orange)] transition-[transform,box-shadow] duration-200 [background:var(--gradient-btn-orange)] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-btn-orange-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-container focus-visible:ring-offset-2"
          >
            {t('cta')}
            <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
          </button>
          {hasSaved && (
            <button
              type="button"
              onClick={onResume}
              className="inline-flex min-h-12 items-center gap-2 rounded-lg border-2 border-primary/25 px-5 font-headline text-base font-bold text-primary transition-colors duration-150 hover:border-primary/50 hover:bg-[var(--tl-tint-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-container focus-visible:ring-offset-2"
            >
              {t('cta_resume')}
            </button>
          )}
        </div>

        <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-on-surface">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          {t('privacy')}
        </p>
        <p className="mt-1.5 text-[13px] text-on-surface-variant">{t('meta_line')}</p>

        <div className="mt-9 border-t border-outline-variant pt-7">
          <h2 className="font-headline text-lg font-extrabold tracking-[-0.02em] text-on-surface">{t('how_title')}</h2>
          <ul className="mt-4 space-y-3">
            {(['how_1', 'how_2', 'how_3'] as const).map(k => (
              <li key={k} className="flex items-start gap-2.5 text-sm leading-relaxed text-on-surface-variant">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--tl-tint-2)]">
                  <Check className="size-3 text-primary" strokeWidth={3} aria-hidden="true" />
                </span>
                {t(k)}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-7 rounded-2xl border border-outline-variant bg-surface-container-low p-5">
          <h2 className="font-headline text-sm font-bold text-on-surface">{t('trust_title')}</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-on-surface-variant">{t('trust_body')}</p>
          <p className="mt-3 text-[13px] font-semibold text-on-surface-variant">
            {t('rules_checked', { date: RULES.version })}
          </p>
        </div>
      </div>

      {/* The thesis, drawn — by the same component the wizard and the result screen use, from a
          realistic input run through the real engine. A hand-drawn illustration would keep claiming
          an old waiting time long after the rules file stopped using it. */}
      <Panel className="p-5 sm:p-7">
        <TimelineChart timeline={example.timeline} input={example.input} today={today} locale={locale} animate />
        <p className="mt-4 border-t border-outline-variant pt-4 text-sm leading-relaxed text-on-surface-variant">
          {te('caption')}
        </p>
      </Panel>
    </div>
  );
}
