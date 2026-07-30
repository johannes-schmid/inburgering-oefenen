import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import AuthShell from '@/components/auth/AuthShell';
import AuthPanel from '@/components/auth/AuthPanel';
import { authErrorMessage, safeNext } from '@/lib/auth-redirect';

export const metadata: Metadata = {
  title: 'Inloggen | Inburgering Oefenen',
  robots: { index: false, follow: true },
};

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { next, error } = await searchParams;

  // Redirecting an already-signed-in visitor server-side rather than from a `useEffect`
  // avoids the flash of the login card that the KNM version showed on every visit.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect(safeNext(next ?? null, `/${locale}/dashboard`));

  return (
    <AuthShell
      title="Welkom terug"
      intro="Log in om verder te gaan met je oefenexamens en je voortgang te bekijken."
      footer={
        <>
          Nog geen account?{' '}
          <Link href="/register" className="text-primary font-semibold hover:underline no-underline">
            Maak er een aan
          </Link>
        </>
      }
    >
      <AuthPanel mode="login" locale={locale} next={next ?? null} initialError={authErrorMessage(error)} />
      <p className="text-xs text-on-surface-variant text-center mt-5 leading-relaxed">
        Door in te loggen ga je akkoord met onze{' '}
        <Link href="/gebruiksvoorwaarden" className="text-primary hover:underline no-underline">
          gebruiksvoorwaarden
        </Link>
        .
      </p>
    </AuthShell>
  );
}
