'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { sendGAEvent } from '@next/third-parties/google';

export default function GoogleAnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirst = useRef(true);

  useEffect(() => {
    // Skip the very first render — GoogleAnalytics already fires the initial page_view
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    const url = pathname + (searchParams.toString() ? '?' + searchParams.toString() : '');
    sendGAEvent('event', 'page_view', {
      page_path: url,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}
