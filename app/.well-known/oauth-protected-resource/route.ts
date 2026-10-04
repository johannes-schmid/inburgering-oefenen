import { protectedResourceHandler, metadataCorsOptionsRequestHandler } from 'mcp-handler';
import { authIssuer, mcpResourceUrl } from '@/lib/mcp/config';

/**
 * RFC 9728: wie is de autorisatieserver van `/api/mcp`? ChatGPT leest dit document zodra een
 * tool `mcp/www_authenticate` teruggeeft, en start dan de OAuth-flow bij Supabase Auth.
 * De waarde van `resource` moet exact `MCP_RESOURCE_URL` zijn — zie `lib/mcp/config.ts`.
 */
export const GET = protectedResourceHandler({
  authServerUrls: [authIssuer()],
  resourceUrl: mcpResourceUrl(),
});

export const OPTIONS = metadataCorsOptionsRequestHandler();
