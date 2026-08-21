/**
 * Shared markup helpers for guide bodies.
 *
 * `inburgering-stappenplan.ts` declares its own copies of these; it predates the kit and is left
 * alone rather than churned. Everything written after 2026-08-20 imports from here, because the
 * alternative is the same forty lines of lucide path data in every file — and an icon that has
 * drifted between two guides is a difference the reader sees and nobody meant.
 *
 * Icons are inline lucide SVG paths, sized by the CSS. No emoji anywhere (project rule); the
 * source manuscripts for the Inburgering spokes used them heavily and every one was replaced.
 */

/** A lucide glyph. Size and colour come from the block's CSS, never from here. */
export const svg = (paths: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

export const I_CHECK = svg('<path d="M20 6 9 17l-5-5"/>');
export const I_X = svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>');
export const I_ARROW = svg('<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>');
export const I_INFO = svg('<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>');
export const I_ALERT = svg('<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>');
export const I_MAIL = svg('<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>');
export const I_CLOCK = svg('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>');
export const I_EURO = svg('<path d="M4 10h12"/><path d="M4 14h9"/><path d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2"/>');
export const I_HOME = svg('<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>');
export const I_USER = svg('<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>');
export const I_USERS = svg('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>');
export const I_CAP = svg('<path d="M21.42 10.92a1 1 0 0 0-.02-1.84L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>');
export const I_PLANE = svg('<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>');
export const I_BOOK = svg('<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/>');
export const I_HEADPHONES = svg('<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>');
export const I_PEN = svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>');
export const I_MIC = svg('<path d="M12 19v3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><rect x="9" y="2" width="6" height="13" rx="3"/>');
export const I_LANDMARK = svg('<line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/>');
export const I_CLIPBOARD = svg('<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>');
export const I_ROUTE = svg('<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>');

/** The docent's voice. Same photo the hero uses; the name is a real person, so never paraphrase
 *  a quotation of hers — write new prose instead. */
export const docent = (text: string) =>
  `<div class="docent-note"><img src="/images/marieke-schipper.jpg" alt="" width="44" height="44" class="docent-note-avatar" loading="lazy" />` +
  `<div><p class="docent-note-name">Marieke Schipper · NT2-docent</p><p>${text}</p></div></div>`;

/** A caveat that must not read as body text. */
export const note = (text: string) =>
  `<div class="note-strip">${I_ALERT}<p>${text}</p></div>`;

/** The inline conversion block. `href` must be a pathname declared in `i18n/routing.ts`. */
export const inlineCta = (title: string, desc: string, href: string, label: string) =>
  `<div class="guide-cta-inline"><p><strong>${title}</strong>${desc}</p>` +
  `<a class="guide-cta-btn" href="${href}">${label}${I_ARROW}</a></div>`;

/* ── Localised chrome inside a translated body ───────────────────────────────────────────────
   `fact()` in `types.ts` hardcodes "Bron:" and "geraadpleegd", and `docent()` above hardcodes
   "NT2-docent". Both are correct for the Dutch source and wrong inside an English or Arabic
   body, where they were the only Dutch words left on the page.

   The **source label and the URL never translate**: they name a Dutch government page, and a
   reader who follows the link lands on Dutch text either way. Renaming "inburgeren.nl — Boete"
   to "inburgeren.nl — Fine" would describe a page that does not exist under that name.

   `tests-unit/guides.test.ts` only inspects `guide.articleHtml` — the Dutch body — for the
   "geraadpleegd DD-MM-YYYY" pattern, so these variants do not weaken that check. They keep the
   date in the same numeric form on purpose: it is a stamp, not prose. */

type BodyLocale = 'en' | 'ar';

const FACT_CHROME: Record<BodyLocale, { source: string; checked: string }> = {
  en: { source: 'Source', checked: 'accessed' },
  ar: { source: 'المصدر', checked: 'تم الاطلاع عليه في' },
};

/** The fact box, with its chrome in the body's own language. */
export const factIn = (
  locale: BodyLocale,
  claim: string,
  sourceLabel: string,
  url: string,
  checked: string,
): string => {
  const c = FACT_CHROME[locale];
  return `<div class="fact-box"><p class="fact-box-claim">${claim}</p>` +
    `<p class="fact-box-source">${c.source}: <a href="${url}" target="_blank" rel="noopener">${sourceLabel}</a> — ${c.checked} ${checked}</p></div>`;
};

const DOCENT_ROLE: Record<BodyLocale, string> = {
  en: 'Marieke Schipper · NT2 teacher',
  /* Her name stays in Latin script: it is a real person's name, it is how she is credited
     everywhere else on the site, and a transliteration would not match the byline above it. */
  ar: 'Marieke Schipper · مُدرِّسة NT2 معتمدة',
};

/** The docent note, with her role line in the body's own language. Her name never changes. */
export const docentIn = (locale: BodyLocale, text: string) =>
  `<div class="docent-note"><img src="/images/marieke-schipper.jpg" alt="" width="44" height="44" class="docent-note-avatar" loading="lazy" />` +
  `<div><p class="docent-note-name">${DOCENT_ROLE[locale]}</p><p>${text}</p></div></div>`;

/**
 * One fact box carrying **two** sources.
 *
 * Added 21-08-2026, when the "Moet ik inburgeren?" spoke was shortened. Two claims that belong to
 * one visual — the vrijstellingsgroepen and the diploma list, both stated by the yes/no grid above
 * it — had two stacked fact boxes, and a column of framed grey boxes reads as chrome rather than
 * as sourcing. Merging the box keeps every claim sourced while the page stays readable.
 *
 * `Bronnen` is plural and each link is separate, so the reader can still tell which page carries
 * which half. `tests-unit/guides.test.ts` requires exactly one `fact-box-source` paragraph per box
 * with one consulted-on date and at least one https href — this satisfies all three. Do not stretch
 * it to three sources: at that point the box is a bibliography and the claim needs splitting up.
 */
export const factTwo = (
  claim: string,
  sources: [label: string, url: string][],
  checked: string,
): string => {
  const links = sources
    .map(([label, url]) => `<a href="${url}" target="_blank" rel="noopener">${label}</a>`)
    .join(' · ');
  return `<div class="fact-box"><p class="fact-box-claim">${claim}</p>` +
    `<p class="fact-box-source">Bronnen: ${links} — geraadpleegd ${checked}</p></div>`;
};

/* ── Explainer figures ───────────────────────────────────────────────────────────────────────
   A line-art diagram with its labels in HTML. The graphics are generated deliberately
   **text-free**, and that is a hard rule rather than a stylistic one: a guide ships in nl/en/ar,
   the Arabic one renders RTL, and any word drawn into the raster cannot be translated, cannot
   mirror, is invisible to a screen reader and cannot be selected. So the picture carries the
   structure and the words stay here.

   WebP first with a PNG fallback — not JPEG. These are flat drawings with hard edges, where JPEG
   rings visibly along every stroke; and on this kind of image WebP lands several times *smaller*
   than the PNG, the reverse of what the photo heroes do (see `GuideHeroImage.hasWebp`).

   `alt` must carry what the drawing says, not what it depicts: a reader who cannot see it needs
   the point, not an inventory of shapes. */
export const figure = (
  base: string,
  w: number,
  h: number,
  alt: string,
  caption: string,
  labels = '',
) =>
  `<figure class="guide-figure"><picture>` +
  `<source srcset="/images/guides/${base}.webp" type="image/webp" />` +
  `<img src="/images/guides/${base}.png" alt="${alt}" width="${w}" height="${h}" loading="lazy" decoding="async" />` +
  `</picture>${labels}<figcaption>${caption}</figcaption></figure>`;

/** The two-sided label strip under a split diagram. `nowIndex` marks the side that applies today. */
export const figureSplit = (
  left: [title: string, desc: string],
  right: [title: string, desc: string],
  nowSide: 'left' | 'right',
) =>
  `<div class="guide-figure-split">` +
  `<div class="guide-figure-side${nowSide === 'left' ? ' is-now' : ''}"><p>${left[0]}</p><p>${left[1]}</p></div>` +
  `<div class="guide-figure-side${nowSide === 'right' ? ' is-now' : ''}"><p>${right[0]}</p><p>${right[1]}</p></div>` +
  `</div>`;
