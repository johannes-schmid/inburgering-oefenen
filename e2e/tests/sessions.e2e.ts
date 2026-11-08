import { test } from '@e2e-dev/web';
import { expect } from 'e2e';
import { accountMeta, resetAccount, sessionCookies, type Persona } from './helpers/accounts';

/**
 * Eén ingelogde sessie per persona.
 *
 * `firstbuy` begint zonder abonnement. De andere vier kopen KNM via de Mollie-testcheckout, zodat
 * ze een lopend abonnement hebben (het testprofiel heeft geen SEPA, dus een abonnement kan alleen
 * via een eerste kaartbetaling ontstaan) en de kiezer in wijzigmodus staat.
 */
async function signIn(persona: Persona, app: { baseUrl: string; open(p?: string): Promise<void> }, browser: { setCookies(c: { url: string; name: string; value: string }[]): Promise<void> }) {
  await resetAccount(persona);
  await browser.setCookies(await sessionCookies(persona, app.baseUrl));
}

test.setup('persona zonder abonnement', { sessions: ['firstbuy'] }, async ({ app, browser, screen, session }) => {
  await signIn('firstbuy', app, browser);
  await app.open('/nl/dashboard/pakketten');
  await expect(screen.getByRole('heading', 'Kies wat je wilt oefenen')).toBeVisible();
  await session.save('firstbuy');
});

for (const persona of ['switcher', 'state', 'edge', 'bundle'] as const) {
  test.setup(`persona met KNM-abonnement: ${persona}`, { sessions: [persona] }, async ({ app, browser, screen, agent, session }) => {
    await signIn(persona, app, browser);
    await app.open('/nl/dashboard/pakketten?kies=knm');
    await screen.getByRole('button', 'Doorgaan naar betalen').tap();
    await agent.act('betaal op deze Mollie-testcheckout met de testkaart, kies op de testpagina de status Paid en klik op Continue');
    await agent.waitFor('de app van Inburgering Oefenen is weer in beeld (betaling gelukt of het overzicht)', { timeout: 60_000 });
    const meta = await accountMeta(persona);
    expect(meta.modules).toEqual(['knm']);
    expect(typeof meta.mollie_customer_id).toBe('string');
    await app.open('/nl/dashboard/pakketten');
    await expect(screen.getByRole('heading', 'Je onderdelen aanpassen')).toBeVisible();
    await session.save(persona);
  });
}
