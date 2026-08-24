/**
 * The translation registry — one file per (guide, locale), merged onto the guide here.
 *
 * ## Why translations are not inline
 * `Guide.translations` was originally written inline, at the bottom of the guide's own file. That
 * works for four guides and stops working at twenty-four: a translated guide file runs to 600–1,200
 * lines, of which two thirds is text nobody reviewing the Dutch wants in their diff, and a reviewer
 * of the Arabic gets the Dutch body and the English body in the same patch. **One translation is one
 * file** for the same reason one guide is one file (see `types.ts`): the file is the review unit.
 *
 * ## Why the merge happens here and not in the guide file
 * A translation reuses the guide's own markup helpers — `row()`, `card()`, its `SRC_*` constants —
 * so `wonen.en.ts` imports from `../wonen`. If the guide file then imported its translations back,
 * that is an import cycle, and an ESM cycle between two modules that both evaluate top-level
 * template literals resolves to `undefined` in whichever half loses the race. So the arrow points
 * one way only: **a translation imports its guide; a guide never imports its translation.** The
 * registry, which is downstream of both, is where they meet.
 *
 * Those helpers are exported from each guide file purely so this can happen. Reusing them rather
 * than pasting expanded HTML into the translation is what stops the markup drifting: change
 * `card()` and all three languages change with it.
 *
 * ## What is NOT translated, ever
 * - **`<h2 id="…">` ids.** They are identical across locales by design — `lib/guides/sections.ts`
 *   reads them as the step list on `/inburgering`, and reading progress is keyed on them, so a
 *   translated id splits one section's progress into three. Only the heading *text* changes.
 * - **Source labels and URLs in a fact box.** They name a Dutch government page; renaming
 *   "inburgeren.nl — Boete" to "inburgeren.nl — Fine" describes a page that does not exist. The
 *   box's own chrome ("Source:", "accessed") is localised by `factIn()` in `kit.ts`.
 * - **`ctaHref`, `related`, `relatedPosts`, `coverGlyph`, dates, `readingMinutes`.** Those live on
 *   the guide and are locale-independent facts about it.
 *
 * ## Provenance
 * The Dutch source of every guide here was reviewed by the NT2 docent (`reviewedBy` /
 * `reviewedOn` on the guide). **The English and Arabic bodies are machine translations of that
 * reviewed Dutch and have not themselves been read by a reviewer** (owner's decision,
 * 2026-08-24): they introduce no claim the Dutch does not make, and `hasTranslation()` indexes a
 * locale the moment a body exists, which is what makes the cluster reachable in EN and AR at all.
 * `translationNote()` in `helpers.ts` states this on the page in the reader's own language — the
 * one place the site says it, and it must not be dropped to tidy a layout.
 */
import type { GuideLocale } from '../types';

/* The block between these two markers is written by `scripts/translate-guides.mjs`. Add a
   translation by running that script, not by hand — it is what keeps the record and the files on
   disk in step, and it sorts both so a new translation is a one-line diff. */
