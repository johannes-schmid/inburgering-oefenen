import { type EmailLocale, t } from '../i18n';
import { renderEmail } from '../layout';

export function feedbackSubject(locale: EmailLocale): string {
  return t[locale].feedback.subject;
}

export function feedbackEmail({ firstName }: { firstName: string }, locale: EmailLocale): string {
  const s = t[locale].feedback;
  const contactUrl = 'https://inburgeringoefenen.nl/contact';

  const body = `
<div class="hero">
  <span class="chip-d">${s.label}</span>
  <h1 class="hero-h1">${s.title}</h1>
</div>
<div class="sec">
  <p class="sec-body" style="font-weight:600;color:#002b6d;">${s.greeting(firstName)}</p>
  <p class="sec-body" style="margin-top:14px;">${s.body1}</p>
  <p class="sec-body" style="margin-top:14px;">${s.body2}</p>
  <p class="sec-body" style="margin-top:14px;">${s.body3}</p>
  <a href="${contactUrl}" class="btn" style="margin-top:28px;">${s.cta}</a>
</div>
<div class="sec tier">
  <p class="sec-body">${s.closing}</p>
  <p class="sign">Inburgering Oefenen</p>
</div>`;

  return renderEmail({ locale, title: s.title, bodyHtml: body, isTransactional: true });
}
