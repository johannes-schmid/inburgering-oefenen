import { createAdminClient } from '@/lib/supabase/admin';
import { fetchAll } from '@/lib/admin/fetch-all';
import {
  modulesExpired,
  modulesFromMetadata,
  planFromMetadata,
  purchasedModules,
  type ModuleId,
} from '@/lib/entitlements';
import { FREE_GRADED_PER_SKILL } from '@/lib/grading-limits';
import { levelLabel, type Level } from '@/data/skills';
import UsersTable from './_components/UsersTable';

export const revalidate = 0;

/** Wat het account vandaag mag: niets, losse modules, of de oude alles-in-één aankoop. */
export type Access = 'free' | 'modules' | 'legacy';

export type ModuleActivity = {
  /** `a2:lezen`, `b1:schrijven` of `knm`. */
  module: ModuleId;
  label: string;
  attempts: number;
  passed: number;
  best_pct: number | null;
  last_at: string;
};

export type UserRow = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  access: Access;
  /** De modules in het pakket, als labels ("A2 Schrijven", "KNM"). Leeg bij `free`. */
  modules: string[];
  /** Gezet na opzeggen: toegang loopt tot deze datum, daarna is `access` weer `free`. */
  modules_until: string | null;
  /** Modules die ooit gekocht zijn maar waarvan de toegang verlopen is. */
  lapsed_modules: string[];
  payments_count: number;
  payments_total_cents: number;
  last_payment: { amount_cents: number; created_at: string } | null;
  /** Nagekeken opdrachten per open onderdeel, tegen het gratis plafond. */
  graded: { schrijven: number; spreken: number };
  graded_limit: number;
  exams: ModuleActivity[];
  lessons_done: number;
  lessons_started: number;
  cards_known: number;
  last_active_at: string | null;
};

function moduleLabel(id: ModuleId): string {
  if (id === 'knm') return 'KNM';
  const [level, skill] = id.split(':') as [Level, string];
  return `${levelLabel(level)} ${skill.charAt(0).toUpperCase()}${skill.slice(1)}`;
}

function latest(...values: (string | null | undefined)[]): string | null {
  let best: string | null = null;
  for (const v of values) {
    if (v && (!best || Date.parse(v) > Date.parse(best))) best = v;
  }
  return best;
}

/**
 * Het gebruikersoverzicht, gelezen uit de tabellen van dít product.
 *
 * De vorige versie kwam mee uit de KNM-fork en las `exam_submissions`, `user_leren_progress` en
 * een `status`-kolom die `user_word_card_progress` niet heeft — vandaar een tabel vol streepjes
 * onder een pakketkolom die iedereen "Gratis" noemde. Toegang komt hier uit `user_metadata.modules`
 * via `lib/entitlements.ts`, activiteit uit `exam_attempts`, `open_submissions` (het gratis
 * nakijktegoed) en `user_lesson_progress`.
 *
 * Alle tabellen gaan door `fetchAll`: een plain `select()` stopt stil bij duizend rijen.
 */
