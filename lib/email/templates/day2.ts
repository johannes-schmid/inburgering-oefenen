import { type EmailLocale, t } from '../i18n';
import { renderEmail } from '../layout';
import { skillsShowcase, packageCards, paymentBadges, scoreSegments, statusPill } from '../components';

type CatScore = { correct: number; total: number };

export function day2Subject(pct: number, locale: EmailLocale): string {
  return t[locale].day2.subject(pct);
}

export function day2Email(
  payload: { pct: number; score: number; total: number; passed: boolean; exam_name?: string; catScores?: Record<string, CatScore> },
  firstName: string,
  locale: EmailLocale,
  unsubscribeUrl: string,
): string {
  const s = t[locale].day2;
  const sc = t[locale].common;
  const pct = payload.pct ?? 0;
  const examName = payload.exam_name ?? 'je oefenexamen';
  const isGood = pct >= 60;
  const score = payload.score ?? 0;
  const total = payload.total ?? 0;

  /* The delta is computed from *this* exam's length. It used to be `27 - score` — 60% of the
     44-question KNM exam — which is wrong for every A2 onderdeel: Lezen and Luisteren have 25
     items, Schrijven 4 and Spreken 16. */
  const threshold = Math.ceil(total * 0.6);
  const needed = Math.max(0, threshold - score);
  const above = Math.max(0, score - threshold);
  let insightBadge: string;
  if (isGood) insightBadge = locale === 'ar' ? `${above} فوق حدّ التدريب` : locale === 'en' ? `${above} ${above === 1 ? 'item' : 'items'} above our practice mark` : `${above} ${above === 1 ? 'vraag' : 'vragen'} boven onze oefengrens`;
  else insightBadge = locale === 'ar' ? `${needed} للوصول إلى حدّ التدريب` : locale === 'en' ? `${needed} more to reach our practice mark` : `Nog ${needed} te gaan tot onze oefengrens`;

  const body = `
<div class="hero" style="text-align:center;padding-top:20px;">
  <p class="hero-greet">${s.greeting(firstName)}</p>
  <p class="small" style="margin-bottom:10px;">${s.resultLabel} · ${examName}</p>
  <p style="margin:0 0 6px;font-family:Manrope,-apple-system,Arial,sans-serif;font-size:84px;font-weight:800;color:#002b6d;line-height:1;letter-spacing:-3.4px;">${pct}<span style="font-size:34px;color:#5d7fd6;letter-spacing:-1px;">%</span></p>
  <p style="margin:0 0 18px;font-size:14px;color:#5b6070;">${score} / ${total}</p>
  <p style="margin:0 0 24px;">${statusPill(isGood, isGood ? t[locale].results.passLabel : t[locale].results.failLabel)}</p>
  ${scoreSegments(score, total, locale, s.passMark)}
  <p style="margin:18px auto 0;max-width:420px;font-size:15px;color:#002b6d;font-weight:700;">${insightBadge}</p>
  <p class="hero-sub" style="margin:6px auto 0;max-width:420px;font-size:15px;">${isGood ? s.goodMsg : s.badMsg}</p>
</div>
${skillsShowcase(locale)}
<div class="sec tier" style="text-align:center;">
  <span class="chip">${s.upgradeLabel}</span>
  <h2 class="sec-title">${sc.packages.heading}</h2>
  ${packageCards(locale)}
  ${paymentBadges(locale)}
  <p class="small" style="margin-top:10px;">${locale === 'ar' ? 'دفع آمن · وصول فوري' : locale === 'en' ? 'Secure payment · Instant access' : 'Veilig betalen · Directe toegang'}</p>
</div>`;

  return renderEmail({ locale, title: s.resultTitle(examName), bodyHtml: body, unsubscribeUrl });
}
