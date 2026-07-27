import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import ProefexamenEngine from './ProefexamenEngine';
import { fetchAllQuestions } from '@/lib/questions';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'proefexamen' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    alternates: {
      canonical: `https://inburgeringoefenen.nl/${locale}/proefexamen`,
      languages: {
        nl: 'https://inburgeringoefenen.nl/nl/proefexamen',
        en: 'https://inburgeringoefenen.nl/en/proefexamen',
        ar: 'https://inburgeringoefenen.nl/ar/proefexamen',
        'x-default': 'https://inburgeringoefenen.nl/nl/proefexamen',
      },
    },
  };
}

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ exam?: string; source?: string }>;
};

export default async function ProefexamenPage({ searchParams }: Props) {
  const sp = await searchParams;
  const examNum = Math.max(1, Math.min(10, parseInt(sp.exam ?? '1', 10) || 1));
  const isDashboardMode = sp.source === 'dashboard';

  if (examNum >= 2) {
    const cookieStore = await cookies();
    const pwTest = cookieStore.get('__pw_premium__');
    if (!pwTest || pwTest.value !== 'true') {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        redirect(`/activate?upgrade=premium`);
      }

      const tier: string = (user.user_metadata?.tier as string) ?? 'free';
      const isPremium = tier === 'premium' || tier === 'premium_plus';

      if (!isPremium) {
        redirect(`/activate?upgrade=premium`);
      }
    }
  }

  const [t, allQuestions] = await Promise.all([
    getTranslations('proefexamen'),
    fetchAllQuestions(),
  ]);

  const isExam1 = examNum === 1;
  const badgeText = isExam1
    ? t('badge')
    : `${t('badge_num_pre')} ${examNum} · ${t('badge_num_post')}`;
  const headingText = isExam1 ? t('heading') : `KNM Proefexamen ${examNum}`;
  const breadcrumbText = isExam1 ? t('breadcrumb') : `${t('breadcrumb_num_pre')} ${examNum}`;

  return (
    <>
      {isDashboardMode && (
        <div className="fixed top-0 w-full z-50 bg-white border-b border-outline-variant/30">
          <div className="max-w-5xl mx-auto px-6 py-3.5 flex items-center justify-between">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors no-underline"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Dashboard
            </Link>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-5 bg-secondary-container rounded-full" />
              <span className="text-base font-extrabold tracking-tight text-primary font-headline">
                Inburgering Oefenen
              </span>
            </div>
            <span className="text-xs text-on-surface-variant hidden sm:block" />
          </div>
        </div>
      )}

      <nav aria-label="Breadcrumb" className="pt-12 pb-0 px-6 bg-surface">
        <div className="max-w-3xl mx-auto py-3 flex items-center gap-2 text-xs text-on-surface-variant">
          <Link href="/" className="hover:text-primary transition-colors no-underline">
            Home
          </Link>
          <span>›</span>
          <span className="text-on-surface font-medium">{breadcrumbText}</span>
        </div>
      </nav>

      <main>
        <div className="bg-surface pb-8 px-6">
          <div className="max-w-3xl mx-auto">
            <span
              className="inline-flex items-center gap-2 px-3 py-1 font-bold text-xs uppercase tracking-widest rounded-full mb-4 text-primary"
              style={{ background: 'rgba(0,43,109,0.06)' }}
            >
              {badgeText}
            </span>
            <h1 className="font-headline font-extrabold text-3xl md:text-4xl text-primary tracking-tight mb-3">
              {headingText}
            </h1>
            <p className="text-on-surface-variant text-base leading-relaxed max-w-xl">
              {t('description')}
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto sm:px-6 pb-24 mt-8">
          <ProefexamenEngine examNum={examNum} isDashboardMode={isDashboardMode} allQuestions={allQuestions} />
        </div>
      </main>
    </>
  );
}
