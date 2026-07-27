/**
 * Results Email — Option A: "Momentum"
 *
 * Design direction:
 * - Gradient hero: deep blue → bright mid-blue with radial glow (no flat colour)
 * - Score as a massive number, not a ring — instant readability
 * - Concrete personalised insight: exact delta to pass threshold
 * - Category breakdown as compact chips, grouped "Strong" vs "Improve" — scannable in 3 seconds
 * - 1 primary CTA tied to their result, not a generic upgrade pitch
 * - Upsell enters only at the bottom, framed around their specific weak spot
 */

import { type EmailLocale, t } from '../i18n';
import { renderEmail } from '../layout';
import { packageCards, paymentBadges, topicCardGrid } from '../components';

type CatScore = { correct: number; total: number };

const CAT_ICONS: Record<string, string> = {
  'Werk en Inkomen': '💼', 'Werk & Inkomen': '💼',
  'Wonen': '🏠', 'Wonen & Samenleven': '🏠',
  'Onderwijs en Opvoeding': '📚', 'Onderwijs & Kinderen': '📚',
  'Gezondheid en Gezondheidszorg': '🏥', 'Gezondheid & Zorg': '🏥',
  'Staatsinrichting en Rechtsstaat': '🏛️', 'Politiek & Instellingen': '🏛️',
  'Instanties': '⚖️', 'Overheid & Regels': '⚖️',
  'Geld & Belastingen': '💶', 'Verkeer & Veiligheid': '🚲',
  'Maatschappij, Normen & Waarden': '🤝',
  'Geschiedenis en Geografie': '📜', 'Geschiedenis & Herdenking': '📜',
};

function delta(pct: number): { needed: number; above: number } {
  // Based on 44-question exam, 27 correct = 60% pass
  const correct = Math.round((pct / 100) * 44);
  const needed = Math.max(0, 27 - correct);
  const above = Math.max(0, correct - 27);
  return { needed, above };
}

