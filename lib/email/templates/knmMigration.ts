import { type EmailLocale, t } from '../i18n';
import { renderEmail } from '../layout';
import { checkList } from '../components';
import { KNM, getFormat, DEFAULT_LEVEL } from '@/data/skills';
import { MODULE_PRICE_CENTS, BUNDLE_PRICE_CENTS, euro } from '@/lib/pricing';
import {
  KNM_MIGRATION_CODE, KNM_MIGRATION_PCT, knmMigrationLandingUrl, knmMigrationPriceCents, type KnmMigrationSegment,
} from '@/lib/knm-migration';

function fill(s: string): string {
  return s
    .replaceAll('{pct}', String(KNM_MIGRATION_PCT))
    .replaceAll('{knmExams}', String(KNM.examCount))
    .replaceAll('{examsPerSkill}', String(getFormat(DEFAULT_LEVEL, 'lezen').examCount))
    .replaceAll('{module}', euro(MODULE_PRICE_CENTS))
    .replaceAll('{bundle}', euro(BUNDLE_PRICE_CENTS))
    .replaceAll('{moduleNow}', euro(knmMigrationPriceCents(MODULE_PRICE_CENTS)))
    .replaceAll('{bundleNow}', euro(knmMigrationPriceCents(BUNDLE_PRICE_CENTS)));
}

export function knmMigrationSubject(locale: EmailLocale): string {
  return fill(t[locale].knmMigration.subject);
}

/**
 * De aankondiging aan de knmoefenen.nl-lijst. Twee varianten op één template: wie op
 * knmoefenen.nl betaald heeft krijgt "je toegang blijft, nu ook de taalexamens", de rest
 * "je kunt gratis beginnen". Het segment gaat mee in de link, zodat PostHog ze uit elkaar houdt.
 */
export function knmMigrationEmail(
  firstName: string,
  segment: KnmMigrationSegment,
  locale: EmailLocale,
  unsubscribeUrl: string,
): string {
  const s = t[locale].knmMigration;
  const url = knmMigrationLandingUrl(locale, segment);

  const items = checkList(s.items.map(fill));

  const body = `
<div class="hero">
  <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;"><tr>
    <td valign="middle"><img src="https://inburgeringoefenen.nl/images/knm-oefenen-logo-email.png" width="36" height="36" alt="KNM Oefenen" style="display:block;border-radius:9px;"></td>
    <td valign="middle" style="padding:0 10px;"><span class="chip-d" style="margin:0;">${s.eyebrow}</span></td>
  </tr></table>
  <h1 class="hero-h1">${s.headline}</h1>
  <p class="hero-greet">${s.greeting(firstName)}</p>
  <p class="hero-sub">${s.intro}</p>
  <p class="hero-sub" style="margin-top:10px;">${segment === 'paid' ? s.introPaid : s.introFree}</p>
</div>
<div class="sec">
  <span class="chip">${s.whatLabel}</span>
  <h2 class="sec-title" style="font-size:19px;">${s.whatTitle}</h2>
  ${items}
</div>
<div class="sec" style="padding-top:0;">
  <div class="panel" style="text-align:center;">
    <p class="small" style="font-weight:700;margin-bottom:12px;">${s.codeLabel}</p>
    <p style="display:inline-block;margin:0 0 16px;font-family:Manrope,-apple-system,Arial,sans-serif;font-size:28px;font-weight:800;letter-spacing:4px;color:#002b6d;background:#ffffff;border-radius:16px;padding:12px 26px;box-shadow:0 12px 24px -16px rgba(0,43,109,0.4);">${KNM_MIGRATION_CODE}</p>
    <p class="sec-body" style="font-size:15px;">${fill(s.codeBody)}</p>
    <p class="small" style="margin-top:8px;">${fill(s.priceLine)}</p>
    <a href="${url}" class="btn" style="margin-top:22px;">${s.ctaBtn}</a>
  </div>
</div>
<div class="sec tier">
  <p class="sec-body">${s.closingNote} <a href="mailto:${t[locale].common.support}">${t[locale].common.support}</a></p>
  <p class="sign">Inburgering Oefenen</p>
  <p class="small" style="margin-top:16px;">${s.whyNote}</p>
</div>`;

  return renderEmail({ locale, title: fill(s.subject), bodyHtml: body, unsubscribeUrl });
}
