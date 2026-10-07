import { createAdminClient } from '@/lib/supabase/admin';
import { fetchAll } from '@/lib/admin/fetch-all';
import { fetchGa4 } from '@/lib/admin/ga4';
import { buildMrrMovements, mrrFromMovements, summariseSubscriptions, type MovementPayment } from '@/lib/admin/mrr';
import { activeByTrack, newCustomers, type GoalPayment, type GoalUser } from '@/lib/admin/goal-model';
import { DoelenDashboard } from './_components/DoelenDashboard';

export const dynamic = 'force-dynamic';

/**
 * Doelen: waar staan we tegenover de mijlpalen, en welke funnelstap houdt ons tegen.
 *
 * Twee bronnen, en de pagina zegt per getal welke: GA4 voor bezoekers en wie gaat oefenen,
 * Supabase voor accounts, betalingen en abonnementen. Alleen inburgeringoefenen.nl — knmoefenen.nl
 * heeft een eigen database (besluit eigenaar, 07-10).
 */
export default async function DoelenPage() {
  const supabase = createAdminClient();
  const since30 = new Date(Date.now() - 30 * 86400000).toISOString();

  const [payments, ga4] = await Promise.all([
    fetchAll<GoalPayment & MovementPayment>((from, to) =>
      supabase.from('payments').select('user_id, product, amount_cents, created_at').eq('status', 'paid')
        .order('created_at', { ascending: true }).range(from, to)),
    fetchGa4(),
  ]);

  // `auth.users` gaat niet via PostgREST; een pagina met minder dan 1.000 rijen is het einde.
  const users: (GoalUser & { email?: string | null })[] = [];
  for (let page = 1; ; page++) {
    const { data } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    const batch = data?.users ?? [];
    users.push(...batch.map(u => ({ id: u.id, created_at: u.created_at, email: u.email ?? null, user_metadata: u.user_metadata ?? null })));
    if (batch.length < 1000) break;
  }

  const mrr = mrrFromMovements(summariseSubscriptions(users), buildMrrMovements(users, payments));
  const customers = newCustomers(payments);
  const ga = 'error' in ga4 ? null : ga4;

  return (
    <DoelenDashboard
      mrrCents={mrr.mrrCents}
      active={activeByTrack(users)}
      newByMonth={customers.byMonth}
      visitorsByMonth={ga?.visitorsByMonth ?? null}
      ga4Error={'error' in ga4 ? ga4.error : null}
      funnel={{
        visitors: ga?.visitors30d ?? null,
        practicing: ga?.practicing30d ?? null,
        signups: users.filter(u => u.created_at >= since30).length,
        paid: customers.last30,
      }}
    />
  );
}
