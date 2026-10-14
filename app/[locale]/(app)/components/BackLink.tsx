'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';

type Props = { fallbackHref: string; label?: string };

/** "Terug" in Glas-vorm (`.g-lp-back`), voor de twee KNM-schermen analyse en fouten. */
export default function BackLink({ fallbackHref, label }: Props) {
  const router = useRouter();
  const t = useTranslations('dashboard');

  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push(fallbackHref);
  };

  return (
    <button type="button" onClick={goBack} className="g-lp-back g-back">
      <ArrowLeft strokeWidth={2.4} className="rtl-flip" aria-hidden />
      {label ?? t('btn_go_back')}
    </button>
  );
}
