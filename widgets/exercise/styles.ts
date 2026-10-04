/**
 * De stijl van het widget: de merktokens van `app/globals.css` (navy, oranje, klei, de vier
 * oppervlaktelagen) zonder Tailwind, want het widget leeft in een iframe van ChatGPT. Lijnregel
 * van de huisstijl: grenzen zijn een kleurverschuiving, geen 1px-rand; selectie is een inset-ring;
 * goed is klei, fout is `--error`, en een icoon draagt de betekenis mee.
 */
export const CSS = `
:root{--navy:#002b6d;--navy-2:#1d428a;--accent:#fe762c;--clay:#a24000;--clay-tint:#fcecdd;--error:#ba1a1a;--error-tint:rgba(186,26,26,.08);
--bg:#f8f9fb;--card:#ffffff;--low:#f2f4f6;--mid:#eceef0;--high:#e6e8ea;--fg:#191c1e;--fg-2:#434651;--ring:rgba(0,43,109,.35);
--font:"Public Sans",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;--head:Manrope,var(--font)}
:root[data-theme="dark"]{--bg:#0f1420;--card:#171d2b;--low:#1c2333;--mid:#222a3b;--high:#2a3346;--fg:#e8eaf0;--fg-2:#aab0c0;--clay-tint:rgba(254,118,44,.16);--ring:rgba(254,118,44,.55);--navy:#2a52a8;--navy-2:#3b63bd}
*{box-sizing:border-box}html,body{margin:0;background:transparent;color:var(--fg);font-family:var(--font);font-size:15px;line-height:1.6}
.w{max-width:640px;margin:0 auto;padding:4px}
.card{background:var(--card);border-radius:18px;padding:18px;box-shadow:0 0 32px rgba(0,0,0,.06)}
.top{display:flex;align-items:center;justify-content:space-between;gap:8px 10px;margin-bottom:12px;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:8px;font-family:var(--head);font-weight:800;color:var(--navy);letter-spacing:-.01em;font-size:14px;white-space:nowrap}
:root[data-theme="dark"] .brand{color:var(--fg)}
.mark{width:22px;height:22px;border-radius:7px;background:var(--navy);position:relative;flex:none}
.mark::after{content:"";position:absolute;right:4px;top:4px;width:7px;height:7px;border-radius:50%;background:var(--accent)}
.chip{font-size:12px;font-weight:600;color:var(--fg-2);background:var(--low);border-radius:999px;padding:3px 10px;white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}
.stim{background:var(--low);border-radius:14px;padding:14px 16px;margin:0 0 14px;font-size:15px}
.stim h4{margin:0 0 6px;font-family:var(--head);font-size:15px}.stim p{margin:0 0 8px}.stim p:last-child{margin:0}.stim ul{margin:0;padding-left:18px}
.instr{font-size:12.5px;color:var(--fg-2);margin:0 0 8px;white-space:pre-line}
.q{font-family:var(--head);font-weight:700;font-size:17px;letter-spacing:-.01em;margin:0 0 12px}
.img{display:block;max-width:100%;border-radius:12px;margin:0 0 12px}
audio{width:100%;margin:0 0 12px}
.opts{display:grid;gap:8px;margin:0 0 14px}
.opt{display:flex;align-items:flex-start;gap:12px;width:100%;text-align:start;background:var(--low);color:var(--fg);border:0;border-radius:14px;padding:12px 14px;font:inherit;cursor:pointer;transition:transform .16s cubic-bezier(.22,1,.36,1),opacity .16s}
.opt:hover{transform:translateY(-1px)}.opt:active{transform:scale(.99)}.opt:focus-visible{outline:0;box-shadow:inset 0 0 0 3px var(--ring)}
.opt.sel{box-shadow:inset 0 0 0 3px var(--navy)}
.opt.ok{background:var(--clay-tint)}.opt.bad{background:var(--error-tint)}
.opt[disabled]{cursor:default;transform:none}
.lbl{flex:none;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:13px;background:var(--card);color:var(--navy)}
:root[data-theme="dark"] .lbl{background:var(--high);color:var(--fg)}
:root[data-theme="dark"] .brand{color:var(--fg)}
:root[data-theme="dark"] .lbl{background:var(--high);color:var(--fg)}
.opt.ok .lbl{background:var(--clay);color:#fff}.opt.bad .lbl{background:var(--error);color:#fff}
.opt img{max-width:160px;border-radius:8px;display:block}
.row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.btn{display:inline-flex;align-items:center;gap:8px;border:0;border-radius:12px;padding:11px 16px;font:inherit;font-weight:700;cursor:pointer;background:var(--navy);color:#fff;transition:transform .16s cubic-bezier(.22,1,.36,1),opacity .16s}
.btn:hover{transform:translateY(-1px)}.btn:active{transform:scale(.99)}.btn:focus-visible{outline:3px solid var(--ring);outline-offset:2px}
.btn[disabled]{opacity:.55;cursor:default;transform:none}
.btn.ghost{background:var(--low);color:var(--fg)}
.res{border-radius:14px;padding:14px 16px;margin:0 0 14px}
.res.ok{background:var(--clay-tint)}.res.bad{background:var(--error-tint)}
.res h3{display:flex;align-items:center;gap:8px;margin:0 0 6px;font-family:var(--head);font-size:16px}
.res.ok h3{color:var(--clay)}.res.bad h3{color:var(--error)}
.res p{margin:0 0 6px}.res p:last-child{margin:0}
.rule{margin-top:8px;font-size:13.5px}.rule a{color:var(--navy);font-weight:600}
.gate{text-align:center;padding:6px 4px}
.gate h3{font-family:var(--head);font-size:18px;margin:0 0 8px;letter-spacing:-.01em}
.gate p{color:var(--fg-2);margin:0 0 14px}
.meta{font-size:12.5px;color:var(--fg-2);margin:10px 0 0}
textarea{width:100%;min-height:140px;border:0;border-radius:14px;background:var(--low);color:var(--fg);padding:12px 14px;font:inherit;resize:vertical}
textarea:focus-visible{outline:0;box-shadow:inset 0 0 0 3px var(--ring)}
.crit{display:grid;gap:8px;margin:0 0 12px}
.crit div{background:var(--low);border-radius:12px;padding:10px 12px}
.crit b{display:flex;justify-content:space-between;gap:8px}
.bul{margin:0 0 12px;padding-left:18px}
.spin{width:16px;height:16px;border-radius:50%;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;animation:sp .8s linear infinite}
@keyframes sp{to{transform:rotate(360deg)}}
@media (max-width:480px){.top{flex-direction:column;align-items:flex-start}}
@media (prefers-reduced-motion:reduce){.opt,.btn{transition:none}.spin{animation:none}}
`;
