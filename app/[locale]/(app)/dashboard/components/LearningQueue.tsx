'use client';

import { useTranslations } from 'next-intl';
import { BookOpen, RotateCcw, Lock } from 'lucide-react';
import type { LerenLink } from '@/lib/leren-links';
import { buildLerenHref } from '@/lib/leren-links';

export type QueueItem = {
  sectionId: number;
  sectionName: string;
  topic: string;
  /** Uit `LEREN_CATEGORY_META`; in Glas niet meer getoond — er staat geen emoji in de UI. */
  icon: string;
  mistakes: number;
  exampleQuestion: string;
  lerenLink: LerenLink | null;
  wrongQuestionIds: number[];
};

type Props = {
  items: QueueItem[];
  plan: 'free' | 'premium' | 'premium_plus';
  locale: string;
  onPractice: (ids: number[]) => void;
};

/** De foutenwachtrij per sectie, in Glas: een witte kaart per sectie, het waarom in klei. */
export default function LearningQueue({ items, plan, locale, onPractice }: Props) {
  const t = useTranslations('dashboard');
  const canLearn = plan === 'premium_plus';

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => {
        const learnHref = item.lerenLink ? buildLerenHref(locale, item.lerenLink) : null;
        return (
          <section key={item.sectionId} className="g-card">
            <div className="flex items-center gap-3">
              <span className="g-steprow-n">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <b className="block truncate font-headline text-[15px] text-ink">{item.sectionName}</b>
                <span className="block text-[12.5px] text-ink-2">{item.topic}</span>
              </span>
            </div>

            <div className="g-notice g-notice-klei">
              <span>
                <b className="block text-klei">{t('queue_why', { count: item.mistakes })}</b>
                <span className="text-ink-2 italic">&ldquo;{item.exampleQuestion}&rdquo;</span>
              </span>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {canLearn && learnHref ? (
                <a href={learnHref} className="g-btn g-btn-navy g-btn-sm">
                  <BookOpen aria-hidden />
                  {t('queue_learn_section')}
                </a>
              ) : (
                <a href={`/${locale}/activate?upgrade=plus`} className="g-btn g-btn-ghost g-btn-sm">
                  <Lock aria-hidden />
                  {t('queue_learn_locked')}
                </a>
              )}
              <button
                type="button"
                onClick={() => onPractice(item.wrongQuestionIds)}
                className="g-btn g-btn-ghost g-btn-sm"
              >
                <RotateCcw aria-hidden />
                {t('queue_practice', { count: item.mistakes })}
              </button>
            </div>
          </section>
        );
      })}
    </div>
  );
}
