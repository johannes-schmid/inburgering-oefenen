import { type EmailLocale, t } from '../i18n';
import { renderEmail } from '../layout';
import { packageCards, paymentBadges } from '../components';

export function day7Subject(locale: EmailLocale): string {
  return t[locale].day7.subject;
}

export function day7Email(firstName: string, locale: EmailLocale, unsubscribeUrl: string): string {
  const s = t[locale].day7;

  const body = `
<div class="hero">
  <p class="hero-eyebrow">${s.eyebrow}</p>
  <h1 class="hero-h1">${s.headline}</h1>
  <p class="hero-sub">${s.body(firstName)}</p>
</div>
<div class="sec" style="background:#f8f9fb;">
  <p class="sec-label" style="text-align:center;">${s.investLabel}</p>
  <h2 class="sec-title" style="text-align:center;">${s.investTitle}</h2>
  <div style="text-align:center;margin-bottom:16px;">
    <span style="display:inline-block;background:#fff7ed;color:#fe762c;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;border-radius:4px;padding:4px 12px;border:1px solid rgba(254,118,44,0.3);">${s.badge}</span>
  </div>
  ${packageCards(locale)}
  ${paymentBadges(locale)}
  <p style="font-size:11px;color:#9CA3AF;text-align:center;margin-top:12px;">${s.secureMsg}</p>
</div>`;

  return renderEmail({ locale, title: s.subject, bodyHtml: body, unsubscribeUrl });
}
