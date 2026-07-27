import { type EmailLocale, t } from '../i18n';
import { renderEmail } from '../layout';
import { featureListDark } from '../components';

export function activationSubject(plan: string, locale: EmailLocale): string {
  return plan === 'premium_plus' ? t[locale].activation.subjectCompleet : t[locale].activation.subjectPremium;
}

export function activationEmail(
  { firstName, loginUrl, plan }: { firstName: string; loginUrl: string; plan: string },
  locale: EmailLocale,
): string {
  const s = t[locale].activation;
  const isCompleet = plan === 'premium_plus';
  const planLabel = isCompleet ? t[locale].common.compleetTitle : t[locale].common.proTitle;
  const features = isCompleet ? [...s.featCompleet] : [...s.featPremium];

  const body = `
<div class="sec">
  <p class="sec-label">${s.label}</p>
  <h1 class="sec-title">${s.title(planLabel)}</h1>
  <p class="sec-body">${s.greeting(firstName)}</p>
  <p class="sec-body" style="margin-top:12px;">${isCompleet ? s.introCompleet : s.introPremium}</p>
  <a href="${loginUrl}" class="btn" style="margin-top:28px;">${s.ctaText}</a>
  <div class="feat" style="margin-top:28px;">
    <p class="feat-title">${s.featuresLabel}</p>
    ${featureListDark(features)}
  </div>
</div>
<div class="div"></div>
<div class="sec">
  <p class="sec-body">${s.supportText} <a href="mailto:${t[locale].common.support}" style="color:#fe762c;">${t[locale].common.support}</a></p>
  <p class="sec-body" style="margin-top:12px;">${s.closing}</p>
  <p class="sec-body" style="margin-top:6px;font-weight:700;color:#002b6d;">Inburgering Oefenen</p>
</div>`;

  return renderEmail({
    locale,
    title: s.title(planLabel),
    bodyHtml: body,
    isTransactional: true,
  });
}
