/**
 * Stuurt één reviewverzoek naar één betalende klant en legt dat vast in `review_requests`.
 *
 * Drie poorten, in deze volgorde: de beheerder (`requireAdmin()`), een betaling op naam van dit
 * account (wie niets gekocht heeft krijgt geen verzoek), en de wachttijd — binnen
 * `REVIEW_COOLDOWN_DAYS` na het vorige verzoek weigert de route met 409, zodat een dubbele klik
 * of een tweede beheerder niet twee keer dezelfde mail stuurt.
 *
 * De rij wordt pas geschreven als Resend de mail heeft aangenomen: een verzoek dat niet verstuurd
 * is mag niet als "gevraagd" in de lijst staan.
 */
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { requireAdmin } from '@/lib/admin/guard';
import { canRequestReview } from '@/lib/admin/review-score';
import { createAdminClient } from '@/lib/supabase/admin';
import type { EmailLocale } from '@/lib/email/i18n';
import { reviewRequestEmail, reviewRequestSubject } from '@/lib/email/templates/review-request';

const FROM = 'Inburgering Oefenen <support@inburgeringoefenen.nl>';
const REPLY_TO = 'support@inburgeringoefenen.nl';

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  const body = (await req.json().catch(() => null)) as { userId?: unknown } | null;
  const userId = typeof body?.userId === 'string' ? body.userId : null;
  if (!userId) return NextResponse.json({ error: 'userId ontbreekt.' }, { status: 400 });

  const admin = createAdminClient();

  const { data: userData } = await admin.auth.admin.getUserById(userId);
  const user = userData?.user;
  if (!user?.email) return NextResponse.json({ error: 'Gebruiker niet gevonden.' }, { status: 404 });

  const { count: paidCount } = await admin
    .from('payments')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'paid');
  if (!paidCount) return NextResponse.json({ error: 'Deze gebruiker heeft niet betaald.' }, { status: 422 });

  const { data: last } = await admin
    .from('review_requests')
    .select('sent_at')
    .eq('user_id', userId)
    .order('sent_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!canRequestReview(last?.sent_at ?? null)) {
    return NextResponse.json({ error: 'Deze klant is kortgeleden al gevraagd.', sentAt: last?.sent_at }, { status: 409 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY ontbreekt.' }, { status: 500 });
  }

  const meta = user.user_metadata ?? {};
  const locale: EmailLocale = meta.locale === 'en' || meta.locale === 'ar' ? meta.locale : 'nl';
  const firstName = typeof meta.full_name === 'string' ? meta.full_name.split(' ')[0] : '';

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error: sendError } = await resend.emails.send({
    from: FROM,
    to: user.email,
    replyTo: REPLY_TO,
    subject: reviewRequestSubject(locale),
    html: reviewRequestEmail({ firstName }, locale),
  });
  if (sendError) {
    console.error('[request-review] send failed:', userId, sendError.message);
    return NextResponse.json({ error: 'De mail kon niet verstuurd worden.' }, { status: 502 });
  }

  const { data: row, error: insertError } = await admin
    .from('review_requests')
    .insert({ user_id: userId, email: user.email, locale, sent_by: check.email })
    .select('sent_at')
    .single();
  if (insertError) {
    console.error('[request-review] sent but not recorded:', userId, insertError.message);
    return NextResponse.json({ sentAt: new Date().toISOString(), recorded: false });
  }

  return NextResponse.json({ sentAt: row.sent_at, recorded: true });
}
