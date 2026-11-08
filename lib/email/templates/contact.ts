import { renderEmail } from '../layout';

/**
 * Het interne bericht naar de support-inbox als iemand het contactformulier invult.
 *
 * Alleen Nederlands: de lezer is het team, niet de kandidaat. Alle velden komen ongefilterd uit
 * het formulier en worden hier ge-escaped — ook het e-mailadres, dat de route alleen op een `@`
 * controleert en dat in een `href` belandt.
 */
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function contactSubject(subject: string, name: string): string {
  return `[Contact] ${subject.trim()} — ${name.trim()}`;
}

export function contactEmail({ name, email, subject, message }: { name: string; email: string; subject: string; message: string }): string {
  const safeEmail = esc(email.trim().toLowerCase());
  const rows: [string, string][] = [
    ['Naam', esc(name.trim())],
    ['E-mail', `<a href="mailto:${safeEmail}">${safeEmail}</a>`],
    ['Onderwerp', esc(subject.trim())],
  ];

  const body = `
<div class="hero">
  <span class="chip-d">Contactformulier</span>
  <h1 class="hero-h1" style="font-size:26px;">Nieuw bericht van ${esc(name.trim())}</h1>
  <p class="hero-sub" style="font-size:15px;">Beantwoorden gaat rechtstreeks naar de afzender.</p>
</div>
<div class="sec">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">${rows.map(([k, v], i) => `
    <tr>
      <td width="110" style="${i % 2 === 0 ? 'background:#eef2f8;' : ''}border-radius:12px 0 0 12px;padding:12px 14px;font-size:13px;font-weight:700;color:#5b6070;">${k}</td>
      <td style="${i % 2 === 0 ? 'background:#eef2f8;' : ''}border-radius:0 12px 12px 0;padding:12px 14px;font-size:15px;color:#191c1e;">${v}</td>
    </tr>`).join('')}
  </table>
  <div class="panel" style="margin-top:20px;">
    <p class="small" style="font-weight:700;margin-bottom:8px;">Bericht</p>
    <p class="sec-body" style="color:#191c1e;">${esc(message.trim()).replace(/\n/g, '<br>')}</p>
  </div>
  <p class="small" style="margin-top:20px;">Verzonden via het contactformulier op inburgeringoefenen.nl</p>
</div>`;

  return renderEmail({ locale: 'nl', title: 'Nieuw contactbericht', bodyHtml: body, isTransactional: true });
}
