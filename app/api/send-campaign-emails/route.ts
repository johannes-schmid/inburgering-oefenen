import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';
import { TABLE, CAMPAIGN } from '@/lib/api-constants';
import { day2Email, day2Subject } from '@/lib/email/templates/day2';
import { day2NoScoreEmail, day2NoScoreSubject } from '@/lib/email/templates/day2NoScore';
import { day7Email, day7Subject } from '@/lib/email/templates/day7';
import { abandonEmail, abandonSubject } from '@/lib/email/templates/abandon';
import { timelineReminderEmail, timelineReminderSubject } from '@/lib/email/templates/timeline';
import { buildTimelineEmailPayload } from '@/lib/tijdlijn/email-payload';
import { pd } from '@/lib/tijdlijn/engine/dates';
import { type EmailLocale } from '@/lib/email/i18n';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL || 'Marieke <marieke@inburgeringoefenen.nl>';

export async function GET(request: Request): Promise<Response> {
  const auth = request.headers.get('authorization') ?? '';
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data: due, error: fetchError } = await supabase
    .from(TABLE.EMAIL_CAMPAIGN_QUEUE)
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', now)
    .limit(200);

  if (fetchError) {
    console.error('Queue fetch error:', fetchError);
    return Response.json({ error: 'Failed to fetch queue' }, { status: 500 });
  }

  const results = { sent: 0, failed: 0 };

  for (const row of due ?? []) {
    try {
      /* The paid-customer skip applies to the **upsell** campaigns only. A tijdlijn reminder is not
       * an upsell — it is the thing the reader explicitly asked for — and suppressing it because
       * they bought a module would drop the one mail they consented to separately. */
      const isUpsell = row.campaign_type !== 'tijdlijn_reminder';
      const { data: paidPayment } = isUpsell ? await supabase
        .from(TABLE.PAYMENTS)
        .select('id')
        .eq('email', row.email)
        .eq('status', 'paid')
        .maybeSingle() : { data: null };
      if (paidPayment) {
        await supabase
          .from(TABLE.EMAIL_CAMPAIGN_QUEUE)
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', row.id);
        continue;
      }

      const locale: EmailLocale = (row.payload?.locale as EmailLocale) || 'nl';
      const firstName = (row.payload?.firstName as string) || (row.email as string).split('@')[0].split('.')[0];
      const unsubscribeUrl = `https://inburgeringoefenen.nl/uitschrijven?email=${encodeURIComponent(row.email)}`;

      let html: string;
      let subject: string;

      if (row.campaign_type === CAMPAIGN.DAY2) {
        const hasScore = row.payload?.pct != null;
        if (hasScore) {
          html = day2Email(row.payload, firstName, locale, unsubscribeUrl);
          subject = day2Subject(row.payload.pct, locale);
        } else {
          html = day2NoScoreEmail(firstName, locale, unsubscribeUrl);
          subject = day2NoScoreSubject(locale);
        }
      } else if (row.campaign_type === CAMPAIGN.DAY7) {
        html = day7Email(firstName, locale, unsubscribeUrl);
        subject = day7Subject(locale);
      } else if (row.campaign_type === 'abandon') {
        html = abandonEmail(firstName, locale, unsubscribeUrl);
        subject = abandonSubject(locale);
      } else if (row.campaign_type === 'tijdlijn_reminder') {
        /* Recomputed from the stored state against **today's** rules file, not from dates frozen when
         * the row was queued eight months ago. If the plan can no longer be read — a future encoding,
         * a corrupted row — the mail is skipped rather than sent with blanks in it. */
        const nowUtc = new Date();
        const built = buildTimelineEmailPayload(
          String(row.payload?.state ?? ''),
          locale,
          pd(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth() + 1, nowUtc.getUTCDate()),
        );
        if (!built) {
          await supabase
            .from(TABLE.EMAIL_CAMPAIGN_QUEUE)
            .update({ status: 'failed', error_message: 'unreadable tijdlijn state' })
            .eq('id', row.id);
          continue;
        }
        html = timelineReminderEmail(built.payload, locale, unsubscribeUrl);
        subject = timelineReminderSubject(built.payload, locale);
      } else {
        continue;
      }

      const { error: sendError } = await resend.emails.send({ from: FROM, to: row.email, subject, html });
      if (sendError) throw sendError;

      await supabase
        .from(TABLE.EMAIL_CAMPAIGN_QUEUE)
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', row.id);

      results.sent++;
    } catch (err) {
      console.error(`Failed to send ${row.campaign_type} to ${row.email}:`, err);
      await supabase
        .from(TABLE.EMAIL_CAMPAIGN_QUEUE)
        .update({ status: 'failed', error_message: String((err as Error)?.message ?? err) })
        .eq('id', row.id);
      results.failed++;
    }
  }

  return Response.json({ ...results, processed: (due ?? []).length });
}
