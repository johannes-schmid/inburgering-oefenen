import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request): Promise<Response> {
  const body = await request.json().catch(() => ({})) as {
    name?: string; email?: string; subject?: string; message?: string;
  };

  const { name, email, subject, message } = body;

  if (!name || typeof name !== 'string' || name.trim().length < 1) {
    return Response.json({ error: 'Naam is verplicht' }, { status: 400 });
  }
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return Response.json({ error: 'Ongeldig e-mailadres' }, { status: 400 });
  }
  if (!subject || typeof subject !== 'string' || subject.trim().length < 1) {
    return Response.json({ error: 'Onderwerp is verplicht' }, { status: 400 });
  }
  if (!message || typeof message !== 'string' || message.trim().length < 10) {
    return Response.json({ error: 'Bericht is te kort' }, { status: 400 });
  }

  const safeName    = name.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeEmail   = email.trim().toLowerCase();
  const safeSubject = subject.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeMessage = message.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'Marieke <marieke@inburgeringoefenen.nl>',
    to: 'support@inburgeringoefenen.nl',
    replyTo: safeEmail,
    subject: `[Contact] ${subject.trim()} — ${name.trim()}`,
    html: `
      <table style="font-family:Arial,sans-serif;font-size:15px;color:#191c1e;border-collapse:collapse;width:100%;max-width:600px;">
        <tr><td style="padding:24px 24px 0;">
          <h2 style="margin:0 0 20px;color:#002b6d;font-size:20px;">Nieuw contactbericht via KNM Oefenen</h2>
        </td></tr>
        <tr><td style="padding:0 24px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #eceef0;font-weight:700;width:130px;color:#434651;">Naam</td>
              <td style="padding:10px 0;border-bottom:1px solid #eceef0;">${safeName}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #eceef0;font-weight:700;color:#434651;">E-mail</td>
              <td style="padding:10px 0;border-bottom:1px solid #eceef0;"><a href="mailto:${safeEmail}" style="color:#002b6d;">${safeEmail}</a></td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #eceef0;font-weight:700;color:#434651;">Onderwerp</td>
              <td style="padding:10px 0;border-bottom:1px solid #eceef0;">${safeSubject}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;font-weight:700;color:#434651;vertical-align:top;">Bericht</td>
              <td style="padding:10px 0;line-height:1.6;">${safeMessage}</td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px;color:#9ca3af;font-size:12px;">
          Verzonden via het contactformulier op inburgeringoefenen.nl
        </td></tr>
      </table>
    `,
  });

  if (error) {
    console.error('Resend error:', error);
    return Response.json({ error: 'E-mail kon niet worden verzonden. Probeer het opnieuw.' }, { status: 500 });
  }

  return Response.json({ ok: true });
}
