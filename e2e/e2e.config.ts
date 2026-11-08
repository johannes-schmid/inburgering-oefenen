import type { E2EConfig } from 'e2e';
import { web } from '@e2e-dev/web';
import { createAnthropic } from '@ai-sdk/anthropic';
import { readFileSync } from 'node:fs';

/**
 * Agentische e2e-tests tegen de LOKALE stack (`npm run dev` op 3001 met `.env.development.local`).
 *
 * Draai deze nooit tegen productie: de setup-tests resetten testaccounts en betalen in Mollie-testmodus.
 *
 * Het model praat rechtstreeks met Anthropic (globale regel: geen AI Gateway voor eigen tooling). De
 * baseURL staat er expliciet, zodat een `ANTHROPIC_BASE_URL` in de shell (Claude Code zet die) niet
 * wint. De sleutel komt uit `.env.development.local` of anders `.env.local`, alleen die ene variabele.
 */
function envValue(name: string): string {
  const fromShell = process.env[`E2E_${name}`];
  if (fromShell) return fromShell;
  for (const envFile of ['../.env.development.local', '../.env.local']) {
    const file = readFileSync(new URL(envFile, import.meta.url), 'utf8');
    const line = file.split('\n').find(l => l.startsWith(`${name}=`));
    const value = line?.slice(name.length + 1).trim().replace(/^["']|["']$/g, '');
    if (value) return value;
  }
  return '';
}

const anthropic = createAnthropic({
  apiKey: envValue('ANTHROPIC_API_KEY'),
  baseURL: 'https://api.anthropic.com/v1',
});

const context =
  'Dit is Inburgering Oefenen, een Nederlandstalig oefenplatform voor het inburgeringsexamen, lokaal in ontwikkeling. ' +
  'Abonnementen: één Mollie-abonnement per klant met één verlengdatum. Een module erbij gaat meteen open en kost nu alleen ' +
  'het resterende deel van de periode; een module eraf blijft open tot de verlengdatum (geen terugbetaling). Onder €1 wordt ' +
  'niets afgeschreven. Vier A2-onderdelen samen kosten €29,95 (bundel) in plaats van 4 × €9,95. KNM en ONA zitten buiten de bundel. ' +
  'Mollie staat in TESTMODUS: op de Mollie-pagina mag je de testkaart 4111 1111 1111 1111 gebruiken (vervaldatum 12/30, CVC 123), ' +
  'en op de testpagina daarna kies je de status "Paid" en klik je op Continue. ' +
  'Lokaal wordt geen e-mail verstuurd. De knop "DEV FLOWS" rechtsonder is een ontwikkeltool: niet gebruiken en niet als bug melden. ' +
  'De dev-server compileert een pagina bij het eerste bezoek: wacht tot hij geladen is voordat je hem kapot noemt. ' +
  'Niet als bug melden: de link "Bekijk pakketten" in de zijbalk; dat "Pakket: Gratis" op Mijn account staat (oud veld, bekend).';

const persona = { model: anthropic('claude-sonnet-5-5'), maxSteps: 40, maxModelCalls: 40, context };

export default {
  tests: 'tests/**/*.e2e.ts',
  targets: [
    {
      name: 'web',
      engine: web({ viewport: { width: 1440, height: 900 } }),
      app: { url: process.env.APP_URL ?? 'http://localhost:3001' },
    },
  ],
  timeout: 300_000,
  // De dev-server compileert routes bij het eerste bezoek; 30 s standaard is soms te krap voor Mollie + terugkeer.
  actionTimeout: 20_000,
  retries: 0,
  reporters: ['list'],
  agents: {
    default: persona,
    skeptic: {
      ...persona,
      system: 'Vertrouw geen enkel bedrag, datum of aantal. Controleer elk tegen elke andere plek waar het staat: de kiezer, de bevestigingsdialoog, Mijn account en het overzicht.',
    },
    fuzzer: {
      ...persona,
      system: 'Neem nooit het gewone pad. Klik snel achter elkaar, herlaad halverwege, ga terug in de geschiedenis, open dialogen en sluit ze, klik twee keer op bevestigen.',
    },
  },
} satisfies E2EConfig;
