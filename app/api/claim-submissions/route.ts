import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';
import { TABLE, CAMPAIGN, jsonOk, jsonError } from '@/lib/api-constants';
import { resultsEmail, resultsSubject } from '@/lib/email/templates/results';
import { type EmailLocale } from '@/lib/email/i18n';

const resend = new Resend(process.env.RESEND_API_KEY);

type CatScore = { correct: number; total: number };

export async function POST(request: Request): Promise<Response> {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return jsonError('Unauthorized', 401);

  const supabase = createAdminClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return jsonError('Invalid session', 401);

  const email = (user.email || '').toLowerCase().trim();
  if (!email) return jsonError('No email on account', 400);

  const body = await request.json().catch(() => ({})) as {
    score?: number; total?: number; pct?: number; passed?: boolean;
    catScores?: Record<string, CatScore>; locale?: string;
  };

  const locale: EmailLocale = (['nl', 'en', 'ar'].includes(body.locale ?? '') ? body.locale as EmailLocale : 'nl');

  let resultData: { score: number; total: number; pct: number; passed: boolean; cat_scores: Record<string, CatScore> } | null = null;
  let shouldSendEmail = false;

  if (typeof body.score === 'number' && typeof body.total === 'number') {
    resultData = {
      score: body.score,
      total: body.total,
      pct: body.pct ?? 0,
      passed: body.passed ?? false,
      cat_scores: body.catScores ?? {},
    };
    const { data: priorSubmission } = await supabase
      .from(TABLE.EXAM_SUBMISSIONS)
      .select('id')
      .eq('email', email)
      .limit(1)
      .maybeSingle();
    shouldSendEmail = !priorSubmission;
  } else {
    const { data: submissions, error: fetchError } = await supabase
      .from(TABLE.EXAM_SUBMISSIONS)
      .select('score, total, pct, passed, cat_scores')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error('Claim fetch error:', fetchError);
      return jsonError('Failed to fetch submissions', 500);
    }
    if (submissions && submissions.length > 0) {
      resultData = submissions[0] as NonNullable<typeof resultData>;
      shouldSendEmail = false;
    }
  }

  const now = Date.now();

  if (!resultData) {
    await supabase.from(TABLE.EMAIL_CAMPAIGN_QUEUE).insert([
      { email, campaign_type: CAMPAIGN.DAY2, scheduled_for: new Date(now + 2 * 24 * 60 * 60 * 1000).toISOString(), payload: { locale } },
      { email, campaign_type: CAMPAIGN.DAY7, scheduled_for: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(), payload: { locale } },
    ]);
    return jsonOk({ claimed: 0 });
  }

  const { error: insertError } = await supabase
    .from(TABLE.EXAM_SUBMISSIONS)
    .update({ user_id: user.id })
    .eq('email', email)
    .is('user_id', null);

  if (insertError) {
    console.error('Claim insert error:', insertError);
    return jsonError('Failed to claim submission', 500);
  }

  const catScores = resultData.cat_scores ?? {};
  const unsubscribeUrl = `https://inburgeringoefenen.nl/uitschrijven?email=${encodeURIComponent(email)}`;

  if (shouldSendEmail) {
    resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Marieke <marieke@inburgeringoefenen.nl>',
      to: email,
      subject: resultsSubject(resultData.pct, resultData.passed, locale),
      html: resultsEmail({ ...resultData, catScores }, locale, unsubscribeUrl, true),
    }).catch((e: unknown) => console.error('Email send error:', e));
  }

  await supabase.from(TABLE.EMAIL_CAMPAIGN_QUEUE).insert([
    {
      email,
      campaign_type: CAMPAIGN.DAY2,
      scheduled_for: new Date(now + 2 * 24 * 60 * 60 * 1000).toISOString(),
      payload: { score: resultData.score, total: resultData.total, pct: resultData.pct, passed: resultData.passed, exam_name: 'KNM Proefexamen', catScores, locale },
    },
    {
      email,
      campaign_type: CAMPAIGN.DAY7,
      scheduled_for: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(),
      payload: { locale },
    },
  ]);

  return jsonOk({
    claimed: 1,
    submission: {
      score: resultData.score,
      total: resultData.total,
      pct: resultData.pct,
      passed: resultData.passed,
      catScores,
    },
  });
}