/* GENERATED:BEGIN */
import b1ExamenAr from './b1-examen.ar';
import b1ExamenEn from './b1-examen.en';
import boeteEnTermijnAr from './boete-en-termijn.ar';
import boeteEnTermijnEn from './boete-en-termijn.en';
import geschiedenisEnGeografieAr from './geschiedenis-en-geografie.ar';
import geschiedenisEnGeografieEn from './geschiedenis-en-geografie.en';
import gezondheidEnGezondheidszorgAr from './gezondheid-en-gezondheidszorg.ar';
import gezondheidEnGezondheidszorgEn from './gezondheid-en-gezondheidszorg.en';
import instantiesAr from './instanties.ar';
import instantiesEn from './instanties.en';
import knmExamenAr from './knm-examen.ar';
import knmExamenEn from './knm-examen.en';
import lezenExamenAr from './lezen-examen.ar';
import lezenExamenEn from './lezen-examen.en';
import luisterenExamenAr from './luisteren-examen.ar';
import luisterenExamenEn from './luisteren-examen.en';
import omgangsvormenWaardenEnNormenAr from './omgangsvormen-waarden-en-normen.ar';
import omgangsvormenWaardenEnNormenEn from './omgangsvormen-waarden-en-normen.en';
import onaExamenAr from './ona-examen.ar';
import onaExamenEn from './ona-examen.en';
import onderwijsEnOpvoedingAr from './onderwijs-en-opvoeding.ar';
import onderwijsEnOpvoedingEn from './onderwijs-en-opvoeding.en';
import pvtMapEnOnaAr from './pvt-map-en-ona.ar';
import pvtMapEnOnaEn from './pvt-map-en-ona.en';
import schrijvenExamenAr from './schrijven-examen.ar';
import schrijvenExamenEn from './schrijven-examen.en';
import sprekenExamenAr from './spreken-examen.ar';
import sprekenExamenEn from './spreken-examen.en';
import staatsinrichtingEnRechtsstaatAr from './staatsinrichting-en-rechtsstaat.ar';
import staatsinrichtingEnRechtsstaatEn from './staatsinrichting-en-rechtsstaat.en';
import taalexamensA2B1Ar from './taalexamens-a2-b1.ar';
import taalexamensA2B1En from './taalexamens-a2-b1.en';
import vrijstellingEnOntheffingAr from './vrijstelling-en-ontheffing.ar';
import vrijstellingEnOntheffingEn from './vrijstelling-en-ontheffing.en';
import werkEnInkomenAr from './werk-en-inkomen.ar';
import werkEnInkomenEn from './werk-en-inkomen.en';
import wonenAr from './wonen.ar';
import wonenEn from './wonen.en';

/** Keyed by guide slug. A slug with no entry simply has no translations yet. */
export const TRANSLATIONS: Record<string, Partial<Record<'en' | 'ar', GuideLocale>>> = {
  'b1-examen': { en: b1ExamenEn, ar: b1ExamenAr },
  'boete-en-termijn': { en: boeteEnTermijnEn, ar: boeteEnTermijnAr },
  'geschiedenis-en-geografie': { en: geschiedenisEnGeografieEn, ar: geschiedenisEnGeografieAr },
  'gezondheid-en-gezondheidszorg': { en: gezondheidEnGezondheidszorgEn, ar: gezondheidEnGezondheidszorgAr },
  'instanties': { en: instantiesEn, ar: instantiesAr },
  'knm-examen': { en: knmExamenEn, ar: knmExamenAr },
  'lezen-examen': { en: lezenExamenEn, ar: lezenExamenAr },
  'luisteren-examen': { en: luisterenExamenEn, ar: luisterenExamenAr },
  'omgangsvormen-waarden-en-normen': { en: omgangsvormenWaardenEnNormenEn, ar: omgangsvormenWaardenEnNormenAr },
  'ona-examen': { en: onaExamenEn, ar: onaExamenAr },
  'onderwijs-en-opvoeding': { en: onderwijsEnOpvoedingEn, ar: onderwijsEnOpvoedingAr },
  'pvt-map-en-ona': { en: pvtMapEnOnaEn, ar: pvtMapEnOnaAr },
  'schrijven-examen': { en: schrijvenExamenEn, ar: schrijvenExamenAr },
  'spreken-examen': { en: sprekenExamenEn, ar: sprekenExamenAr },
  'staatsinrichting-en-rechtsstaat': { en: staatsinrichtingEnRechtsstaatEn, ar: staatsinrichtingEnRechtsstaatAr },
  'taalexamens-a2-b1': { en: taalexamensA2B1En, ar: taalexamensA2B1Ar },
  'vrijstelling-en-ontheffing': { en: vrijstellingEnOntheffingEn, ar: vrijstellingEnOntheffingAr },
  'werk-en-inkomen': { en: werkEnInkomenEn, ar: werkEnInkomenAr },
  'wonen': { en: wonenEn, ar: wonenAr },
};
/* GENERATED:END */

export default TRANSLATIONS;
