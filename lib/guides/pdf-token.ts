/**
 * Het downloadbewijs voor een gids-PDF.
 *
 * De PDF staat achter een e-mailadres (eigenaar, 05-10-2026): wie downloadt, komt in dezelfde
 * 2- en 7-dagenreeks als wie zich voor een oefentoets aanmeldt. `/api/guide-pdf-request` zet het
 * adres in de wachtrij en geeft een URL met dit bewijs terug; `/api/guide-pdf` weigert zonder.
 * Het is een HMAC over gids + taal + vervaltijd, dus de URL werkt een uur en voor één gids —
 * genoeg om de download te starten, te kort om als vaste link rond te gaan.
 *
 * Geen geheim geconfigureerd betekent geen poort: lokaal zonder `GUIDE_PDF_SECRET` werkt de
 * download gewoon, en dat staat in de log zodat het in productie opvalt.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

const TTL_MS = 60 * 60 * 1000;

function secret(): string | null {
  return process.env.GUIDE_PDF_SECRET ?? process.env.SUPABASE_SERVICE_KEY ?? null;
}

function sign(payload: string, key: string): string {
  return createHmac('sha256', key).update(payload).digest('base64url');
}

export function pdfToken(section: string, slug: string, locale: string): string | null {
  const key = secret();
  if (!key) return null;
  const exp = Date.now() + TTL_MS;
  const payload = `${section}/${slug}/${locale}/${exp}`;
  return `${exp}.${sign(payload, key)}`;
}

export function pdfTokenValid(token: string | null, section: string, slug: string, locale: string): boolean {
  const key = secret();
  if (!key) {
    console.warn('guide-pdf: geen GUIDE_PDF_SECRET, de download is niet afgeschermd');
    return true;
  }
  if (!token) return false;
  const [expRaw, sig] = token.split('.');
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp < Date.now() || !sig) return false;
  const expected = sign(`${section}/${slug}/${locale}/${exp}`, key);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
