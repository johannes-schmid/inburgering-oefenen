import { type EmailLocale, t } from '../i18n';
import { renderEmail } from '../layout';
import { checkList } from '../components';

export function activationSubject(plan: string, locale: EmailLocale): string {
  return plan === 'premium_plus' ? t[locale].activation.subjectCompleet : t[locale].activation.subjectPremium;
}

export function activationEmail(
  { firstName, loginUrl, plan }: { firstName: string; loginUrl: string; plan: string },
  locale: EmailLocale,
): string {
  const s = t[locale].activation;
  /* `premium_plus` no longer means a "Compleet" tier — `fulfilModulePayment` sets it when the
     account owns Schrijven or Spreken, i.e. an onderdeel with rubric feedback. The e-mail says
     what was unlocked; there is no tier name left to print. */
  const isCompleet = plan === 'premium_plus';
  const planLabel = 'Inburgering Oefenen';
  const features = isCompleet ? [...s.featCompleet] : [...s.featPremium];

  const body = `
<div class="hero">
  <span class="chip-d">${s.label}</span>
  <h1 class="hero-h1">${s.title(planLabel)}</h1>
  <p class="hero-greet">${s.greeting(firstName)}</p>
  <p class="hero-sub">${isCompleet ? s.introCompleet : s.introPremium}</p>
  <a href="${loginUrl}" class="btn" style="margin-top:28px;">${s.ctaText}</a>
</div>
<div class="sec">
  <div class="panel">
    <h2 class="sec-title" style="font-size:19px;">${s.featuresLabel}</h2>
    ${checkList(features)}
  </div>
</div>
<div class="sec tier">
  <p class="sec-body">${s.supportText} <a href="mailto:${t[locale].common.support}">${t[locale].common.support}</a></p>
  <p class="sec-body" style="margin-top:12px;">${s.closing}</p>
  <p class="sign">Inburgering Oefenen</p>
</div>`;

  return renderEmail({
    locale,
    title: s.title(planLabel),
    bodyHtml: body,
    isTransactional: true,
  });
}
