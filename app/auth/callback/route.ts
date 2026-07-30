import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { routing } from '@/i18n/routing';

/**
 * Where every auth flow lands — Google OAuth, e-mail confirmation and password recovery.
 *
 * `next` is only honoured when it is a same-site absolute path. Redirecting to an arbitrary
 * `?next=` would make this an open redirect *that has just set a session cookie*, which is
 * the expensive version of that bug.
 */
const DEFAULT_LOCALE = routing.defaultLocale;

function safePath(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return `/${DEFAULT_LOCALE}/dashboard`;
  return raw;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safePath(searchParams.get('next'));
  const loginUrl = `${origin}/${DEFAULT_LOCALE}/login`;

  // The provider reports its own failures here — a cancelled Google consent screen sends
  // `error=access_denied` and no code — so surface that rather than the misleading "no_code".
  const providerError = searchParams.get('error_description') ?? searchParams.get('error');
  if (providerError) {
    return NextResponse.redirect(`${loginUrl}?error=${encodeURIComponent(providerError)}`);
  }
  if (!code) {
    return NextResponse.redirect(`${loginUrl}?error=no_code`);
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

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error('[auth/callback] exchange failed:', error.message);
    return NextResponse.redirect(`${loginUrl}?error=${encodeURIComponent(error.message)}`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
