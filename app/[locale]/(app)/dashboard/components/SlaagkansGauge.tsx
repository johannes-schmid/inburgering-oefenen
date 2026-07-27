'use client';

import { useTranslations } from 'next-intl';
import type { SlaagkansBand } from '@/lib/exam-readiness';

type Props = {
  value: number;
  examsCount: number;
  avgScore: number;
  band: SlaagkansBand;
  variant?: 'light' | 'dark';
  bare?: boolean;
};

const CX = 170;
const CY = 170;
const R = 130;
const STROKE = 18;
const START_ANGLE = 129;
const SWEEP = 282;
const TICKS = [20, 40, 60, 80];
const BAND_KEYS: { key: 'low' | 'moderate' | 'fair' | 'good' | 'high'; center: number }[] = [
  { key: 'low', center: 10 },
  { key: 'moderate', center: 30 },
  { key: 'fair', center: 50 },
  { key: 'good', center: 70 },
  { key: 'high', center: 90 },
];

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const a = toRad(angleDeg);
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, sweepAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, startAngle + sweepAngle);
  const largeArc = sweepAngle > 180 ? 1 : 0;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

export default function SlaagkansGauge({ value, examsCount, avgScore, band, variant = 'light', bare = false }: Props) {
  const t = useTranslations('dashboard');
  const dark = variant === 'dark';

  const c = {
    track: dark ? 'rgba(255,255,255,0.13)' : '#eceef2',
    tick: dark ? 'rgba(255,255,255,0.28)' : '#dfe3ea',
    bandActive: dark ? '#ff9d5e' : '#d94f00',
    bandIdle: dark ? 'rgba(255,255,255,0.45)' : '#a2a7b5',
    markerStroke: dark ? '#ffb488' : '#1d428a',
    value: dark ? '#fff' : '#191c1e',
    label: dark ? 'rgba(255,255,255,0.6)' : '#8a8fa0',
    footer: dark ? 'rgba(255,255,255,0.45)' : '#8a8fa0',
  };

  const trackPath = describeArc(CX, CY, R, START_ANGLE, SWEEP);
  const progressSweep = (value / 100) * SWEEP;
  const progressPath = describeArc(CX, CY, R, START_ANGLE, progressSweep);
  const labelArcPath = describeArc(CX, CY, R + 38, START_ANGLE, SWEEP);
  const marker = polarToCartesian(CX, CY, R, START_ANGLE + progressSweep);

  const gauge = (
      <svg viewBox="0 -10 340 320" style={{ display: 'block', width: '100%', height: 'auto' }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="knmArc" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#d94f00" />
            <stop offset="0.55" stopColor="#fe762c" />
            <stop offset="1" stopColor="#1d428a" />
          </linearGradient>
          <radialGradient id="knmGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="rgba(254,118,44,0.42)" />
            <stop offset="0.55" stopColor="rgba(254,118,44,0.14)" />
            <stop offset="1" stopColor="rgba(254,118,44,0)" />
          </radialGradient>
          <path id="knmLabelArc" d={labelArcPath} fill="none" />
        </defs>

        <circle cx={CX} cy={CY} r={96} fill="url(#knmGlow)" />

        <path d={trackPath} fill="none" stroke={c.track} strokeWidth={STROKE} strokeLinecap="round" />
        {examsCount > 0 && (
          <path d={progressPath} fill="none" stroke="url(#knmArc)" strokeWidth={STROKE} strokeLinecap="round" />
        )}
        {examsCount > 0 && (
          <circle cx={marker.x} cy={marker.y} r={9} fill="#fff" stroke={c.markerStroke} strokeWidth={4} />
        )}

        {TICKS.map(pct => {
          const angle = START_ANGLE + (pct / 100) * SWEEP;
          const p1 = polarToCartesian(CX, CY, R - 21, angle);
          const p2 = polarToCartesian(CX, CY, R - 39, angle);
          return (
            <line key={pct} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={c.tick} strokeWidth={2.5} strokeLinecap="round" />
          );
        })}

        {BAND_KEYS.map(b => {
          const isActive = band === b.key;
          return (
            <text
              key={b.key}
              fontFamily="var(--font-body, system-ui, sans-serif)"
              fontSize={isActive ? 12.5 : 12}
              fontWeight={isActive ? 800 : 700}
              letterSpacing="1.2"
              fill={isActive ? c.bandActive : c.bandIdle}
              style={{ textTransform: 'uppercase' }}
            >
              <textPath href="#knmLabelArc" startOffset={`${b.center}%`} textAnchor="middle">
                {t(`slaagkans_band_${b.key}`)}
              </textPath>
            </text>
          );
        })}

        <text x={CX} y={176} textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontSize={64} fill={c.value}>
          {examsCount > 0 ? `${value}%` : '—'}
        </text>
        <text x={CX} y={200} textAnchor="middle" fontFamily="var(--font-body, system-ui, sans-serif)" fontSize={11} fontWeight={700} letterSpacing="2.5" fill={c.label} style={{ textTransform: 'uppercase' }}>
          {t('slaagkans_label')}
        </text>
      </svg>
  );

  if (bare) return gauge;

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #eceef4',
        borderRadius: 24,
        padding: '18px 14px 20px',
        boxShadow: 'var(--shadow-card-md, 0 2px 16px rgba(0,43,109,0.06))',
      }}
    >
      {gauge}
      <div style={{ textAlign: 'center', fontSize: 12, color: c.footer, marginTop: 2 }}>
        {examsCount > 0
          ? t('slaagkans_footer', { count: examsCount, avg: avgScore })
          : t('slaagkans_footer_empty')}
      </div>
    </div>
  );
}
