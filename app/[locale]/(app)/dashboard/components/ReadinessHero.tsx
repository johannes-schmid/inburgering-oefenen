'use client';

import { useTranslations } from 'next-intl';
import { Zap } from 'lucide-react';
import { levelForXp } from '@/lib/xp';
import type { SlaagkansBand } from '@/lib/exam-readiness';
import SlaagkansGauge from './SlaagkansGauge';

type Props = {
  slaagkans: number;
  band: SlaagkansBand;
  examsCount: number;
  avgScore: number;
  xp: number | null;
};

export default function ReadinessHero({ slaagkans, band, examsCount, avgScore, xp }: Props) {
  const t = useTranslations('dashboard');
  const level = xp != null ? levelForXp(xp).level : 1;

  return (
    <div
      className="rh-card"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: '#fff',
        border: '1px solid #eceef4',
        borderRadius: 24,
        padding: '16px 16px 16px',
        boxShadow: '0 2px 16px rgba(0,43,109,0.06)',
      }}
    >
      <div className="rh-gauge-wrap" style={{ margin: '0 auto' }}>
        <SlaagkansGauge value={slaagkans} examsCount={examsCount} avgScore={avgScore} band={band} variant="light" bare />
      </div>

      <div style={{ textAlign: 'center', fontSize: 12, color: '#8a8fa0', marginTop: 2 }}>
        {examsCount > 0 ? t('slaagkans_footer', { count: examsCount, avg: avgScore }) : t('slaagkans_footer_empty')}
      </div>

      {xp != null && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: '#002b6d', background: 'rgba(0,43,109,0.06)', border: '1px solid rgba(0,43,109,0.1)', borderRadius: 999, padding: '5px 13px', fontVariantNumeric: 'tabular-nums' }}>
            <Zap size={13} fill="#fe762c" stroke="none" />
            {xp.toLocaleString('nl-NL')} XP · {t('xp_level_short', { level })}
          </div>
        </div>
      )}
    </div>
  );
}
