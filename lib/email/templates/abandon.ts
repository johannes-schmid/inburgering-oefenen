import { type EmailLocale, t } from '../i18n';
import { renderEmail } from '../layout';
import { packageCards, paymentBadges, checkList } from '../components';

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
  const benefitsHtml = checkList([...s.benefits]);

  const body = `
<div class="hero">
  <span class="chip-d">${s.label}</span>
  <h1 class="hero-h1">${s.title}</h1>
  <p class="hero-greet">${s.greeting(firstName)}</p>
  <p class="hero-sub">${s.body1}</p>
</div>
<div class="sec">
  <p class="sec-body" style="margin-bottom:8px;">${s.body2}</p>
  <h2 class="sec-title" style="font-size:19px;">${s.benefitsLabel}</h2>
  ${benefitsHtml}
</div>
<div class="sec tier">
  <h2 class="sec-title" style="text-align:center;">${s.packagesLabel}</h2>
  ${packageCards(locale, activateUrl)}
  <div style="text-align:center;margin-top:26px;">
    <a href="${activateUrl}" class="btn">${s.ctaBtn}</a>
    ${paymentBadges(locale)}
    <p class="small" style="margin-top:10px;">${s.secureMsg}</p>
  </div>
</div>
<div class="sec">
  <p class="sec-body">${s.closingNote} <a href="mailto:${t[locale].common.support}">${t[locale].common.support}</a></p>
  <p class="sign">Inburgering Oefenen</p>
</div>`;

  return renderEmail({ locale, title: s.title, bodyHtml: body, unsubscribeUrl });
}
