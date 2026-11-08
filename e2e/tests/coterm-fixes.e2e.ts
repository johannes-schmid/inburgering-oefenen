import { test } from '@e2e-dev/web';
import { expect } from 'e2e';
import { accountMeta } from './helpers/accounts';

/**
 * Regressietests voor de vier bugs uit de bug bash van 08-11 (alle vier opgelost): de knop bleef
 * grijs na een wijziging, opgezegde modules waren niet terug te zetten, `?gewijzigd=` meldde een
 * wijziging die er niet was, en het niveau-overzicht zei "Alle lessen af" bij modules die je niet hebt.
 */
const bb = {};

async function confirmChange(screen: any) {
  await screen.getByRole('button', 'Wijziging bekijken').tap();
  const dialog = screen.getByRole('dialog', 'Klopt dit?');
  await dialog.getByRole('button', 'Bevestigen', { exact: false }).tap();
  await expect(screen.getByText('Je wijziging is verwerkt. Je krijgt een bevestiging per e-mail.')).toBeVisible();
}

test('na een bevestigde wijziging kun je zonder herladen nog een wijziging doen', { ...bb, session: 'switcher' }, async ({ app, screen }) => {
  await app.open('/nl/dashboard/pakketten');
  const lezen = () => screen.getByRole('group', 'A2').getByRole('checkbox', 'Lezen', { exact: false });
  await lezen().tap();
  await confirmChange(screen);
  await lezen().tap();
  await expect(screen.getByRole('button', 'Wijziging bekijken')).toBeEnabled();
});

test('na alles uitzetten kun je een module die nog loopt weer aanzetten', { ...bb, session: 'edge' }, async ({ app, screen }) => {
  await app.open('/nl/dashboard/pakketten');
  await screen.getByRole('group', 'Andere modules').getByRole('checkbox', 'KNM', { exact: false }).tap();
  await confirmChange(screen);

  await app.open('/nl/dashboard/pakketten');
  const knm = screen.getByRole('group', 'Andere modules').getByRole('checkbox', 'KNM', { exact: false });
  await expect(knm).toContainText('Open tot');
  await expect(knm).toBeEnabled();

  await knm.tap();
  await confirmChange(screen);
  const meta = await accountMeta('edge');
  expect(Object.keys((meta.module_until ?? {}) as object)).not.toContain('knm');
  expect(meta.subscription_canceled_at ?? null).toBeNull();
});

test('een losse ?gewijzigd=1 meldt geen verwerkte wijziging', { ...bb, session: 'firstbuy' }, async ({ app, screen }) => {
  await app.open('/nl/dashboard/pakketten?gewijzigd=1');
  await expect(screen.getByRole('heading', 'Kies wat je wilt oefenen')).toBeVisible();
  await expect(screen.getByText('Je wijziging is verwerkt', { exact: false })).toHaveCount(0);
});

test('A2-overzicht zonder pakket zegt niet "Alle lessen af"', { ...bb, session: 'firstbuy' }, async ({ app, screen }) => {
  await app.open('/nl/dashboard/a2');
  await expect(screen.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(screen.getByText('Alle lessen af')).toHaveCount(0);
});
