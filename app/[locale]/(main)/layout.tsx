import { Suspense } from 'react';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import BrandLoader from '@/components/BrandLoader';
import AnalyticsProviders from '@/components/AnalyticsProviders';
import DevStateBar from '@/components/dev/DevStateBar';
import { devToolsEnabled } from '@/lib/dev-tools';

export default async function MainLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <>
      <AnalyticsProviders />
      <Nav />
      <div className="pt-[var(--nav-h)]">
        <Suspense fallback={<BrandLoader fullPage={false} />}>
          {children}
        </Suspense>
      </div>
      <Footer />
      {/* Local only — see lib/dev-tools.ts. Excluded from the tree in prod builds. */}
      {devToolsEnabled() && <DevStateBar locale={locale} />}
    </>
  );
}
