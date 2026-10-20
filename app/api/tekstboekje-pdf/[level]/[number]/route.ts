/**
 * Het tekstboekje van een Lezen-examen als PDF — `GET /api/tekstboekje-pdf/[level]/[number]`.
 *
 * Zelfde machine als de gids-PDF (`/api/guide-pdf`): de pagina `/nl/tekstboekje/[level]/[number]`
 * in een headless Chromium, geprint met de `@page`-regels van die pagina. Het verschil is de poort:
 * hier geen e-mailadres maar het examen zelf — ingelogd en `is_free` of `ownsModule`
 * (`lib/tekstboekje.ts`). Chromium heeft geen sessie, dus krijgt hij een bewijs van een uur mee.
 *
 * Privé gecachet: elke download hangt aan een sessie, en een gedeelde CDN-cache zou de PDF van een
 * betaald examen aan de volgende aanvrager geven.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { isLevel } from '@/data/skills';
import { fetchExamContent } from '@/lib/exam-content';
import { tekstboekjeAccess, tekstboekjeToken } from '@/lib/tekstboekje';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

async function launch() {
  const puppeteer = (await import('puppeteer-core')).default;
  if (process.env.VERCEL) {
    const chromium = (await import('@sparticuz/chromium')).default;
    return puppeteer.launch({
      args: await puppeteer.defaultArgs({ args: chromium.args, headless: 'shell' }),
      executablePath: await chromium.executablePath(),
      headless: 'shell',
    });
  }
  return puppeteer.launch({
    executablePath:
      process.env.PDF_CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ level: string; number: string }> }) {
  const { level, number: raw } = await params;
  const number = parseInt(raw, 10);
  if (!isLevel(level) || !Number.isInteger(number) || number < 1) return new NextResponse('Not found', { status: 404 });

  const content = await fetchExamContent(level, 'lezen', number);
  if (!content) return new NextResponse('Not found', { status: 404 });
  const access = await tekstboekjeAccess(level, number, content.exam.is_free, null);
  if (access === 'login') {
    return NextResponse.redirect(new URL(`/nl/login?next=/oefenexamen/${level}/lezen/${number}`, req.nextUrl.origin));
  }
  if (access === 'denied') return new NextResponse('Forbidden', { status: 403 });

  const target = new URL(`/nl/tekstboekje/${level}/${number}`, req.nextUrl.origin);
  const token = tekstboekjeToken(level, number);
  if (token) target.searchParams.set('t', token);

  let browser: Awaited<ReturnType<typeof launch>>;
  try {
    browser = await launch();
  } catch (err) {
    console.error('tekstboekje-pdf: Chromium start niet', err);
    return new NextResponse('PDF unavailable', { status: 500 });
  }
  try {
    const page = await browser.newPage();
    const res = await page.goto(target.toString(), { waitUntil: 'networkidle0', timeout: 45_000 });
    if (!res?.ok()) {
      console.error('tekstboekje-pdf: pagina gaf', res?.status());
      return new NextResponse('PDF unavailable', { status: 500 });
    }
    await page.emulateMediaType('print');
    await page.evaluate(() => document.fonts.ready);
    const pdf = await page.pdf({ printBackground: true, preferCSSPageSize: true });
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Tekstboekje-${level.toUpperCase()}-Lezen-${number}.pdf"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } finally {
    await browser.close();
  }
}
