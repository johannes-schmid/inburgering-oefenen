'use client';

import { useTranslations } from 'next-intl';
import { Zap } from 'lucide-react';
import { levelForXp } from '@/lib/xp';

type Props = { totalXp: number; compact?: boolean };

export default function XpPill({ totalXp, compact = false }: Props) {
  const t = useTranslations('dashboard');
  const { level, intoLevel, span, next } = levelForXp(totalXp);
  const name = t(`xp_level_${level}` as Parameters<typeof t>[0]);
  const pctToNext = span ? Math.min(100, Math.round((intoLevel / span) * 100)) : 100;

  return (
    <div style={{ background: '#002b6d', borderRadius: 16, padding: compact ? '11px 14px' : '13px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <span style={{ flex: 'none', width: 32, height: 32, borderRadius: 10, background: 'rgba(254,118,44,0.18)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <Zap size={17} fill="#fe762c" stroke="none" />
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-manrope), Manrope, sans-serif', fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
            {totalXp.toLocaleString('nl-NL')} {t('xp_suffix')}
          </div>
          <div style={{ fontSize: 11.5, color: '#a8bce0', fontWeight: 600, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {t('xp_level', { level, name })}
          </div>
        </div>
      </div>
      {next != null && (
        <div style={{ marginTop: 10 }}>
          <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.14)', overflow: 'hidden' }}>
            <div style={{ width: `${pctToNext}%`, height: '100%', borderRadius: 3, background: 'linear-gradient(90deg,#fe762c,#ffa366)' }} />
          </div>
          <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.5)', marginTop: 5, textAlign: 'right' }}>
            {t('xp_to_next', { points: next - totalXp })}
          </div>
        </div>
      )}
    </div>
  );
}
