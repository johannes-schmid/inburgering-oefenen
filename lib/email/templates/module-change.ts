import { type EmailLocale, t } from '../i18n';
import { renderEmail } from '../layout';
import { euro } from '@/lib/pricing';
import { formatDate, moduleLabel } from './cancellation';

/**
 * Bevestiging van een tussentijdse wijziging — of van een mislukte incasso daarvoor.
 *
 * Beantwoordt de drie vragen die iemand heeft na een wijziging: wat staat er nu open, wat heb ik
 * net betaald, en wat betaal ik vanaf de volgende keer. Een tussentijds bedrag als €22,89 is
 * onverwacht als je niet ziet waar het vandaan komt; daarom staat de datum ernaast.
 *
 * Transactioneel, net als de opzegbevestiging: geen aanbod, geen afmeldlink.
 */

export type ModuleChangeEmailInput = {
  firstName: string;
  outcome: 'applied' | 'payment_failed';
  added: string[];
  removed: string[];
  /** `YYYY-MM-DD`: einde van de lopende periode, en de dag van de eerstvolgende incasso. */
  periodEnd: string;
  chargedCents: number;
  monthlyCents: number;
  accountUrl: string;
};

export function moduleChangeSubject(outcome: ModuleChangeEmailInput['outcome'], locale: EmailLocale): string {
  const s = t[locale].moduleChange;
  return outcome === 'applied' ? s.subject : s.subjectFailed;
}

function chips(ids: string[]): string {
  return ids
    .map(moduleLabel)
    .map(n => `<span style="display:inline-block;background:#ffffff;color:#002b6d;font-size:14px;font-weight:700;border-radius:999px;padding:6px 14px;margin:0 6px 6px 0;">${n}</span>`)
    .join('');
}

const LABEL = 'class="small" style="font-weight:700;color:#5b6070;margin:20px 0 8px;"';
const FIRST_LABEL = 'class="small" style="font-weight:700;color:#5b6070;margin:0 0 8px;"';
const VALUE = 'style="font-family:Manrope,-apple-system,Arial,sans-serif;font-size:18px;font-weight:800;color:#002b6d;letter-spacing:-0.4px;line-height:1.4;"';

export function moduleChangeEmail(input: ModuleChangeEmailInput, locale: EmailLocale): string {
  const s = t[locale].moduleChange;
  const date = formatDate(input.periodEnd, locale);
  const failed = input.outcome === 'payment_failed';

  const rows: string[] = [];
  if (failed) {
    rows.push(`<p ${FIRST_LABEL}>${s.failedLabel}</p><p>${chips(input.added)}</p>`);
  } else {
    if (input.added.length > 0) rows.push(`<p ${rows.length ? LABEL : FIRST_LABEL}>${s.addedLabel}</p><p>${chips(input.added)}</p>`);
    if (input.removed.length > 0) rows.push(`<p ${rows.length ? LABEL : FIRST_LABEL}>${s.removedLabel(date)}</p><p>${chips(input.removed)}</p>`);
    rows.push(`<p ${LABEL}>${s.chargedLabel}</p><p ${VALUE}>${input.chargedCents > 0 ? s.charged(euro(input.chargedCents), date) : s.chargedNone}</p>`);
  }
  rows.push(`<p ${LABEL}>${s.monthlyLabel}</p><p ${VALUE}>${input.monthlyCents > 0 ? s.monthly(euro(input.monthlyCents), date) : s.monthlyNone}</p>`);

  const body = `
<div class="hero">
  <span class="chip-d">${failed ? s.labelFailed : s.label}</span>
  <h1 class="hero-h1">${failed ? s.titleFailed : s.title}</h1>
  <p class="hero-greet">${s.greeting(input.firstName)}</p>
  <p class="hero-sub">${failed ? s.bodyFailed : s.body}</p>
</div>
<div class="sec">
  <div class="panel">
    ${rows.join('\n    ')}
  </div>
</div>
<div class="sec" style="padding-top:0;">${failed ? `
  <p class="sec-body">${s.againFailed}</p>` : ''}
  <a href="${input.accountUrl}" class="btn" style="margin-top:22px;">${s.cta}</a>
</div>
<div class="sec tier">
  <p class="sec-body">${s.supportText} <a href="mailto:${t[locale].common.support}">${t[locale].common.support}</a></p>
  <p class="sign">Inburgering Oefenen</p>
</div>`;

  return renderEmail({ locale, title: failed ? s.titleFailed : s.title, bodyHtml: body, isTransactional: true });
}
