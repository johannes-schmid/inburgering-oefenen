'use client';

import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { RotateCcw, ArrowRight } from 'lucide-react';
import type { TopicStat } from '@/lib/exam-readiness';
import type { MariekeMessage } from '@/lib/marieke-insights';
import WeaknessBreakdown from './WeaknessBreakdown';

type Props = {
  message: MariekeMessage;
  topicProgress: Record<string, TopicStat>;
  hasMistakes: boolean;
};

export default function MariekeFeedback({ message, topicProgress, hasMistakes }: Props) {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const analyseHref = `/${locale}/dashboard/analyse`;
  const msgKey = message.key as Parameters<typeof t>[0];

  return (
    <div
      style={{
        background: 'linear-gradient(180deg,#ffffff 0%,#f5f8fc 100%)',
        border: '1px solid #e6eaf1',
        borderRadius: 20,
        padding: '22px 24px',
        boxShadow: '0 6px 20px rgba(0,27,78,0.06)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 18,
      }}
    >
      {/* Marieke quote */}
      <div style={{ display: 'flex', gap: 13, alignItems: 'flex-start' }}>
        <div style={{ flex: 'none', width: 42, height: 42, borderRadius: '50%', overflow: 'hidden', position: 'relative', border: '2px solid #e6eaf1' }}>
          <Image src="/images/marieke-schipper.jpg" alt="Marieke" fill sizes="42px" style={{ objectFit: 'cover', objectPosition: '65% 30%' }} />
        </div>
        <div style={{ fontSize: 14.5, color: '#26324a', lineHeight: 1.55, paddingTop: 1 }}>
          <b style={{ color: '#d94f00' }}>Marieke:</b>{' '}
          &ldquo;{message.topic
            ? t.rich(msgKey, {
                ...message.params,
                topicLink: chunks => (
                  <a href={`${analyseHref}?topic=${encodeURIComponent(message.topic!)}`} style={{ color: '#002b6d', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                    {chunks}
                  </a>
                ),
              })
            : t(msgKey, message.params)}&rdquo;
        </div>
      </div>

      {/* Weakness breakdown bars */}
      <WeaknessBreakdown topicProgress={topicProgress} locale={locale} variant="light" />

      {/* Subtle CTA row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        {hasMistakes && (
          <a
            href={`/${locale}/dashboard/fouten`}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              borderRadius: 11, padding: '10px 18px', fontSize: 13.5, fontWeight: 700,
              border: '1.5px solid #d7deea', color: '#002b6d', background: '#fff', textDecoration: 'none',
            }}
          >
            <RotateCcw size={16} strokeWidth={2.2} />
            {t('marieke_review_mistakes')}
          </a>
        )}
        <a
          href={analyseHref}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#4f74ab', textDecoration: 'none' }}
        >
          {t('hero_view_analysis')}
          <ArrowRight size={14} strokeWidth={2.4} />
        </a>
      </div>
    </div>
  );
}
