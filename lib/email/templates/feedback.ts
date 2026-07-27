import { type EmailLocale, t } from '../i18n';
import { renderEmail } from '../layout';

export function feedbackSubject(locale: EmailLocale): string {
  return t[locale].feedback.subject;
}

export function feedbackEmail({ firstName }: { firstName: string }, locale: EmailLocale): string {
  const s = t[locale].feedback;
  const contactUrl = 'https://inburgeringoefenen.nl/contact';

  const body = `
<div class="sec">
  <p class="sec-label">${s.label}</p>
  <h1 class="sec-title">${s.title}</h1>
  <p class="sec-body">${s.greeting(firstName)}</p>
  <p class="sec-body" style="margin-top:14px;">${s.body1}</p>
  <p class="sec-body" style="margin-top:14px;">${s.body2}</p>
  <p class="sec-body" style="margin-top:14px;">${s.body3}</p>
  <a href="${contactUrl}" class="btn" style="margin-top:28px;">${s.cta}</a>
</div>
<div class="div"></div>
<div class="sec">
  <p class="sec-body">${s.closing}</p>
  <p class="sec-body" style="margin-top:10px;font-weight:700;color:#002b6d;">KNM Oefenen</p>
</div>`;

  return renderEmail({ locale, title: s.title, bodyHtml: body, isTransactional: true });
}
