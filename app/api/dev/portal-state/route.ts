/**
 * Local-only state switcher for the dev toolbar.
 *
 * Refuses unless `devToolsEnabled()` — which requires a non-production build *and* a local
 * Supabase URL. It writes `user_metadata` and `exam_attempts` for the calling user only.
 */
import { createAdminClient } from '@/lib/supabase/admin';
import { jsonOk, jsonError } from '@/lib/api-constants';
import { planFromMetadata, modulesFromMetadata, modulesExpired } from '@/lib/entitlements';
import { devToolsEnabled, type StatePreset } from '@/lib/dev-tools';

type Shape = {
  plan: 'free' | 'premium' | 'premium_plus';
  modules: string[];
  /** Days in the past that access lapsed; `null` for an active subscription. */
  expiredDaysAgo: number | null;
  attempts: boolean;
};

const A2 = ['a2:lezen', 'a2:luisteren', 'a2:schrijven', 'a2:spreken'];
const B1 = ['b1:lezen', 'b1:schrijven', 'b1:spreken'];

const SHAPES: Record<StatePreset, Shape> = {
  fresh:        { plan: 'free', modules: [],                     expiredDaysAgo: null, attempts: false },
  started:      { plan: 'free', modules: [],                     expiredDaysAgo: null, attempts: true  },
  module_lezen: { plan: 'free', modules: ['a2:lezen'],           expiredDaysAgo: null, attempts: true  },
  module_knm:   { plan: 'free', modules: ['knm'],                expiredDaysAgo: null, attempts: true  },
  bundle_a2:    { plan: 'free', modules: A2,                     expiredDaysAgo: null, attempts: true  },
  everything:   { plan: 'free', modules: [...A2, ...B1, 'knm'],  expiredDaysAgo: null, attempts: true  },
  expired:      { plan: 'free', modules: A2,                     expiredDaysAgo: 3,    attempts: true  },
  legacy_plan:  { plan: 'premium_plus', modules: [],             expiredDaysAgo: null, attempts: true  },
};

/** One completed sitting of exam 1 per onderdeel — enough for every progress surface. */
const SEED_ATTEMPTS: { level: string | null; skill: string; pct: number }[] = [
  { level: 'a2', skill: 'lezen',     pct: 72 },
  { level: 'a2', skill: 'luisteren', pct: 48 },
  { level: 'a2', skill: 'schrijven', pct: 65 },
  { level: 'a2', skill: 'spreken',   pct: 80 },
  { level: 'b1', skill: 'lezen',     pct: 55 },
  { level: null, skill: 'knm',       pct: 70 },
];

type Ctx =
  | { ok: false; error: Response }
  | { ok: true; supabase: ReturnType<typeof createAdminClient>; user: { id: string; email?: string; user_metadata?: Record<string, unknown> } };

async function userFrom(request: Request): Promise<Ctx> {
  const token = (request.headers.get('authorization') || '').replace('Bearer ', '');
  if (!token) return { ok: false, error: jsonError('Unauthorized', 401) };
  const supabase = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return { ok: false, error: jsonError('Invalid session', 401) };
  return { ok: true, supabase, user };
}

export async function GET(request: Request): Promise<Response> {
  if (!devToolsEnabled()) return jsonError('Not found', 404);
  const ctx = await userFrom(request);
  if (!ctx.ok) return ctx.error;
  const { supabase, user } = ctx;

  const { count } = await supabase
    .from('exam_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const meta = user.user_metadata ?? {};
  return jsonOk({
    enabled: true,
    email: user.email ?? null,
    plan: planFromMetadata(meta),
    modules: modulesFromMetadata(meta),
    modulesUntil: (meta as { modules_until?: string }).modules_until ?? null,
    expired: modulesExpired(meta),
    attemptCount: count ?? 0,
  });
}

export async function POST(request: Request): Promise<Response> {
  if (!devToolsEnabled()) return jsonError('Not found', 404);
  const ctx = await userFrom(request);
  if (!ctx.ok) return ctx.error;
  const { supabase, user } = ctx;

  const body = (await request.json().catch(() => ({}))) as { preset?: StatePreset };
  const shape = body.preset ? SHAPES[body.preset] : undefined;
  if (!shape) return jsonError('Unknown preset', 400);

  // updateUserById MERGES user_metadata, so every key this preset controls must be written
  // explicitly — omitting one leaves the previous preset's value in place.
  const meta = { ...(user.user_metadata ?? {}) } as Record<string, unknown>;
  meta.plan = shape.plan;
  meta.tier = shape.plan;
  meta.premium = shape.plan !== 'free';
  meta.modules = shape.modules;
  meta.modules_until =
    shape.expiredDaysAgo === null
      ? null
      : new Date(Date.now() - shape.expiredDaysAgo * 86_400_000).toISOString();

  const { error: metaError } = await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: meta,
  });
  if (metaError) return jsonError(`metadata: ${metaError.message}`, 500);

  const del = await supabase.from('exam_attempts').delete().eq('user_id', user.id);
  if (del.error) return jsonError(`attempts: ${del.error.message}`, 500);

  if (shape.attempts) {
    const rows = SEED_ATTEMPTS.map((a, i) => ({
      user_id: user.id,
      level: a.level,
      skill: a.skill,
      exam_number: 1,
      attempt_no: 1,
      score: a.pct,
      total: 100,
      pct: a.pct,
      passed: a.pct >= 60,
      pass_threshold_pct: 60,
      feedback_mode: 'exam',
      started_at: new Date(Date.now() - (i + 1) * 86_400_000).toISOString(),
      completed_at: new Date(Date.now() - (i + 1) * 86_400_000 + 1_800_000).toISOString(),
    }));
    const ins = await supabase.from('exam_attempts').insert(rows);
    if (ins.error) return jsonError(`attempts: ${ins.error.message}`, 500);
  }

  return jsonOk({ applied: body.preset });
}
