import { createAdminClient } from '@/lib/supabase/admin';
import { QuestionsDonutChart } from './_components/QuestionsDonutChart';
import { ActivityLineChart } from './_components/ActivityLineChart';
import { CategoryRadarChart } from './_components/CategoryRadarChart';
import { RevenueDashboard } from './_components/RevenueDashboard';

export default async function AdminDashboard() {
  const supabase = createAdminClient();

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const since = threeMonthsAgo.toISOString();

  // Revenue date boundaries (UTC midnight)
  const nowUtc = new Date();
  const todayStart = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), nowUtc.getUTCDate()));
  // Monday of current week
  const dayOfWeek = nowUtc.getUTCDay(); // 0=Sun
  const diffToMonday = (dayOfWeek + 6) % 7;
  const weekStart = new Date(todayStart);
  weekStart.setUTCDate(todayStart.getUTCDate() - diffToMonday);

  const [
    { count: questionCount },
    { count: wordCardCount },
    { count: lerenCount },
    { count: validatedCount },
    { count: notValidatedCount },
    { data: questionActivity },
    { data: examActivity },
    { data: categoryResults },
    { data: paymentsToday },
    { data: paymentsWeek },
    { data: paymentsAll },
    { data: paymentsYesterday },
    { data: paymentsLastWeek },
    { data: paymentsChart },
  ] = await Promise.all([
    supabase.from('questions').select('*', { count: 'exact', head: true }),
    supabase.from('word_cards').select('*', { count: 'exact', head: true }),
    supabase.from('leren_content').select('*', { count: 'exact', head: true }),
    supabase.from('questions').select('*', { count: 'exact', head: true }).eq('review_status', 'validated'),
    supabase.from('questions').select('*', { count: 'exact', head: true }).eq('review_status', 'pending'),
    supabase.from('user_question_results').select('answered_at').gte('answered_at', since),
    supabase.from('exam_submissions').select('created_at').gte('created_at', since),
    // The sub-skill now lives on the stimulus, not the question, so the breakdown walks
    // user_question_results → questions → stimuli → sections.
    supabase.from('user_question_results').select('question_id, was_correct, questions(stimuli(sections(name_nl)))'),
    supabase.from('payments').select('amount_cents').eq('status', 'paid').gte('created_at', todayStart.toISOString()),
    supabase.from('payments').select('amount_cents').eq('status', 'paid').gte('created_at', weekStart.toISOString()),
    supabase.from('payments').select('amount_cents').eq('status', 'paid'),
    // Yesterday for today trend
    supabase.from('payments').select('amount_cents').eq('status', 'paid')
      .gte('created_at', new Date(todayStart.getTime() - 86400000).toISOString())
      .lt('created_at', todayStart.toISOString()),
    // Last week for week trend
    supabase.from('payments').select('amount_cents').eq('status', 'paid')
      .gte('created_at', new Date(weekStart.getTime() - 7 * 86400000).toISOString())
      .lt('created_at', weekStart.toISOString()),
    // Last 3 months daily for chart
    supabase.from('payments').select('amount_cents, created_at').eq('status', 'paid').gte('created_at', since),
  ]);

  // Aggregate both series by date (YYYY-MM-DD)
  const dayMap: Record<string, { questions: number; exams: number }> = {};

  for (const row of questionActivity ?? []) {
    const day = row.answered_at.slice(0, 10);
    if (!dayMap[day]) dayMap[day] = { questions: 0, exams: 0 };
    dayMap[day].questions++;
  }
  for (const row of examActivity ?? []) {
    const day = row.created_at.slice(0, 10);
    if (!dayMap[day]) dayMap[day] = { questions: 0, exams: 0 };
    dayMap[day].exams++;
  }

  const activityData = Object.entries(dayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({ date, ...counts }));

  const totalQuestions = (questionActivity ?? []).length;
  const totalExams = (examActivity ?? []).length;

  // Aggregate correct/total per sub-skill (advertentie, gesprek, e-mail …)
  const catMap: Record<string, { correct: number; total: number }> = {};
  for (const row of categoryResults ?? []) {
    const q = row.questions as unknown as
      { stimuli: { sections: { name_nl: string } | null } | null } | null;
    const cat = q?.stimuli?.sections?.name_nl;
    if (!cat) continue;
    if (!catMap[cat]) catMap[cat] = { correct: 0, total: 0 };
    catMap[cat].total++;
    if (row.was_correct) catMap[cat].correct++;
  }
  const categoryData = Object.entries(catMap).map(([category, { correct, total }]) => ({
    category,
    correct,
    total,
    pct: total > 0 ? Math.round((correct / total) * 100) : 0,
  }));

  const sumCents = (rows: { amount_cents: number }[] | null) =>
    (rows ?? []).reduce((acc, r) => acc + r.amount_cents, 0);

  // Daily chart data (last 3 months)
  const dailyMap: Record<string, number> = {};
  for (const r of paymentsChart ?? []) {
    const day = r.created_at.slice(0, 10);
    dailyMap[day] = (dailyMap[day] ?? 0) + r.amount_cents;
  }
  const chartData = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, cents]) => ({ date, cents }));

  // Weekly bar chart: Mon–Sun of current week
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setUTCDate(weekStart.getUTCDate() + i);
    return d.toISOString().slice(0, 10);
  });
  const weekDailyData = weekDays.map((date) => ({
    date,
    cents: dailyMap[date] ?? 0,
  }));

  const trendPct = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const revenueData = {
    todayCount: (paymentsToday ?? []).length,
    todayRevenueCents: sumCents(paymentsToday),
    todayTrend: trendPct(sumCents(paymentsToday), sumCents(paymentsYesterday)),
    weekCount: (paymentsWeek ?? []).length,
    weekRevenueCents: sumCents(paymentsWeek),
    weekTrend: trendPct(sumCents(paymentsWeek), sumCents(paymentsLastWeek)),
    totalCount: (paymentsAll ?? []).length,
    totalRevenueCents: sumCents(paymentsAll),
    weekDailyData,
    chartData,
  };

  const stats = [
    { label: 'Vragen', value: questionCount ?? 0, icon: 'quiz', href: 'admin/questions', color: 'bg-primary/10 text-primary' },
    { label: 'Woordkaarten', value: wordCardCount ?? 0, icon: 'style', href: 'admin/woordkaarten', color: 'bg-secondary/10 text-secondary' },
    { label: 'Les-secties', value: lerenCount ?? 0, icon: 'menu_book', href: 'admin/leren', color: 'bg-emerald-50 text-emerald-700' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-headline font-bold text-on-surface mb-2">Dashboard</h1>
      <p className="text-on-surface-variant text-sm mb-6">Welkom terug. Beheer hier vragen, lessen en woordkaarten.</p>

      <RevenueDashboard data={revenueData} />

      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-8">
        <p className="text-sm font-bold text-amber-800 mb-1">Let op</p>
        <p className="text-sm text-amber-900">
          Wijzigingen die je hier opslaat verschijnen direct op de live website voor alle gebruikers. Controleer altijd de preview-link na het opslaan en wees voorzichtig met het verwijderen of aanpassen van vragen die al aan examens zijn gekoppeld. Neem bij twijfel eerst een screenshot of notitie van de huidige staat voordat je wijzigingen doorvoert.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
        {stats.map(s => (
          <a key={s.label} href={s.href} className="bg-white rounded-2xl p-6 shadow-[var(--shadow-card-md)] hover:shadow-[var(--shadow-card-lg)] transition-shadow">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${s.color}`}>
              <span className="material-symbols-outlined text-[20px]">{s.icon}</span>
            </div>
            <p className="text-3xl font-headline font-bold text-on-surface">{s.value}</p>
            <p className="text-on-surface-variant text-sm mt-1">{s.label}</p>
          </a>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-10">
        <QuestionsDonutChart
          total={questionCount ?? 0}
          validated={validatedCount ?? 0}
          notValidated={notValidatedCount ?? 0}
        />
        <CategoryRadarChart data={categoryData} />
      </div>

      <ActivityLineChart
        data={activityData}
        totalQuestions={totalQuestions}
        totalExams={totalExams}
      />
    </div>
  );
}
