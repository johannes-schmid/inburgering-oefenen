/**
 * Het tekstboekje van een Lezen-examen — de teksten zonder de vragen, zoals DUO ze op papier
 * uitdeelt. Twee gebruikers:
 *
 * - de kandidaat, die een tekst vanuit de speler in een nieuw tabblad opent (`#tekst-3`);
 * - `/api/tekstboekje-pdf/[level]/[number]`, die deze pagina in Chromium print tot een A4-PDF
 *   met een omslag in de stijl van de gids-brochures.
 *
 * Dezelfde poort als de speler (zie `lib/tekstboekje.ts`): de teksten van een betaald examen zijn
 * geen gratis omweg. Niet in de sitemap en `noindex`.
 */
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import BrochureCover from '@/components/guides/BrochureCover';
import { isLevel } from '@/data/skills';
import { fetchExamContent } from '@/lib/exam-content';
import { tekstboekjeAccess } from '@/lib/tekstboekje';
import './tekstboekje.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Tekstboekje | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ locale: string; level: string; number: string }>;
  searchParams: Promise<{ t?: string }>;
};

/** Een CSS-string voor `content:` in de voetregel. `<` gaat als escape, zodat `</style>` nooit kan. */
function cssString(s: string): string {
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/</g, '\\3C ').replace(/\s+/g, ' ')}"`;
}

export default async function TekstboekjePage({ params, searchParams }: Props) {
  const { locale, level, number: raw } = await params;
  const { t: token } = await searchParams;
  const number = parseInt(raw, 10);
  if (!isLevel(level) || !Number.isInteger(number) || number < 1) notFound();

  const content = await fetchExamContent(level, 'lezen', number);
  if (!content) notFound();
  const access = await tekstboekjeAccess(level, number, content.exam.is_free, token ?? null);
  if (access === 'login') redirect(`/${locale}/login?next=/tekstboekje/${level}/${number}`);
  if (access === 'denied') notFound();

  const niveau = level.toUpperCase();
  const label = `Lezen ${niveau} · oefenexamen ${number}`;
  const texts = content.stimuli.filter(s => s.kind === 'text');

  const box =
    'font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 7pt; letter-spacing: 0.08em; text-transform: uppercase; color: #4c5874;';
  const pageCss =
    `@page { size: A4; margin: 17mm 18mm 19mm; ` +
    `@bottom-left { content: ${cssString(`Tekstboekje · ${label}`)}; ${box} } @bottom-right { content: counter(page); ${box} } } ` +
    `@page :first { margin: 0; @bottom-left { content: none; } @bottom-right { content: none; } }`;

  return (
    <div className="tb-doc" dir="ltr" lang="nl">
      <style>{pageCss}</style>

      <BrochureCover
        size="a4"
        cover={{
          title: 'Tekstboekje',
          subtitle: `De ${texts.length} teksten van ${label}. De vragen staan in het examen op het scherm.`,
          kind: `Taal ${niveau} · Lezen`,
          reviewer: '',
          role: '',
          version: `Oefenexamen ${number}`,
          section: 'taalexamens',
          pillar: false,
          slug: `tekstboekje-${level}-${number}`,
        }}
      />

      <div className="tb">
        <section className="tb-uitleg">
          <h2>Zo gebruikt u dit tekstboekje</h2>
          <ul>
            <li>In dit boekje staan {texts.length} teksten. De vragen staan in het examen op de computer.</li>
            <li>Boven elke vraag staat bij welke tekst die hoort.</li>
            <li>U mag in dit boekje aantekeningen maken en zinnen onderstrepen, net als bij DUO.</li>
          </ul>
        </section>

        {texts.map((s, i) => (
          <article key={s.id} id={`tekst-${i + 1}`} className="tb-tekst">
            <span className="tb-nr">Tekst {i + 1}</span>
            {s.intro && <p className="tb-intro">{s.intro}</p>}
            {s.title && <h2>{s.title}</h2>}
            {s.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.image_url} alt={s.image_alt ?? ''} className="tb-img" />
            )}
            {s.body_html && <div className="tb-body exam-rich" dangerouslySetInnerHTML={{ __html: s.body_html }} />}
          </article>
        ))}
      </div>
    </div>
  );
}
