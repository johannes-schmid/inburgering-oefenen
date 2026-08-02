/**
 * Email preview generator — renders all emails × 3 locales into a single HTML page.
 * Run: npx tsx scripts/preview-emails.mjs
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const load = (p) => import(path.join(ROOT, p));
const [day2, day2NoScore, day7, activation, upgrade, feedback, abandon, results] = await Promise.all([
  load('lib/email/templates/day2.ts'),
  load('lib/email/templates/day2NoScore.ts'),
  load('lib/email/templates/day7.ts'),
  load('lib/email/templates/activation.ts'),
  load('lib/email/templates/upgrade.ts'),
  load('lib/email/templates/feedback.ts'),
  load('lib/email/templates/abandon.ts'),
  load('lib/email/templates/results.ts'),
]);

const LOCALES = ['nl', 'en', 'ar'];
const UNSUB = 'https://inburgeringoefenen.nl/uitschrijven?email=preview%40test.com';

const CATS_PASS = {
  'Hoofdgedachte': { correct: 6, total: 7 },
  'Detail': { correct: 5, total: 8 },
  'Bedoeling van de schrijver': { correct: 4, total: 6 },
  'Woordbetekenis': { correct: 2, total: 4 },
};
const CATS_FAIL = {
  'Hoofdgedachte': { correct: 3, total: 7 },
  'Detail': { correct: 3, total: 8 },
  'Bedoeling van de schrijver': { correct: 2, total: 6 },
  'Woordbetekenis': { correct: 1, total: 4 },
};

const emails = [];

// ── RESULTS ──────────────────────────────────────────────────────────────────
emails.push({
  id: 'results-pass',
  group: '📧 Results',
  label: 'Results — Lezen, boven de oefengrens (68%)',
  html: results.resultsEmail({ score: 17, total: 25, passed: true, pct: 68, catScores: CATS_PASS, skill: 'lezen' }, 'nl', UNSUB, true),
});
emails.push({
  id: 'results-fail',
  group: '📧 Results',
  label: 'Results — Lezen, onder de oefengrens (36%)',
  html: results.resultsEmail({ score: 9, total: 25, passed: false, pct: 36, catScores: CATS_FAIL, skill: 'lezen' }, 'nl', UNSUB, true),
});

// ── ALL OTHER EMAILS × 3 LOCALES ─────────────────────────────────────────────
for (const locale of LOCALES) {
  emails.push({ id: `day2-${locale}`, group: `📧 Day-2 (${locale.toUpperCase()})`, label: `Day-2 with Score`, html: day2.day2Email({ pct: 68, score: 17, total: 25, passed: true, exam_name: 'Lezen — oefenexamen 1', catScores: CATS_PASS }, 'Fatima', locale, UNSUB) });
  emails.push({ id: `day2-noscore-${locale}`, group: `📧 Day-2 (${locale.toUpperCase()})`, label: `Day-2 No Score`, html: day2NoScore.day2NoScoreEmail('Mohammed', locale, UNSUB) });
  emails.push({ id: `day7-${locale}`, group: `📧 Day-7 (${locale.toUpperCase()})`, label: `Day-7 Urgency`, html: day7.day7Email('Ahmed', locale, UNSUB) });
  emails.push({ id: `activation-premium-${locale}`, group: `📧 Activation (${locale.toUpperCase()})`, label: `Activation — één onderdeel`, html: activation.activationEmail({ firstName: 'Sara', loginUrl: 'https://inburgeringoefenen.nl/login', plan: 'premium' }, locale) });
  emails.push({ id: `activation-compleet-${locale}`, group: `📧 Activation (${locale.toUpperCase()})`, label: `Activation — met Schrijven/Spreken`, html: activation.activationEmail({ firstName: 'Sara', loginUrl: 'https://inburgeringoefenen.nl/login', plan: 'premium_plus' }, locale) });
  emails.push({ id: `upgrade-${locale}`, group: `📧 Upgrade (${locale.toUpperCase()})`, label: `Upgrade Confirmation`, html: upgrade.upgradeEmail({ firstName: 'Yusuf', dashboardUrl: 'https://inburgeringoefenen.nl/dashboard' }, locale) });
  emails.push({ id: `feedback-${locale}`, group: `📧 Feedback (${locale.toUpperCase()})`, label: `Feedback +7d`, html: feedback.feedbackEmail({ firstName: 'Nadia' }, locale) });
  emails.push({ id: `abandon-${locale}`, group: `📧 Abandon ✨ (${locale.toUpperCase()})`, label: `Abandon Email`, html: abandon.abandonEmail('Khalid', locale, UNSUB) });
}

// ── BUILD PAGE ────────────────────────────────────────────────────────────────
const groups = [...new Set(emails.map(e => e.group))];

const sidebar = groups.map(g => {
  const items = emails.filter(e => e.group === g);
  return `<li class="group">
    <span class="group-label">${g}</span>
    <ul>${items.map(e => `<li><a href="#${e.id}">${e.label}</a></li>`).join('')}</ul>
  </li>`;
}).join('');

const sections = emails.map(e => `
<section id="${e.id}" class="email-section">
  <div class="email-meta">
    <div>
      <p class="group-tag">${e.group}</p>
      <h2>${e.label}</h2>
    </div>
    <div class="frame-controls">
      <button onclick="setWidth(this,'600px')" class="active">Desktop</button>
      <button onclick="setWidth(this,'390px')">Mobile</button>
    </div>
  </div>
  <div class="frame-wrap" style="width:600px;">
    <iframe srcdoc="${e.html.replace(/"/g, '&quot;').replace(/\n/g, ' ')}" frameborder="0" scrolling="no" onload="resizeIframe(this)"></iframe>
  </div>
</section>`).join('');

const page = `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Email Preview — Inburgering Oefenen</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:-apple-system,Arial,sans-serif;background:#f0f2f5;color:#191c1e;}
  .sidebar{position:fixed;top:0;left:0;bottom:0;width:260px;background:#001040;overflow-y:auto;z-index:10;}
  .sidebar-header{padding:18px 20px;border-bottom:1px solid rgba(255,255,255,0.08);}
  .sidebar-header h1{font-size:13px;font-weight:800;color:#fff;letter-spacing:-0.2px;}
  .sidebar-header p{font-size:11px;color:rgba(255,255,255,0.35);margin-top:2px;}
  .sidebar ul{list-style:none;}
  li.group{margin-top:6px;}
  .group-label{display:block;padding:8px 20px 4px;font-size:10px;font-weight:700;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.8px;}
  li.group ul li a{display:block;padding:6px 20px 6px 28px;font-size:12px;color:rgba(255,255,255,0.55);text-decoration:none;border-left:2px solid transparent;transition:all .1s;}
  li.group ul li a:hover,li.group ul li a.active{color:#fff;border-left-color:#fe762c;background:rgba(255,255,255,0.05);}
  .main{margin-left:260px;padding:32px 40px;}
  .page-header{margin-bottom:32px;}
  .page-header h1{font-size:20px;font-weight:800;color:#002b6d;}
  .page-header p{font-size:13px;color:#747782;margin-top:4px;}
  .email-section{margin-bottom:56px;scroll-margin-top:20px;}
  .email-meta{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;gap:16px;}
  .group-tag{font-size:10px;font-weight:700;color:#fe762c;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:4px;}
  .email-meta h2{font-size:16px;font-weight:700;color:#191c1e;}
  .frame-controls{display:flex;gap:6px;flex-shrink:0;}
  .frame-controls button{padding:6px 14px;border-radius:6px;border:1.5px solid #e0e3e5;background:#fff;font-size:12px;font-weight:600;color:#434651;cursor:pointer;}
  .frame-controls button.active{border-color:#002b6d;color:#002b6d;background:#002b6d10;}
  .frame-wrap{background:#e4e7eb;border-radius:12px;padding:20px;transition:width .2s;min-height:100px;}
  .frame-wrap iframe{width:100%;border:none;display:block;border-radius:4px;}
</style>
</head>
<body>
<nav class="sidebar">
  <div class="sidebar-header">
    <h1>📧 Email Preview</h1>
    <p>${emails.length} emails total</p>
  </div>
  <ul>${sidebar}</ul>
</nav>
<main class="main">
  <div class="page-header">
    <h1>Inburgering Oefenen — Email Preview</h1>
    <p>Results options A & B at the top · All ${emails.length} emails below · Toggle mobile/desktop per email</p>
  </div>
  ${sections}
</main>
<script>
function resizeIframe(f){f.style.height=(f.contentWindow.document.documentElement.scrollHeight+10)+'px';}
function setWidth(btn,w){
  const wrap=btn.closest('.email-section').querySelector('.frame-wrap');
  wrap.style.width=w;
  btn.closest('.frame-controls').querySelectorAll('button').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  wrap.querySelector('iframe').onload=function(){resizeIframe(this)};
}
const links=[...document.querySelectorAll('.sidebar a')];
const secs=[...document.querySelectorAll('.email-section')];
window.addEventListener('scroll',()=>{
  let cur='';
  secs.forEach(s=>{if(window.scrollY>=s.offsetTop-60)cur=s.id;});
  links.forEach(l=>l.classList.toggle('active',l.getAttribute('href')==='#'+cur));
},{passive:true});
</script>
</body>
</html>`;

const outPath = '/tmp/inburgering-email-preview.html';
fs.writeFileSync(outPath, page, 'utf-8');
console.log(`\n✅ ${emails.length} emails → ${outPath}`);
execSync(`open -a "Google Chrome" "${outPath}"`);
