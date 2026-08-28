import { createAdminClient } from '@/lib/supabase/admin';
import UsersTable from './_components/UsersTable';

export const revalidate = 0;

export type ActivityEvent = {
  type: 'exam' | 'leren' | 'woordkaart';
  label: string;
  at: string;
};

export type UserRow = {
  id: string;
  email: string;
  plan: 'free' | 'premium' | 'premium_plus';
  created_at: string;
  last_sign_in_at: string | null;
  last_payment: {
    amount_cents: number;
    product: string;
    created_at: string;
  } | null;
  exams_completed: number;
  exams_passed: number;
  themas_completed: number;
  cards_known: number;
  cards_seen: number;
  last_active_at: string | null;
  activity: ActivityEvent[];
};

export default async function UsersPage() {
  const admin = createAdminClient();

  // Paginate through all auth users
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

  // Fetch activity tables in parallel
  const [paymentsRes, examsRes, lerenRes, cardsRes] = await Promise.all([
    admin.from('payments').select('user_id, amount_cents, product, status, created_at').eq('status', 'paid').order('created_at', { ascending: false }),
    admin.from('exam_submissions').select('user_id, exam_number, pct, passed, completed_at').not('user_id', 'is', null),
    admin.from('user_leren_progress').select('user_id, thema_id, max_section, completed, completed_at, updated_at'),
    admin.from('user_word_card_progress').select('user_id, status, seen_count, last_seen_at, updated_at').not('user_id', 'is', null),
  ]);

  const payments = paymentsRes.data ?? [];
  const exams = examsRes.data ?? [];
  const lerens = lerenRes.data ?? [];
  const cards = cardsRes.data ?? [];

  // Index by user_id
  const paymentsByUser = new Map<string, typeof payments[0]>();
  for (const p of payments) {
    if (p.user_id && !paymentsByUser.has(p.user_id)) paymentsByUser.set(p.user_id, p);
  }

  const examsByUser = new Map<string, typeof exams>();
  for (const e of exams) {
    if (!e.user_id) continue;
    if (!examsByUser.has(e.user_id)) examsByUser.set(e.user_id, []);
    examsByUser.get(e.user_id)!.push(e);
  }

  const lerenByUser = new Map<string, typeof lerens>();
  for (const l of lerens) {
    if (!lerenByUser.has(l.user_id)) lerenByUser.set(l.user_id, []);
    lerenByUser.get(l.user_id)!.push(l);
  }

  const cardsByUser = new Map<string, typeof cards>();
  for (const c of cards) {
    if (!c.user_id) continue;
    if (!cardsByUser.has(c.user_id)) cardsByUser.set(c.user_id, []);
    cardsByUser.get(c.user_id)!.push(c);
  }

  const users: UserRow[] = allUsers
    .filter(u => u.email && !u.email.endsWith('@example.com'))
    .map(u => {
      const plan = ((u.user_metadata?.plan as string) ||
        (u.user_metadata?.premium === true ? 'premium' : 'free')) as UserRow['plan'];
      const userExams = examsByUser.get(u.id) ?? [];
      const userLeren = lerenByUser.get(u.id) ?? [];
      const userCards = cardsByUser.get(u.id) ?? [];

      // Build merged activity timeline
      const events: ActivityEvent[] = [
        ...userExams.map(e => ({
          type: 'exam' as const,
          label: `Examen ${e.exam_number} — ${e.pct}% (${e.passed ? 'geslaagd' : 'gezakt'})`,
          at: e.completed_at,
        })),
        ...userLeren.map(l => ({
          type: 'leren' as const,
          label: `Thema ${l.thema_id} ${l.completed ? 'afgerond' : `(sectie ${l.max_section})`}`,
          at: l.completed_at ?? l.updated_at,
        })),
        ...userCards
          .filter(c => c.last_seen_at)
          .slice(0, 20)
          .map(c => ({
            type: 'woordkaart' as const,
            label: `Woordkaart bekeken (status: ${c.status})`,
            at: c.last_seen_at!,
          })),
      ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 15);

      const timestamps = [
        ...userExams.map(e => e.completed_at),
        ...userLeren.map(l => l.completed_at ?? l.updated_at),
        ...userCards.map(c => c.last_seen_at ?? c.updated_at),
      ].filter(Boolean) as string[];
      const lastActive = timestamps.length
        ? timestamps.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
        : null;

      return {
        id: u.id,
        email: u.email!,
        plan,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        last_payment: paymentsByUser.get(u.id) ?? null,
        exams_completed: userExams.length,
        exams_passed: userExams.filter(e => e.passed).length,
        themas_completed: userLeren.filter(l => l.completed).length,
        cards_known: userCards.filter(c => c.status === 'known').length,
        cards_seen: userCards.filter(c => c.status !== 'unseen').length,
        last_active_at: lastActive,
        activity: events,
      };
    });

  // Sort by created_at desc
  users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return <UsersTable users={users} />;
}
