'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DEV_FLOWS, type DevFlow, type DevState } from '@/lib/dev-tools';

/**
 * Local-only flow switcher: jump straight into a state the product can be in, including the
 * ones that normally take a whole sitting to reach.
 *
 * A flow is a screen *plus the account state it needs*, so clicking one may first POST a
 * preset to `/api/dev/portal-state` and only then navigate. Never renders in a production
 * build — both layouts gate it on `devToolsEnabled()` — and that API refuses unless Supabase
 * is a local instance. See lib/dev-tools.ts.
 */
export default function DevStateBar({ locale }: { locale: string }) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<DevState | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const token = useCallback(async () => {
    // getSession() refreshes an expired access token; without it the API 401s and the click
    // looks like a no-op.
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) { setProblem(`sessie: ${error.message}`); return null; }
    return session?.access_token ?? null;
  }, [supabase]);

  const refresh = useCallback(async () => {
    const at = await token();
    if (!at) { setState(null); return; }
    try {
      const res = await fetch('/api/dev/portal-state', { headers: { Authorization: 'Bearer ' + at } });
      if (res.ok) { setState(await res.json()); setProblem(null); }
      else setProblem(res.status === 404 ? '404 — verouderde tab, harde herlaad (⌘⇧R)' : `status ${res.status}`);
    } catch (err) {
      setProblem(`netwerk: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [token]);

  useEffect(() => { if (open) refresh(); }, [open, refresh]);

  const signedIn = state !== null;

  async function go(flow: DevFlow) {
    setProblem(null);
    // `/admin` is not in i18n/routing.ts and must stay unprefixed; everything else is.
    const href = flow.href.startsWith('/admin') ? flow.href : `/${locale}${flow.href}`;

    if (!flow.preset) { window.location.href = href; return; }

    const at = await token();
    if (!at) { setProblem('niet ingelogd — deze flow zet eerst een accountstatus'); return; }
    setBusy(flow.id);
    try {
      const res = await fetch('/api/dev/portal-state', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + at, 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset: flow.preset }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setProblem(
          res.status === 404
            ? '404 — verouderde tab, doe een harde herlaad (⌘⇧R)'
            : `${res.status}: ${body?.error ?? 'onbekende fout'}`,
        );
        setBusy(null);
        return;
      }
      // A full navigation, not a router push: the new metadata lives in the session and only a
      // fresh request re-runs getUser() on the server components that gate on it.
      window.location.href = href;
    } catch (err) {
      setProblem(`netwerk: ${err instanceof Error ? err.message : String(err)}`);
      setBusy(null);
    }
  }

  return (
    /* 76px up, not 16: the exam player has a sticky action bar in the bottom-right corner
       and the pill sat on top of its "Volgende" button. */
    <div style={{ position: 'fixed', bottom: 76, right: 16, zIndex: 9999, fontFamily: 'Manrope, sans-serif' }}>
      {open && (
        <div
          style={{
            width: 330, maxHeight: '78vh', overflowY: 'auto', marginBottom: 10, borderRadius: 14,
            background: '#0f1222', border: '1px solid rgba(255,255,255,0.14)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.45)', color: '#fff',
          }}
        >
          <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'sticky', top: 0, background: '#0f1222', zIndex: 1 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8ab4ff' }}>
              Dev flows · local only
            </p>
            <p style={{ margin: '6px 0 0', fontSize: 11, lineHeight: 1.6, color: 'rgba(255,255,255,0.6)' }}>
              {state
                ? `${state.email ?? 'onbekend'} · ${state.plan} · ${state.modules.length ? state.modules.join(', ') : 'geen modules'}${state.expired ? ' · verlopen' : ''} · ${state.attemptCount} pogingen`
                : 'niet ingelogd — alleen de anonieme flows werken'}
            </p>
            {problem && (
              <p style={{ margin: '8px 0 0', fontSize: 11, lineHeight: 1.5, fontWeight: 700, color: '#ff9a9a' }}>
                ⚠ {problem}
              </p>
            )}
          </div>

          <div style={{ padding: 8 }}>
            {DEV_FLOWS.map(group => (
              <div key={group.title} style={{ marginBottom: 6 }}>
                <p style={{ margin: '6px 4px 4px', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
                  {group.title}
                </p>
                {group.flows.map(flow => {
                  const blocked = Boolean(flow.auth) && !signedIn;
                  return (
                    <button
                      key={flow.id}
                      onClick={() => go(flow)}
                      disabled={busy !== null || blocked}
                      title={blocked ? 'log eerst in' : undefined}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px',
                        borderRadius: 9, cursor: blocked ? 'not-allowed' : busy ? 'wait' : 'pointer',
                        background: 'transparent', border: '1px solid transparent',
                        color: '#fff', font: 'inherit', opacity: blocked ? 0.35 : 1,
                      }}
                      onMouseOver={e => { if (!blocked) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                      onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span style={{ display: 'block', fontSize: 13, fontWeight: 700 }}>
                        {busy === flow.id ? 'klaarzetten…' : flow.label}
                      </span>
                      <span style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
                        {flow.hint}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        data-dev-toolbar
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 9999,
          background: '#0f1222', color: '#fff', border: '1px solid rgba(255,255,255,0.18)',
          boxShadow: '0 6px 20px rgba(0,0,0,0.35)', cursor: 'pointer', font: 'inherit',
          fontSize: 12, fontWeight: 800, letterSpacing: '0.04em',
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: 999, background: '#8ab4ff' }} />
        DEV FLOWS
      </button>
    </div>
  );
}
