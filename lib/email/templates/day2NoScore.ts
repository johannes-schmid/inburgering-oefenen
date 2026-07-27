import { type EmailLocale, t } from '../i18n';
import { renderEmail } from '../layout';
import { featureDuo, packageCards, paymentBadges } from '../components';

export function day2NoScoreSubject(locale: EmailLocale): string {
  return t[locale].day2NoScore.subject;
}

export function day2NoScoreEmail(firstName: string, locale: EmailLocale, unsubscribeUrl: string): string {
  const s = t[locale].day2NoScore;
  const examUrl = 'https://inburgeringoefenen.nl/proefexamen';
  const dashboardUrl = 'https://inburgeringoefenen.nl/dashboard?view=woordkaarten';

  const body = `
<div class="hero">
  <p class="hero-greet">${s.greeting(firstName)}</p>
  <h1 class="hero-h1">${s.heroHeadline}</h1>
  <p class="hero-sub">${s.heroSub}</p>
</div>
<div class="sec">
  <p class="sec-label">${s.freeLabel}</p>
  <h2 class="sec-title">${s.freeTitle}</h2>
  <p class="sec-body" style="margin-bottom:24px;">${s.freeBody}</p>
  <div style="background:#fff7ed;border:1.5px solid rgba(254,118,44,0.3);border-radius:12px;padding:28px;text-align:center;">
    <p style="font-family:Manrope,-apple-system,Arial,sans-serif;font-size:18px;font-weight:800;color:#191c1e;margin-bottom:8px;">${s.freeCtaTitle}</p>
    <p style="font-size:14px;color:#434651;line-height:1.6;margin-bottom:20px;">${s.freeCtaSub}</p>
    <a href="${examUrl}" class="btn" style="display:inline-block;">${s.freeBtn}</a>
  </div>
</div>
<div class="div"></div>
${featureDuo(locale)}
<div class="div"></div>
<div class="sec" style="background:#f8f9fb;">
  <p class="sec-label" style="text-align:center;">Klaar voor toegang?</p>
  ${packageCards(locale)}
  ${paymentBadges(locale)}
  <p style="font-size:11px;color:#9CA3AF;text-align:center;margin-top:10px;">🔒 ${locale === 'ar' ? 'دفع آمن · وصول فوري' : locale === 'en' ? 'Secure payment · Instant access' : 'Veilig betalen · Directe toegang'}</p>
</div>`;

  return renderEmail({ locale, title: s.subject, bodyHtml: body, unsubscribeUrl });
}
