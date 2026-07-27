'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import type { TopicStat } from '@/lib/exam-readiness';

type Props = {
  topicProgress: Record<string, TopicStat>;
  locale: string;
  variant?: 'light' | 'dark';
};

function barColor(pct: number, dark: boolean) {
  if (dark) return pct < 70 ? '#f6924e' : '#7aa6e6';
  return pct < 70 ? '#e07a3c' : '#4f74ab';
}

export default function WeaknessBreakdown({ topicProgress, locale, variant = 'light' }: Props) {
  const t = useTranslations('dashboard');
  const dark = variant === 'dark';

  const attempted = Object.entries(topicProgress)
    .map(([title, s]) => ({
      title,
      pct: s.total > 0 ? Math.round((s.mastered / s.total) * 100) : 0,
      answered: s.mastered + s.reviewing,
    }))
    .filter(x => x.answered > 0)
    .sort((a, b) => a.pct - b.pct);

  if (attempted.length === 0) return null;

  const shown = attempted.slice(0, 3);
  const labelColor = dark ? '#dbe4f5' : '#26324a';
  const headColor = dark ? 'rgba(255,255,255,0.5)' : '#9aa0b0';
  const track = dark ? 'rgba(255,255,255,0.14)' : '#eef0f4';
  const hintColor = dark ? 'rgba(255,255,255,0.8)' : '#4f74ab';

  const weakCount = attempted.filter(x => x.pct < 70).length;
  const weakestIsWeak = shown[0].pct < 70;
  const moreOnMobile = Math.max(0, weakCount - (weakestIsWeak ? 1 : 0));

  return (
    <div>
      <style>{`
        @media (max-width:767px){ .wb-row.wb-extra{ display:none !important; } }
        @media (min-width:768px){ .wb-hint{ display:none !important; } }
      `}</style>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: headColor, marginBottom: 12 }}>
        {t('weakness_title')} · {t('topics_weakest_first')}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {shown.map((topic, i) => (
          <div key={topic.title} className={`wb-row${i > 0 ? ' wb-extra' : ''}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: labelColor }}>{topic.title}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: barColor(topic.pct, dark), fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{topic.pct}%</span>
            </div>
            <div style={{ height: 7, borderRadius: 999, background: track, overflow: 'hidden' }}>
              <div style={{ width: `${topic.pct}%`, height: '100%', borderRadius: 999, background: barColor(topic.pct, dark) }} />
            </div>
          </div>
        ))}
      </div>

      {moreOnMobile > 0 && (
        <a
          href={`/${locale}/dashboard/analyse`}
          className="wb-hint"
          style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600, color: hintColor, textDecoration: 'none' }}
        >
          {t('weakness_more_mobile', { count: moreOnMobile })}
          <ArrowRight size={13} strokeWidth={2.4} />
        </a>
      )}
    </div>
  );
}
