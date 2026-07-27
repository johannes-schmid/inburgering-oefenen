'use client';

import { useTranslations } from 'next-intl';
import { RotateCcw, CircleDashed, CheckCircle2, ChevronRight } from 'lucide-react';
import type { LearningQueues } from '@/lib/learning-queues';

type Props = { queues: LearningQueues; locale: string };

export default function QueueSummary({ queues, locale }: Props) {
  const t = useTranslations('dashboard');
  const { counts, sectionQueues } = queues;

  const tiles = [
    { n: counts.mistakes, label: t('queue_mistakes'), color: '#d94f00', Icon: RotateCcw },
    { n: counts.open, label: t('queue_open'), color: '#1d428a', Icon: CircleDashed },
    { n: counts.mastered, label: t('queue_mastered'), color: '#1a7a3c', Icon: CheckCircle2 },
  ];

  const weakSections = sectionQueues.filter(s => s.mistakes > 0).slice(0, 3);

  return (
    <div style={{ background: '#fff', border: '1px solid #e6e9f0', borderRadius: 20, padding: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#8a8fa0', marginBottom: 12 }}>
        {t('queue_title')}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: weakSections.length ? 16 : 0 }}>
        {tiles.map(tile => (
          <div key={tile.label} style={{ flex: 1, background: '#f6f8fc', border: '1px solid #eceef4', borderRadius: 14, padding: '12px 12px 11px' }}>
            <div style={{ fontFamily: 'var(--font-manrope), Manrope, sans-serif', fontSize: 24, fontWeight: 800, color: tile.color, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{tile.n}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, color: '#5a6078', marginTop: 4 }}>
              <tile.Icon size={13} strokeWidth={2.2} color={tile.color} />
              <span>{tile.label}</span>
            </div>
          </div>
        ))}
      </div>

      {weakSections.length > 0 && (
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#002b6d', marginBottom: 8 }}>{t('queue_sections_title')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {weakSections.map(s => (
              <a
                key={s.sectionId}
                href={`/${locale}/dashboard?view=exams&openTopic=${encodeURIComponent(s.topic)}`}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 11px', borderRadius: 11, background: '#fff', border: '1px solid #eceef4', textDecoration: 'none' }}
              >
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#191c1e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
                  <span style={{ display: 'block', fontSize: 11, color: '#8a8fa0' }}>{s.topic}</span>
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#d94f00', whiteSpace: 'nowrap' }}>{t('section_mistakes', { count: s.mistakes })}</span>
                <ChevronRight size={15} strokeWidth={2.2} color="#c4c6d2" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