export function resultsEmailA(
  data: { score: number; total: number; passed: boolean; pct: number; catScores: Record<string, CatScore> },
  locale: EmailLocale,
  unsubscribeUrl = '',
): string {
  const { needed, above } = delta(data.pct);

  const passGradient = data.passed
    ? 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)'
    : 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)';
  const passText = data.passed ? '✓ Geslaagd' : '✗ Nog niet geslaagd';

  // Personalised insight copy
  let insightBadge: string;
  let insightSub: string;
  if (data.pct >= 80) {
    insightBadge = `${above} vragen boven de grens`;
    insightSub = 'Je bent uitstekend voorbereid. Nog één oefenronde en je gaat er zeker doorheen.';
  } else if (data.passed) {
    insightBadge = `${above} ${above === 1 ? 'vraag' : 'vragen'} boven de slagingsgrens`;
    insightSub = 'Je haalt het nét. Oefen nog een keer om meer marge te krijgen op de echte examendag.';
  } else if (needed <= 5) {
    insightBadge = `Nog maar ${needed} ${needed === 1 ? 'vraag' : 'vragen'} te gaan`;
    insightSub = 'Je bent er bijna. Een paar gerichte oefensessies zijn genoeg om de slagingsgrens te halen.';
  } else {
    insightBadge = `${needed} meer vragen nodig`;
    insightSub = 'Focus op je zwakste onderwerpen hieronder. Studenten die twee extra proefexamens doen, stijgen gemiddeld 18%.';
  }

  // Top 2 weak study actions
  const sorted = Object.entries(data.catScores)
    .map(([cat, sc]) => ({ cat, sc, pct: Math.round((sc.correct / sc.total) * 100) }))
    .sort((a, b) => a.pct - b.pct);
  const weak = sorted.filter(c => c.pct < 60);

  const topWeak = weak.slice(0, 2);
  const studyActions = topWeak.map(item => {
    const actionMap: Record<string, string> = {
      'Werk en Inkomen': 'Leer de regels rondom minimumloon, WW en bijstand.',
      'Wonen': 'Focus op huurrecht, sociale huurwoning en burenrecht.',
      'Onderwijs en Opvoeding': 'Bestudeer leerplicht, schooltypen en kinderopvang.',
      'Gezondheid en Gezondheidszorg': 'Leer het verschil tussen huisarts, specialist en zorgverzekering.',
      'Staatsinrichting en Rechtsstaat': 'Oefen vragen over gemeenteraad, coalitie en burgerrechten.',
      'Instanties': 'Ken de functies van UWV, DUO, Belastingdienst en gemeente.',
      'Geschiedenis en Geografie': 'Focus op WO II, 4 mei herdenking en koloniale geschiedenis.',
    };
    const tip = actionMap[item.cat] || 'Herhaal de lesstof voor dit onderwerp.';
    const icon = CAT_ICONS[item.cat] || '📖';
    return `
<div style="display:flex;gap:14px;align-items:flex-start;padding:14px 0;border-bottom:1px solid #f2f4f6;">
  <div style="width:36px;height:36px;border-radius:10px;background:#fef2f2;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;line-height:36px;text-align:center;">${icon}</div>
  <div>
    <p style="margin:0 0 3px;font-size:13px;font-weight:700;color:#191c1e;">${item.cat} <span style="color:#dc2626;font-size:12px;font-weight:600;">(${item.pct}%)</span></p>
    <p style="margin:0;font-size:13px;color:#434651;line-height:1.5;">${tip}</p>
  </div>
</div>`;
  }).join('');

  const body = `
<!-- HERO: gradient + big score number -->
<div style="background:linear-gradient(160deg,#001040 0%,#002b6d 45%,#0f4299 100%);padding:44px 40px 48px;text-align:center;position:relative;overflow:hidden;">
  <!-- Radial glow -->
  <div style="position:absolute;top:-40px;left:50%;transform:translateX(-50%);width:320px;height:200px;background:radial-gradient(ellipse,rgba(254,118,44,0.18) 0%,transparent 70%);pointer-events:none;"></div>
  <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1.2px;">KNM Proefexamen — Jouw resultaat</p>
  <!-- Big score number -->
  <div style="margin:20px 0 8px;">
    <span style="font-family:Manrope,-apple-system,Arial,sans-serif;font-size:96px;font-weight:800;color:#ffffff;line-height:1;letter-spacing:-4px;">${data.pct}</span><span style="font-family:Manrope,-apple-system,Arial,sans-serif;font-size:36px;font-weight:700;color:rgba(255,255,255,0.6);letter-spacing:-1px;">%</span>
  </div>
  <!-- Pass / fail pill -->
  <div style="display:inline-block;background:${data.passed ? 'rgba(22,163,74,0.25)' : 'rgba(220,38,38,0.25)'};border:1px solid ${data.passed ? 'rgba(22,163,74,0.5)' : 'rgba(220,38,38,0.5)'};color:${data.passed ? '#6ee7b7' : '#fca5a5'};font-size:13px;font-weight:700;padding:6px 18px;border-radius:99px;margin-bottom:16px;">${passText}</div>
  <!-- Score vs threshold bar -->
  <div style="max-width:280px;margin:20px auto 0;">
    <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
      <span style="font-size:11px;color:rgba(255,255,255,0.5);">0%</span>
      <span style="font-size:11px;color:rgba(255,255,255,0.5);">Slagingsgrens 60%</span>
      <span style="font-size:11px;color:rgba(255,255,255,0.5);">100%</span>
    </div>
    <div style="background:rgba(255,255,255,0.12);border-radius:99px;height:8px;position:relative;overflow:visible;">
      <!-- fill -->
      <div style="background:${data.passed ? 'linear-gradient(90deg,#34d399,#10b981)' : 'linear-gradient(90deg,#f87171,#ef4444)'};width:${data.pct}%;height:8px;border-radius:99px;"></div>
      <!-- threshold marker -->
      <div style="position:absolute;top:-3px;left:60%;width:2px;height:14px;background:#fe762c;border-radius:2px;"></div>
    </div>
    <div style="margin-top:10px;">
      <span style="display:inline-block;background:rgba(254,118,44,0.15);border:1px solid rgba(254,118,44,0.35);color:#fdba74;font-size:11px;font-weight:700;padding:4px 12px;border-radius:6px;">${insightBadge}</span>
    </div>
    <p style="margin:10px 0 0;font-size:13px;color:rgba(255,255,255,0.55);line-height:1.6;">${insightSub}</p>
  </div>
</div>

<!-- BREAKDOWN: card grid -->
<div style="padding:24px 32px 20px;">
  <p style="font-size:11px;font-weight:700;color:#fe762c;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">Score per onderwerp</p>
  ${topicCardGrid(data.catScores)}
</div>

${topWeak.length > 0 ? `
<!-- STUDY ACTIONS: only top 2 weak areas -->
<div style="background:#fafafa;border-top:1px solid #f2f4f6;padding:28px 40px;">
  <p style="font-size:11px;font-weight:700;color:#fe762c;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Jouw studeertips</p>
  <p style="font-family:Manrope,-apple-system,Arial,sans-serif;font-size:17px;font-weight:800;color:#191c1e;margin:0 0 20px;">Zo haal je meer punten</p>
  ${studyActions}
</div>` : ''}

<!-- UPSELL -->
<div style="padding:32px 40px;background:#f8f9fb;border-top:1px solid #f0f2f5;">
  <p style="font-size:11px;font-weight:700;color:#fe762c;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Klaar voor de volgende stap?</p>
  <p style="font-family:Manrope,-apple-system,Arial,sans-serif;font-size:17px;font-weight:800;color:#191c1e;margin:0 0 8px;">9 meer proefexamens wachten op je</p>
  <p style="font-size:14px;color:#434651;line-height:1.65;margin:0 0 24px;">Gevalideerde vragen van een gecertificeerde docent. Directe feedback per vraag. Eenmalig — geen abonnement.</p>
  ${packageCards(locale)}
  ${paymentBadges(locale)}
  <p style="font-size:11px;color:#9CA3AF;text-align:center;margin-top:10px;">🔒 Veilig betalen · Directe toegang na betaling</p>
</div>`;

  return renderEmail({ locale, title: 'Jouw KNM Proefexamen Resultaat', bodyHtml: body, unsubscribeUrl });
}

export function resultsSubjectA(pct: number, passed: boolean): string {
  return passed
    ? `✓ Geslaagd! Je scoorde ${pct}% — jouw volledige analyse`
    : `Je scoorde ${pct}% — hier is precies wat je nog moet verbeteren`;
}
