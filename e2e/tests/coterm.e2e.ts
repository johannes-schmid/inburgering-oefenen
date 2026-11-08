import { test } from '@e2e-dev/web';
import { expect } from 'e2e';
import { accountMeta } from './helpers/accounts';

/**
 * Regressietests voor co-terming (docs/decisions/billing-coterm.md). Zonder agent-stappen: geen
 * modelkosten. De setup-tests in `sessions.e2e.ts` zorgen voor de beginstand.
 *
 * Het abonnement van een persona is vandaag aangemaakt, dus de hele periode is nog over: een module
 * erbij kost nu precies zijn maandprijs.
 */

test('zonder abonnement is de kiezer een gewone checkout', { session: 'firstbuy' }, async ({ app, screen }) => {
  await app.open('/nl/dashboard/pakketten');
  await expect(screen.getByRole('heading', 'Kies wat je wilt oefenen')).toBeVisible();
  await expect(screen.getByRole('button', 'Doorgaan naar betalen')).toBeVisible();
});

test('KNM eruit, drie A2-onderdelen erin', { session: 'switcher' }, async ({ app, screen }) => {
  await app.open('/nl/dashboard/pakketten');
  const a2 = screen.getByRole('group', 'A2');
  await a2.getByRole('checkbox', 'Lezen', { exact: false }).tap();
  await a2.getByRole('checkbox', 'Schrijven', { exact: false }).tap();
  await a2.getByRole('checkbox', 'Spreken', { exact: false }).tap();
  await screen.getByRole('group', 'Andere modules').getByRole('checkbox', 'KNM', { exact: false }).tap();

  const bar = screen.getByRole('complementary', 'Jouw abonnement');
  await expect(bar).toContainText('€29,85');
  await screen.getByRole('button', 'Wijziging bekijken').tap();

  const dialog = screen.getByRole('dialog', 'Klopt dit?');
  await expect(dialog).toContainText('Lezen A2, Schrijven A2, Spreken A2');
  await expect(dialog).toContainText('KNM, open tot en met');
  await dialog.getByRole('button', 'Bevestigen en €29,85 betalen').tap();

  await expect(screen.getByText('Je wijziging is verwerkt. Je krijgt een bevestiging per e-mail.')).toBeVisible();
  const meta = await accountMeta('switcher');
  expect(meta.modules).toEqual(['knm', 'a2:lezen', 'a2:schrijven', 'a2:spreken']);
  expect(Object.keys((meta.module_until ?? {}) as object)).toEqual(['knm']);

  await app.open('/nl/dashboard/profiel');
  await expect(screen.getByText('Opgezegd, open tot', { exact: false })).toBeVisible();
  await expect(screen.getByText('Verlengt')).toHaveCount(3);
});
