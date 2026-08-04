import { type EmailLocale, t, dir } from '../i18n';
import { renderEmail } from '../layout';
import { DEFAULT_LEVEL } from '@/data/skills';

type CatScore = { correct: number; total: number };

const STUDY_TIPS: Record<string, string> = {
  'Lezen': 'Lees elke dag een korte Nederlandse tekst — een brief van de gemeente, een advertentie of een nieuwsbericht — en zoek eerst het onderwerp voordat je de vragen leest.',
  'Luisteren': 'Luister een fragment twee keer: de eerste keer voor het onderwerp, de tweede keer voor de details zoals tijden, prijzen en namen.',
  'Schrijven': 'Oefen met korte standaardteksten: een e-mail met een vraag, een afmelding en een ingevuld formulier. Let op aanhef en afsluiting.',
  'Spreken': 'Neem je antwoord op en luister het terug. Spreek in korte, volledige zinnen en gebruik de woorden uit de vraag.',
};

export type ResultsEmailData = {
  score: number;
  total: number;
  passed: boolean;
  pct: number;
  catScores: Record<string, CatScore>;
  /** 'lezen' | 'luisteren' | 'schrijven' | 'spreken' — omitted when unknown */
  skill?: string;
};

export function resultsEmail(
  data: ResultsEmailData,
  locale: EmailLocale,
  unsubscribeUrl = '',
  includeStudyTips = false,
): string {
  const s = t[locale].results;
  const rtl = dir(locale) === 'rtl';
  const skillName = data.skill ? s.skillNames[data.skill] : undefined;
  // Lightened variants — #16a34a / #dc2626 do not carry enough contrast on the navy hero.
  const accent = data.pct >= 80 ? '#4ade80' : data.pct >= 60 ? '#fe9f5f' : '#ff8a80';

  let scoreMsg: string;
  if (data.pct >= 80) scoreMsg = s.goodScore;
  else if (data.pct >= 60) scoreMsg = s.okScore;
  else scoreMsg = s.badScore;

  const cats = Object.entries(data.catScores);

  const catRows = cats.map(([cat, sc]) => {
    const cp = Math.round((sc.correct / sc.total) * 100);
    const cc = cp >= 60 ? '#16a34a' : cp >= 40 ? '#a24000' : '#dc2626';
    return `
<tr>
  <td style="padding:8px 12px 8px 0;font-size:13px;color:#434651;white-space:nowrap;">${cat}</td>
  <td style="padding:8px 0;width:100%;">
    <div style="background:#e0e3e5;border-radius:4px;height:8px;overflow:hidden;">
      <div style="background:${cc};width:${Math.max(4, cp)}%;height:8px;border-radius:4px;"></div>
    </div>
  </td>
  <td style="padding:8px 0 8px 12px;font-size:13px;font-weight:700;color:${cc};white-space:nowrap;text-align:${rtl ? 'left' : 'right'};">${sc.correct}/${sc.total} (${cp}%)</td>
</tr>`;
  }).join('');

  const catSection = cats.length
    ? `
<div class="sec">
  <p class="sec-label">${s.catTitle}</p>
  <table width="100%" cellpadding="0" cellspacing="0">${catRows}</table>
</div>`
    : '';

  let studyTipsHtml = '';
  if (includeStudyTips) {
    const weakTips = cats
      .filter(([, sc]) => Math.round((sc.correct / sc.total) * 100) < 60)
      .map(([cat, sc]) => {
        const cp = Math.round((sc.correct / sc.total) * 100);
        const tip = STUDY_TIPS[cat] || '';
        return `<tr><td style="padding:12px 0;border-bottom:1px solid #f0f2f4;">
          <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#002b6d;">${cat} — ${cp}%</p>
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

  const practiceUrl = data.skill
    ? `https://inburgeringoefenen.nl/oefenexamen/${DEFAULT_LEVEL}/${data.skill}`
    : 'https://inburgeringoefenen.nl/oefenen';

  /* The score is plain text in a table cell, not an SVG ring: Gmail strips inline <svg>
     outright, which left the old ring — and the score itself — invisible. */
  const body = `
<div class="hero" style="text-align:center;padding:34px 40px 38px;">
  <p class="hero-eyebrow" style="margin-bottom:16px;">${s.eyebrow(skillName)}</p>
  <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
    <tr>
      <td align="center" style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.16);border-radius:16px;padding:20px 34px;">
        <p style="margin:0;font-family:Manrope,-apple-system,Arial,sans-serif;font-size:46px;font-weight:800;line-height:1;letter-spacing:-2px;color:${accent};">${data.pct}%</p>
        <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.6);">${s.scoreLabel}: ${data.score} / ${data.total}</p>
      </td>
    </tr>
  </table>
  <p style="margin:20px 0 0;">
    <span style="display:inline-block;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.22);color:#ffffff;font-size:13px;font-weight:700;padding:6px 18px;border-radius:99px;">${data.passed ? s.passLabel : s.failLabel}</span>
  </p>
  <p style="margin:14px 0 6px;font-size:14px;color:rgba(255,255,255,0.78);line-height:1.6;">${data.passed ? s.passSubtext : s.failSubtext}</p>
  <p style="font-size:14px;color:rgba(255,255,255,0.55);line-height:1.6;">${scoreMsg}</p>
</div>
${catSection}
${studyTipsHtml}
<div class="sec"${cats.length ? ' style="padding-top:0;"' : ''}>
  <p style="margin:0;font-size:12px;color:#747782;line-height:1.6;">${s.thresholdNote}</p>
</div>
<div class="div"></div>
<div class="sec" style="background:#f8f9fb;text-align:center;">
  <p class="sec-label">${s.nextLabel}</p>
  <p class="sec-title">${s.nextTitle}</p>
  <p class="sec-body" style="margin-bottom:22px;">${s.nextBody}</p>
  <a href="${practiceUrl}" class="btn">${s.nextBtn}</a>
</div>`;

  return renderEmail({ locale, title: s.title, bodyHtml: body, unsubscribeUrl });
}

export function resultsSubject(pct: number, passed: boolean, locale: EmailLocale, skill?: string): string {
  const s = t[locale].results;
  return s.subject(pct, passed, skill ? s.skillNames[skill] : undefined);
}
