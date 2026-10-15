/**
 * De gids als PDF — `GET /api/guide-pdf/[section]/[slug]?locale=nl`.
 *
 * De route opent de brochurepagina (`/[locale]/gids-brochure/[section]/[slug]`) in een headless
 * Chromium en print die. Tot 15-10 printte hij de gidspagina zelf; nu is er een omslag en een
 * brochure-opmaak, maar nog steeds geen tweede tekst: de brochure rendert dezelfde `articleHtml`
 * als de gidspagina, zodat er één plek blijft waar de gids "staat". Marges, paginaformaat en de
 * lopende voetregel staan in de `@page`-regels van die pagina (`preferCSSPageSize`), niet hier.
 *
 * Twee Chromiums: lokaal het geïnstalleerde Chrome (`PDF_CHROME_PATH`, standaard het Mac-pad), op
 * Vercel `@sparticuz/chromium`. Beide via `puppeteer-core`, dus er wordt nooit een browser mee
 * geïnstalleerd in `node_modules`. De `@page`-margevakken (de voetregel) vragen Chromium 131+.
 *
 * Alleen gepubliceerde gidsen; een concept geeft 404, net als een onbekende slug. Sinds 05-10
 * staat de download achter een e-mailadres: `/api/guide-pdf-request` geeft een URL met een
 * bewijs van een uur (`?t=`), en zonder geldig bewijs is het antwoord 403. Hetzelfde bewijs gaat
 * door naar de brochurepagina, die zonder bewijs een 404 geeft. De CDN-cache is daarmee per
 * bewijs, dus feitelijk per download — de kosten zitten in de Chromium-start, niet in de herhaling.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { getGuideBySlug } from '@/data/guides/helpers';
import { routing } from '@/i18n/routing';
import { pdfTokenValid } from '@/lib/guides/pdf-token';
import type { GuideSection } from '@/data/guides/types';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const SECTIONS: GuideSection[] = ['inburgering', 'taalexamens', 'knm'];

async function launch() {
  const puppeteer = (await import('puppeteer-core')).default;
  if (process.env.VERCEL) {
    const chromium = (await import('@sparticuz/chromium')).default;
    /* `headless: 'shell'` en niet `true`: het pakket levert de headless *shell*, en puppeteers
       "nieuwe" headless-modus start die binary niet (README van @sparticuz/chromium v153). */
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

  const target = new URL(`/${locale}/gids-brochure/${section}/${guide.slug}`, req.nextUrl.origin);
  const token = req.nextUrl.searchParams.get('t');
  if (token) target.searchParams.set('t', token);

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
    const res = await page.goto(target.toString(), { waitUntil: 'networkidle0', timeout: 45_000 });
    if (!res?.ok()) {
      console.error('guide-pdf: brochurepagina gaf', res?.status());
      return new NextResponse('PDF unavailable', { status: 500 });
    }
    await page.emulateMediaType('print');
    await page.evaluate(() => document.fonts.ready);
    const pdf = await page.pdf({ printBackground: true, preferCSSPageSize: true });
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
