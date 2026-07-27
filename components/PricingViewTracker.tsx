'use client';

import { useEffect } from 'react';
import { track } from '@/lib/analytics';

export default function PricingViewTracker() {
  useEffect(() => {
    track('pricing_page_viewed');
  }, []);

  return null;
}
