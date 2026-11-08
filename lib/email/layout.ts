import { type EmailLocale, dir, t } from './i18n';

/**
 * Glas v1.0 (docs/design/DESIGN_SYSTEM.md), vertaald naar wat een mailprogramma kan.
 *
 * Drie dingen kunnen niet en hebben een vaste vervanging:
 * - **Geen echt glas.** Gmail en Outlook negeren `backdrop-filter`; de terugval uit de spec is 92%
 *   wit, dus "glas" is hier een witte kaart op mist.
 * - **Een veld is een effen kleur met een verloop erover.** Outlook toont alleen de
 *   `background-color`; die is daarom een lichte mist, zodat de navy tekst overal leesbaar blijft.
 * - **Geen SVG.** Gmail haalt inline `<svg>` weg. Scores en vinkjes zijn tabelcellen en tekst.
 *
 * Het veld bovenaan is **Dageraad** (besluit eigenaar, 08-11-2026, gekozen uit drie richtingen):
 * van bijna-wit naar hemelblauw, met één zachte perzik-gloed aan de horizon. Die gloed ís het
 * oranje van de mail (G1.3, één gloed per view), dus elke knop is navy. Het enige andere oranje is
 * het streepje op de 60%-grens van de score, dat de spec zelf voorschrijft.
 */
