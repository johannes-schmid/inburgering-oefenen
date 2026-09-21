/**
 * De hele weg van een bezoeker zonder account: taster → uitslag → het onderdeel in het portaal
 * → oefenexamen 1 → de aanmeldkaart.
 *
 * Geen `auth`, en dat is de hele vraag die deze video stelt: dit is de route zoals een gast hem
 * loopt. KNM is het onderdeel, omdat de lokale stack daar echte vragen met antwoorden van heeft —
 * de A2-examens staan lokaal nog op demo-inhoud en dan zou de speler een leeg antwoordblok tonen.
 */
export default {
  title: 'Van gast naar account',
  description: 'Tien gratis vragen, de uitslag, en vijf vragen van een echt oefenexamen',
  steps: [
    {
      chapter: 'De taster, zonder account',
      description: 'Tien vragen met uitleg na elk antwoord.',
      async run(page, kit) {
        await kit.visit('/nl/oefenen/knm');
        await kit.beat(1800);
      },
    },
    {
      chapter: 'De uitslag staat er meteen',
      description: 'Geen e-mailpoort meer: de score is van wie hem net verdiend heeft.',
      async run(page, kit) {
        await kit.visit('/nl/oefenen/knm?devFlow=results_pass');
        await kit.beat(2600);
        await kit.reveal('.fp-gauge', { hold: 1600 }).catch(() => {});
      },
    },
    {
      chapter: 'Verder op het onderdeel zelf',
      description: 'De knop gaat naar KNM in het portaal, niet naar de catalogus van alles.',
      async run(page, kit) {
        await page.getByRole('link', { name: /Verder oefenen op het platform/ }).first().click();
        await page.waitForLoadState('networkidle').catch(() => {});
        await kit.beat(2200);
      },
    },
    {
      chapter: 'Oefenexamen 1 openen',
      description: 'Een gast mag het gratis examen nu echt openen.',
      async run(page, kit) {
        await kit.visit('/nl/oefenexamen/knm/1');
        await kit.beat(2000);
        await page.getByRole('button', { name: /Start het examen/ }).first().click();
        await kit.beat(1600);
      },
    },
    {
      chapter: 'Vijf vragen, echt gemaakt',
      description: 'Dezelfde vragen als een betalende kandidaat ziet — dit is geen voorproefje van een voorproefje.',
      async run(page, kit) {
        for (let i = 0; i < 5; i += 1) {
          await page.getByRole('radio').first().click().catch(() => {});
          await kit.beat(700);
          // Via de DOM: het lokale DEV FLOWS-knopje ligt over "Volgende" heen.
          await page.evaluate(() => {
            const el = [...document.querySelectorAll('button')].find(b => /^Volgende$/.test(b.innerText.trim()));
            el?.click();
          });
          await kit.beat(800);
        }
      },
    },
    {
      chapter: 'De aanmeldkaart, over het examen heen',
      description: 'Eén tik met Google, en hij komt terug op dit examen met zijn vijf antwoorden.',
      async run(page, kit) {
        await kit.reveal('.guest-wall-card', { hold: 3200 }).catch(() => {});
        await kit.beat(2400);
      },
    },
  ],
};
