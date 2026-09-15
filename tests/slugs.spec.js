const { test, expect } = require('@playwright/test');

/**
 * Eén vraag: kloppen de vertaalde slugs, en overleeft de taalwissel ze?
 *
 * Dat tweede is de reden dat dit bestand bestaat. In `i18n/routing.ts` stond jarenlang dat een
 * slug per taal "een 404 geeft zodra de lezer van taal wisselt", en op grond daarvan is het
 * vertalen van elke publieke URL uitgesteld. Dat klopte alleen voor een *parameterwaarde* (de
 * slug van een gids), niet voor een statisch segment: `usePathname()` van next-intl geeft de
 * interne routenaam terug, dus de wissel zoekt de goede slug zelf op. De gevallen hieronder
 * zijn het bewijs, en ze staan hier zodat niemand dat nog eens op gezag hoeft te geloven.
 */

const LABEL = { nl: 'Nederlands', en: 'English', ar: 'العربية' };
const LANG_BUTTON = { nl: 'Taal', en: 'Language', ar: 'اللغة' };

test.use({ viewport: { width: 1440, height: 900 } });

test.describe('vertaalde slugs', () => {
  const REACHABLE = [
    '/en/guides',
    '/en/civic-integration',
    '/en/language-exams',
    '/en/practice',
    '/en/practice/reading',
    '/en/practice-exam/a2/reading',
    '/en/practice-exam/knm',
    '/en/privacy-policy',
    '/ar/الأدلة',
    '/ar/تدرب',
    '/ar/امتحان-تجريبي/a2/القراءة',
  ];

  for (const path of REACHABLE) {
    test(`${path} is direct bereikbaar`, async ({ request }) => {
      const res = await request.get('http://localhost:3001' + path, { maxRedirects: 0 });
      expect(res.status()).toBe(200);
    });
  }

  /* Nederlands verandert niet. Die URL's zijn geïndexeerd en ranken; dit is de regel die een
   * toekomstige opruimactie niet mag breken. */
  const DUTCH = ['/nl/gidsen', '/nl/oefenen', '/nl/oefenen/lezen', '/nl/oefenexamen/a2/lezen'];
  for (const path of DUTCH) {
    test(`${path} blijft ongewijzigd`, async ({ request }) => {
      const res = await request.get('http://localhost:3001' + path, { maxRedirects: 0 });
      expect(res.status()).toBe(200);
    });
  }

  /* De onderdeelnaam is een parameterwaarde en next-intl vertaalt die niet mee, dus `proxy.ts`
   * doet het. Zonder die 308 bestaan `/en/practice-exam/a2/lezen` en `.../reading` naast
   * elkaar: twee vindplaatsen voor één pagina. */
  test('de onderdeelnaam in een andere taal leidt door naar de canonieke URL', async ({ request }) => {
    const res = await request.get('http://localhost:3001/en/practice-exam/a2/lezen', { maxRedirects: 0 });
    expect(res.status()).toBe(308);
    expect(decodeURIComponent(res.headers()['location'])).toContain('/en/practice-exam/a2/reading');
  });

  /* Het portaal heeft géén vertaalde slug maar wel dezelfde vier waarden. Als de omleiding
   * hierboven niet strak is afgebakend, verdwijnt het dashboard naar een route die niet bestaat. */
  test('het portaal beweegt niet mee', async ({ request }) => {
    const res = await request.get('http://localhost:3001/en/dashboard/a2/lezen', { maxRedirects: 0 });
    expect(res.status()).toBe(200);
  });
});

test.describe('de taalwissel', () => {
  const CASES = [
    ['/nl/oefenen', 'en', '/en/practice'],
    ['/nl/oefenexamen/a2/lezen', 'en', '/en/practice-exam/a2/reading'],
    ['/nl/gidsen', 'en', '/en/guides'],
    // Een gids-slug is een parameterwaarde en blijft in elke taal gelijk — zie `routing.ts`.
    ['/nl/inburgering/moet-ik-inburgeren', 'en', '/en/civic-integration/moet-ik-inburgeren'],
    ['/nl/oefenen/lezen', 'ar', '/ar/تدرب/القراءة'],
    ['/nl/taalexamens', 'ar', '/ar/امتحانات-اللغة'],
    ['/en/practice-exam/a2/reading', 'nl', '/nl/oefenexamen/a2/lezen'],
  ];

  for (const [from, to, expected] of CASES) {
    test(`${from} -> ${to}`, async ({ page }) => {
      await page.goto('http://localhost:3001' + from);
      const current = from.split('/')[1];
      await page.getByLabel(LANG_BUTTON[current], { exact: true }).first().click();
      await page.getByText(LABEL[to], { exact: true }).first().click();
      await page.waitForURL(u => decodeURIComponent(u.pathname) === expected, { timeout: 20000 });
      expect(decodeURIComponent(new URL(page.url()).pathname)).toBe(expected);
    });
  }
});
