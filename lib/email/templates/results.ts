import { type EmailLocale, t } from '../i18n';
import { renderEmail } from '../layout';
import { svgScoreRing, packageCards, paymentBadges } from '../components';

type CatScore = { correct: number; total: number };

const CAT_ICONS: Record<string, string> = {
  'Werk en Inkomen': '💼', 'Werk & Inkomen': '💼',
  'Wonen': '🏠', 'Wonen & Samenleven': '🏠',
  'Onderwijs en Opvoeding': '📚', 'Onderwijs & Kinderen': '📚',
  'Gezondheid en Gezondheidszorg': '🏥', 'Gezondheid & Zorg': '🏥',
  'Staatsinrichting en Rechtsstaat': '🏛️', 'Politiek & Instellingen': '🏛️',
  'Instanties': '⚖️', 'Overheid & Regels': '⚖️',
  'Geld & Belastingen': '💶',
  'Verkeer & Veiligheid': '🚲',
  'Maatschappij, Normen & Waarden': '🤝',
  'Geschiedenis en Geografie': '📜', 'Geschiedenis & Herdenking': '📜',
};

const STUDY_TIPS: Record<string, string> = {
  'Werk en Inkomen': 'Bestudeer hoe het Nederlandse arbeidsstelsel werkt: minimumloon, arbeidscontracten, WW-uitkering en bijstand.',
  'Wonen': 'Leer over huurrechten, sociale huurwoningen en samenleven in een Nederlandse wijk.',
  'Onderwijs en Opvoeding': 'Verdiep je in het Nederlandse onderwijssysteem: basisschool, middelbare school en leerplicht.',
  'Gezondheid en Gezondheidszorg': 'Bestudeer hoe de Nederlandse gezondheidszorg werkt: huisarts, zorgverzekering en eigen risico.',
  'Staatsinrichting en Rechtsstaat': 'Leer over het Nederlandse politieke stelsel, gemeenteraad en rechten en plichten van inwoners.',
  'Instanties': 'Verdiep je in de belangrijkste instanties: gemeentehuis, DUO, Belastingdienst en UWV.',
  'Geschiedenis en Geografie': 'Bestudeer de Nederlandse geschiedenis: Tweede Wereldoorlog, 4 en 5 mei en nationale herdenkingen.',
};

export function resultsEmail(
  data: { score: number; total: number; passed: boolean; pct: number; catScores: Record<string, CatScore> },
  locale: EmailLocale,
  unsubscribeUrl = '',
  includeStudyTips = false,
): string {
  const s = t[locale].results;
  const passColor = data.passed ? '#16a34a' : '#dc2626';

  let scoreMsg: string;
  if (data.pct >= 80) scoreMsg = s.goodScore;
  else if (data.pct >= 60) scoreMsg = s.okScore;
  else scoreMsg = s.badScore;

  const catRows = Object.entries(data.catScores).map(([cat, sc]) => {
    const cp = Math.round((sc.correct / sc.total) * 100);
    const cc = cp >= 60 ? '#16a34a' : cp >= 40 ? '#a24000' : '#dc2626';
    const icon = CAT_ICONS[cat] || '';
    const barWidth = Math.max(4, cp);
    return `
<tr>
  <td style="padding:8px 12px 8px 0;font-size:13px;color:#434651;white-space:nowrap;">${icon} ${cat}</td>
  <td style="padding:8px 0;width:100%;">
    <div style="background:#e0e3e5;border-radius:4px;height:8px;overflow:hidden;">
      <div style="background:${cc};width:${barWidth}%;height:8px;border-radius:4px;"></div>
    </div>
  </td>
  <td style="padding:8px 0 8px 12px;font-size:13px;font-weight:700;color:${cc};white-space:nowrap;text-align:right;">${sc.correct}/${sc.total} (${cp}%)</td>
</tr>`;
  }).join('');

  let studyTipsHtml = '';
  if (includeStudyTips) {
    const weakTips = Object.entries(data.catScores)
      .filter(([, sc]) => Math.round((sc.correct / sc.total) * 100) < 60)
      .map(([cat, sc]) => {
        const cp = Math.round((sc.correct / sc.total) * 100);
        const icon = CAT_ICONS[cat] || '';
        const tip = STUDY_TIPS[cat] || '';
        return `<tr><td style="padding:12px 0;border-bottom:1px solid #f0f2f4;">
          <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#002b6d;">${icon} ${cat} — ${cp}%</p>
          <p style="margin:0;font-size:13px;color:#434651;line-height:1.5;">${tip}</p>
        </td></tr>`;
      }).join('');
    if (weakTips) {
      studyTipsHtml = `
<div class="sec" style="padding-top:0;">
  <div style="background:#fff8f0;border:1.5px solid #fde3c8;border-radius:10px;padding:20px 24px;">
    <p style="margin:0 0 16px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#a24000;">${s.studyTipsLabel}</p>
    <table width="100%" cellpadding="0" cellspacing="0">${weakTips}</table>
  </div>
</div>`;
    }
  }

  const body = `
<div class="hero" style="text-align:center;padding:36px 40px 40px;">
  ${svgScoreRing(data.pct, data.score, data.total)}
  <span style="display:inline-block;background:${passColor}22;color:${passColor};font-size:14px;font-weight:700;padding:6px 20px;border-radius:99px;border:1px solid ${passColor}44;">${data.passed ? s.passLabel : s.failLabel}</span>
  <p style="margin:10px 0 6px;font-size:13px;color:rgba(255,255,255,0.7);">${data.passed ? s.passSubtext : s.failSubtext}</p>
  <p style="font-size:13px;color:rgba(255,255,255,0.55);">${scoreMsg}</p>
</div>
<div class="sec">
  <p class="sec-label">${s.catTitle}</p>
  <table width="100%" cellpadding="0" cellspacing="0">${catRows}</table>
</div>
${studyTipsHtml}
<div class="div"></div>
<div class="sec" style="background:#f8f9fb;">
  <p class="sec-label" style="text-align:center;">${s.upsellLabel}</p>
  <p class="sec-title" style="text-align:center;">${s.upsellTitle}</p>
  <p class="sec-body" style="text-align:center;margin-bottom:24px;">${s.upsellBody}</p>
  ${packageCards(locale)}
  ${paymentBadges(locale)}
  <p style="font-size:11px;color:#9CA3AF;text-align:center;margin-top:10px;">🔒 Veilig betalen · Directe toegang na betaling</p>
</div>`;

  return renderEmail({ locale, title: s.title, bodyHtml: body, unsubscribeUrl });
}

export function resultsSubject(pct: number, passed: boolean, locale: EmailLocale): string {
  return t[locale].results.subject(pct, passed);
}
