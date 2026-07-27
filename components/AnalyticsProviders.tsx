import { Suspense } from 'react';
import { GoogleAnalytics } from '@next/third-parties/google';
import GoogleAnalyticsTracker from './GoogleAnalyticsTracker';
import MicrosoftClarity from './MicrosoftClarity';
import { MetaPixel } from './MetaPixel';

export default function AnalyticsProviders() {
  return (
    <>
      <GoogleAnalytics gaId="G-KBZTYHGX2L" />
      <Suspense>
        <GoogleAnalyticsTracker />
      </Suspense>
      <MicrosoftClarity />
      <MetaPixel />
    </>
  );
}
