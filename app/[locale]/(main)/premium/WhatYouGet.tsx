'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Pause, Play } from 'lucide-react';

export type Slide = { key: string; title: string; desc: string; screen: ReactNode };

/**
 * "Dit krijg je" als telefoon met vijf schermen ernaast (naar het voorbeeld van Superpower).
 * Het scherm wisselt vanzelf; de tijd zit in de CSS-animatie van het voortgangsstreepje, en
 * `animationend` schuift door. Daardoor pauzeert alles met één `animation-play-state`: bij hover,
 * bij focus, buiten beeld, of met de knop. Bij "beweging verminderen" loopt er niets vanzelf.
 */
export default function WhatYouGet({ slides, heading, footer }: { slides: Slide[]; heading: ReactNode; footer?: ReactNode }) {
  const t = useTranslations('premium_page');
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const running = visible && !paused && !held;
  const go = (n: number) => setI((n + slides.length) % slides.length);

  return (
    <div className="g-wyg" ref={ref}>
      <div className="g-wyg-head">{heading}</div>
      <div
        className="g-wyg-stage-col"
        onPointerEnter={() => setHeld(true)}
        onPointerLeave={() => setHeld(false)}
      >
        <div className="g-wyg-stage" aria-hidden="true">
          <div className="g-wyg-glow" />
          <div className="g-wyg-phone">
            <div className="g-wyg-screen" dir="ltr" lang="nl">
              <div className="g-wyg-status"><span>9:41</span><i /></div>
              {slides.map((s, n) => (
                <div key={s.key} className="g-wyg-slide" data-on={n === i || undefined}>
                  {s.screen}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="g-wyg-nav">
          <div className="g-wyg-segs" data-running={running || undefined}>
            {slides.map((s, n) => (
              <button
                key={s.key}
                type="button"
                className="g-wyg-seg"
                data-state={n < i ? 'done' : n === i ? 'now' : undefined}
                aria-label={t('get_slide_label', { n: n + 1, title: s.title })}
                aria-current={n === i || undefined}
                onClick={() => go(n)}
              >
                <i key={n === i ? `now-${i}` : 'idle'} onAnimationEnd={() => go(i + 1)} />
              </button>
            ))}
          </div>
          <button
            type="button"
            className="g-wyg-pp"
            onClick={() => setPaused(p => !p)}
            aria-label={paused ? t('get_play') : t('get_pause')}
          >
            {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
          </button>
          <span className="g-wyg-count g-tnum" aria-hidden="true">{i + 1} / {slides.length}</span>
        </div>
      </div>

      <div className="g-wyg-copy">
        <ol className="g-wyg-list">
          {slides.map((s, n) => (
            <li key={s.key}>
              <button
                type="button"
                data-on={n === i || undefined}
                onClick={() => { go(n); setPaused(true); }}
                onFocus={() => setHeld(true)}
                onBlur={() => setHeld(false)}
              >
                <b>{s.title}</b>
                <span>{s.desc}</span>
              </button>
            </li>
          ))}
        </ol>
        {footer}
      </div>
    </div>
  );
}
