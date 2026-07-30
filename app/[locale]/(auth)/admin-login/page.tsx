import type { Metadata } from 'next';
import AuthShell from '@/components/auth/AuthShell';
import AuthPanel from '@/components/auth/AuthPanel';
import { authErrorMessage } from '@/lib/auth-redirect';

export const metadata: Metadata = {
  title: 'Beheer — inloggen',
  robots: { index: false, follow: false },
};

/**
 * Lives in `(auth)`, not `(admin)`: the admin layout redirects unauthenticated visitors to
 * this page, so putting it inside that layout would be a redirect loop.
 *
 * There is no separate admin credential. Whoever signs in here signs in with the same
 * Supabase account as anyone else; access is decided afterwards by the `admin_users`
 * allowlist that the `(admin)` layout checks. That is why this page cannot itself report
 * "wrong password vs not an admin" — it does not know, and shouldn't.
 */
export default async function AdminLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  const { error } = await searchParams;

  return (
    <AuthShell
      title="Beheer"
      intro="Alleen accounts op de toegangslijst kunnen hier verder."
      showHeaderCta={false}
    >
      <AuthPanel
        mode="admin"
        locale={locale}
        next={`/${locale}/admin`}
        initialError={authErrorMessage(error)}
      />
    </AuthShell>
  );
}
