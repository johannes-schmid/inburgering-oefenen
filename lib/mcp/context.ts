import { createHash } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AuthInfo } from '@modelcontextprotocol/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Wie roept de tool aan?
 *
 * - `user`: er zit een geldig OAuth-token in de aanroep (zie `auth.ts`). `db` is een
 *   Supabase-client die dat token meestuurt, dus RLS geldt precies zoals in de browser — de
 *   kandidaat kan alleen zijn eigen rijen schrijven en lezen. `meta` is `user_metadata`, dezelfde
 *   bron als `ownsModule()` op de site.
 * - `anonymous`: geen token. ChatGPT stuurt een geanonimiseerde, stabiele gebruikers-id mee in
 *   `_meta["openai/subject"]`; die wordt gehasht met een serverzout en is de sleutel van de
 *   proefvragen-teller. Zonder subject (een andere MCP-client) is er niets om op te tellen: dan
 *   geldt het strengste pad — zie `exercises.ts`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Db = SupabaseClient<any, any, any>;

export type UserContext = {
  kind: 'user';
  userId: string;
  email: string | null;
  meta: Record<string, unknown>;
  db: Db;
  clientId: string | null;
  locale: string;
};

export type AnonymousContext = {
  kind: 'anonymous';
  subjectHash: string | null;
  locale: string;
};

export type McpContext = UserContext | AnonymousContext;

type ToolCtx = {
  mcpReq?: { _meta?: Record<string, unknown> };
  http?: { authInfo?: AuthInfo; req?: Request };
};

export function hashSubject(subject: string): string {
  const salt = process.env.MCP_SUBJECT_SALT ?? '';
  return createHash('sha256').update(`${salt}:${subject}`).digest('hex');
}

function userScopedClient(token: string): Db {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

function localeOf(meta: Record<string, unknown> | undefined): string {
  const raw = meta?.['openai/locale'] ?? meta?.['webplus/i18n'];
  if (typeof raw !== 'string') return 'nl';
  const lang = raw.slice(0, 2).toLowerCase();
  return lang === 'en' || lang === 'ar' ? lang : 'nl';
}

export async function buildContext(ctx: ToolCtx): Promise<McpContext> {
  const meta = ctx.mcpReq?._meta;
  const locale = localeOf(meta);
  const auth = ctx.http?.authInfo;
  const userId = (auth?.extra as { userId?: string } | undefined)?.userId;

  if (auth?.token && userId) {
    const admin = createAdminClient();
    const { data } = await admin.auth.admin.getUserById(userId);
    return {
      kind: 'user',
      userId,
      email: data.user?.email ?? null,
      meta: (data.user?.user_metadata ?? {}) as Record<string, unknown>,
      db: userScopedClient(auth.token),
      clientId: auth.clientId === 'supabase-session' ? null : auth.clientId,
      locale,
    };
  }

  const subject = meta?.['openai/subject'];
  return {
    kind: 'anonymous',
    subjectHash: typeof subject === 'string' && subject ? hashSubject(subject) : null,
    locale,
  };
}
