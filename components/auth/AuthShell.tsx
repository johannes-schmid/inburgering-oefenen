import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import LogoMark from '@/components/site/LogoMark';
import { Field, GlassCard } from '@/components/glas';

/**
 * The card the auth screens sit in. One shell so login, admin-login and the OAuth consent
 * cannot drift apart visually, which is exactly what had happened in the fork — the admin
 * screen still said "KNM Admin" above a padlock emoji.
 *
 * Glas v1.0: één rustig veld (`licht`, geen gloed — dit scherm heeft geen wijzer nodig) achter de
 * hele pagina, het formulier op sterk glas (regel 06), geen lijnen om kop of voet.
 */
export default function AuthShell({
  title,
  intro,
  children,
  footer,
  showHeaderCta = true,
}: {
  title: string;
  intro: string;
  children: ReactNode;
  footer?: ReactNode;
  showHeaderCta?: boolean;
}) {
  return (
    <Field variant="licht" className="auth-g-page">
      <header className="g-wrap w-full flex items-center justify-between gap-4 py-5">
        <Link href="/" className="auth-g-brand">
          <LogoMark size={32} />
          <span className="auth-g-brand-name">Inburgering Oefenen</span>
        </Link>
        {showHeaderCta && (
          <Link href="/premium" className="g-tlink text-sm whitespace-nowrap">
            Bekijk de pakketten
            <ArrowRight size={16} className="rtl-flip" aria-hidden />
          </Link>
        )}
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-[420px]">
          <GlassCard strong className="auth-g-card">
            <h1 className="auth-g-title">{title}</h1>
            <p className="auth-g-intro">{intro}</p>
            {children}
          </GlassCard>
          {footer && <div className="auth-g-note mt-6 text-sm">{footer}</div>}
        </div>
      </main>

      <footer className="auth-g-foot">
        © 2026 Inburgering Oefenen ·{' '}
        <a href="mailto:contact@inburgeringoefenen.nl" className="auth-g-link font-normal">
          contact@inburgeringoefenen.nl
        </a>
      </footer>
    </Field>
  );
}
