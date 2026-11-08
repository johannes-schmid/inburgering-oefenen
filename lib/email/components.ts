import { type EmailLocale, t, dir } from './i18n';
import { DEFAULT_LEVEL, skillsAtLevel } from '@/data/skills';
import { MODULE_PRICE_CENTS, BUNDLE_PRICE_CENTS, BUNDLE_SAVING_CENTS, euro } from '@/lib/pricing';

/** Where every pricing CTA in an e-mail goes: the public pricing page, readable without a login. */
const PRICING_URL = 'https://inburgeringoefenen.nl/premium';

const HEAD = "font-family:Manrope,-apple-system,Arial,sans-serif;";

/** Een vinkje in een groen rondje (Glas G3). Tekst, geen SVG: Gmail haalt SVG weg. */
export function check(onDark = false): string {
  return `<span class="ck${onDark ? ' ck-d' : ''}">&#10003;</span>`;
}

/** Een lijst met vinkjes — de vervanger van de oude `feat-li` met een oranje ✓ ervoor. */
export function checkList(items: string[], onDark = false): string {
  const color = onDark ? 'rgba(255,255,255,0.86)' : '#434651';
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0">${items.map(i => `
  <tr>
    <td width="34" valign="top" style="padding:6px 0;">${check(onDark)}</td>
    <td valign="top" style="padding:7px 0;font-size:15px;line-height:1.6;color:${color};">${i}</td>
  </tr>`).join('')}
</table>`;
}

/**
 * The two offers, priced from `lib/pricing.ts`.
 *
 * Never hardcode the amounts here. These used to read €9,95 / €19,95 one-off "levenslange
 * toegang" out of the copy file, which stopped being true the day the product moved to a
 * per-onderdeel monthly subscription — an e-mail quoting a price checkout will not honour is a
 * false price claim, not a stale string.
 *
 * Glas-prijsvergelijking: de aanbevolen kolom is één navy vlak, vinkjes groen, en geen oranje —
 * het ene oranje van de mail is de hoofdknop.
 */
