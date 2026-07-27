'use client';

import { useState, useEffect, useRef } from 'react';

const WORDS = [
  { article: 'de', dutch: 'betaalpas', en: 'debit card', desc: 'a card to pay directly from your bank account' },
  { article: 'de', dutch: 'gemeente', en: 'municipality', desc: 'the local government of a city or town' },
  { article: 'de', dutch: 'vrijwilliger', en: 'volunteer', desc: 'someone who works without being paid' },
  { article: 'het', dutch: 'huurcontract', en: 'rental contract', desc: 'a written agreement between a tenant and a landlord' },
  { article: 'de', dutch: 'zorgverzekering', en: 'health insurance', desc: 'insurance that covers medical costs' },
  { article: 'de', dutch: 'stemkaart', en: 'voter card', desc: 'an invitation to vote sent before elections' },
];

const AUTO_DELAY = 3200;

export default function HeroWordCard() {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [barWidth, setBarWidth] = useState(0);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const barTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearTimers() {
    if (autoTimer.current) clearTimeout(autoTimer.current);
    if (barTimer.current) clearTimeout(barTimer.current);
  }

  function startBar() {
    setBarWidth(0);
    barTimer.current = setTimeout(() => setBarWidth(100), 30);
  }

  function advance() {
    setFlipped(false);
    autoTimer.current = setTimeout(() => {
      setIdx((i) => (i + 1) % WORDS.length);
      startBar();
      autoTimer.current = setTimeout(() => {
        setFlipped(true);
        autoTimer.current = setTimeout(advance, AUTO_DELAY);
      }, AUTO_DELAY);
    }, 300);
  }

  function handleClick() {
    clearTimers();
    if (!flipped) {
      setFlipped(true);
      autoTimer.current = setTimeout(advance, AUTO_DELAY);
    } else {
      advance();
    }
  }

  useEffect(() => {
    startBar();
    autoTimer.current = setTimeout(() => {
      setFlipped(true);
      autoTimer.current = setTimeout(advance, AUTO_DELAY);
    }, AUTO_DELAY);
    return clearTimers;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const word = WORDS[idx];

  return (
    <div
      onClick={handleClick}
      title="Tik om te omdraaien"
      style={{ perspective: '800px', cursor: 'pointer', width: '100%' }}
    >
      <div style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.12)' }}>
        <div
          style={{
            position: 'relative',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.55s cubic-bezier(0.4,0,0.2,1)',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front */}
          <div
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              borderRadius: '16px',
              background: 'rgba(255,255,255,0.96)',
              border: '1.5px solid rgba(255,255,255,0.5)',
              padding: '18px 20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#002b6d' }}>Woordkaart</span>
              <span style={{ fontSize: '0.75rem', color: '#747782' }}>🇬🇧</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a24000' }}>{word.article}</span>
              <span style={{ fontFamily: 'var(--font-headline)', fontWeight: 800, fontSize: '1.25rem', lineHeight: 1.2, color: 'var(--color-on-surface)' }}>{word.dutch}</span>
            </div>
            <p style={{ fontSize: '0.75rem', marginTop: '2px', color: '#747782' }}>Tik voor vertaling ↩</p>
            <div style={{ height: '2px', background: 'rgba(0,43,109,0.12)', borderRadius: '2px', overflow: 'hidden', marginTop: '10px' }}>
              <div
                style={{
                  height: '100%',
                  background: 'linear-gradient(to right, #002b6d, #1d428a)',
                  borderRadius: '2px',
                  width: `${barWidth}%`,
                  transition: `width ${AUTO_DELAY}ms linear`,
                }}
              />
            </div>
          </div>

          {/* Back */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transform: 'rotateY(180deg)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              borderRadius: '16px',
              background: 'rgba(255,255,255,0.96)',
              border: '1.5px solid rgba(255,255,255,0.5)',
              padding: '18px 20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#002b6d' }}>Vertaling</span>
              <span style={{ fontSize: '0.75rem', color: '#747782' }}>🇬🇧</span>
            </div>
            <p style={{ fontFamily: 'var(--font-headline)', fontWeight: 800, fontSize: '1.25rem', lineHeight: 1.2, color: 'var(--color-on-surface)', marginBottom: '4px' }}>{word.en}</p>
            <p style={{ fontSize: '0.75rem', lineHeight: 1.5, color: '#434651' }}>{word.desc}</p>
            <div style={{ height: '2px', background: 'rgba(0,43,109,0.12)', borderRadius: '2px', overflow: 'hidden', marginTop: '10px' }}>
              <div style={{ height: '100%', background: 'linear-gradient(to right, #002b6d, #1d428a)', borderRadius: '2px', width: '100%', opacity: 0.25 }} />
            </div>
          </div>
        </div>
      </div>
      <p style={{ textAlign: 'center', fontSize: '10px', marginTop: '8px', color: 'rgba(255,255,255,0.5)' }}>366 woordkaarten · EN / AR / TR</p>
    </div>
  );
}
