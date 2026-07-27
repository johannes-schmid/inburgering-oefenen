import AnalyticsProviders from '@/components/AnalyticsProviders';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AnalyticsProviders />
      {children}
    </>
  );
}
