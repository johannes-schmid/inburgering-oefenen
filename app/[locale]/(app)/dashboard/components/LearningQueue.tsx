'use client';

import { useTranslations } from 'next-intl';
import { BookOpen, RotateCcw, ChevronRight, Lock } from 'lucide-react';
import type { LerenLink } from '@/lib/leren-links';
import { buildLerenHref } from '@/lib/leren-links';

export type QueueItem = {
  sectionId: number;
  sectionName: string;
  topic: string;
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

export default function LearningQueue({ items, plan, locale, onPractice }: Props) {
  const t = useTranslations('dashboard');
  const canLearn = plan === 'premium_plus';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((item, i) => {
        const learnHref = item.lerenLink ? buildLerenHref(locale, item.lerenLink) : null;
        return (
          <div key={item.sectionId} style={{ background: '#fff', border: '1px solid #e6e9f0', borderRadius: 16, padding: '16px 17px', boxShadow: '0 1px 4px rgba(0,27,78,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ flex: 'none', width: 26, height: 26, borderRadius: '50%', background: '#f0f3f8', color: '#002b6d', fontSize: 12.5, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
              <span style={{ fontSize: 17 }}>{item.icon}</span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: 'block', fontSize: 14.5, fontWeight: 800, color: '#191c1e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.sectionName}</span>
                <span style={{ display: 'block', fontSize: 12, color: '#8a8fa0' }}>{item.topic}</span>
              </span>
            </div>

            {/* Why */}
            <div style={{ marginTop: 11, padding: '10px 12px', background: '#fff7f2', border: '1px solid #ffe2cf', borderRadius: 11 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#a24000' }}>{t('queue_why', { count: item.mistakes })}</div>
              <div style={{ fontSize: 13, color: '#5a6078', lineHeight: 1.45, marginTop: 3, fontStyle: 'italic' }}>&ldquo;{item.exampleQuestion}&rdquo;</div>
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 9, marginTop: 12, flexWrap: 'wrap' }}>
              {canLearn && learnHref ? (
                <a href={learnHref} style={{ flex: 1, minWidth: 150, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 11, padding: '10px 14px', fontSize: 13.5, fontWeight: 700, color: '#fff', textDecoration: 'none', background: 'linear-gradient(135deg,#002b6d,#003580)' }}>
                  <BookOpen size={16} strokeWidth={2.2} />
                  {t('queue_learn_section')}
                </a>
              ) : (
                <a href={`/${locale}/activate?upgrade=plus`} style={{ flex: 1, minWidth: 150, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 11, padding: '10px 14px', fontSize: 13.5, fontWeight: 700, color: '#a24000', textDecoration: 'none', background: 'rgba(162,64,0,0.1)' }}>
                  <Lock size={15} strokeWidth={2.2} />
                  {t('queue_learn_locked')}
                </a>
              )}
              <button
                onClick={() => onPractice(item.wrongQuestionIds)}
                style={{ flex: 1, minWidth: 150, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, border: '1.5px solid #1d428a', color: '#1d428a', background: '#fff', borderRadius: 11, padding: '10px 14px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}
              >
                <RotateCcw size={15} strokeWidth={2.2} />
                {t('queue_practice', { count: item.mistakes })}
                <ChevronRight size={15} strokeWidth={2.2} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
