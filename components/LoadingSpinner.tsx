'use client';

import BrandLoader from '@/components/BrandLoader';

export default function LoadingSpinner({ label }: { size?: string; label?: string }) {
  return <BrandLoader label={label} />;
}
