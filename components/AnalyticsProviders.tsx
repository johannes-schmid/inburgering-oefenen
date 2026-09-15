'use client';

import { Suspense, useEffect, useState } from 'react';
import { GoogleAnalytics } from '@next/third-parties/google';
import GoogleAnalyticsTracker from './GoogleAnalyticsTracker';
import MicrosoftClarity from './MicrosoftClarity';
import { MetaPixel } from './MetaPixel';

/**
 * De drie meetscripts, pas geladen ná de eerste interactie of ná idle.
 *
 * Ze stonden alle drie op `afterInteractive`, wat betekent: zodra React gehydrateerd is. Dat is
 * precies het moment waarop de pagina ook zijn eigen werk doet, en samen kostten ze 160 ms van
 * de 180 ms totale blokkeertijd (Facebook 100, Clarity 34, GTM 25) plus 386 KB. Op een mobiel
 * toestel met 4x tragere CPU is dat het verschil tussen een LCP die wel en niet binnen de
 * norm valt.
 *
 * `afterInteractive` blijft op de `<Script>`-tags zelf staan; wat hier verandert is *wanneer ze
 * gemonteerd worden*. De trigger is de eerste van drie: een echte interactie (scroll, tik,
 * toets), de idle-callback van de browser, of een harde timeout van 4 s. Die timeout is er
 * omdat `requestIdleCallback` op een drukke pagina nooit hoeft te vuren, en een bezoeker die
 * leest zonder te scrollen anders helemaal niet gemeten wordt.
 *
 * **Wat dit kost:** een bezoeker die binnen een fractie van een seconde weer wegklikt, wordt
 * niet geteld. Dat is een bewuste ruil — die sessie levert geen bruikbare data en zijn
 * pageview kostte wel de laadtijd van iedereen anders.
 */
function useDeferredUntilIdleOrInteraction(timeoutMs = 4000): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) return;

    let done = false;
    const fire = () => {
      if (done) return;
      done = true;
      setReady(true);
    };

    const events = ['pointerdown', 'keydown', 'touchstart', 'scroll'] as const;
    for (const event of events) {
      window.addEventListener(event, fire, { once: true, passive: true });
    }

    const idle =
      'requestIdleCallback' in window
        ? window.requestIdleCallback(fire, { timeout: timeoutMs })
        : undefined;
    const timer = window.setTimeout(fire, timeoutMs);

    return () => {
      for (const event of events) window.removeEventListener(event, fire);
      if (idle !== undefined) window.cancelIdleCallback(idle);
      window.clearTimeout(timer);
    };
  }, [ready, timeoutMs]);

  return ready;
}

export default function AnalyticsProviders() {
  const ready = useDeferredUntilIdleOrInteraction();
  if (!ready) return null;

  return (
    <>
      <GoogleAnalytics gaId="G-S2REC7DCXZ" />
      <Suspense>
        <GoogleAnalyticsTracker />
      </Suspense>
      <MicrosoftClarity />
      <MetaPixel />
    </>
  );
}
