import { createMcpHandler, withMcpAuth } from 'mcp-handler';
import { verifyForMcpHandler } from '@/lib/mcp/auth';
import { mcpResourceUrl } from '@/lib/mcp/config';
import { registerTools } from '@/lib/mcp/tools/register';
import { widgetHtml } from '@/lib/mcp/widget';

/**
 * Het MCP-eindpunt van de ChatGPT-app (Streamable HTTP, stateless).
 *
 * Auth is optioneel op het eindpunt (`required: false`): de proefvragen werken zonder account, en
 * de tools die een account vereisen geven zelf de `mcp/www_authenticate`-uitdaging terug die de
 * koppel-UI van ChatGPT opent. Een ongeldig token wordt wél een 401 met `WWW-Authenticate`, zodat
 * ChatGPT opnieuw autoriseert in plaats van anoniem door te gaan met een verlopen token.
 *
 * De tools zelf staan in `lib/mcp/tools/register.ts`; de regels in `lib/mcp/*`.
 */
const handler = createMcpHandler(
  (server) => registerTools(server, widgetHtml),
  {
    serverInfo: { name: 'inburgering-oefenen', version: '1.0.0' },
    instructions:
      'Inburgering Oefenen provides practice questions for the Dutch inburgeringsexamen (A2 and B1 Lezen, A2 Luisteren, Schrijven, KNM), ' +
      'written and reviewed by a certified NT2 teacher. Use get_practice_exercise to fetch a question, show it to the user, and use submit_answer ' +
      '(or submit_writing_answer for Schrijven) to check the answer; use explain_answer for the teacher explanation. ' +
      'Do not write exam questions or judge answers yourself: the content and the verdict always come from the tools. ' +
      'Keep the Dutch question text and answer options verbatim, and reply in the language the user writes in. ' +
      'When a result contains a gate object, relay its message to the user as-is.',
  },
);

// `resourceUrl` is hier de órigin, niet het MCP-pad: mcp-handler plakt `resourceMetadataPath` er
// direct achter voor de `resource_metadata`-URL in de 401. Met het volledige pad wees die naar
// `/api/mcp/.well-known/...` (404) en kon ChatGPT de autorisatieserver niet vinden.
const authed = withMcpAuth(handler, verifyForMcpHandler, {
  required: false,
  resourceMetadataPath: '/.well-known/oauth-protected-resource',
  resourceUrl: new URL(mcpResourceUrl()).origin,
});

export { authed as GET, authed as POST, authed as DELETE };
