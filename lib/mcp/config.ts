/**
 * De vaste adressen van de ChatGPT-app (MCP).
 *
 * `MCP_RESOURCE_URL` is de canonieke identiteit van het MCP-eindpunt (RFC 9728 `resource`).
 * ChatGPT stuurt precies deze waarde als `resource` mee in de OAuth-flow, dus hij moet
 * overeenkomen met wat `/.well-known/oauth-protected-resource` publiceert. Lokaal is dat de
 * tunnel-URL; op productie `https://inburgeringoefenen.nl/api/mcp`.
 */
export function mcpResourceUrl(): string {
  const raw = process.env.MCP_RESOURCE_URL || `${process.env.BASE_URL ?? 'http://localhost:3001'}/api/mcp`;
  return raw.replace(/\/$/, '');
}

/** De autorisatieserver: Supabase Auth van ditzelfde project. */
export function authIssuer(): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, '')}/auth/v1`;
}

export function protectedResourceMetadataUrl(): string {
  return `${new URL(mcpResourceUrl()).origin}/.well-known/oauth-protected-resource`;
}
