/**
 * "Stuur mij mijn tijdlijn" — the one and only network call the tijdlijn tool makes.
 *
 * ## What crosses the wire, and what does not
 *
 * The request body is `{ email, state, locale, reminders }`. `state` is the same opaque, versioned,
 * non-identifying string the URL already carries. There is **no BSN, no DigiD, no V-number and no
 * name** anywhere in this feature, and the landing page says so — which is a promise this route has
 * to keep rather than a marketing line.
 *
 * ## Why the timeline is recomputed here instead of being posted
 *
 * The client could have sent its rendered dates. It must not, and does not: the route decodes the
 * state and runs the engine itself (`buildTimelineEmailPayload`). An e-mail is the one artifact we
 * cannot correct after the fact, so the figures in it are computed on the server from the rules file
 * by the same engine the page used. A posted date would be a number we did not derive, sitting in
 * somebody's inbox under our name.
 *
 * ## The reminder
 *
 * Queued into the existing `email_campaign_queue` — one scheduler, one retry story, one unsubscribe
 * path — timed to **eight weeks before the last safe registration date** of the binding component.
 * That is the single most valuable retention mechanic in the product: a mail saying "you should
 * register for your KNM exam this month", arriving in the month it is true. It is skipped when that
 * date is unknown or already past, because a reminder about a date that has gone is worse than none.
 */
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';
import { addWeeks, isAfter, pd, toISO } from '@/lib/tijdlijn/engine/dates';
import { buildTimelineEmailPayload } from '@/lib/tijdlijn/email-payload';
import { timelineEmail, timelineEmailSubject } from '@/lib/email/templates/timeline';
import type { UiLocale } from '@/lib/tijdlijn/format';
import { SITE_URL } from '@/lib/site';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    state?: string;
    locale?: string;
    reminders?: boolean;
  };

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  /* Deliberately loose: a stricter pattern rejects valid addresses, and the send itself is the real
   * validator. What must be excluded is a list of recipients or a header injection, not an unusual TLD. */
  if (!email || !/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(email) || email.length > 254) {
    return Response.json({ error: 'invalid_email' }, { status: 400 });
  }

  const locale: UiLocale = body.locale === 'en' || body.locale === 'ar' ? body.locale : 'nl';
  const state = typeof body.state === 'string' ? body.state : '';
  /* Bounded before it reaches the decoder: the state is a short encoding, and anything much longer
   * is either a bug or an attempt to make us store arbitrary content. */
  if (!state || state.length > 600) return Response.json({ error: 'invalid_state' }, { status: 400 });

  const now = new Date();
  const today = pd(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate());
  const built = buildTimelineEmailPayload(state, locale, today);
  if (!built) return Response.json({ error: 'invalid_state' }, { status: 400 });

  const unsubscribeUrl = `${SITE_URL}/${locale}/uitschrijven?email=${encodeURIComponent(email)}`;
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'Marieke <marieke@inburgeringoefenen.nl>',
    to: email,
    subject: timelineEmailSubject(built.payload, locale),
    html: timelineEmail(built.payload, locale, unsubscribeUrl),
  });
  if (error) {
    console.error('tijdlijn-email send failed:', error);
    return Response.json({ error: 'send_failed' }, { status: 502 });
  }

  /* Storage failing must not fail the send: the reader already has their timeline, and an error
   * message after a mail that arrived is a worse outcome than a lost reminder. */
  try {
    const supabase = createAdminClient();
    const reminders = body.reminders === true;
    const reminderAt = built.registerBy ? addWeeks(built.registerBy, -8) : null;
    const queueIt = Boolean(reminders && reminderAt && isAfter(reminderAt, today));

    await supabase.from('tijdlijn_plans').insert({
      email,
      encoded_state: state,
      locale,
      reminders,
      reminder_queued_at: queueIt ? new Date().toISOString() : null,
    });

    if (queueIt && reminderAt) {
      await supabase.from('email_campaign_queue').insert({
        email,
        campaign_type: 'tijdlijn_reminder',
        scheduled_for: `${toISO(reminderAt)}T09:00:00Z`,
        /* The payload carries the *state*, not the dates: the cron recomputes at send time, so a
         * reminder queued months ago cannot quote a lead time DUO has changed since. */
        payload: { state, locale },
      });
    }
  } catch (err) {
    console.error('tijdlijn-email persistence failed:', err);
  }

  return Response.json({ ok: true });
}
