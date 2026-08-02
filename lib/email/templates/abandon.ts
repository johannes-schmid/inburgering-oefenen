import { type EmailLocale, t } from '../i18n';
import { renderEmail } from '../layout';
import { packageCards, paymentBadges } from '../components';

export function abandonSubject(locale: EmailLocale): string {
  return t[locale].abandon.subject;
}

export function abandonEmail(firstName: string, locale: EmailLocale, unsubscribeUrl: string): string {
  const s = t[locale].abandon;
  /* `/activate` only redirects to the module picker, which needs a login. This e-mail goes to
     addresses that may not have an account yet, so it points at the public pricing page. */
  const activateUrl = 'https://inburgeringoefenen.nl/premium';

  /* No testimonials. The two that used to sit here were invented, and the product has no
     customers yet — see the fabricated-social-proof note in CLAUDE.md. */
  const benefitsHtml = [...s.benefits].map(b => `
<div style="display:flex;align-items:flex-start;gap:10px;padding:6px 0;">
  <span style="color:#10b981;font-weight:700;font-size:15px;flex-shrink:0;margin-top:1px;">✓</span>
  <span style="font-size:14px;color:#434651;line-height:1.6;">${b}</span>
</div>`).join('');

  const body = `
<div class="hero">
  <p class="hero-eyebrow">${s.label}</p>
  <h1 class="hero-h1">${s.title}</h1>
  <p class="hero-sub">${s.greeting(firstName)}</p>
  <p class="hero-sub" style="margin-top:10px;">${s.body1}</p>
</div>
<div class="sec">
  <p class="sec-label">${s.body2}</p>
  <h2 class="sec-title" style="font-size:17px;margin-bottom:16px;">${s.benefitsLabel}</h2>
  ${benefitsHtml}
</div>
<div class="div"></div>
<div class="sec" style="background:#f8f9fb;">
  <p class="sec-label" style="text-align:center;">${s.packagesLabel}</p>
  ${packageCards(locale, activateUrl)}
  ${paymentBadges(locale)}
  <p style="font-size:11px;color:#9CA3AF;text-align:center;margin-top:10px;">${s.secureMsg}</p>
  <a href="${activateUrl}" class="btn" style="margin-top:20px;">${s.ctaBtn}</a>
</div>
<div class="sec">
  <p class="sec-body">${s.closingNote} <a href="mailto:${t[locale].common.support}" style="color:#fe762c;">${t[locale].common.support}</a></p>
  <p class="sec-body" style="margin-top:10px;font-weight:700;color:#002b6d;">Inburgering Oefenen</p>
</div>`;

  return renderEmail({ locale, title: s.title, bodyHtml: body, unsubscribeUrl });
}
