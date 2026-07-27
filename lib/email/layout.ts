import { type EmailLocale, dir, t } from './i18n';

const BRAND_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@700;800&family=Public+Sans:wght@400;600;700&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#f2f4f6; font-family:'Public Sans',-apple-system,'Helvetica Neue',Arial,sans-serif; -webkit-text-size-adjust:100%; color:#191c1e; }
  .ew { background:#f2f4f6; padding:32px 16px; }
  .ec { max-width:600px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 2px 32px rgba(0,43,109,0.08),0 1px 4px rgba(0,43,109,0.04); }
  /* Header */
  .eh { background:#002b6d; padding:28px 40px; }
  .logo-wrap { display:inline-block; text-decoration:none; }
  .logo-bar { display:inline-block; width:4px; height:20px; background:#fe762c; border-radius:3px; vertical-align:middle; margin-right:9px; }
  .logo-txt { font-family:Manrope,-apple-system,Arial,sans-serif; color:#ffffff; font-size:19px; font-weight:800; letter-spacing:-0.4px; vertical-align:middle; text-decoration:none; }
  .logo-tag { color:rgba(255,255,255,0.45); font-size:11px; margin-top:5px; letter-spacing:0.2px; }
  /* Hero band */
  .hero { background:#002b6d; padding:36px 40px 40px; border-bottom:3px solid #fe762c; }
  .hero-eyebrow { font-size:11px; font-weight:700; color:#fe762c; text-transform:uppercase; letter-spacing:1.2px; margin-bottom:12px; }
  .hero-h1 { font-family:Manrope,-apple-system,Arial,sans-serif; color:#ffffff; font-size:26px; font-weight:800; line-height:1.25; margin-bottom:14px; letter-spacing:-0.5px; }
  .hero-sub { color:rgba(255,255,255,0.65); font-size:15px; line-height:1.7; }
  .hero-greet { color:rgba(255,255,255,0.7); font-size:14px; margin-bottom:8px; }
  /* Section */
  .sec { padding:32px 40px; }
  .sec-label { font-size:11px; font-weight:700; color:#fe762c; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; }
  .sec-title { font-family:Manrope,-apple-system,Arial,sans-serif; font-size:20px; font-weight:800; color:#191c1e; margin-bottom:12px; line-height:1.3; letter-spacing:-0.3px; }
  .sec-body { font-size:15px; color:#434651; line-height:1.75; }
  /* Button */
  .btn { display:block; background:linear-gradient(135deg,#fe762c 0%,#d94f00 100%); color:#ffffff !important; text-decoration:none; text-align:center; border-radius:10px; padding:16px 28px; font-size:16px; font-weight:700; font-family:Manrope,-apple-system,Arial,sans-serif; letter-spacing:-0.2px; box-shadow:inset 0 1px 0 rgba(255,255,255,0.12),0 4px 14px rgba(254,118,44,0.35); }
  .btn-outline { display:block; background:transparent; color:#ffffff !important; text-decoration:none; text-align:center; border-radius:10px; padding:14px 28px; font-size:15px; font-weight:700; border:2px solid rgba(255,255,255,0.4); }
  /* Feature block (dark) */
  .feat { background:#002b6d; border-radius:12px; padding:28px; margin-top:24px; }
  .feat-badge { display:inline-block; background:rgba(254,118,44,0.15); border:1px solid rgba(254,118,44,0.35); color:#fe762c; font-size:11px; font-weight:700; letter-spacing:0.8px; text-transform:uppercase; border-radius:4px; padding:3px 10px; margin-bottom:14px; }
  .feat-title { font-family:Manrope,-apple-system,Arial,sans-serif; color:#ffffff; font-size:18px; font-weight:800; margin-bottom:8px; }
  .feat-sub { color:rgba(255,255,255,0.65); font-size:14px; line-height:1.6; margin-bottom:20px; }
  .feat-li { color:rgba(255,255,255,0.8); font-size:14px; line-height:1.6; padding:4px 0; }
  .feat-li::before { content:"✓ "; color:#fe762c; font-weight:700; }
  /* Score card */
  .score-card { background:#ffffff; border:1.5px solid #e0e3e5; border-radius:12px; padding:24px; box-shadow:0 1px 4px rgba(0,43,109,0.04); }
  /* Package cards */
  .pkg-grid { display:table; width:100%; border-collapse:separate; border-spacing:12px; margin-top:20px; }
  .pkg-cell { display:table-cell; width:50%; vertical-align:top; }
  .pkg-pro { background:#fff; border:1.5px solid #e0e3e5; border-radius:14px; padding:24px; }
  .pkg-compleet { background:#fff; border:2px solid #fe762c; border-radius:14px; padding:24px; box-shadow:0 4px 16px rgba(254,118,44,0.14); }
  .pkg-badge { display:inline-block; background:linear-gradient(135deg,#fe762c,#d94f00); color:#fff; font-size:9px; font-weight:700; letter-spacing:0.8px; text-transform:uppercase; border-radius:20px; padding:3px 10px; margin-bottom:10px; }
  .pkg-name { font-family:Manrope,-apple-system,Arial,sans-serif; font-size:15px; font-weight:800; color:#191c1e; margin-bottom:4px; }
  .pkg-price { font-family:Manrope,-apple-system,Arial,sans-serif; font-size:26px; font-weight:800; color:#002b6d; letter-spacing:-1px; margin:8px 0 4px; }
  .pkg-note { font-size:10px; color:#747782; margin-bottom:12px; }
  .pkg-feat { font-size:12px; color:#434651; line-height:1.6; padding:3px 0; }
  .pkg-feat::before { content:"✓ "; color:#10b981; font-weight:700; }
  .pkg-btn { display:block; text-decoration:none; text-align:center; border-radius:8px; padding:12px 16px; font-size:13px; font-weight:700; margin-top:16px; }
  .pkg-btn-pro { color:#002b6d; border:1.5px solid #002b6d; background:#fff; }
  .pkg-btn-compleet { color:#fff; background:linear-gradient(135deg,#fe762c,#d94f00); box-shadow:0 2px 8px rgba(254,118,44,0.3); }
  /* Payment badges */
  .pay-badges { text-align:center; margin-top:14px; }
  .pay-badge { display:inline-block; background:#f2f4f6; border:1px solid #e0e3e5; border-radius:4px; padding:4px 10px; font-size:10px; font-weight:700; color:#747782; margin:0 4px; text-transform:uppercase; }
  /* Divider */
  .div { height:1px; background:#f2f4f6; margin:0 40px; }
  /* Footer */
  .ef { background:#f8f9fb; border-top:1px solid #e0e3e5; padding:24px 40px; text-align:center; }
  .ef p { font-size:12px; color:#9CA3AF; line-height:1.8; }
  .ef a { color:#9CA3AF; text-decoration:underline; }
  /* Testimonial */
  .testi { background:#f8f9fb; border-left:3px solid #fe762c; border-radius:0 8px 8px 0; padding:14px 18px; margin-bottom:12px; }
  .testi-q { font-size:14px; color:#434651; line-height:1.6; font-style:italic; margin-bottom:6px; }
  .testi-n { font-size:12px; font-weight:700; color:#002b6d; }
  /* Mobile */
  @media only screen and (max-width:480px) {
    .eh,.hero,.sec,.ef { padding-left:24px !important; padding-right:24px !important; }
    .div { margin:0 24px !important; }
    .hero-h1 { font-size:22px !important; }
    .pkg-grid { display:block !important; }
    .pkg-cell { display:block !important; width:100% !important; margin-bottom:14px; }
    .btn { font-size:15px !important; padding:15px 20px !important; }
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
<title>${title}</title>
<style>${BRAND_CSS}</style>
</head>
<body>
<div class="ew">
  <div class="ec">
    <div class="eh">
      <a href="https://inburgeringoefenen.nl" class="logo-wrap">
        <span class="logo-bar"></span><span class="logo-txt">KNM Oefenen</span>
      </a>
      <p class="logo-tag">${strings.tagline}</p>
    </div>
    ${bodyHtml}
    <div class="ef">
      <p>${strings.copyright} · <a href="mailto:${strings.contact}">${strings.contact}</a></p>
      ${footerExtra}
    </div>
  </div>
</div>
</body>
</html>`;
}
