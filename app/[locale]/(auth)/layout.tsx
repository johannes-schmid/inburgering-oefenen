import AnalyticsProviders from '@/components/AnalyticsProviders';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AnalyticsProviders />
      {children}
    </>
  );
}
