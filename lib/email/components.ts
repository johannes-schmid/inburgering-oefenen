import { type EmailLocale, t, dir } from './i18n';
import { DEFAULT_LEVEL, skillsAtLevel } from '@/data/skills';
import { MODULE_PRICE_CENTS, BUNDLE_PRICE_CENTS, BUNDLE_SAVING_CENTS, euro } from '@/lib/pricing';

/** Where every pricing CTA in an e-mail goes: the public pricing page, readable without a login. */
const PRICING_URL = 'https://inburgeringoefenen.nl/premium';

/**
 * The two offers, priced from `lib/pricing.ts`.
 *
 * Never hardcode the amounts here. These used to read €9,95 / €19,95 one-off "levenslange
 * toegang" out of the copy file, which stopped being true the day the product moved to a
 * per-onderdeel monthly subscription — an e-mail quoting a price checkout will not honour is a
 * false price claim, not a stale string.
 */
export function packageCards(locale: EmailLocale, pricingUrl = PRICING_URL): string {
  const s = t[locale].common.packages;
  const moduleFeatures = s.moduleFeatures.map(f => `<p class="pkg-feat">${f}</p>`).join('');
  const bundleFeatures = s.bundleFeatures.map(f => `<p class="pkg-feat">${f}</p>`).join('');
  const bundleNote = s.bundleNote.replace('{saving}', euro(BUNDLE_SAVING_CENTS));

  return `
<table class="pkg-grid" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td class="pkg-cell" style="padding-right:8px;">
      <div class="pkg-pro">
        <p class="pkg-name">${s.moduleTitle}</p>
        <p class="pkg-price">${euro(MODULE_PRICE_CENTS)}</p>
        <p class="pkg-note">${s.perMonth} · ${s.cancelAny}</p>
        ${moduleFeatures}
        <a href="${pricingUrl}" class="pkg-btn pkg-btn-pro">${s.moduleBtn}</a>
      </div>
    </td>
    <td class="pkg-cell" style="padding-left:8px;">
      <div class="pkg-compleet">
        <span class="pkg-badge">${s.bestValue}</span>
        <p class="pkg-name">${s.bundleTitle}</p>
        <p class="pkg-price">${euro(BUNDLE_PRICE_CENTS)}</p>
        <p class="pkg-note">${s.perMonth} · ${bundleNote}</p>
        ${bundleFeatures}
        <a href="${pricingUrl}" class="pkg-btn pkg-btn-compleet">${s.bundleBtn}</a>
      </div>
    </td>
  </tr>
</table>`;
}

export function paymentBadges(locale: EmailLocale): string {
  const badges = t[locale].common.payBadges;
  return `<div class="pay-badges">${badges.map(b => `<span class="pay-badge">${b}</span>`).join('')}</div>`;
}

export function featureListDark(items: string[]): string {
  return items.map(i => `<p class="feat-li">${i}</p>`).join('');
}

/**
 * The product showcase: the four onderdelen, then why the content is a docent's and not a model's.
 *
 * Replaces the KNM `featureDuo` — a woordkaarten flashcard mock-up and a seven-leermodules audio
 * player. Both surfaces are flagged off in `lib/features.ts` and have no A2 content, so the e-mail
 * was advertising two dead ends.
 *
 * Item counts and durations come from `data/skills.ts`, so they cannot drift from the taxonomy.
 */
export function skillsShowcase(locale: EmailLocale = 'nl'): string {
  const s = t[locale].common.skills;
  const rtl = dir(locale) === 'rtl';
  const align = rtl ? 'left' : 'right';

  // A2 only — these e-mails go to people in the A2 funnel and quote the A2 offer.
  //
  // Skills whose format is unverified are dropped rather than rendered with a dash: an e-mail
  // is already sent and cannot be corrected, so a row reading "— vragen · — minuten" is worse
  // than a row that is not there. All four A2 formats are known, so nothing is dropped today.
  const rows = skillsAtLevel(DEFAULT_LEVEL)
    .filter(skill => skill.itemCount !== null && skill.durationMinutes !== null)
    .map(skill => {
    const itemCount = skill.itemCount as number;
    const durationMinutes = skill.durationMinutes as number;
    const items = skill.scoring === 'open' ? s.itemsOpen(itemCount) : s.itemsMcq(itemCount);
    return `
<tr>
  <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);">
    <p style="margin:0;font-family:Manrope,-apple-system,Arial,sans-serif;font-size:14px;font-weight:800;color:#ffffff;">${s.names[skill.slug]}</p>
    <p style="margin:2px 0 0;font-size:11px;color:rgba(255,255,255,0.45);">${items} · ${s.minutes(durationMinutes)}</p>
  </td>
  <td align="${align}" style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);">
    <span style="display:inline-block;background:rgba(254,118,44,0.15);border:1px solid rgba(254,118,44,0.35);color:#fdba74;font-size:11px;font-weight:700;padding:3px 10px;border-radius:6px;">${skill.examCount}×</span>
  </td>
</tr>`;
  }).join('');

  return `
<!-- ── The four onderdelen ── -->
<div style="padding:28px 32px 24px;" dir="${dir(locale)}">
  <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#fe762c;text-transform:uppercase;letter-spacing:1px;">${s.label}</p>
  <p style="font-family:Manrope,-apple-system,Arial,sans-serif;font-size:18px;font-weight:800;color:#191c1e;margin:0 0 6px;letter-spacing:-0.3px;line-height:1.3;">${s.heading}</p>
  <p style="font-size:13px;color:#434651;line-height:1.6;margin:0 0 16px;">${s.desc}</p>
  <div style="background:linear-gradient(160deg,#001040 0%,#002b6d 55%,#0f3a8a 100%);border-radius:12px;padding:8px 18px 14px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>
  </div>
</div>

<div style="height:1px;background:#f0f2f5;margin:0 32px;"></div>

<!-- ── Docent, not AI — the product's only real claim ── -->
<div style="padding:28px 32px 24px;" dir="${dir(locale)}">
  <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#fe762c;text-transform:uppercase;letter-spacing:1px;">${s.docentLabel}</p>
  <p style="font-family:Manrope,-apple-system,Arial,sans-serif;font-size:18px;font-weight:800;color:#191c1e;margin:0 0 6px;letter-spacing:-0.3px;line-height:1.3;">${s.docentHeading}</p>
  <p style="font-size:13px;color:#434651;line-height:1.6;margin:0;">${s.docentDesc}</p>
</div>`;
}

export function svgScoreRing(pct: number, score: number, total: number): string {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (pct / 100) * circumference;
  const ringColor = pct >= 80 ? '#16a34a' : pct >= 60 ? '#fe762c' : '#dc2626';
  return `
<div style="text-align:center;margin-bottom:24px;">
  <svg width="140" height="140" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
    <circle cx="70" cy="70" r="${radius}" fill="none" stroke="#e0e3e5" stroke-width="12"/>
    <circle cx="70" cy="70" r="${radius}" fill="none" stroke="${ringColor}" stroke-width="12"
      stroke-dasharray="${circumference.toFixed(2)}" stroke-dashoffset="${dashOffset.toFixed(2)}"
      stroke-linecap="round" transform="rotate(-90 70 70)"/>
    <text x="70" y="62" text-anchor="middle" font-size="28" font-weight="800" fill="${ringColor}" font-family="Manrope,Arial,sans-serif">${pct}%</text>
    <text x="70" y="82" text-anchor="middle" font-size="13" fill="#747782" font-family="Arial,sans-serif">${score} / ${total}</text>
  </svg>
</div>`;
}
