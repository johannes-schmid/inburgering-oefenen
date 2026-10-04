import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import AuthShell from '@/components/auth/AuthShell';
import AuthPanel from '@/components/auth/AuthPanel';
import ConsentPanel from './ConsentPanel';

/**
 * De toestemmingspagina van de OAuth 2.1-server van Supabase Auth.
 *
 * Een externe client (vandaag: de ChatGPT-app) vraagt toegang namens de kandidaat. Supabase
 * stuurt de browser hierheen met `?authorization_id=…`; wij tonen wie er toegang vraagt en
 * laten de kandidaat goed- of afkeuren. Niet ingelogd → eerst de gewone Google-login, met
 * deze pagina als `next`, zodat de autorisatie na het inloggen gewoon doorloopt.
 *
 * Er komt geen tweede account bij: het is dezelfde Supabase-gebruiker als op de site.
 */
export const metadata: Metadata = {
  title: 'Toegang geven | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ authorization_id?: string }>;
};

export default async function OAuthConsentPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { authorization_id: authorizationId } = await searchParams;

  if (!authorizationId) {
    return (
      <AuthShell title="Deze link is niet compleet" intro="Begin de koppeling opnieuw vanuit de app die toegang vroeg." showHeaderCta={false}>
        <p className="text-sm text-on-surface-variant m-0">Er ontbreekt een autorisatie-id in de link.</p>
      </AuthShell>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const next = `/${locale}/oauth/consent?authorization_id=${encodeURIComponent(authorizationId)}`;
    return (
      <AuthShell
        title="Log eerst in"
        intro="Een app wil toegang tot je oefenvoortgang. Log in met het account dat je op Inburgering Oefenen gebruikt."
        showHeaderCta={false}
      >
        <AuthPanel mode="login" locale={locale} next={next} />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Toegang geven?"
      intro="Je koppelt je account van Inburgering Oefenen. De app kan dan oefenvragen voor je ophalen en je voortgang bijwerken."
      showHeaderCta={false}
    >
      <ConsentPanel authorizationId={authorizationId} email={user.email ?? ''} />
    </AuthShell>
  );
}
