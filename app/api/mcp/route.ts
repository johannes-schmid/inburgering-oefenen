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
      'Inburgering Oefenen: echte oefenvragen voor het Nederlandse inburgeringsexamen — A2 en B1 Lezen, A2 Luisteren, Schrijven en KNM — ' +
      'geschreven en gecontroleerd door een NT2-docent. Verzin nooit zelf examenvragen en beoordeel nooit zelf een antwoord: haal een vraag op met ' +
      'get_practice_exercise, laat de gebruiker kiezen, en kijk na met submit_answer (of submit_writing_answer voor Schrijven). ' +
      'Zonder gekoppeld account zijn er tien proefvragen per onderdeel; met een gratis account oefenexamen 1; met een module alle tien examens. ' +
      'Als een resultaat een `gate` bevat, leg dan in de taal van de gebruiker uit wat de volgende stap is en noem de link; betalen gebeurt alleen op de website. ' +
      'Antwoord in de taal van de gebruiker, maar laat de Nederlandse examenteksten en antwoordopties letterlijk staan.',
  },
);

const authed = withMcpAuth(handler, verifyForMcpHandler, {
  required: false,
  resourceMetadataPath: '/.well-known/oauth-protected-resource',
  resourceUrl: mcpResourceUrl(),
});

export { authed as GET, authed as POST, authed as DELETE };
