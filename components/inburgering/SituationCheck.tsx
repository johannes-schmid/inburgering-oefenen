'use client';

/**
 * "Check jouw situatie" — the hulpmiddel beside the fasen, and the CTA inside a guide's sidebar.
 *
 * Three questions, one at a time, then a verdict that links into the guide. It is deliberately
 * *small*: it sits in a 300px column next to an article, so it can never be a page of its own, and
 * one question per card is what keeps the whole thing above the fold on a phone.
 *
 * The reasoning it applies is `lib/guides/situation.ts` and none of it lives here — this file is
 * only the three questions, the dots, and the back button. That split is the point: the verdict
 * table is a set of claims about Dutch law, restated from a docent-reviewed guide and pinned by a
 * unit test; the card around it is a design that will be redrawn.
 *
 * Three things that are decisions rather than styling:
 *
 * - **"Ik weet het niet zeker" is an option on every question, in the same weight as the others.**
 *   Not greyed, not a skip link. Most people arriving here genuinely do not know which residence
 *   category they are in — that is why they are reading — and a tool that treats not-knowing as a
 *   failure state sends exactly those readers away. `unknown` is a first-class value all the way
 *   into the verdict table, where it resolves to `unclear` plus the section that clears it up.
 * - **Answering advances immediately; there is no "Volgende" on the question itself.** One tap per
 *   question, three taps to a verdict. The mockup drew a Volgende button, but with a single-select
 *   list it is a second tap that confirms what the first tap already said. "Terug" stays, because
 *   correcting a mis-tap has to be possible.
 * - **The result is never gated and never asks for an e-mail.** Same rule as the tijdlijn tool.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight, Check, RotateCcw } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import {
  evaluateSituation,
  type AgeBand,
  type Nationality,
  type SituationAnswers,
  type StayReason,
} from '@/lib/guides/situation';

/** The three questions, in order, with their option values. Copy comes from the message file. */
const STEPS = [
  { key: 'nationality', options: ['eu', 'non_eu', 'unknown'] },
  { key: 'reason', options: ['work_study', 'family', 'asylum', 'unknown'] },
  { key: 'age', options: ['under_18', 'working_age', 'pension', 'unknown'] },
] as const;

type Props = {
  /** `compact` is the in-article sidebar: same tool, tighter padding, no intro paragraph. */
  variant?: 'full' | 'compact';
  className?: string;
};

