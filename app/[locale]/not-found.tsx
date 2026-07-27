import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function NotFound() {
  const t = await getTranslations('not_found');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white px-6 text-center">
      <p className="text-sm font-semibold tracking-wide text-[var(--color-primary)]">404</p>
      <h1 className="text-3xl font-bold tracking-[-0.03em] text-slate-900">{t('title')}</h1>
      <p className="max-w-md text-base leading-[1.7] text-slate-600">{t('description')}</p>
      <Link
        href="/"
        className="rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(0,43,109,0.5)] transition-transform hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] active:scale-[0.98]"
      >
        {t('cta')}
      </Link>
    </div>
  );
}
