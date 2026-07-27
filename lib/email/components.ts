import { type EmailLocale, t, dir } from './i18n';

export function packageCards(locale: EmailLocale, activateUrl = 'https://inburgeringoefenen.nl/activate'): string {
  const s = t[locale].common;
  const proFeatures = s.proFeatures.map(f => `<p class="pkg-feat">${f}</p>`).join('');
  const compleetFeatures = s.compleetFeatures.map(f => `<p class="pkg-feat">${f}</p>`).join('');
  return `
<table class="pkg-grid" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td class="pkg-cell" style="padding-right:8px;">
      <div class="pkg-pro">
        <p class="pkg-name">${s.proTitle}</p>
        <p class="pkg-price">${s.proPrice}</p>
        <p class="pkg-note">${s.oneTime}</p>
        ${proFeatures}
        <a href="${activateUrl}?plan=premium" class="pkg-btn pkg-btn-pro">${s.proTitle} →</a>
      </div>
    </td>
    <td class="pkg-cell" style="padding-left:8px;">
      <div class="pkg-compleet">
        <span class="pkg-badge">${s.mostChosen}</span>
        <p class="pkg-name">${s.compleetTitle}</p>
        <p class="pkg-price">${s.compleetPrice}</p>
        <p class="pkg-note">${s.oneTime}</p>
        ${compleetFeatures}
        <a href="${activateUrl}?plan=premium_plus" class="pkg-btn pkg-btn-compleet">${s.compleetTitle} →</a>
      </div>
    </td>
  </tr>
</table>`;
}

export function paymentBadges(locale: EmailLocale): string {
  const badges = t[locale].common.payBadges;
  return `<div class="pay-badges">${badges.map(b => `<span class="pay-badge">${b}</span>`).join('')}</div>`;
}

export function featureListDark(items: string[]): string {
  return items.map(i => `<p class="feat-li">${i}</p>`).join('');
}

export function wcStatsRow(locale: EmailLocale): string {
  const s = t[locale].common.wcStats;
  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
  <tr>
    <td align="center" style="padding:12px 0;">
      <div style="font-family:Manrope,-apple-system,Arial,sans-serif;font-size:24px;font-weight:800;color:#fe762c;">${s.cards}</div>
      <div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:2px;">${s.cardLabel}</div>
    </td>
    <td align="center" style="padding:12px 0;border-left:1px solid rgba(255,255,255,0.1);">
      <div style="font-family:Manrope,-apple-system,Arial,sans-serif;font-size:24px;font-weight:800;color:#fe762c;">${s.themes}</div>
      <div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:2px;">${s.themeLabel}</div>
    </td>
    <td align="center" style="padding:12px 0;border-left:1px solid rgba(255,255,255,0.1);">
      <div style="font-family:Manrope,-apple-system,Arial,sans-serif;font-size:24px;font-weight:800;color:#fe762c;">${s.trans}</div>
      <div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:2px;">${s.transLabel}</div>
    </td>
  </tr>
</table>`;
}

/**
 * Two completely separate benefit sections stacked vertically.
 * Section 1: Woordkaarten — flashcard preview + stats
 * Section 2: Leren modules — audio player preview + topic chips
 */
export function featureDuo(locale: EmailLocale = 'nl'): string {
  const s = t[locale].common.featureDuo;
  const rtl = dir(locale) === 'rtl';
  // topics array: [icon, label, icon, label, ...]
  const tp = s.topics;
  function chip(icon: string, label: string): string {
    return `<td align="center">
  <div style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);border-radius:7px;padding:7px 4px;text-align:center;">
    <div style="font-size:14px;line-height:1;margin-bottom:3px;">${icon}</div>
    <div style="font-size:9px;font-weight:700;color:rgba(255,255,255,0.6);">${label}</div>
  </div>
</td>`;
  }
  return `
