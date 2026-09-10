/**
 * De leersporen: van het onderdeelscherm naar één module en terug.
 *
 * Dit is de herindeling van 02-09 in beeld — de lange blokkenlijst met de tweede kolom ernaast is
 * eraf, en Grammatica en Examentraining zijn nu roosters van modules zoals de woordkaarten. Wat
 * de video moet laten zien is niet dat het er staat maar dat je er *uit* komt: elke stap eindigt
 * op de weg terug.
 *
 * De demo-account heeft alleen `a2:lezen`, want dat is het enige onderdeel met een cursus.
 */
export default {
  title: 'De leersporen',
  description: 'Grammatica en Examentraining als modules — erin, en er weer uit',
  start: '/nl/dashboard/a2/lezen',
  auth: {
    email: 'walkthrough+leerspoor@inburgeringoefenen.nl',
    metadata: { full_name: 'Johannes Schmid', modules: ['a2:lezen'] },
  },
  steps: [
    {
      chapter: 'De leerroute',
      description: 'Drie stappen op het onderdeelscherm. Elke stap wijst naar zijn eigen rooster.',
      async run(page, kit) {
        await kit.visit('/nl/dashboard/a2/lezen');
        await kit.reveal('text=Leerroute', { hold: 1500 });
        await kit.reveal('text=Grammatica', { hold: 1600 });
      },
    },
    {
      chapter: 'Vijf modules, geen lijst van 28 lessen',
      description: 'Zinnen bouwen, Werkwoorden & tijd, … — met de voortgang per module erin.',
      async run(page, kit) {
        await page.getByRole('link', { name: /Bekijk de modules/ }).first().click();
        await page.waitForLoadState('networkidle').catch(() => {});
        await kit.beat(1400);
        await kit.reveal('text=Totale voortgang', { hold: 1400 });
        await kit.reveal('text=Zinnen bouwen', { hold: 1600 });
      },
    },
    {
      chapter: 'Eén module staat op zichzelf',
      description: 'Zeven lessen op volgorde, waar je verdergaat bovenaan, en één weg terug.',
      async run(page, kit) {
        await page.getByRole('link', { name: /Zinnen bouwen/ }).first().click();
        await page.waitForLoadState('networkidle').catch(() => {});
        await kit.beat(1600);
        await kit.reveal('text=Beginnen', { hold: 1500 });
        await kit.reveal('text=Volgende module', { hold: 1600 });
      },
    },
    {
      chapter: 'In de les — en de terugknop noemt de module',
      description: 'Geen zijbalk met de hele cursus meer. De les hoort bij één module en zegt welke.',
      async run(page, kit) {
        await page.getByRole('link', { name: /De hoofdzin/ }).first().click();
        await page.waitForLoadState('networkidle').catch(() => {});
        await kit.beat(1800);
        await kit.reveal('text=Les 1 van 7', { hold: 1800 });
      },
    },
    {
      chapter: 'Terug naar de module',
      description: 'Eén klik. Vanaf daar is het spoor één klik verder, en het onderdeel twee.',
      async run(page, kit) {
        await page.getByRole('link', { name: /Zinnen bouwen/ }).first().click();
        await page.waitForLoadState('networkidle').catch(() => {});
        await kit.beat(1500);
        await page.getByRole('link', { name: /^Grammatica$/ }).first().click();
        await page.waitForLoadState('networkidle').catch(() => {});
        await kit.beat(1800);
      },
    },
    {
      chapter: 'Examentraining is hetzelfde scherm',
      description: 'Drie modules uit de blokken van de docent: uitleg, training, toets jezelf.',
      async run(page, kit) {
        await kit.visit('/nl/dashboard/a2/lezen/spoor/examentraining');
        await kit.beat(1400);
        await kit.reveal('text=Examenuitleg', { hold: 1600 });
        await kit.reveal('text=Toets jezelf', { hold: 1800 });
      },
    },
  ],
};
