import { type EmailLocale, t, dir } from '../i18n';
import { renderEmail } from '../layout';
import { scoreSegments, statusPill } from '../components';
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

  let scoreMsg: string;
  if (data.pct >= 80) scoreMsg = s.goodScore;
  else if (data.pct >= 60) scoreMsg = s.okScore;
  else scoreMsg = s.badScore;

  const cats = Object.entries(data.catScores);

  const catRows = cats.map(([cat, sc]) => {
    const cp = Math.round((sc.correct / sc.total) * 100);
    /* Glas G3: groen = in orde, klei = aandacht, rood = fout. */
    const [cc, ink] = cp >= 60 ? ['#2b7a5c', '#1c5a42'] : cp >= 40 ? ['#fe762c', '#a24000'] : ['#ba1a1a', '#ba1a1a'];
    const pad = rtl ? 'padding:10px 0 10px 14px' : 'padding:10px 14px 10px 0';
    return `
<tr>
  <td style="${pad};font-size:14px;font-weight:600;color:#002b6d;white-space:nowrap;">${cat}</td>
  <td style="padding:10px 0;width:100%;">
    <div style="background:#eef2f8;border-radius:999px;height:10px;overflow:hidden;">
      <div style="background:${cc};width:${Math.max(4, cp)}%;height:10px;border-radius:999px;"></div>
    </div>
  </td>
  <td style="padding:10px ${rtl ? '14px 10px 0' : '0 10px 14px'};font-size:14px;font-weight:700;color:${ink};white-space:nowrap;text-align:${rtl ? 'left' : 'right'};">${sc.correct}/${sc.total}</td>
</tr>`;
  }).join('');

  const catSection = cats.length
    ? `
<div class="sec">
  <h2 class="sec-title" style="font-size:19px;margin-bottom:8px;">${s.catTitle}</h2>
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
        return `<tr><td style="padding:10px 0;">
          <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#a24000;">${cat} · ${cp}%</p>
          <p style="margin:0;font-size:14px;color:#434651;line-height:1.6;">${tip}</p>
        </td></tr>`;
      }).join('');
    if (weakTips) {
      studyTipsHtml = `
<div class="sec" style="padding-top:0;">
  <div class="panel-tip">
    <h2 class="sec-title" style="font-size:18px;color:#a24000;margin-bottom:4px;">${s.studyTipsLabel}</h2>
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
<div class="hero" style="text-align:center;padding-top:20px;">
  <span class="chip-d">${s.eyebrow(skillName)}</span>
  <p style="margin:0 0 6px;font-family:Manrope,-apple-system,Arial,sans-serif;font-size:84px;font-weight:800;color:#002b6d;line-height:1;letter-spacing:-3.4px;">${data.pct}<span style="font-size:34px;color:#5d7fd6;letter-spacing:-1px;">%</span></p>
  <p style="margin:0 0 18px;font-size:14px;color:#5b6070;">${s.scoreLabel}: ${data.score} / ${data.total}</p>
  <p style="margin:0 0 24px;">${statusPill(data.passed, data.passed ? s.passLabel : s.failLabel)}</p>
  ${scoreSegments(data.score, data.total, locale, data.passed ? s.passSubtext : s.failSubtext)}
  <p class="hero-sub" style="margin:16px auto 0;max-width:420px;font-size:15px;">${scoreMsg}</p>
</div>
${catSection}
${studyTipsHtml}
<div class="sec"${cats.length ? ' style="padding-top:0;"' : ''}>
  <p class="small">${s.thresholdNote}</p>
</div>
<div class="sec tier" style="text-align:center;">
  <span class="chip">${s.nextLabel}</span>
  <h2 class="sec-title">${s.nextTitle}</h2>
  <p class="sec-body" style="margin-bottom:24px;">${s.nextBody}</p>
  <a href="${practiceUrl}" class="btn">${s.nextBtn}</a>
</div>`;

  return renderEmail({ locale, title: s.title, bodyHtml: body, unsubscribeUrl });
}

export function resultsSubject(pct: number, passed: boolean, locale: EmailLocale, skill?: string): string {
  const s = t[locale].results;
  return s.subject(pct, passed, skill ? s.skillNames[skill] : undefined);
}