<!-- ── BENEFIT 1: Woordkaarten ── -->
<div style="padding:28px 32px 24px;" dir="${dir(locale)}">
  <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#fe762c;text-transform:uppercase;letter-spacing:1px;">${s.wcLabel}</p>
  <p style="font-family:Manrope,-apple-system,Arial,sans-serif;font-size:18px;font-weight:800;color:#191c1e;margin:0 0 6px;letter-spacing:-0.3px;line-height:1.3;">${s.wcHeading}</p>
  <p style="font-size:13px;color:#434651;line-height:1.6;margin:0 0 16px;">${s.wcDesc}</p>
  <div style="background:linear-gradient(160deg,#001040 0%,#002b6d 55%,#0f3a8a 100%);border-radius:12px;padding:18px;">
    <div style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:14px;margin-bottom:14px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
        <tr>
          <td style="font-size:9px;font-weight:700;color:#fe762c;text-transform:uppercase;letter-spacing:0.6px;">${s.wcTheme}</td>
          <td align="${rtl ? 'left' : 'right'}" style="font-size:9px;color:rgba(255,255,255,0.35);">${s.wcCard}</td>
        </tr>
      </table>
      <p style="font-family:Manrope,-apple-system,Arial,sans-serif;font-size:16px;font-weight:800;color:#fff;margin:0 0 10px;letter-spacing:-0.2px;">${s.wcTerm}</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td width="49%"><div style="background:rgba(255,255,255,0.08);border-radius:5px;padding:5px 8px;">
          <p style="margin:0 0 2px;font-size:8px;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;">EN</p>
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.75);">${s.wcTermEn}</p>
        </div></td>
        <td width="2%" style="font-size:0;"> </td>
        <td width="49%"><div style="background:rgba(255,255,255,0.08);border-radius:5px;padding:5px 8px;">
          <p style="margin:0 0 2px;font-size:8px;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;">AR</p>
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.75);direction:rtl;">${s.wcTermAr}</p>
        </div></td>
      </tr></table>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td align="center" style="border-right:1px solid rgba(255,255,255,0.1);padding:8px 0;">
        <p style="margin:0;font-size:20px;font-weight:800;color:#fe762c;font-family:Manrope,-apple-system,Arial,sans-serif;line-height:1;">${s.wcStats[0]}</p>
        <p style="margin:3px 0 0;font-size:9px;color:rgba(255,255,255,0.4);">${s.wcStats[1]}</p>
      </td>
      <td align="center" style="border-right:1px solid rgba(255,255,255,0.1);padding:8px 0;">
        <p style="margin:0;font-size:20px;font-weight:800;color:#fe762c;font-family:Manrope,-apple-system,Arial,sans-serif;line-height:1;">${s.wcStats[2]}</p>
        <p style="margin:3px 0 0;font-size:9px;color:rgba(255,255,255,0.4);">${s.wcStats[3]}</p>
      </td>
      <td align="center" style="padding:8px 0;">
        <p style="margin:0;font-size:20px;font-weight:800;color:#fe762c;font-family:Manrope,-apple-system,Arial,sans-serif;line-height:1;">${s.wcStats[4]}</p>
        <p style="margin:3px 0 0;font-size:9px;color:rgba(255,255,255,0.4);">${s.wcStats[5]}</p>
      </td>
    </tr></table>
  </div>
</div>

<div style="height:1px;background:#f0f2f5;margin:0 32px;"></div>

<!-- ── BENEFIT 2: Leren modules ── -->
<div style="padding:28px 32px 24px;" dir="${dir(locale)}">
  <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#fe762c;text-transform:uppercase;letter-spacing:1px;">${s.audioLabel}</p>
  <p style="font-family:Manrope,-apple-system,Arial,sans-serif;font-size:18px;font-weight:800;color:#191c1e;margin:0 0 6px;letter-spacing:-0.3px;line-height:1.3;">${s.audioHeading}</p>
  <p style="font-size:13px;color:#434651;line-height:1.6;margin:0 0 16px;">${s.audioDesc}</p>
  <div style="background:linear-gradient(160deg,#001040 0%,#002b6d 55%,#0f3a8a 100%);border-radius:12px;padding:18px;">
    <div style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:12px 14px;margin-bottom:14px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td width="36" valign="middle">
          <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#fe762c,#d94f00);text-align:center;line-height:36px;font-size:13px;color:#fff;padding-left:3px;">▶</div>
        </td>
        <td style="padding-left:12px;" valign="middle">
          <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:#fff;font-family:Manrope,-apple-system,Arial,sans-serif;">${s.audioTitle}</p>
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.4);">${s.audioSub}</p>
        </td>
        <td align="right" valign="middle"><span style="font-size:12px;font-weight:700;color:rgba(255,255,255,0.4);font-family:Manrope,-apple-system,Arial,sans-serif;">${s.audioDur}</span></td>
      </tr></table>
      <div style="background:rgba(255,255,255,0.12);border-radius:99px;height:3px;margin-top:10px;"></div>
      <p style="margin:6px 0 0;font-size:10px;color:rgba(255,255,255,0.25);">${s.audioHint}</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        ${chip(tp[0], tp[1])}
        ${chip(tp[2], tp[3])}
        ${chip(tp[4], tp[5])}
        ${chip(tp[6], tp[7])}
      </tr>
      <tr><td colspan="4" style="height:6px;font-size:0;"> </td></tr>
      <tr>
        ${chip(tp[8], tp[9])}
        ${chip(tp[10], tp[11])}
        ${chip(tp[12], tp[13])}
        <td></td>
      </tr>
    </table>
  </div>
</div>`;
}

export function flashcardMockup(): string {
  return `
