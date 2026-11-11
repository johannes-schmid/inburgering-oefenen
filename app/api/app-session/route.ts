import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { routing } from '@/i18n/routing';
import { captureServerEvent } from '@/lib/posthog-server';

/**
 * De overdracht van een sessie uit de iOS-app naar de webview.
 *
 * De app (`mobile/`) logt zelf in — Google via het systeemvenster, Apple via de eigen knop —
 * want Google weigert OAuth in een ingebedde webview. Wat de app daarna in handen heeft is een
 * gewone Supabase-sessie; dit endpoint zet die om in dezelfde cookies die `/auth/callback` zet,
 * zodat het portaal in de webview precies de sessie ziet die de browser ook zou zien.
 *
 * Drie dingen die hier bewust zo zijn:
 *
 *  - **POST met de tokens in de body, nooit in de URL.** Een URL belandt in logs en in de
 *    geschiedenis van de webview.
 *  - **De kop `X-App-Shell` is verplicht.** Een HTML-formulier op een andere site kan geen eigen
 *    kop meesturen en een `fetch` met zo'n kop strandt op de CORS-preflight, dus een derde kan
 *    een bezoeker hier niet ongemerkt in zíjn account inloggen (login-CSRF).
 *  - **De app bewaart de sessie daarna niet.** Twee houders van één refresh-token trekken elkaars
 *    sessie in zodra de eerste hem ververst (rotatie met hergebruikdetectie). De webview is de
 *    enige eigenaar; de app vraagt alleen "is er nog een cookie?".
 */
const DEFAULT_LOCALE = routing.defaultLocale;

function safePath(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return `/${DEFAULT_LOCALE}/dashboard`;
  return raw;
}

export async function POST(request: NextRequest) {
  const { origin } = new URL(request.url);

  if (!request.headers.get('x-app-shell')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const form = await request.formData().catch(() => null);
  const accessToken = form?.get('access_token');
  const refreshToken = form?.get('refresh_token');
  const next = safePath(typeof form?.get('next') === 'string' ? (form.get('next') as string) : null);
  const failUrl = `${origin}/${DEFAULT_LOCALE}/login?error=app_session`;

  if (typeof accessToken !== 'string' || typeof refreshToken !== 'string' || !accessToken || !refreshToken) {
    return NextResponse.redirect(failUrl, 303);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: cookiesToSet => {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );

  // `setSession` controleert het toegangstoken bij Supabase voordat het de cookies schrijft:
  // een verzonnen of verlopen paar levert hier een fout op en geen sessie.
  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error || !data.user) {
    console.error('[app-session] setSession failed:', error?.message);
    return NextResponse.redirect(failUrl, 303);
  }

  // Zelfde regel als in /auth/callback: een account van minder dan twee minuten oud is een
  // registratie. De app komt niet langs die callback, dus het event moet ook hier vandaan.
  const user = data.user;
  if (Date.now() - new Date(user.created_at).getTime() < 2 * 60_000) {
    await captureServerEvent(user.id, 'signup_completed', {
      provider: user.app_metadata?.provider ?? 'google',
      source: 'ios_app',
      $set: { email: user.email },
    });
  }

  return NextResponse.redirect(`${origin}${next}`, 303);
}
