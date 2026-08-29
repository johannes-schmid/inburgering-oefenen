import AnalyticsProviders from '@/components/AnalyticsProviders';
import DevStateBar from '@/components/dev/DevStateBar';
import { devToolsEnabled } from '@/lib/dev-tools';

export default async function AppLayout({
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
      {children}
      {/* Local only — see lib/dev-tools.ts. Excluded from the tree in prod builds. */}
      {devToolsEnabled() && <DevStateBar locale={locale} />}
    </>
  );
}
