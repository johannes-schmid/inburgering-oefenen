import { setRequestLocale } from 'next-intl/server';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import AnalyticsProviders from '@/components/AnalyticsProviders';
import { devToolsEnabled } from '@/lib/dev-tools';

export default async function MainLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  /* Lazy én achter een compile-time `NODE_ENV`-check. Een statische import zette de client-chunk
   * van `DevStateBar` — met de hele Supabase-client, 64 KB brotli — in élke publieke pagina; een
   * `import()` achter alleen `devToolsEnabled()` deed dat ook nog, want de bundler kan een
   * functieaanroep niet wegvouwen. De letterlijke `process.env.NODE_ENV`-vergelijking wél. */
  const DevStateBar =
    process.env.NODE_ENV !== 'production' && devToolsEnabled()
      ? (await import('@/components/dev/DevStateBar')).default
      : null;
  return (
    <>
      <AnalyticsProviders />
      <Nav />
      {/* Geen Suspense-grens met een loader om de pagina heen. Met die grens schreef React de
          shell — nav, loader, footer — eerst uit en zette de pagina-inhoud pas aan het einde van
          het (350 KB grote) document erin, óók in de statisch gerenderde HTML. Op mobiel 4G was
          dat een LCP van 7,5 s en 0,6 CLS: de footer stond eerst bovenin en schoof daarna weg.
          Een pagina die een eigen laadtoestand wil, zet een `loading.tsx` of een grens rond
          precies het deel dat wacht. */}
      <div className="pt-[var(--nav-h)]">{children}</div>
      <Footer />
      {/* Local only — see lib/dev-tools.ts. Excluded from the tree in prod builds. */}
      {DevStateBar && <DevStateBar locale={locale} />}
    </>
  );
}
