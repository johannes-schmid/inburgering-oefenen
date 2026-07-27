import { type EmailLocale, t } from '../i18n';
import { renderEmail } from '../layout';
import { featureListDark } from '../components';

export function upgradeSubject(locale: EmailLocale): string {
  return t[locale].upgrade.subject;
}

export function upgradeEmail(
  { firstName, dashboardUrl }: { firstName: string; dashboardUrl: string },
  locale: EmailLocale,
): string {
  const s = t[locale].upgrade;

  const body = `
<div class="hero">
  <p class="hero-eyebrow">🚀</p>
  <h1 class="hero-h1">${s.title}</h1>
  <p class="hero-sub">${s.greeting(firstName)}</p>
  <p class="hero-sub" style="margin-top:10px;">${s.body}</p>
  <a href="${dashboardUrl}" class="btn" style="margin-top:28px;">${s.cta}</a>
</div>
<div class="sec">
  <p class="sec-label">${s.unlockedLabel}</p>
  <div class="feat" style="margin-top:0;">
    ${featureListDark([...s.features])}
  </div>
</div>
<div class="div"></div>
<div class="sec">
  <p class="sec-body">${t[locale].activation.supportText} <a href="mailto:${t[locale].common.support}" style="color:#fe762c;">${t[locale].common.support}</a></p>
  <p class="sec-body" style="margin-top:12px;font-weight:700;color:#002b6d;">KNM Oefenen</p>
</div>`;

  return renderEmail({ locale, title: s.title, bodyHtml: body, isTransactional: true });
}
