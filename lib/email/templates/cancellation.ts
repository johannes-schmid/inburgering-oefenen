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
 * `a2:lezen` → `Lezen A2`, `knm` → `KNM`.
 *
 * De route geeft `modulesFromMetadata()` door, en dat zijn genormaliseerde `level:skill`-ids. De
 * oude tabel kende alleen de kale slug, dus de mail noemde "a2:lezen" letterlijk.
 */
export function moduleLabel(id: string): string {
  if (id === 'knm' || id === 'ona') return id.toUpperCase();
  const [level, skill] = id.includes(':') ? id.split(':') : [null, id];
  const name = SKILL_LABELS[skill] ?? skill;
  return level ? `${name} ${level.toUpperCase()}` : name;
}

/**
 * `2026-08-31` → `31 augustus 2026`.
 *
 * Built from the plain `YYYY-MM-DD` Mollie returns, with no `new Date()` in between: parsing it as
 * a date and formatting it back shifts it a day in half the world's timezones, and a cancellation
 * mail that understates the paid-for period by one day is a complaint.
 */
export function formatDate(iso: string, locale: EmailLocale): string {
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
  const named = modules.map(moduleLabel);

  const body = `
<div class="hero">
  <span class="chip-d">${s.label}</span>
  <h1 class="hero-h1">${s.title}</h1>
  <p class="hero-greet">${s.greeting(firstName)}</p>
  <p class="hero-sub">${s.body}</p>
</div>
<div class="sec">
  <div class="panel">
    <p class="small" style="font-weight:700;color:#5b6070;margin-bottom:6px;">${s.accessLabel}</p>
    <p style="font-family:Manrope,-apple-system,Arial,sans-serif;font-size:20px;font-weight:800;color:#002b6d;letter-spacing:-0.5px;line-height:1.35;">${accessUntil ? s.accessUntil(formatDate(accessUntil, locale)) : s.accessUnknown}</p>${named.length > 0 ? `
    <p class="small" style="font-weight:700;color:#5b6070;margin:20px 0 8px;">${s.modulesLabel}</p>
    <p>${named.map(n => `<span style="display:inline-block;background:#ffffff;color:#002b6d;font-size:14px;font-weight:700;border-radius:999px;padding:6px 14px;margin:0 6px 6px 0;">${n}</span>`).join('')}</p>` : ''}
  </div>
</div>
<div class="sec" style="padding-top:0;">
  <h2 class="sec-title" style="font-size:19px;">${s.againLabel}</h2>
  <p class="sec-body">${s.againBody}</p>
  <a href="${accountUrl}" class="btn" style="margin-top:22px;">${s.cta}</a>
</div>
<div class="sec tier">
  <p class="sec-body">${s.supportText} <a href="mailto:${t[locale].common.support}">${t[locale].common.support}</a></p>
  <p class="sign">Inburgering Oefenen</p>
</div>`;

  return renderEmail({ locale, title: s.title, bodyHtml: body, isTransactional: true });
}
