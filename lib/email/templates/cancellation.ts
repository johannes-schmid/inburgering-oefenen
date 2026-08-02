import { type EmailLocale, t } from '../i18n';
import { renderEmail } from '../layout';

/**
 * Cancellation confirmation — sent once, immediately after a successful cancellation.
 *
 * It exists to answer the two questions a candidate has the moment they cancel: *is it really
 * cancelled* and *when does my access stop*. So it states both, and it names the modules that
 * were cancelled — a "your subscription is cancelled" with no specifics is exactly the mail that
 * makes people write to support.
 *
 * **Transactional, and deliberately not a win-back.** No discount, no "waarom ga je weg?", no
 * survey. Dutch law (Wet Van Der Meer) requires cancelling to be as easy as subscribing, and
 * turning the receipt into a retention surface argues with that. It carries no unsubscribe link
 * for the same reason it is not marketing: `isTransactional: true`.
 */

export function cancellationSubject(locale: EmailLocale): string {
  return t[locale].cancellation.subject;
}

const SKILL_LABELS: Record<string, string> = {
  lezen: 'Lezen',
  luisteren: 'Luisteren',
  schrijven: 'Schrijven',
  spreken: 'Spreken',
};

/**
 * `2026-08-31` → `31 augustus 2026`.
 *
 * Built from the plain `YYYY-MM-DD` Mollie returns, with no `new Date()` in between: parsing it as
 * a date and formatting it back shifts it a day in half the world's timezones, and a cancellation
 * mail that understates the paid-for period by one day is a complaint.
 */
function formatDate(iso: string, locale: EmailLocale): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const months: Record<EmailLocale, string[]> = {
    nl: ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  };
  return `${d} ${months[locale][m - 1]} ${y}`;
}

export function cancellationEmail(
  {
    firstName,
    accessUntil,
    modules = [],
    accountUrl,
  }: {
    firstName: string;
    /** `YYYY-MM-DD` from Mollie's `nextPaymentDate`, or null when Mollie gave none. */
    accessUntil: string | null;
    /** Module slugs that were cancelled, for naming them explicitly. */
    modules?: string[];
    accountUrl: string;
  },
  locale: EmailLocale,
): string {
  const s = t[locale].cancellation;
  const named = modules.map(m => SKILL_LABELS[m] ?? m);

  const body = `
<div class="hero">
  <p class="hero-eyebrow">${s.label}</p>
  <h1 class="hero-h1">${s.title}</h1>
  <p class="hero-sub">${s.greeting(firstName)}</p>
  <p class="hero-sub" style="margin-top:10px;">${s.body}</p>
</div>
<div class="sec">
  <p class="sec-label">${s.accessLabel}</p>
  <p class="sec-body">${accessUntil ? s.accessUntil(formatDate(accessUntil, locale)) : s.accessUnknown}</p>
</div>${named.length > 0 ? `
<div class="sec">
  <p class="sec-label">${s.modulesLabel}</p>
  <p class="sec-body">${named.join(' · ')}</p>
</div>` : ''}
<div class="div"></div>
<div class="sec">
  <p class="sec-label">${s.againLabel}</p>
  <p class="sec-body">${s.againBody}</p>
  <a href="${accountUrl}" class="btn" style="margin-top:20px;">${s.cta}</a>
</div>
<div class="div"></div>
<div class="sec">
  <p class="sec-body">${s.supportText} <a href="mailto:${t[locale].common.support}" style="color:#fe762c;">${t[locale].common.support}</a></p>
  <p class="sec-body" style="margin-top:12px;font-weight:700;color:#002b6d;">Inburgering Oefenen</p>
</div>`;

  return renderEmail({ locale, title: s.title, bodyHtml: body, isTransactional: true });
}
