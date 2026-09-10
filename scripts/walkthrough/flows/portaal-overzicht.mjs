/**
 * Het portaaloverzicht, zoals een betalende kandidaat het ziet.
 *
 * De demo-account heeft alles gekocht: anders staat er "niet in je pakket" op elke kaart en toont
 * de video de verkooppagina in plaats van het product.
 */
export default {
  title: 'Het portaaloverzicht',
  description: 'Wat een kandidaat ziet na inloggen — en waar hij verdergaat',
  start: '/nl/dashboard',
  auth: {
    email: 'walkthrough+portaal@inburgeringoefenen.nl',
    metadata: {
      full_name: 'Johannes Schmid',
      modules: [
        'a2:lezen', 'a2:luisteren', 'a2:schrijven', 'a2:spreken',
        'b1:lezen', 'b1:schrijven', 'b1:spreken', 'knm',
      ],
    },
  },
  steps: [
    {
      chapter: 'De begroeting',
      description: 'Eén regel: hoeveel oefenexamens en lessen je hebt gedaan.',
      async run(page, kit) {
        await kit.visit('/nl/dashboard');
        await kit.beat(1600);
      },
    },
    {
      chapter: 'Vier modules, twee meters',
      description: 'A2, B1, KNM en ONA — met leren en oefenen apart geteld.',
      async run(page, kit) {
        await kit.reveal('text=Niveau A2', { hold: 1500 });
        await kit.reveal('text=Nederlandse Maatschappij', { hold: 1500 });
      },
    },
    {
      chapter: 'ONA is aangekondigd, niet gebouwd',
      description: 'Gestippeld, geen link en geen prijs: betalen opent hem niet.',
      async run(page, kit) {
        await kit.reveal('text=Oriëntatie op de arbeidsmarkt', { hold: 1800 });
      },
    },
    {
      chapter: 'Wat nu?',
      description: 'Examenklaar is een telling van je oefenexamens, geen DUO-norm.',
      async run(page, kit) {
        await kit.reveal('text=Examenklaar', { hold: 1600 });
        await kit.reveal('text=Jouw traject', { hold: 2000 });
      },
    },
    {
      chapter: 'Door naar een onderdeel',
      description: 'De onderdelen van een niveau staan één klik verder.',
      async run(page, kit) {
        /* Op de ondertitel, niet op "Niveau A2": die naam staat óók in de zijbalk en `first()`
           pakte die, waardoor de video de kaart demonstreerde door hem te negeren. */
        await page.getByRole('link', { name: /Vier taalonderdelen/ }).first().click();
        await page.waitForLoadState('networkidle').catch(() => {});
        await kit.beat(2200);
      },
    },
  ],
};