const BRAND_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&family=Public+Sans:wght@400;600;700&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#eef2f8; font-family:'Public Sans',-apple-system,'Helvetica Neue',Arial,sans-serif; -webkit-text-size-adjust:100%; color:#191c1e; }
  a { color:#002b6d; text-underline-offset:3px; }
  .ew { background:#eef2f8; padding:32px 16px 40px; }
  .ec { max-width:600px; margin:0 auto; background:#ffffff; border-radius:28px; overflow:hidden; box-shadow:0 24px 48px -24px rgba(0,43,109,0.22),0 2px 6px rgba(0,43,109,0.05); }

  /* Het veld: kop + hero lopen als één Dageraad-vlak in elkaar over. De tekst staat bovenin, op
     het lichte deel; de gloed zit onder de laatste regel (G1.6: leesbaarheid gaat voor sfeer). */
  .eh { background-color:#f7f9fd; padding:28px 40px 24px; }
  .logo-txt { font-family:Manrope,-apple-system,Arial,sans-serif; color:#002b6d; font-size:17px; font-weight:800; letter-spacing:-0.4px; text-decoration:none; }
  .logo-tag { display:block; color:#5b6070; font-size:12px; margin-top:3px; }
  .hero { margin-top:-1px; background-color:#e8eef8; background-image:radial-gradient(ellipse 70% 45% at 50% 112%,rgba(255,183,140,0.95) 0%,rgba(255,214,186,0.55) 45%,rgba(255,232,214,0) 100%),linear-gradient(180deg,#f7f9fd 0%,#e8eef8 45%,#c9d6f2 100%); padding:12px 40px 60px; }
  .chip-d { display:inline-block; background:#fcecdd; color:#a24000; font-size:12px; font-weight:700; letter-spacing:0.2px; border-radius:999px; padding:5px 12px; margin-bottom:18px; }
  .hero-h1 { font-family:Manrope,-apple-system,Arial,sans-serif; color:#002b6d; font-size:32px; font-weight:800; line-height:1.15; margin-bottom:16px; letter-spacing:-1.2px; }
  .hero-sub { color:#434651; font-size:16px; line-height:1.7; }
  .hero-greet { color:#1d428a; font-size:15px; font-weight:600; margin-bottom:10px; }

  /* Wit staat: secties op de kaart */
  .sec { padding:36px 40px; }
  .chip { display:inline-block; background:#fcecdd; color:#a24000; font-size:12px; font-weight:700; letter-spacing:0.2px; border-radius:999px; padding:4px 12px; margin-bottom:14px; }
  .sec-title { font-family:Manrope,-apple-system,Arial,sans-serif; font-size:22px; font-weight:800; color:#002b6d; margin-bottom:12px; line-height:1.25; letter-spacing:-0.6px; }
  .sec-body { font-size:16px; color:#434651; line-height:1.7; }
  .small { font-size:13px; color:#5b6070; line-height:1.6; }
  .sign { font-family:Manrope,-apple-system,Arial,sans-serif; font-weight:800; color:#002b6d; font-size:15px; margin-top:14px; }

  /* Een sectie-tier zonder lijnen: mist als vlak binnen de kaart */
  .tier { background:#eef2f8; }
  .panel { background:#eef2f8; border-radius:22px; padding:28px; }
  .panel-tip { background:#fcecdd; border-radius:22px; padding:24px 28px; }

  /* Knoppen zijn pillen */
  .btn, .btn-w { display:inline-block; text-decoration:none !important; text-align:center; border-radius:999px; padding:15px 30px; font-size:16px; font-weight:700; font-family:Manrope,-apple-system,Arial,sans-serif; letter-spacing:-0.2px; }
  .btn { background:#002b6d; color:#ffffff !important; box-shadow:0 8px 18px -8px rgba(0,43,109,0.55); }
  .btn-w { background:#ffffff; color:#002b6d !important; box-shadow:inset 0 0 0 1.5px #002b6d; }
  .btn:hover { background:#1d428a; }

  /* Vinkjes: groen in een rondje (G3), tekst in plaats van SVG */
  .ck { display:inline-block; width:22px; height:22px; line-height:22px; border-radius:999px; background:#e2f1e9; color:#2b7a5c; font-size:12px; font-weight:800; text-align:center; }
  .ck-d { background:rgba(255,255,255,0.14); color:#ffffff; }
  .li { font-size:15px; color:#434651; line-height:1.6; }

  /* Betaalmerken onder de knop */
  .pay-badges { margin-top:14px; }
  .pay-badge { display:inline-block; background:#eef2f8; border-radius:8px; padding:5px 10px; font-size:11px; font-weight:700; color:#434651; margin:0 3px; }

  /* Voet: op de mist, buiten de kaart */
  .ef { max-width:600px; margin:0 auto; padding:24px 40px 0; text-align:center; }
  .ef p { font-size:12px; color:#5b6070; line-height:1.8; }
  .ef a { color:#5b6070; }

  @media only screen and (max-width:480px) {
    .ew { padding:16px 10px 28px !important; }
    .ec { border-radius:22px !important; }
    .eh,.hero,.sec,.ef { padding-left:24px !important; padding-right:24px !important; }
    .panel,.panel-tip { padding:22px !important; }
    .hero-h1 { font-size:27px !important; letter-spacing:-0.9px !important; }
    .btn,.btn-w { display:block !important; }
    .pkg-cell { display:block !important; width:100% !important; padding:0 0 12px !important; }
  }
`;

export function renderEmail({
  locale,
  title,
  bodyHtml,
  unsubscribeUrl = '',
  isTransactional = false,
}: {
  locale: EmailLocale;
  title: string;
  bodyHtml: string;
  unsubscribeUrl?: string;
  isTransactional?: boolean;
}) {
  const strings = t[locale].common;
  const d = dir(locale);
  const footerExtra = isTransactional
    ? ''
    : unsubscribeUrl
    ? `<p><a href="${unsubscribeUrl}">${strings.unsubscribe}</a></p>`
    : '';

  return `<!DOCTYPE html>
<html lang="${locale}" dir="${d}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light only">
<title>${title}</title>
<style>${BRAND_CSS}</style>
</head>
<body>
<div class="ew" dir="${d}">
  <div class="ec">
    <div class="eh">
      <a href="https://inburgeringoefenen.nl" style="text-decoration:none;">
        <table cellpadding="0" cellspacing="0" border="0" dir="${d}"><tr>
          <td width="34" valign="middle">
            <img src="https://inburgeringoefenen.nl/images/logo-email.png" width="34" height="34" alt="Inburgering Oefenen"
              style="display:block;width:34px;height:34px;border:0;border-radius:8px;" />
          </td>
          <td valign="middle" style="padding-${d === 'rtl' ? 'right' : 'left'}:12px;">
            <span class="logo-txt">Inburgering Oefenen</span>
            <span class="logo-tag">${strings.tagline}</span>
          </td>
        </tr></table>
      </a>
    </div>
    ${bodyHtml}
  </div>
  <div class="ef">
    <p>${strings.copyright} · <a href="mailto:${strings.contact}">${strings.contact}</a></p>
    ${footerExtra}
  </div>
</div>
</body>
</html>`;
}
