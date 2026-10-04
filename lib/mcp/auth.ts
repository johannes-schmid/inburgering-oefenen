import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify, type JWTPayload } from 'jose';
import type { AuthInfo } from '@modelcontextprotocol/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { authIssuer, protectedResourceMetadataUrl } from './config';

/**
 * Controleert het dragertoken dat ChatGPT meestuurt en geeft de Supabase-gebruiker terug.
 *
 * Het token is een gewone Supabase-gebruikers-JWT, uitgegeven door de OAuth 2.1-server van
 * Supabase Auth. Twee routes, afhankelijk van het algoritme in de kop:
 *
 *  - **ES256/RS256** (asymmetrisch; de lokale stack en productie met signing keys): lokaal
 *    verifiëren tegen de JWKS van het project — geen netwerkverkeer per aanroep behalve het
 *    cachen van de sleutels.
 *  - **HS256** (het oude symmetrische geheim): wij hebben dat geheim niet in de app en willen
 *    het ook niet hebben; dan laat GoTrue zelf het token valideren via `auth.getUser(token)`,
 *    het patroon dat `app/api/claim-submissions` al gebruikt.
 *
 * In beide gevallen controleren we daarna hetzelfde: `iss` is ónze autorisatieserver, `sub` is
 * een uuid, `exp` ligt in de toekomst, `aud` is `authenticated`. `client_id` staat alleen op een
 * token dat via de OAuth-server is uitgegeven; een gewone browsersessie heeft hem niet. Buiten
 * tests eisen we hem, zodat een gelekte sessiecookie geen MCP-toegang is.
 */
export type VerifiedUser = { userId: string; clientId: string | null; expiresAt: number };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function remoteJwks() {
  if (!jwks) jwks = createRemoteJWKSet(new URL(`${authIssuer()}/.well-known/jwks.json`));
  return jwks;
}

function requireClientId(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.MCP_REQUIRE_CLIENT_ID === 'true';
}

export function checkClaims(payload: JWTPayload): VerifiedUser | null {
  const issuer = authIssuer();
  if (payload.iss !== issuer) return null;
  if (typeof payload.sub !== 'string' || !UUID.test(payload.sub)) return null;
  if (typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now()) return null;
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!aud.includes('authenticated')) return null;
  const clientId = typeof payload.client_id === 'string' ? payload.client_id : null;
  if (requireClientId() && !clientId) return null;
  return { userId: payload.sub, clientId, expiresAt: payload.exp };
}

export async function verifyAccessToken(token: string): Promise<VerifiedUser | null> {
  let alg: string | undefined;
  try {
    alg = decodeProtectedHeader(token).alg;
  } catch {
    return null;
  }

  try {
    if (alg === 'HS256') {
      const admin = createAdminClient();
      const { data, error } = await admin.auth.getUser(token);
      if (error || !data.user) return null;
      // GoTrue heeft handtekening en vervaldatum al gecontroleerd; de claims lezen we zelf.
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')) as JWTPayload;
      const verified = checkClaims(payload);
      return verified && verified.userId === data.user.id ? verified : null;
    }
    const { payload } = await jwtVerify(token, remoteJwks(), { issuer: authIssuer() });
    return checkClaims(payload);
  } catch {
    return null;
  }
}

/**
 * De vorm die `withMcpAuth` van mcp-handler verwacht.
 *
 * Geen token → `undefined`, en de aanroep gaat anoniem door (de proefvragen). Wél een token maar
 * ongeldig → een fout, want `withMcpAuth` maakt daar een 401 met `WWW-Authenticate` van. Zou het
 * stil `undefined` worden, dan liep een verlopen token gewoon anoniem door en zag ChatGPT nooit
 * dat het opnieuw moest autoriseren.
 */
export async function verifyForMcpHandler(_req: Request, bearerToken?: string): Promise<AuthInfo | undefined> {
  if (!bearerToken) return undefined;
  const user = await verifyAccessToken(bearerToken);
  if (!user) throw new Error('invalid_token');
  return {
    token: bearerToken,
    clientId: user.clientId ?? 'supabase-session',
    scopes: [],
    expiresAt: user.expiresAt,
    extra: { userId: user.userId },
    resourceMetadataUrl: protectedResourceMetadataUrl(),
  } as AuthInfo;
}

/** De `WWW-Authenticate`-uitdaging die de koppel-UI van ChatGPT opent. */
export function loginChallenge(description = 'Koppel je account van Inburgering Oefenen om verder te gaan.'): string {
  return `Bearer resource_metadata="${protectedResourceMetadataUrl()}", error="insufficient_scope", error_description="${description.replace(/"/g, "'")}"`;
}
