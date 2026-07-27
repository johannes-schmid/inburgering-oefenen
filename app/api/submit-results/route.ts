import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';
import { TABLE, CAMPAIGN, jsonOk, jsonError } from '@/lib/api-constants';
import { resultsEmail, resultsSubject } from '@/lib/email/templates/results';
import { type EmailLocale } from '@/lib/email/i18n';

const resend = new Resend(process.env.RESEND_API_KEY);

type CatScore = { correct: number; total: number };

export async function POST(request: Request): Promise<Response> {
  const body = await request.json().catch(() => ({})) as {
    email?: string; score?: number; total?: number; passed?: boolean;
    pct?: number; catScores?: Record<string, CatScore>; timeTaken?: number;
    locale?: string;
  };

  const { email, score, total, passed, pct, catScores, locale: rawLocale } = body;
  const locale: EmailLocale = (['nl', 'en', 'ar'].includes(rawLocale ?? '') ? rawLocale as EmailLocale : 'nl');

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return jsonError('Ongeldig e-mailadres', 400);
  }
  if (typeof score !== 'number' || typeof total !== 'number') {
    return jsonError('Ongeldige score gegevens', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const supabase = createAdminClient();

  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data: recentSubmission } = await supabase
    .from(TABLE.EXAM_SUBMISSIONS)
    .select('id')
    .eq('email', normalizedEmail)
    .gte('created_at', tenMinutesAgo)
    .limit(1)
    .maybeSingle();

  if (recentSubmission) {
    return jsonOk({ success: true, deduplicated: true });
  }

  const { error: emailError } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'Marieke <marieke@inburgeringoefenen.nl>',
    to: normalizedEmail,
    subject: resultsSubject(pct ?? 0, passed ?? false, locale),
    html: resultsEmail(
      { score, total, passed: passed ?? false, pct: pct ?? 0, catScores: catScores ?? {} },
      locale,
      `https://inburgeringoefenen.nl/uitschrijven?email=${encodeURIComponent(normalizedEmail)}`,
    ),
  });

  if (emailError) {
    console.error('Resend error:', emailError);
    return jsonError('E-mail kon niet worden verzonden. Probeer het opnieuw.', 500);
  }

  const now = Date.now();
  const { error: queueError } = await supabase.from(TABLE.EMAIL_CAMPAIGN_QUEUE).insert([
    {
      email: normalizedEmail,
      campaign_type: CAMPAIGN.DAY2,
      scheduled_for: new Date(now + 2 * 24 * 60 * 60 * 1000).toISOString(),
      payload: { score, total, pct, passed, exam_name: 'KNM Proefexamen', catScores, locale },
    },
    {
      email: normalizedEmail,
      campaign_type: CAMPAIGN.DAY7,
      scheduled_for: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(),
      payload: { locale },
    },
  ]);

  if (queueError && queueError.code !== '23505') {
    console.error('Queue insert error:', queueError);
  }

  const { error: submissionError } = await supabase.from(TABLE.EXAM_SUBMISSIONS).insert({
    email: normalizedEmail,
    score,
    total,
    pct,
    passed,
    cat_scores: catScores,
  });

  if (submissionError) {
    console.error('Submission insert error:', submissionError);
  }

  return jsonOk({ success: true });
}
