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
  <span class="chip-d">${s.eyebrow}</span>
  <h1 class="hero-h1">${s.headline}</h1>
  <p class="hero-sub">${s.body(firstName)}</p>
</div>
<div class="sec tier" style="text-align:center;">
  <span class="chip">${s.investLabel}</span>
  <h2 class="sec-title">${s.investTitle}</h2>
  <p class="small">${s.badge}</p>
  ${packageCards(locale)}
  ${paymentBadges(locale)}
  <p class="small" style="margin-top:10px;">${s.secureMsg}</p>
</div>`;

  return renderEmail({ locale, title: s.subject, bodyHtml: body, unsubscribeUrl });
}
