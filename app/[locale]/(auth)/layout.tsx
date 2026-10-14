/* De Glas-huid van de auth-schermen; alleen hier geladen, niet in de publieke stylesheet. */
import '@/app/auth-glas.css';
import AnalyticsProviders from '@/components/AnalyticsProviders';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AnalyticsProviders />
      {children}
    </>
  );
}
