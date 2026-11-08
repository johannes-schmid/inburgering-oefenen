import { type EmailLocale, t } from '../i18n';
import { renderEmail } from '../layout';
import { skillsShowcase, packageCards, paymentBadges } from '../components';

export function day2NoScoreSubject(locale: EmailLocale): string {
  return t[locale].day2NoScore.subject;
}

export function day2NoScoreEmail(firstName: string, locale: EmailLocale, unsubscribeUrl: string): string {
  const s = t[locale].day2NoScore;
  /* `/oefenen` is the skill picker — the free funnel. `/proefexamen` was the KNM flat-question
     player and `?view=woordkaarten` a dashboard view that no longer exists. */
  const examUrl = 'https://inburgeringoefenen.nl/oefenen';

  const body = `
<div class="hero">
  <p class="hero-greet">${s.greeting(firstName)}</p>
  <h1 class="hero-h1">${s.heroHeadline}</h1>
  <p class="hero-sub">${s.heroSub}</p>
</div>
<div class="sec">
  <span class="chip">${s.freeLabel}</span>
  <h2 class="sec-title">${s.freeTitle}</h2>
  <p class="sec-body" style="margin-bottom:24px;">${s.freeBody}</p>
  <div class="panel" style="text-align:center;">
    <p style="font-family:Manrope,-apple-system,Arial,sans-serif;font-size:20px;font-weight:800;color:#002b6d;letter-spacing:-0.5px;margin-bottom:8px;">${s.freeCtaTitle}</p>
    <p class="sec-body" style="font-size:15px;margin-bottom:22px;">${s.freeCtaSub}</p>
    <a href="${examUrl}" class="btn">${s.freeBtn}</a>
  </div>
</div>
${skillsShowcase(locale)}
<div class="sec tier" style="text-align:center;">
  <h2 class="sec-title">${s.readyLabel}</h2>
  ${packageCards(locale)}
  ${paymentBadges(locale)}
  <p class="small" style="margin-top:10px;">${locale === 'ar' ? 'دفع آمن · وصول فوري' : locale === 'en' ? 'Secure payment · Instant access' : 'Veilig betalen · Directe toegang'}</p>
</div>`;

  return renderEmail({ locale, title: s.subject, bodyHtml: body, unsubscribeUrl });
}
