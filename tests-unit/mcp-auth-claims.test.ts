import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { checkClaims } from '@/lib/mcp/auth';

/**
 * De claimcontrole op het OAuth-token, los van de handtekening (die doet jose tegen de JWKS).
 * `iss` moet onze eigen Supabase Auth zijn, `sub` een uuid, `exp` in de toekomst, `aud`
 * `authenticated`; `client_id` is in productie verplicht zodat een gelekte sessiecookie geen
 * MCP-toegang is.
 */
const ISSUER = 'http://127.0.0.1:54421/auth/v1';
const SUB = 'cba70c58-3cb4-4ade-8bae-b99e9672ff69';
const future = Math.floor(Date.now() / 1000) + 600;

const good = { iss: ISSUER, sub: SUB, aud: 'authenticated', exp: future, client_id: 'abc' };

let env: Record<string, string | undefined>;
beforeEach(() => {
  env = { url: process.env.NEXT_PUBLIC_SUPABASE_URL, req: process.env.MCP_REQUIRE_CLIENT_ID };
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54421';
  delete process.env.MCP_REQUIRE_CLIENT_ID;
});
afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = env.url;
  if (env.req === undefined) delete process.env.MCP_REQUIRE_CLIENT_ID; else process.env.MCP_REQUIRE_CLIENT_ID = env.req;
});

describe('checkClaims', () => {
  it('accepts a well-formed OAuth token', () => {
    expect(checkClaims(good)).toEqual({ userId: SUB, clientId: 'abc', expiresAt: future });
  });

  it('rejects another issuer', () => {
    expect(checkClaims({ ...good, iss: 'https://evil.example/auth/v1' })).toBeNull();
  });

  it('rejects an expired token', () => {
    expect(checkClaims({ ...good, exp: Math.floor(Date.now() / 1000) - 1 })).toBeNull();
  });

  it('rejects a wrong audience', () => {
    expect(checkClaims({ ...good, aud: 'anon' })).toBeNull();
    expect(checkClaims({ ...good, aud: ['service_role'] })).toBeNull();
  });

  it('rejects a subject that is not a uuid', () => {
    expect(checkClaims({ ...good, sub: 'admin' })).toBeNull();
  });

  it('requires client_id when configured, so a browser session token is not an MCP token', () => {
    const session = { ...good, client_id: undefined };
    expect(checkClaims(session)?.clientId).toBeNull();
    process.env.MCP_REQUIRE_CLIENT_ID = 'true';
    expect(checkClaims(session)).toBeNull();
  });
});