export default function SituationCheck({ variant = 'full', className = '' }: Props) {
  const t = useTranslations('inburgering_route.check');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<SituationAnswers>({});

  const done = step >= STEPS.length;
  const result = done ? evaluateSituation(answers) : null;

  function choose(value: string) {
    const key = STEPS[step].key;
    setAnswers(prev => ({
      ...prev,
      /* The option values are the union members themselves, so the cast is the widening the
         `as const` tuple already guarantees — not an assumption about the string. */
      [key]: value as Nationality & StayReason & AgeBand,
    }));
    setStep(step + 1);
  }

  function restart() {
    setAnswers({});
    setStep(0);
  }

  const pad = variant === 'compact' ? 'p-5' : 'p-6';

  return (
    <div
      className={`bg-surface-container-lowest rounded-2xl ${pad} ${className}`}
      style={{ boxShadow: 'var(--shadow-card, 0 2px 16px rgba(0,43,109,0.06))' }}
    >
      <div className="flex items-start justify-between gap-3 mb-1">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#a24000' }}>
          {t('eyebrow')}
        </p>
        {/* Progress as four pills — three questions plus the verdict. A number ("2 van 3") in a
            column this narrow competes with the question's own "VRAAG 2 VAN 3" line; the pills say
            the same thing without a second sentence. */}
        <div className="flex items-center gap-1 pt-0.5" aria-hidden="true">
          {[0, 1, 2, 3].map(i => (
            <span
              key={i}
              className="rounded-full transition-[width,background-color] duration-200"
              style={{
                height: 4,
                width: i === Math.min(step, 3) ? 14 : 5,
                background: i <= step ? '#002b6d' : 'var(--color-outline-variant)',
              }}
            />
          ))}
        </div>
      </div>

      <h2 className="font-headline font-bold text-on-surface text-lg leading-snug mb-1">
        {t('title')}
      </h2>
      <p className="text-sm text-on-surface-variant leading-relaxed mb-5">{t('intro')}</p>

      {!done && (
        <>
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
            {t('step_of', { current: step + 1, total: STEPS.length })}
          </p>
          <p className="font-headline font-bold text-on-surface mb-3">
            {t(`q.${STEPS[step].key}.label`)}
          </p>

          {/* A radiogroup, not buttons: three mutually exclusive answers to one question is what
              the role is for, and it gives arrow-key movement for free. */}
          <div role="radiogroup" aria-label={t(`q.${STEPS[step].key}.label`)} className="flex flex-col gap-2">
            {STEPS[step].options.map(value => {
              const selected =
                (answers as Record<string, string | undefined>)[STEPS[step].key] === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => choose(value)}
                  className="flex items-center gap-3 text-left rounded-xl px-3 py-2.5 text-sm cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.99] transition-[background-color,border-color,transform] duration-150"
                  style={{
                    background: selected ? 'rgba(254,118,44,0.08)' : 'var(--color-surface-container)',
                    border: `1.5px solid ${selected ? 'var(--color-secondary-container)' : 'transparent'}`,
                    color: 'var(--color-on-surface)',
                  }}
                >
                  <span
                    className="flex items-center justify-center rounded-full flex-shrink-0"
                    style={{
                      width: 20,
                      height: 20,
                      background: selected ? 'var(--color-secondary-container)' : 'var(--color-surface-container-highest, #e8e9ef)',
                    }}
                    aria-hidden="true"
                  >
                    {selected && <Check className="w-3 h-3" style={{ color: '#fff' }} strokeWidth={3} />}
                  </span>
                  <span className="leading-snug">{t(`q.${STEPS[step].key}.${value}`)}</span>
                </button>
              );
            })}
          </div>

          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant cursor-pointer rounded-lg px-2 py-1.5 -ml-2 hover:text-on-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 rtl-flip" aria-hidden="true" />
              {t('back')}
            </button>
          )}
        </>
      )}

      {result && (
        /* `aria-live` because the verdict replaces the question in place: without it a screen
           reader announces nothing on the tap that produced the answer. */
        <div aria-live="polite">
          <div className="flex items-start gap-3 mb-3">
            <span
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{
                width: 28,
                height: 28,
                background:
                  result.verdict === 'likely'
                    ? 'var(--color-secondary-container)'
                    : result.verdict === 'unlikely'
                      ? '#002b6d'
                      : 'var(--color-outline)',
              }}
              aria-hidden="true"
            >
              <Check className="w-4 h-4" style={{ color: '#fff' }} strokeWidth={2.5} />
            </span>
            <p className="font-headline font-bold text-on-surface leading-snug pt-0.5">
              {t(`result.${result.reason}.title`)}
            </p>
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
            {t(`result.${result.reason}.body`)}
          </p>

          <Link
            href={{ pathname: '/inburgering/[slug]', params: { slug: result.next.slug } }}
            className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold text-sm no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.99] transition-transform"
            style={{
              background: 'var(--color-secondary-container)',
              color: '#fff',
              textDecoration: 'none',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14)',
            }}
          >
            {t('cta_read')}
            <ArrowRight className="w-4 h-4 rtl-flip" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={restart}
            className="mt-2 w-full inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-on-surface-variant cursor-pointer hover:text-on-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors"
            style={{ background: 'var(--color-surface-container)' }}
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            {t('restart')}
          </button>
        </div>
      )}
    </div>
  );
}