<div style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:10px;padding:18px 20px;margin-bottom:20px;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
    <tr>
      <td style="font-size:10px;font-weight:700;color:#fe762c;text-transform:uppercase;letter-spacing:0.8px;">Staatsinrichting</td>
      <td align="right" style="font-size:10px;color:rgba(255,255,255,0.4);">Kaart 7 van 42</td>
    </tr>
  </table>
  <div style="font-family:Manrope,-apple-system,Arial,sans-serif;font-size:18px;font-weight:800;color:#ffffff;margin:12px 0 14px;letter-spacing:-0.3px;">inburgeringsplicht</div>
  <div>
    <span style="display:inline-block;background:rgba(255,255,255,0.1);border-radius:4px;padding:4px 10px;font-size:11px;color:rgba(255,255,255,0.7);margin-right:6px;margin-bottom:4px;vertical-align:top;"><strong style="color:rgba(255,255,255,0.45);font-size:9px;font-weight:700;text-transform:uppercase;display:block;margin-bottom:1px;">EN</strong>civic integration obligation</span><!--
    --><span style="display:inline-block;background:rgba(255,255,255,0.1);border-radius:4px;padding:4px 10px;font-size:11px;color:rgba(255,255,255,0.7);margin-right:6px;margin-bottom:4px;vertical-align:top;"><strong style="color:rgba(255,255,255,0.45);font-size:9px;font-weight:700;text-transform:uppercase;display:block;margin-bottom:1px;">AR</strong>التزام الاندماج المدني</span>
  </div>
</div>`;
}

type CatScore = { correct: number; total: number };

const CAT_EMOJI: Record<string, string> = {
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

/**
 * Compact 2-col topic card grid — styled like the reference screenshot but tighter.
 * Blue header band with % pill + emoji icon, white body with name, slim bar, score.
 */
export function topicCardGrid(catScores: Record<string, CatScore>): string {
  const entries = Object.entries(catScores).map(([cat, sc]) => {
    const pct = Math.round((sc.correct / sc.total) * 100);
    const passed = pct >= 60;
    const barColor  = passed ? '#16a34a' : '#fe762c';
    const pillBg    = passed ? '#16a34a' : '#fe762c';
    const pillText  = passed ? `✓ ${pct}%` : `${pct}%`;
    const icon      = CAT_EMOJI[cat] || '📖';
    return { cat, sc, pct, passed, barColor, pillBg, pillText, icon };
  });

  // Pair into rows of 2
  const rows: typeof entries[] = [];
  for (let i = 0; i < entries.length; i += 2) rows.push(entries.slice(i, i + 2));

  function card(e: typeof entries[0], last = false): string {
    return `
<td width="50%" valign="top" style="padding:${last ? '0' : '0 0 8px 0'};">
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
    style="border-radius:8px;overflow:hidden;border:1px solid #e0e3e5;background:#fff;">
    <!-- Header band -->
    <tr>
      <td style="background:#002b6d;padding:7px 10px 7px 10px;border-radius:8px 8px 0 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
              <span style="display:inline-block;background:${e.pillBg};color:#fff;font-size:10px;font-weight:800;padding:2px 7px;border-radius:99px;letter-spacing:0.2px;">${e.pillText}</span>
            </td>
            <td align="right" style="font-size:16px;opacity:0.25;line-height:1;">${e.icon}</td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Body -->
    <tr>
      <td style="padding:8px 10px 9px;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#191c1e;line-height:1.3;">${e.cat}</p>
        <div style="background:#e9ecef;border-radius:99px;height:4px;overflow:hidden;margin-bottom:5px;">
          <div style="background:${e.barColor};width:${Math.max(4, e.pct)}%;height:4px;border-radius:99px;"></div>
        </div>
        <p style="margin:0;font-size:11px;color:#747782;">${e.sc.correct} / ${e.sc.total} goed</p>
      </td>
    </tr>
  </table>
</td>`;
  }

  const rowHtml = rows.map((row, ri) => {
    const isLast = ri === rows.length - 1;
    const left  = card(row[0], isLast);
    const right = row[1]
      ? card(row[1], isLast)
      : `<td width="50%" style="padding-left:4px;"></td>`;
    return `<tr>${left}<td width="8" style="font-size:0;line-height:0;">&nbsp;</td>${right}</tr>`;
  }).join('');

  return `<table width="100%" cellpadding="0" cellspacing="0" border="0">${rowHtml}</table>`;
}

export function svgScoreRing(pct: number, score: number, total: number): string {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (pct / 100) * circumference;
  const ringColor = pct >= 80 ? '#16a34a' : pct >= 60 ? '#fe762c' : '#dc2626';
  return `
<div style="text-align:center;margin-bottom:24px;">
  <svg width="140" height="140" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
    <circle cx="70" cy="70" r="${radius}" fill="none" stroke="#e0e3e5" stroke-width="12"/>
    <circle cx="70" cy="70" r="${radius}" fill="none" stroke="${ringColor}" stroke-width="12"
      stroke-dasharray="${circumference.toFixed(2)}" stroke-dashoffset="${dashOffset.toFixed(2)}"
      stroke-linecap="round" transform="rotate(-90 70 70)"/>
    <text x="70" y="62" text-anchor="middle" font-size="28" font-weight="800" fill="${ringColor}" font-family="Manrope,Arial,sans-serif">${pct}%</text>
    <text x="70" y="82" text-anchor="middle" font-size="13" fill="#747782" font-family="Arial,sans-serif">${score} / ${total}</text>
  </svg>
</div>`;
}