export function packageCards(locale: EmailLocale, pricingUrl = PRICING_URL): string {
  const s = t[locale].common.packages;
  const bundleNote = s.bundleNote.replace('{saving}', euro(BUNDLE_SAVING_CENTS));
  const side = dir(locale) === 'rtl' ? ['left', 'right'] : ['right', 'left'];
  const feats = (items: readonly string[], onDark: boolean) => items.map(f => `
      <tr>
        <td width="28" valign="top" style="padding:5px 0;">${check(onDark)}</td>
        <td valign="top" style="padding:6px 0;font-size:13px;line-height:1.5;color:${onDark ? 'rgba(255,255,255,0.86)' : '#434651'};">${f}</td>
      </tr>`).join('');

  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:22px;">
  <tr>
    <td class="pkg-cell" width="50%" valign="top" style="padding-${side[0]}:6px;">
      <div style="text-align:start;background:#ffffff;border-radius:22px;padding:24px;box-shadow:0 12px 28px -18px rgba(0,43,109,0.35);">
        <p style="${HEAD}font-size:15px;font-weight:800;color:#002b6d;margin:0;">${s.moduleTitle}</p>
        <p style="${HEAD}font-size:32px;font-weight:800;color:#002b6d;letter-spacing:-1.2px;margin:10px 0 2px;">${euro(MODULE_PRICE_CENTS)}</p>
        <p style="font-size:12px;color:#5b6070;margin:0 0 14px;">${s.perMonth} · ${s.cancelAny}</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">${feats(s.moduleFeatures, false)}</table>
        <a href="${pricingUrl}" class="btn-w" style="display:block;margin-top:18px;padding:12px 18px;font-size:14px;">${s.moduleBtn}</a>
      </div>
    </td>
    <td class="pkg-cell" width="50%" valign="top" style="padding-${side[1]}:6px;">
      <div style="text-align:start;background-color:#002b6d;background-image:linear-gradient(180deg,#002b6d 0%,#001a4a 100%);border-radius:22px;padding:24px;box-shadow:0 16px 32px -18px rgba(0,18,46,0.6);">
        <span style="display:inline-block;background:rgba(255,255,255,0.14);color:#ffffff;font-size:11px;font-weight:700;border-radius:999px;padding:3px 10px;margin-bottom:10px;">${s.bestValue}</span>
        <p style="${HEAD}font-size:15px;font-weight:800;color:#ffffff;margin:0;">${s.bundleTitle}</p>
        <p style="${HEAD}font-size:32px;font-weight:800;color:#ffffff;letter-spacing:-1.2px;margin:10px 0 2px;">${euro(BUNDLE_PRICE_CENTS)}</p>
        <p style="font-size:12px;color:#c9d6f2;margin:0 0 14px;">${s.perMonth} · ${bundleNote}</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">${feats(s.bundleFeatures, true)}</table>
        <a href="${pricingUrl}" class="btn-w" style="display:block;margin-top:18px;padding:12px 18px;font-size:14px;box-shadow:none;">${s.bundleBtn}</a>
      </div>
    </td>
  </tr>
</table>`;
}

export function paymentBadges(locale: EmailLocale): string {
  const badges = t[locale].common.payBadges;
  return `<div class="pay-badges">${badges.map(b => `<span class="pay-badge">${b}</span>`).join('')}</div>`;
}

/**
 * The product showcase: the four onderdelen, then why the content is a docent's and not a model's.
 *
 * Item counts and durations come from `data/skills.ts`, so they cannot drift from the taxonomy.
 * Rijen wisselen van tint in plaats van een lijn ertussen (de no-line-regel).
 */
export function skillsShowcase(locale: EmailLocale = 'nl'): string {
  const s = t[locale].common.skills;
  const align = dir(locale) === 'rtl' ? 'left' : 'right';

  // A2 only — these e-mails go to people in the A2 funnel and quote the A2 offer.
  //
  // Skills whose format is unverified are dropped rather than rendered with a dash: an e-mail
  // is already sent and cannot be corrected, so a row reading "— vragen · — minuten" is worse
  // than a row that is not there. All four A2 formats are known, so nothing is dropped today.
  const rows = skillsAtLevel(DEFAULT_LEVEL)
    .filter(skill => skill.itemCount !== null && skill.durationMinutes !== null)
    .map((skill, i) => {
      const itemCount = skill.itemCount as number;
      const durationMinutes = skill.durationMinutes as number;
      const items = skill.scoring === 'open' ? s.itemsOpen(itemCount) : s.itemsMcq(itemCount);
      const bg = i % 2 === 0 ? '#eef2f8' : '#ffffff';
      return `
<tr>
  <td style="background:${bg};padding:13px 18px;border-radius:14px 0 0 14px;">
    <p style="margin:0;${HEAD}font-size:15px;font-weight:800;color:#002b6d;">${s.names[skill.slug]}</p>
    <p style="margin:2px 0 0;font-size:12px;color:#5b6070;">${items} · ${s.minutes(durationMinutes)}</p>
  </td>
  <td align="${align}" style="background:${bg};padding:13px 18px;border-radius:0 14px 14px 0;${HEAD}font-size:15px;font-weight:800;color:#002b6d;white-space:nowrap;">${skill.examCount}&times;</td>
</tr>`;
    }).join('');

  return `
<div class="sec" dir="${dir(locale)}">
  <span class="chip">${s.label}</span>
  <h2 class="sec-title">${s.heading}</h2>
  <p class="sec-body" style="margin-bottom:20px;">${s.desc}</p>
  <table width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>
</div>
<div class="sec" style="padding-top:0;" dir="${dir(locale)}">
  <div class="panel">
    <span class="chip" style="background:#ffffff;">${s.docentLabel}</span>
    <h2 class="sec-title" style="font-size:19px;">${s.docentHeading}</h2>
    <p class="sec-body" style="font-size:15px;">${s.docentDesc}</p>
  </div>
</div>`;
}

/**
 * De score als Glas-ring, platgeslagen tot een balk: één segment per vraag, gevuld = goed,
 * leeg = fout, en een oranje streepje op onze oefengrens van 60% (G5 "Score").
 *
 * We weten alleen het aantal goed, niet wélke vragen, dus de gevulde segmenten staan vooraan.
 * Een tabel, geen SVG — Gmail toont SVG niet.
 */
export function scoreSegments(score: number, total: number, locale: EmailLocale, markLabel: string): string {
  if (!total || total < 1) return '';
  const rtl = dir(locale) === 'rtl';
  const n = Math.min(total, 50);
  const filled = Math.round((score / total) * n);
  const cells = Array.from({ length: n }, (_, i) =>
    `<td style="height:10px;border-radius:3px;${i < filled ? 'background:#2b7a5c;' : 'background:#ffffff;box-shadow:inset 0 0 0 1px #c9d6f2;'}"></td>`,
  ).join('<td width="3" style="font-size:0;line-height:0;">&nbsp;</td>');

  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:420px;margin:0 auto;"><tr>${cells}</tr></table>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:420px;margin:6px auto 0;">
  <tr>
    <td width="60%" style="border-${rtl ? 'left' : 'right'}:2px solid #fe762c;height:8px;font-size:0;line-height:0;">&nbsp;</td>
    <td width="40%" style="font-size:0;line-height:0;">&nbsp;</td>
  </tr>
  <tr>
    <td colspan="2" style="padding-top:6px;font-size:12px;color:#5b6070;text-align:center;">${markLabel}</td>
  </tr>
</table>`;
}

/** Een statuslabel op het lichte veld: groen met vinkje, of rood met kruis (Glas G3). */
export function statusPill(ok: boolean, label: string): string {
  return ok
    ? `<span style="display:inline-block;background:#e2f1e9;color:#1c5a42;font-size:13px;font-weight:700;padding:6px 16px;border-radius:999px;">&#10003;&nbsp; ${label}</span>`
    : `<span style="display:inline-block;background:#fbe9e9;color:#ba1a1a;font-size:13px;font-weight:700;padding:6px 16px;border-radius:999px;">&#10005;&nbsp; ${label}</span>`;
}
