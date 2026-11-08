import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { changeModules } from '@/lib/billing/change';

/**
 * Een lopend abonnement wijzigen: modules erbij, eraf, of allebei (co-terming).
 *
 * `confirm: false` geeft de offerte, `confirm: true` voert hem uit. De client stuurt alleen wélke
 * modules; elk bedrag rekent de server zelf (`lib/billing/change.ts`). Zonder lopend abonnement
 * antwoordt hij `409 no_subscription` en hoort de kiezer naar `/api/checkout-modules`.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });

  let body: { add?: unknown; remove?: unknown; locale?: unknown; confirm?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag.' }, { status: 400 });
  }

  const locale = typeof body.locale === 'string' && /^[a-z]{2}$/.test(body.locale) ? body.locale : 'nl';

  try {
    const result = await changeModules({
      userId: user.id,
      email: user.email ?? null,
      add: body.add,
      remove: body.remove,
      locale,
      confirm: body.confirm === true,
    });
    if (!result.ok) return NextResponse.json({ code: result.code }, { status: result.status });
    return NextResponse.json(result);
  } catch (err) {
    console.error('[change-modules]', err instanceof Error ? err.message : err);
    return NextResponse.json({ code: 'error' }, { status: 502 });
  }
}