export default async function UsersPage() {
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
  type Attempt = {
    user_id: string;
    level: Level | null;
    skill: string;
    passed: boolean | null;
    pct: number | null;
    completed_at: string | null;
    started_at: string;
  };
  type Graded = {
    user_id: string;
    attempt_id: number | null;
    task_id: number;
    created_at: string;
    open_tasks: { skill: 'schrijven' | 'spreken' } | { skill: 'schrijven' | 'spreken' }[] | null;
  };
  type LessonProgress = { user_id: string; state: string; updated_at: string; completed_at: string | null };
  type Card = { user_id: string | null; known: boolean; updated_at: string };

  const [payments, attempts, graded, lessons, cards] = await Promise.all([
    fetchAll<Payment>((f, t) =>
      admin.from('payments').select('user_id, amount_cents, created_at').eq('status', 'paid')
        .order('created_at', { ascending: false }).range(f, t)),
    fetchAll<Attempt>((f, t) =>
      admin.from('exam_attempts').select('user_id, level, skill, passed, pct, completed_at, started_at')
        .range(f, t)),
    fetchAll<Graded>((f, t) =>
      admin.from('open_submissions').select('user_id, attempt_id, task_id, created_at, open_tasks(skill)')
        .neq('status', 'submitted').range(f, t) as unknown as PromiseLike<{ data: Graded[] | null; error: unknown }>),
    fetchAll<LessonProgress>((f, t) =>
      admin.from('user_lesson_progress').select('user_id, state, updated_at, completed_at').range(f, t)),
    fetchAll<Card>((f, t) =>
      admin.from('user_word_card_progress').select('user_id, known, updated_at').not('user_id', 'is', null)
        .range(f, t)),
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

  const users: UserRow[] = allUsers
    .filter(u => u.email && !u.email.endsWith('@example.com'))
    .map(u => {
      const meta = u.user_metadata ?? {};
      const legacy = planFromMetadata(meta) !== 'free';
      const owned = modulesFromMetadata(meta);
      const bought = purchasedModules(meta);
      const access: Access = legacy ? 'legacy' : owned.length > 0 ? 'modules' : 'free';
      const until = typeof meta.modules_until === 'string' ? meta.modules_until : null;

      const userPayments = paymentsByUser.get(u.id) ?? [];
      const userAttempts = attemptsByUser.get(u.id) ?? [];
      const userGraded = gradedByUser.get(u.id) ?? [];
      const userLessons = lessonsByUser.get(u.id) ?? [];
      const userCards = cardsByUser.get(u.id) ?? [];

      // Per module: afgeronde zittingen, geslaagd, beste score, laatste keer.
      const byModule = new Map<ModuleId, ModuleActivity>();
      for (const a of userAttempts) {
        if (!a.completed_at) continue;
        const id = (a.skill === 'knm' ? 'knm' : `${a.level ?? 'a2'}:${a.skill}`) as ModuleId;
        const cur = byModule.get(id) ?? {
          module: id, label: moduleLabel(id), attempts: 0, passed: 0, best_pct: null, last_at: a.completed_at,
        };
        cur.attempts += 1;
        if (a.passed) cur.passed += 1;
        if (a.pct != null && (cur.best_pct == null || a.pct > cur.best_pct)) cur.best_pct = a.pct;
        cur.last_at = latest(cur.last_at, a.completed_at)!;
        byModule.set(id, cur);
      }

      // Dezelfde telling als `graded_exercise_count`: één per (zitting, opgave).
      const gradedKeys = { schrijven: new Set<string>(), spreken: new Set<string>() };
      for (const g of userGraded) {
        const task = Array.isArray(g.open_tasks) ? g.open_tasks[0] : g.open_tasks;
        const skill = task?.skill;
        if (skill) gradedKeys[skill].add(`${g.attempt_id ?? 'none'}:${g.task_id}`);
      }

      const lastActive = latest(
        u.last_sign_in_at,
        ...userAttempts.map(a => a.completed_at ?? a.started_at),
        ...userGraded.map(g => g.created_at),
        ...userLessons.map(l => l.completed_at ?? l.updated_at),
        ...userCards.map(c => c.updated_at),
      );

      return {
        id: u.id,
        email: u.email!,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        access,
        modules: legacy ? ['Alles (oude aankoop)'] : owned.map(moduleLabel),
        modules_until: until,
        lapsed_modules: !legacy && modulesExpired(meta) ? bought.map(moduleLabel) : [],
        payments_count: userPayments.length,
        payments_total_cents: userPayments.reduce((s, p) => s + p.amount_cents, 0),
        last_payment: userPayments[0]
          ? { amount_cents: userPayments[0].amount_cents, created_at: userPayments[0].created_at }
          : null,
        graded: { schrijven: gradedKeys.schrijven.size, spreken: gradedKeys.spreken.size },
        graded_limit: FREE_GRADED_PER_SKILL,
        exams: [...byModule.values()].sort((a, b) => Date.parse(b.last_at) - Date.parse(a.last_at)),
        lessons_done: userLessons.filter(l => l.state === 'done').length,
        lessons_started: userLessons.length,
        cards_known: userCards.filter(c => c.known).length,
        last_active_at: lastActive,
      };
    });

  users.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));

  return <UsersTable users={users} />;
}
