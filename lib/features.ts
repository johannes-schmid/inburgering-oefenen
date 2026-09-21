/**
 * Launch feature flags.
 *
 * The KNM platform shipped with a blog, free topic quizzes, long-form lesson modules and
 * vocabulary cards. All of that code is kept for the A2 product, but the content does not
 * exist yet — these flags keep those surfaces out of the nav, out of the sitemap, and
 * behind a "Binnenkort beschikbaar" state until their A2 content lands.
 *
 * Flip a flag to `true` once the corresponding content is authored.
 */
export const FEATURES = {
  blog: true,
  oefenvragen: false,
  // Both switched on 2026-08-24, when KNM's content moved across from knmoefenen.nl: seven
  // lesson modules (43 sections) and 366 woordkaarten, all authored and reviewed on that
  // platform. **They are KNM's, not the taalonderdelen's** — Lezen and Luisteren still have no
  // lesson content, which is why both surfaces are reached from the KNM module rather than
  // from the portal's top level.
  leren: true,
  woordkaarten: true,
} as const;

export type FeatureKey = keyof typeof FEATURES;

export function isEnabled(key: FeatureKey): boolean {
  return FEATURES[key];
}

/* ═══════════════════════════════════════════════════════════════════════════
 * `UNGATE_PAID_FEATURES` — every plan behaves as Compleet
 *
 * Turned on 2026-07-30 while the grader was being built, because the paid gate hid
 * the output that needed reviewing. Turned **off** again the same day once spend
 * controls existed: `lib/grading-limits.ts` rations grading by allowance rather
 * than by tier, which is the honest way round when the cost is per use.
 *
 * `canSeeExplanations()` in lib/entitlements.ts is the only reader. Set to `true`
 * to open everything up again for testing.
 * ═══════════════════════════════════════════════════════════════════════════ */
export const UNGATE_PAID_FEATURES = false;

/* ═══════════════════════════════════════════════════════════════════════════
 * `LESSONS_COMING_SOON` — de leermodules staan op "Binnenkort"
 *
 * Aangezet 16-09 (eigenaar): de lesstof van de taalonderdelen is er wel, maar is
 * nog niet klaar om getoond te worden. De twee leerroutekaarten die daarnaar
 * wijzen — de taalregels en de examentraining — renderen daarom als `soon`,
 * zonder link.
 *
 * **Twee dingen vallen hier buiten, en allebei bewust.** De woordkaarten zijn
 * klaar. En **de lesmodules van KNM zijn de enige leerstof die wél af is** —
 * die kwamen in augustus mee van knmoefenen.nl, geschreven en nagekeken op dat
 * platform, en staan onder `FEATURES.leren`. Deze vlag raakt `dashboard/knm`
 * daarom niet; zet hem daar nooit "voor de consistentie" alsnog op.
 *
 * De lespagina's zelf blijven bereikbaar op hun URL; dit haalt alleen de weg
 * ernaartoe weg. Zet hem op `false` om de modules weer vrij te geven.
 * ═══════════════════════════════════════════════════════════════════════════ */
export const LESSONS_COMING_SOON = true;

/* ═══════════════════════════════════════════════════════════════════════════
 * `GUEST_PREVIEW_QUESTIONS` — hoeveel vragen een gast van een gratis examen krijgt
 *
 * Besluit eigenaar, 21-09, naar het voorbeeld van KNM Oefenen. Daarvóór stuurde
 * de speler een gast meteen naar `/register`: een leeg formulier, gevraagd vóór
 * er iets te zien was. Nu maakt hij de eerste vijf vragen van oefenexamen 1 echt
 * en komt de aanmeldkaart als overlay over het examen heen — `GuestSignupOverlay`.
 *
 * **Alleen op een gratis examen.** Een betaald examen blijft een omleiding naar
 * `/register`: daar is de rekening het onderwerp en niet het account.
 *
 * Er wordt voor een gast niets weggeschreven — elke schrijfactie in `ExamShell`
 * hangt aan `userId`. De vijf antwoorden staan in `sessionStorage` en worden na
 * het inloggen teruggezet.
 * ═══════════════════════════════════════════════════════════════════════════ */
export const GUEST_PREVIEW_QUESTIONS = 5;
