import type { ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import LogoMark from '@/components/site/LogoMark';

/**
 * The card the three auth screens sit in. One shell so login, register and admin-login
 * cannot drift apart visually, which is exactly what had happened in the fork — the admin
 * screen still said "KNM Admin" above a padlock emoji.
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
    <div className="min-h-screen flex flex-col bg-surface">
      <header className="bg-surface-container-lowest" style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <LogoMark size={30} />
            <span className="text-lg font-extrabold tracking-tight text-primary font-headline">
              Inburgering Oefenen
            </span>
          </Link>
          {showHeaderCta && (
            <Link href="/premium" className="text-sm font-semibold text-primary hover:underline no-underline">
              Bekijk de pakketten →
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-14">
        <div className="w-full max-w-sm">
          <div
            className="bg-surface-container-lowest rounded-2xl p-7"
            style={{ boxShadow: 'var(--shadow-card-lg)', border: '1px solid var(--color-outline-variant)' }}
          >
            <h1
              className="font-headline font-extrabold text-on-surface mb-1.5"
              style={{ fontSize: '1.3rem', letterSpacing: '-0.02em', textWrap: 'balance' }}
            >
              {title}
            </h1>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-6">{intro}</p>
            {children}
          </div>
          {footer && <div className="text-center mt-5 text-sm text-on-surface-variant">{footer}</div>}
        </div>
      </main>

      <footer
        className="text-center py-6 text-xs text-on-surface-variant"
        style={{ borderTop: '1px solid var(--color-outline-variant)' }}
      >
        © 2026 Inburgering Oefenen ·{' '}
        <a
          href="mailto:contact@inburgeringoefenen.nl"
          className="hover:text-primary no-underline transition-colors"
        >
          contact@inburgeringoefenen.nl
        </a>
      </footer>
    </div>
  );
}
