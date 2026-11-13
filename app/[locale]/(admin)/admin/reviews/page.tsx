import { createAdminClient } from '@/lib/supabase/admin';
import { fetchAll } from '@/lib/admin/fetch-all';
import { modulesFromMetadata, planFromMetadata } from '@/lib/entitlements';
import { distinctDays, usageScore, type UsageParts } from '@/lib/admin/review-score';
import ReviewsTable from './_components/ReviewsTable';

export const revalidate = 0;

export type ReviewRow = {
  id: string;
  email: string;
  name: string | null;
  locale: 'nl' | 'en' | 'ar';
  score: number;
  parts: UsageParts;
  exams_completed: number;
  lessons_done: number;
  graded_tasks: number;
  cards_known: number;
  active_days: number;
  last_active_at: string | null;
  /** Loopt er vandaag nog toegang (modules of de oude aankoop)? */
  subscribed: boolean;
  payments_count: number;
  payments_total_cents: number;
  first_payment_at: string;
  /** Het laatste reviewverzoek, of `null` als er nooit gevraagd is. */
  requested_at: string | null;
  requests_count: number;
};

/**
 * Iedereen die ooit betaald heeft, met een gebruiksscore en het laatste reviewverzoek.
 *
 * "Betaald" is een rij in `payments` met status `paid` op naam van het account — niet het huidige
 * pakket: een opgezegde abonnee heeft het product net zo goed gebruikt. Beheerders staan er niet
 * in: een review van iemand die aan het bedrijf verbonden is hoort niet op Trustpilot
 * (`SEO/facts.md` §12).
 *
 * De score sorteert en verbergt niemand; zie `lib/admin/review-score.ts`.
 */
export default async function ReviewsPage() {
  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allUsers: any[] = [];
  let page = 1;
  while (true) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (!data?.users?.length) break;
    allUsers.push(...data.users);
    if (data.users.length < 1000) break;
    page++;
  }

  type Payment = { user_id: string | null; amount_cents: number; created_at: string };
  type Attempt = { user_id: string; completed_at: string | null; started_at: string };
  type Graded = { user_id: string; attempt_id: number | null; task_id: number; created_at: string };
  type LessonProgress = { user_id: string; state: string; updated_at: string; completed_at: string | null };
  type Card = { user_id: string | null; known: boolean; updated_at: string };
  type Request = { user_id: string; sent_at: string };

  const [payments, attempts, graded, lessons, cards, requests, admins] = await Promise.all([
    fetchAll<Payment>((f, t) =>
      admin.from('payments').select('user_id, amount_cents, created_at').eq('status', 'paid')
        .not('user_id', 'is', null).order('created_at', { ascending: true }).range(f, t)),
    fetchAll<Attempt>((f, t) =>
      admin.from('exam_attempts').select('user_id, completed_at, started_at').range(f, t)),
    fetchAll<Graded>((f, t) =>
      admin.from('open_submissions').select('user_id, attempt_id, task_id, created_at')
        .neq('status', 'submitted').range(f, t)),
    fetchAll<LessonProgress>((f, t) =>
      admin.from('user_lesson_progress').select('user_id, state, updated_at, completed_at').range(f, t)),
    fetchAll<Card>((f, t) =>
      admin.from('user_word_card_progress').select('user_id, known, updated_at').not('user_id', 'is', null)
        .range(f, t)),
    fetchAll<Request>((f, t) =>
      admin.from('review_requests').select('user_id, sent_at').order('sent_at', { ascending: false }).range(f, t)),
    fetchAll<{ email: string }>((f, t) => admin.from('admin_users').select('email').range(f, t)),
  ]);

  const groupBy = <T extends { user_id: string | null }>(rows: T[]) => {
    const m = new Map<string, T[]>();
    for (const r of rows) {
      if (!r.user_id) continue;
      if (!m.has(r.user_id)) m.set(r.user_id, []);
      m.get(r.user_id)!.push(r);
    }
    return m;
  };

  const paymentsByUser = groupBy(payments);
  const attemptsByUser = groupBy(attempts);
  const gradedByUser = groupBy(graded);
  const lessonsByUser = groupBy(lessons);
  const cardsByUser = groupBy(cards);
  const requestsByUser = groupBy(requests);
  const adminEmails = new Set(admins.map(a => a.email.toLowerCase()));

  const rows: ReviewRow[] = allUsers
    .filter(u => u.email && paymentsByUser.has(u.id) && !adminEmails.has(u.email.toLowerCase()))
    .map(u => {
      const meta = u.user_metadata ?? {};
      const userPayments = paymentsByUser.get(u.id)!;
      const userAttempts = attemptsByUser.get(u.id) ?? [];
      const userGraded = gradedByUser.get(u.id) ?? [];
      const userLessons = lessonsByUser.get(u.id) ?? [];
      const userCards = cardsByUser.get(u.id) ?? [];
      const userRequests = requestsByUser.get(u.id) ?? [];

      const activity = [
        ...userAttempts.map(a => a.completed_at ?? a.started_at),
        ...userGraded.map(g => g.created_at),
        ...userLessons.map(l => l.completed_at ?? l.updated_at),
        ...userCards.map(c => c.updated_at),
      ];

      const usage = {
        examsCompleted: userAttempts.filter(a => a.completed_at).length,
        lessonsDone: userLessons.filter(l => l.state === 'done').length,
        // Dezelfde telling als `graded_exercise_count`: één per (zitting, opgave).
        gradedTasks: new Set(userGraded.map(g => `${g.attempt_id ?? 'none'}:${g.task_id}`)).size,
        cardsKnown: userCards.filter(c => c.known).length,
        activeDays: distinctDays(activity),
      };
      const { score, parts } = usageScore(usage);

      return {
        id: u.id,
        email: u.email as string,
        name: typeof meta.full_name === 'string' && meta.full_name.trim() ? meta.full_name.trim() : null,
        locale: meta.locale === 'en' || meta.locale === 'ar' ? meta.locale : 'nl',
        score,
        parts,
        exams_completed: usage.examsCompleted,
        lessons_done: usage.lessonsDone,
        graded_tasks: usage.gradedTasks,
        cards_known: usage.cardsKnown,
        active_days: usage.activeDays,
        last_active_at: activity.length ? activity.sort().at(-1)! : null,
        subscribed: planFromMetadata(meta) !== 'free' || modulesFromMetadata(meta).length > 0,
        payments_count: userPayments.length,
        payments_total_cents: userPayments.reduce((s, p) => s + p.amount_cents, 0),
        first_payment_at: userPayments[0].created_at,
        requested_at: userRequests[0]?.sent_at ?? null,
        requests_count: userRequests.length,
      };
    });

  rows.sort((a, b) => b.score - a.score);

  return <ReviewsTable rows={rows} />;
}
