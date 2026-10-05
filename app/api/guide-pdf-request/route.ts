/**
 * "Download deze gids als PDF" — `POST { email, section, slug, locale }`.
 *
 * De PDF is de ruil voor een e-mailadres. Het adres gaat in dezelfde `email_campaign_queue` als
 * een oefentoets-aanmelding — één planner, één uitschrijfpad — met `payload.source = 'guide'`,
 * waarop `/api/send-campaign-emails` de gidsvariant van de dag-2- en dag-7-mail kiest. Wie al in
 * de reeks zit (de unieke index op adres + type geeft 23505) krijgt de PDF gewoon; de mails
 * worden niet dubbel gepland.
 *
 * Er wordt hier niets gemaild: het antwoord is de download-URL met een bewijs van een uur
 * (`lib/guides/pdf-token.ts`), en de browser start de download zelf.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { TABLE, CAMPAIGN } from '@/lib/api-constants';
import { getGuideBySlug, getGuideLocale } from '@/data/guides/helpers';
import { pdfToken } from '@/lib/guides/pdf-token';
import { routing } from '@/i18n/routing';
import type { GuideSection } from '@/data/guides/types';

const SECTIONS: GuideSection[] = ['inburgering', 'taalexamens', 'knm'];
const DAY = 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as {
    email?: string; section?: string; slug?: string; locale?: string;
  };

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || !/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }
  const locale = (routing.locales as readonly string[]).includes(body.locale ?? '') ? body.locale! : 'nl';
  const section = body.section ?? '';
  if (!SECTIONS.includes(section as GuideSection)) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const guide = getGuideBySlug(section as GuideSection, body.slug ?? '');
  if (!guide || guide.status !== 'reviewed') return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const title = getGuideLocale(guide, locale).heroTitle;
  const now = Date.now();
  const payload = { locale, source: 'guide', section, slug: guide.slug, title };
  const { error } = await createAdminClient().from(TABLE.EMAIL_CAMPAIGN_QUEUE).insert([
    { email, campaign_type: CAMPAIGN.DAY2, scheduled_for: new Date(now + 2 * DAY).toISOString(), payload },
    { email, campaign_type: CAMPAIGN.DAY7, scheduled_for: new Date(now + 7 * DAY).toISOString(), payload },
  ]);
  if (error && error.code !== '23505') {
    console.error('guide-pdf-request: wachtrij', error);
    return NextResponse.json({ error: 'queue_failed' }, { status: 500 });
  }

  const token = pdfToken(section, guide.slug, locale);
  const url = `/api/guide-pdf/${section}/${guide.slug}?locale=${locale}${token ? `&t=${token}` : ''}`;
  return NextResponse.json({ url });
}
