import { type EmailLocale, t } from '../i18n';
import { renderEmail } from '../layout';
import { checkList } from '../components';
import { BUNDLE_PRICE_CENTS, MODULE_PRICE_CENTS, applyDiscount, euro } from '@/lib/pricing';
import { BLACK_FRIDAY } from '@/lib/black-friday';

function fill(s: string): string {
  return s
    .replaceAll('{pct}', String(BLACK_FRIDAY.pct))
    .replaceAll('{module}', euro(MODULE_PRICE_CENTS))
    .replaceAll('{bundle}', euro(BUNDLE_PRICE_CENTS))
    .replaceAll('{moduleNow}', euro(applyDiscount(MODULE_PRICE_CENTS, BLACK_FRIDAY.pct)))
    .replaceAll('{bundleNow}', euro(applyDiscount(BUNDLE_PRICE_CENTS, BLACK_FRIDAY.pct)));
}

/** Naar het pakkettenscherm: wie niet ingelogd is, logt eerst in en komt daar terug. */
export function blackFridayUrl(locale: EmailLocale): string {
  const q = new URLSearchParams({ utm_source: 'email', utm_medium: 'email', utm_campaign: 'black_friday_2026' });
  return `https://inburgeringoefenen.nl/${locale}/dashboard/pakketten?${q}`;
}

export function blackFridaySubject(locale: EmailLocale): string {
  return fill(t[locale].blackFriday.subject);
}

/**
 * De Black Friday-mail aan accounts zonder betaald onderdeel. Geen code om over te tikken: de
 * checkout past de actie vanzelf toe (`lib/sale.ts`), dus de mail belooft alleen wat daar gebeurt.
 */
export function blackFridayEmail(firstName: string, locale: EmailLocale, unsubscribeUrl: string): string {
  const s = t[locale].blackFriday;

  const body = `
<div class="hero">
  <span class="chip-d">${s.eyebrow}</span>
  <h1 class="hero-h1">${fill(s.headline)}</h1>
  <p class="hero-greet">${s.greeting(firstName)}</p>
  <p class="hero-sub">${fill(s.intro)}</p>
  <p class="hero-sub" style="margin-top:10px;">${s.introKeep}</p>
</div>
<div class="sec">
  <span class="chip">${s.whatLabel}</span>
  <h2 class="sec-title" style="font-size:19px;">${s.whatTitle}</h2>
  ${checkList([...s.items])}
</div>
<div class="sec" style="padding-top:0;">
  <div class="panel" style="text-align:center;">
    <p class="small" style="font-weight:700;margin-bottom:12px;">${s.priceLabel}</p>
    <p style="display:inline-block;margin:0 0 16px;font-family:Manrope,-apple-system,Arial,sans-serif;font-size:28px;font-weight:800;letter-spacing:-0.5px;color:#002b6d;background:#ffffff;border-radius:16px;padding:12px 26px;box-shadow:0 12px 24px -16px rgba(0,43,109,0.4);">−${BLACK_FRIDAY.pct}%</p>
    <p class="sec-body" style="font-size:15px;">${fill(s.priceLine)}</p>
    <p class="small" style="margin-top:8px;">${s.noCode}</p>
    <p class="small" style="margin-top:4px;font-weight:700;color:#a24000;">${s.deadline}</p>
    <a href="${blackFridayUrl(locale)}" class="btn" style="margin-top:22px;">${s.ctaBtn}</a>
  </div>
</div>
<div class="sec tier">
  <p class="sec-body">${s.closingNote} <a href="mailto:${t[locale].common.support}">${t[locale].common.support}</a></p>
  <p class="sign">Inburgering Oefenen</p>
  <p class="small" style="margin-top:16px;">${s.whyNote}</p>
</div>`;

  return renderEmail({ locale, title: fill(s.subject), bodyHtml: body, unsubscribeUrl });
}
