/**
 * A **real** Supabase session for the auth-gated tests.
 *
 * The KNM suite faked one: a hand-built session object written straight into the cookie, plus an
 * override of `document.cookie` and an interception of every `auth/v1` call so nothing could notice.
 * It tested a browser that had been lied to. When `@supabase/ssr` changed how it decodes a cookie,
 * the mock kept "working" and the tests kept passing against a page that no real user could reach.
 *
 * This mints a session against the local stack instead, through the same GoTrue endpoint the app
 * uses. It needs `supabase start` and the local service key, so `available()` reports whether the
 * environment can do it — the specs skip rather than fail when it cannot, because a missing local
 * stack is not a broken product.
 */

const API = process.env.SUPABASE_TEST_URL || 'http://127.0.0.1:54421';
const SERVICE = process.env.SUPABASE_SERVICE_KEY;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const PASSWORD = 'playwright-local-only';

export function available() {
  return Boolean(SERVICE && ANON);
}

export function skipReason() {
  return 'needs the local Supabase stack — set SUPABASE_SERVICE_KEY and NEXT_PUBLIC_SUPABASE_ANON_KEY';
}

/**
 * Create (or reset) a local user and return its session.
 *
 * `user_metadata` is passed through so a spec can ask for a paying account. Note GoTrue *merges*
 * metadata on update, so a key omitted here survives from a previous run — every field a test
 * depends on is therefore written explicitly, including the empty ones.
 */
export async function mintSession(email, userMetadata = {}) {
  const admin = {
    apikey: SERVICE,
    Authorization: `Bearer ${SERVICE}`,
    'Content-Type': 'application/json',
  };

  const list = await (await fetch(`${API}/auth/v1/admin/users?per_page=200`, { headers: admin })).json();
  const existing = (list.users ?? []).find(u => u.email === email);

  if (existing) {
    await fetch(`${API}/auth/v1/admin/users/${existing.id}`, {
      method: 'PUT',
      headers: admin,
      body: JSON.stringify({ password: PASSWORD, user_metadata: userMetadata }),
    });
  } else {
    await fetch(`${API}/auth/v1/admin/users`, {
      method: 'POST',
      headers: admin,
      body: JSON.stringify({
        email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: userMetadata,
      }),
    });
  }

  const res = await fetch(`${API}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  const session = await res.json();
  if (!session.access_token) {
    throw new Error(`Could not mint a session for ${email}: ${JSON.stringify(session)}`);
  }
  return session;
}

/**
 * Put a session into a Playwright context as the cookie the server reads.
 *
 * Chunked into `.0` / `.1` exactly as `@supabase/ssr` does. This is not cosmetic: Chromium rejects
 * a cookie over ~4 KB outright, and a session carrying any real `user_metadata` is over it — so an
 * unchunked cookie is silently dropped and every "authenticated" test quietly runs anonymous.
 */
export async function applySession(context, session, baseURL = 'http://localhost:3001') {
  const value = `base64-${Buffer.from(JSON.stringify(session)).toString('base64')}`;
  const name = 'sb-127-auth-token';
  const CHUNK = 3180;
  const parts =
    value.length <= CHUNK
      ? [{ name, value }]
      : Array.from({ length: Math.ceil(value.length / CHUNK) }, (_, i) => ({
          name: `${name}.${i}`,
          value: value.slice(i * CHUNK, (i + 1) * CHUNK),
        }));

  const { hostname } = new URL(baseURL);
  await context.addCookies(parts.map(c => ({ ...c, domain: hostname, path: '/' })));
}

/**
 * Flip one exam's free/paid flag, and hand back a function that restores it.
 *
 * The entitlement tests need both a free exam and a paid one that actually have items in them, and
 * on a freshly seeded database only exam 1 of each (level, skill) is published. Rather than
 * fabricating a stimulus and questions — which would be a second, quietly diverging copy of what
 * the seed script builds — a real published exam is borrowed for the length of the test.
 */
export async function setExamFree(level, skill, number, isFree) {
  const query = `level=eq.${level}&skill=eq.${skill}&number=eq.${number}`;
  const headers = {
    apikey: SERVICE,
    Authorization: `Bearer ${SERVICE}`,
    'Content-Type': 'application/json',
  };

  const write = async value => {
    const res = await fetch(`${API}/rest/v1/exams?${query}`, {
      method: 'PATCH',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify({ is_free: value }),
    });
    const rows = await res.json();
    if (!res.ok || !Array.isArray(rows) || rows.length === 0) {
      throw new Error(`Could not set is_free on ${level}/${skill}/${number}: ${JSON.stringify(rows)}`);
    }
  };

  // Read the original *before* writing. `return=representation` gives back the row as it now is, so
  // deriving the restore value from the PATCH response would restore the value the test just set.
  const res = await fetch(`${API}/rest/v1/exams?${query}&select=is_free`, { headers });
  const [original] = await res.json();
  if (!original) throw new Error(`No exam ${level}/${skill}/${number} to borrow`);

  await write(isFree);
  return () => write(original.is_free);
}

/** Add an admin to the allowlist, so `(admin)` stops bouncing this account. */
export async function allowlistAdmin(email) {
  const res = await fetch(`${API}/rest/v1/admin_users?on_conflict=email`, {
    method: 'POST',
    headers: {
      apikey: SERVICE,
      Authorization: `Bearer ${SERVICE}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({ email }),
  });
  if (!res.ok && res.status !== 409) {
    throw new Error(`Could not allowlist ${email}: ${res.status} ${await res.text()}`);
  }
}
