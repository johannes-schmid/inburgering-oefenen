import { createAdminClient } from '@/lib/supabase/admin';
import { fetchAll } from '@/lib/admin/fetch-all';
import { fetchGa4 } from '@/lib/admin/ga4';
import { buildMrrMovements, mrrFromMovements, summariseSubscriptions, type MovementPayment } from '@/lib/admin/mrr';
import {
  PERIODS, activeSubscribers, netMonthlyEur, periodActuals, periodStart,
  type GoalPayment, type GoalUser, type PeriodKey,
} from '@/lib/admin/goal-model';
import { DoelenDashboard, type PeriodData } from './_components/DoelenDashboard';

export const dynamic = 'force-dynamic';

/**
 * Doelen: waar staan we vandaag, deze week en deze maand tegenover het gekozen scenario, en welke
 * funnelstap houdt ons tegen.
 *
 * Twee bronnen: GA4 voor bezoekers en wie gaat oefenen, Supabase voor accounts, betalingen en
 * abonnementen. Alleen inburgeringoefenen.nl — knmoefenen.nl heeft een eigen database.
 */
export default async function DoelenPage() {
  const supabase = createAdminClient();

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
  const ga = 'error' in ga4 ? null : ga4;

  const periods = Object.fromEntries(PERIODS.map(({ key, days }) => {
    const actual = periodActuals(users, payments, periodStart(days));
    return [key, {
      ...actual,
      funnel: {
        visitors: ga ? ga.visitors[key] : null,
        practicing: ga ? ga.practicing[key] : null,
        signups: actual.signups,
        paid: actual.sales,
      },
    }];
  })) as Record<PeriodKey, PeriodData>;

  return (
    <DoelenDashboard
      mrrEur={netMonthlyEur(mrr.mrrCents)}
      subscribers={activeSubscribers(users)}
      periods={periods}
      ga4Error={'error' in ga4 ? ga4.error : null}
    />
  );
}
