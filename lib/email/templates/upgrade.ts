import { type EmailLocale, t } from '../i18n';
import { renderEmail } from '../layout';
import { checkList } from '../components';

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
  <h1 class="hero-h1">${s.title}</h1>
  <p class="hero-greet">${s.greeting(firstName)}</p>
  <p class="hero-sub">${s.body}</p>
  <a href="${dashboardUrl}" class="btn" style="margin-top:28px;">${s.cta}</a>
</div>
<div class="sec">
  <div class="panel">
    <h2 class="sec-title" style="font-size:19px;">${s.unlockedLabel}</h2>
    ${checkList([...s.features])}
  </div>
</div>
<div class="sec tier">
  <p class="sec-body">${t[locale].activation.supportText} <a href="mailto:${t[locale].common.support}">${t[locale].common.support}</a></p>
  <p class="sign">Inburgering Oefenen</p>
</div>`;

  return renderEmail({ locale, title: s.title, bodyHtml: body, isTransactional: true });
}
