'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';

type Props = { fallbackHref: string; label?: string };

export default function BackLink({ fallbackHref, label }: Props) {
  const router = useRouter();
  const t = useTranslations('dashboard');

  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push(fallbackHref);
  };

  return (
    <button
      type="button"
      onClick={goBack}
      className="hidden md:inline-flex items-center gap-1.5"
      style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', color: '#5a6078', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', marginBottom: 14 }}
      onMouseEnter={e => (e.currentTarget.style.color = '#002b6d')}
      onMouseLeave={e => (e.currentTarget.style.color = '#5a6078')}
    >
      <ArrowLeft size={16} strokeWidth={2.4} />
      {label ?? t('btn_go_back')}
    </button>
  );
}
