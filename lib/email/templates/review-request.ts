import { type EmailLocale, t } from '../i18n';
import { renderEmail } from '../layout';

/** De reviewpagina van inburgeringoefenen.nl op Trustpilot. Eén plek, ook voor /admin/reviews. */
export const TRUSTPILOT_REVIEW_URL = 'https://www.trustpilot.com/evaluate/inburgeringoefenen.nl';

export function reviewRequestSubject(locale: EmailLocale): string {
  return t[locale].reviewRequest.subject;
}

/**
 * Het reviewverzoek dat de eigenaar vanuit /admin/reviews verstuurt.
 *
 * Vraagt om een **eerlijke** review en belooft er niets voor terug: Trustpilot staat geen
 * beloning en geen sturing op een positief oordeel toe. Het gesprek loopt via een antwoord op de
 * mail (`replyTo` in de route), dus er staat geen tweede knop.
 */
export function reviewRequestEmail({ firstName }: { firstName: string }, locale: EmailLocale): string {
  const s = t[locale].reviewRequest;

  const body = `
<div class="hero">
  <span class="chip-d">${s.label}</span>
  <h1 class="hero-h1">${s.title}</h1>
</div>
<div class="sec">
  <p class="sec-body" style="font-weight:600;color:#002b6d;">${s.greeting(firstName)}</p>
  <p class="sec-body" style="margin-top:14px;">${s.body1}</p>
  <p class="sec-body" style="margin-top:14px;">${s.body2}</p>
  <a href="${TRUSTPILOT_REVIEW_URL}" class="btn" style="margin-top:28px;">${s.cta}</a>
</div>
<div class="sec tier">
  <p class="sec-body" style="font-weight:600;color:#002b6d;">${s.chatTitle}</p>
  <p class="sec-body" style="margin-top:8px;">${s.chat}</p>
  <p class="sec-body" style="margin-top:14px;">${s.closing}</p>
  <p class="sign">Inburgering Oefenen</p>
</div>`;

  return renderEmail({ locale, title: s.title, bodyHtml: body, isTransactional: true });
}
