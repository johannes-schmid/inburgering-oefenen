import { Resend } from 'resend';
import { contactEmail, contactSubject } from '@/lib/email/templates/contact';

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

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'Inburgering Oefenen <support@inburgeringoefenen.nl>',
    to: 'support@inburgeringoefenen.nl',
    replyTo: email.trim().toLowerCase(),
    subject: contactSubject(subject, name),
    html: contactEmail({ name, email, subject, message }),
  });

  if (error) {
    console.error('Resend error:', error);
    return Response.json({ error: 'E-mail kon niet worden verzonden. Probeer het opnieuw.' }, { status: 500 });
  }

  return Response.json({ ok: true });
}
