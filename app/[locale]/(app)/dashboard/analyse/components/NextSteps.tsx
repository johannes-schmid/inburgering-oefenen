'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import type { Recommendation } from '@/lib/learning-queues';

type Props = { recommendations: Recommendation[]; locale: string };

export default function NextSteps({ recommendations, locale }: Props) {
  const t = useTranslations('dashboard');
  const dash = `/${locale}/dashboard`;

  function render(rec: Recommendation): { text: string; cta: string; href: string } {
    switch (rec.type) {
      case 'repeat_mistakes':
        return { text: t('next_step_repeat_mistakes', { count: rec.count }), cta: t('next_step_cta_mistakes'), href: `${dash}/fouten` };
      case 'study_section':
        return { text: t('next_step_study_section', { section: rec.sectionName }), cta: t('next_step_cta_read'), href: `${dash}?view=leren` };
      case 'practice_topic':
        return { text: t('next_step_practice_topic', { topic: rec.topic, count: rec.openCount }), cta: t('next_step_cta_practice'), href: `${dash}?view=exams&openTopic=${encodeURIComponent(rec.topic)}` };
      case 'retake_exam':
        return { text: t('next_step_retake_exam', { number: rec.examNumber, pct: rec.pct }), cta: t('next_step_cta_exam'), href: `${dash}?view=exams` };
      case 'take_exam':
        return { text: t('next_step_take_exam', { number: rec.examNumber }), cta: t('next_step_cta_exam'), href: `${dash}?view=exams` };
    }
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e6e9f0', borderRadius: 20, padding: 18 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: '#002b6d', marginBottom: 10, fontFamily: 'var(--font-manrope), Manrope, sans-serif' }}>
        {t('next_steps_title')}
      </div>

      {recommendations.length === 0 ? (
        <p style={{ fontSize: 13.5, color: '#5a6078', margin: 0, lineHeight: 1.5 }}>{t('next_steps_empty')}</p>
      ) : (
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, counterReset: 'step' }}>
          {recommendations.map((rec, i) => {
            const { text, cta, href } = render(rec);
            return (
              <li
                key={i}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0',
                  borderBottom: i < recommendations.length - 1 ? '1px solid #edeef3' : 'none',
                }}
              >
                <span style={{ flex: 'none', width: 24, height: 24, borderRadius: '50%', background: '#002b6d', color: '#fff', fontSize: 12.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                <span style={{ flex: 1, fontSize: 14, color: '#33415a', lineHeight: 1.4 }}>{text}</span>
                <a href={href} style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700, color: '#d94f00', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  {cta}
                  <ArrowRight size={14} strokeWidth={2.4} />
                </a>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
