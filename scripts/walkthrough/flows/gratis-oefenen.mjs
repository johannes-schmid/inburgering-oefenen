/**
 * De gratis taster, anoniem — de bovenkant van de funnel.
 *
 * Geen `auth`: dit is precies de route die zonder account moet werken, en een ingelogde sessie zou
 * de enige vraag die deze video stelt onbeantwoord laten.
 */
export default {
  title: 'Gratis oefenen, zonder account',
  description: 'Tien vragen met uitleg — de bovenkant van de funnel',
  steps: [
    {
      chapter: 'Kiezen: examen, dan onderdeel',
      description: 'Twee stappen, want A2 en B1 zijn dezelfde onderdelen op twee niveaus.',
      async run(page, kit) {
        await kit.visit('/nl/oefenen');
        await kit.beat(1800);
      },
    },
    {
      chapter: 'Een onderdeel starten',
      description: 'Lezen A2: tien vragen uit het echte formaat.',
      async run(page, kit) {
        await page.getByRole('link', { name: /Lezen/ }).first().click();
        await page.waitForLoadState('networkidle').catch(() => {});
        await kit.beat(1600);
      },
    },
    {
      chapter: 'Uitleg per vraag',
      description: 'Direct na je antwoord, van de docent — dat is wat de taster verkoopt.',
      async run(page, kit) {
        const start = page.getByRole('button', { name: /Start|Begin/ }).first();
        if (await start.isVisible().catch(() => false)) {
          await start.click();
          await kit.beat(1200);
        }
        const option = page.getByRole('radio').first();
        if (await option.isVisible().catch(() => false)) {
          await option.click();
        } else {
          await page.locator('button, [role="button"]').filter({ hasText: /^[A-C][\.\s]/ }).first()
            .click().catch(() => {});
        }
        await kit.beat(2400);
      },
    },
  ],
};
