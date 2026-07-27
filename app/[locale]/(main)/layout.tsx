import { Suspense } from 'react';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import KnmLoader from '@/components/KnmLoader';
import AnalyticsProviders from '@/components/AnalyticsProviders';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AnalyticsProviders />
      <Nav />
      <div className="pt-20">
        <Suspense fallback={<KnmLoader fullPage={false} />}>
          {children}
        </Suspense>
      </div>
      <Footer />
    </>
  );
}
