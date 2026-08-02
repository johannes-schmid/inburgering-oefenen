import { type EmailLocale, t } from '../i18n';
import { renderEmail } from '../layout';
import { skillsShowcase, packageCards, paymentBadges } from '../components';

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
<!-- SCORE HERO -->
<div style="background:linear-gradient(160deg,#001040 0%,#002b6d 45%,#0f4299 100%);padding:36px 40px 40px;text-align:center;position:relative;overflow:hidden;">
  <div style="position:absolute;top:-40px;left:50%;transform:translateX(-50%);width:320px;height:200px;background:radial-gradient(ellipse,rgba(254,118,44,0.15) 0%,transparent 70%);pointer-events:none;"></div>
  <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1.2px;">${s.resultLabel} — ${examName}</p>
  <p style="margin:0 0 8px;font-size:11px;color:rgba(255,255,255,0.4);">${s.greeting(firstName)}</p>
  <div style="margin:16px 0 8px;">
    <span style="font-family:Manrope,-apple-system,Arial,sans-serif;font-size:88px;font-weight:800;color:#ffffff;line-height:1;letter-spacing:-4px;">${pct}</span><span style="font-family:Manrope,-apple-system,Arial,sans-serif;font-size:32px;font-weight:700;color:rgba(255,255,255,0.55);letter-spacing:-1px;">%</span>
  </div>
  <div style="display:inline-block;background:${isGood ? 'rgba(22,163,74,0.25)' : 'rgba(220,38,38,0.25)'};border:1px solid ${isGood ? 'rgba(22,163,74,0.5)' : 'rgba(220,38,38,0.5)'};color:${isGood ? '#6ee7b7' : '#fca5a5'};font-size:12px;font-weight:700;padding:5px 16px;border-radius:99px;margin-bottom:18px;">${isGood ? t[locale].results.passLabel : t[locale].results.failLabel}</div>
  <div style="max-width:280px;margin:0 auto;">
    <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
      <span style="font-size:10px;color:rgba(255,255,255,0.4);">0%</span>
      <span style="font-size:10px;color:rgba(255,255,255,0.4);">${s.passMark}</span>
      <span style="font-size:10px;color:rgba(255,255,255,0.4);">100%</span>
    </div>
    <div style="background:rgba(255,255,255,0.12);border-radius:99px;height:7px;position:relative;overflow:visible;">
      <div style="background:${isGood ? 'linear-gradient(90deg,#34d399,#10b981)' : 'linear-gradient(90deg,#f87171,#ef4444)'};width:${pct}%;height:7px;border-radius:99px;"></div>
      <div style="position:absolute;top:-3px;left:60%;width:2px;height:13px;background:#fe762c;border-radius:2px;"></div>
    </div>
    <div style="margin-top:10px;">
      <span style="display:inline-block;background:rgba(254,118,44,0.15);border:1px solid rgba(254,118,44,0.35);color:#fdba74;font-size:11px;font-weight:700;padding:4px 12px;border-radius:6px;">${insightBadge}</span>
    </div>
    <p style="margin:8px 0 0;font-size:12px;color:rgba(255,255,255,0.5);line-height:1.6;">${isGood ? s.goodMsg : s.badMsg}</p>
  </div>
</div>
<div class="div"></div>
${skillsShowcase(locale)}
<div class="div"></div>
<div class="sec" style="background:#f8f9fb;">
  <p class="sec-label" style="text-align:center;">${s.upgradeLabel}</p>
  <p class="sec-title" style="text-align:center;">${sc.packages.heading}</p>
  ${packageCards(locale)}
  ${paymentBadges(locale)}
  <p style="font-size:11px;color:#9CA3AF;text-align:center;margin-top:10px;">🔒 ${locale === 'ar' ? 'دفع آمن · وصول فوري' : locale === 'en' ? 'Secure payment · Instant access' : 'Veilig betalen · Directe toegang'}</p>
</div>`;

  return renderEmail({ locale, title: s.resultTitle(examName), bodyHtml: body, unsubscribeUrl });
}
