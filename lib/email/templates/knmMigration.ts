import { type EmailLocale, t } from '../i18n';
import { renderEmail } from '../layout';
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

  const items = s.items.map(i => `
<div style="display:flex;align-items:flex-start;gap:10px;padding:6px 0;">
  <span style="color:#fe762c;font-weight:700;font-size:15px;flex-shrink:0;margin-top:1px;">✓</span>
  <span style="font-size:14px;color:#434651;line-height:1.6;">${fill(i)}</span>
</div>`).join('');

  const body = `
<div class="hero">
  <img src="https://inburgeringoefenen.nl/images/knm-oefenen-logo-email.png" width="40" height="40" alt="KNM Oefenen" style="display:block;border-radius:10px;border:2px solid rgba(255,255,255,0.35);margin-bottom:14px;">
  <p class="hero-eyebrow">${s.eyebrow}</p>
  <h1 class="hero-h1">${s.headline}</h1>
  <p class="hero-sub">${s.greeting(firstName)}</p>
  <p class="hero-sub" style="margin-top:10px;">${s.intro}</p>
  <p class="hero-sub" style="margin-top:10px;">${segment === 'paid' ? s.introPaid : s.introFree}</p>
</div>
<div class="sec">
  <p class="sec-label">${s.whatLabel}</p>
  <h2 class="sec-title" style="font-size:17px;margin-bottom:16px;">${s.whatTitle}</h2>
  ${items}
</div>
<div class="div"></div>
<div class="sec" style="background:#f8f9fb;text-align:center;">
  <p class="sec-label" style="text-align:center;">${s.codeLabel}</p>
  <p style="display:inline-block;margin:6px 0 12px;font-family:Manrope,-apple-system,Arial,sans-serif;font-size:26px;font-weight:800;letter-spacing:3px;color:#002b6d;background:#ffffff;border:2px dashed rgba(254,118,44,0.6);border-radius:10px;padding:10px 22px;">${KNM_MIGRATION_CODE}</p>
  <p class="sec-body" style="text-align:center;">${fill(s.codeBody)}</p>
  <p style="font-size:12px;color:#747782;text-align:center;line-height:1.6;margin-top:8px;">${fill(s.priceLine)}</p>
  <a href="${url}" class="btn" style="margin-top:20px;">${s.ctaBtn}</a>
</div>
<div class="sec">
  <p class="sec-body">${s.closingNote} <a href="mailto:${t[locale].common.support}" style="color:#fe762c;">${t[locale].common.support}</a></p>
  <p class="sec-body" style="margin-top:10px;font-weight:700;color:#002b6d;">Inburgering Oefenen</p>
  <p style="font-size:11px;color:#9CA3AF;margin-top:14px;">${s.whyNote}</p>
</div>`;

  return renderEmail({ locale, title: fill(s.subject), bodyHtml: body, unsubscribeUrl });
}
