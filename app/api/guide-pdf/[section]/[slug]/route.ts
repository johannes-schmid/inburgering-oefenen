/**
 * De gids als PDF — `GET /api/guide-pdf/[section]/[slug]?locale=nl`.
 *
 * Geen tweede sjabloon: de route opent de gidspagina zélf in een headless Chromium en print hem.
 * De `@media print`-regels in `app/globals.css` halen de navigatie, de footer, de inhoudsopgave
 * en de knoppen weg, zodat wat overblijft de hero, de samenvatting, het artikel, de FAQ en de
 * nagekeken-door-regel is — precies de tekst die de docent heeft gelezen. Een eigen PDF-sjabloon
 * zou een tweede plek zijn waar de gids "staat", en die twee lopen uit elkaar.
 *
 * Twee Chromiums: lokaal het geïnstalleerde Chrome (`PDF_CHROME_PATH`, standaard het Mac-pad), op
 * Vercel `@sparticuz/chromium`. Beide via `puppeteer-core`, dus er wordt nooit een browser mee
 * geïnstalleerd in `node_modules`.
 *
 * Alleen gepubliceerde gidsen; een concept geeft 404, net als een onbekende slug. Sinds 05-10
 * staat de download achter een e-mailadres: `/api/guide-pdf-request` geeft een URL met een
 * bewijs van een uur (`?t=`), en zonder geldig bewijs is het antwoord 403. De CDN-cache is
 * daarmee per bewijs, dus feitelijk per download — de kosten zitten in de Chromium-start, niet
 * in de herhaling.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { getGuideBySlug } from '@/data/guides/helpers';
import { routing } from '@/i18n/routing';
import { contentSlugParam } from '@/i18n/content-slugs';
import { translateDutchPath } from '@/i18n/paths';
import { pdfTokenValid } from '@/lib/guides/pdf-token';
import type { GuideSection } from '@/data/guides/types';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const SECTIONS: GuideSection[] = ['inburgering', 'taalexamens', 'knm'];

async function launch() {
  const puppeteer = (await import('puppeteer-core')).default;
  if (process.env.VERCEL) {
    const chromium = (await import('@sparticuz/chromium')).default;
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }
  return puppeteer.launch({
    executablePath:
      process.env.PDF_CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ section: string; slug: string }> },
) {
  const { section, slug } = await params;
  const localeParam = req.nextUrl.searchParams.get('locale') ?? 'nl';
  const locale = (routing.locales as readonly string[]).includes(localeParam) ? localeParam : 'nl';

  if (!SECTIONS.includes(section as GuideSection)) return new NextResponse('Not found', { status: 404 });
  const guide = getGuideBySlug(section as GuideSection, slug);
  if (!guide || guide.status !== 'reviewed') return new NextResponse('Not found', { status: 404 });
  /* Alleen met het bewijs uit `/api/guide-pdf-request`: de PDF is de ruil voor een e-mailadres. */
  if (!pdfTokenValid(req.nextUrl.searchParams.get('t'), section, guide.slug, locale)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const path = `/${locale}/${translateDutchPath(section, locale)}/${contentSlugParam(guide.slug, locale)}`;
  const target = new URL(path, req.nextUrl.origin).toString();

  let browser: Awaited<ReturnType<typeof launch>>;
  try {
    browser = await launch();
  } catch (err) {
    /* De enige plek waar Vercel het verschil tussen "geen Chromium" en "geen pagina" laat zien. */
    console.error('guide-pdf: Chromium start niet', err);
    return new NextResponse('PDF unavailable', { status: 500 });
  }
  try {
    const page = await browser.newPage();
    await page.goto(target, { waitUntil: 'networkidle0', timeout: 45_000 });
    await page.emulateMediaType('print');
    /* De FAQ-vouwen open: een dichte `<details>` print zijn antwoord niet, en de vraag zonder
       antwoord is de helft van de FAQ. */
    await page.$$eval('details', ds => ds.forEach(d => { d.open = true; }));
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '16mm', right: '14mm', bottom: '18mm', left: '14mm' },
    });
    const filename = `${guide.slug}${locale === 'nl' ? '' : `-${locale}`}.pdf`;
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } finally {
    await browser.close();
  }
}
