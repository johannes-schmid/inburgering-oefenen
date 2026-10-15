/**
 * The one renderer for every announced-but-unbuilt surface in `data/planned-surfaces.ts`.
 *
 * Deliberately **not** a "binnenkort" page. It states what the surface will do, what it will be
 * built from, which milestone builds it, and — the part that matters — links to what already
 * exists, so following the menu here is never a dead end.
 *
 * **It emits no JSON-LD.** Every route rendering this is `noindex`, and structured data on a
 * noindex page contradicts the page's own meta tag; that is the rule M0 set for the empty B1
 * overviews and M1 set for draft guides. It is also absent from `app/sitemap.ts` — by never being
 * added there, rather than by being filtered out.
 */
import { getTranslations } from 'next-intl/server';
import { Clock, BookOpen, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import Field from '@/components/glas/Field';
import SectionHeading from '@/components/glas/SectionHeading';
import Crumbs from './glas/Crumbs';
import { hubHref } from '@/data/guides/helpers';
import type { PlannedSurface as Surface, RelatedHref } from '@/data/planned-surfaces';

/** What each `related` entry is called, so the card can be labelled without a per-page key. */
function relatedLabelKey(href: RelatedHref): string {
  if (typeof href !== 'string') return 'related_pillar';
  return {
    '/inburgering': 'related_inburgering',
    '/knm': 'related_knm',
    '/taalexamens': 'related_taalexamens',
    '/oefenen': 'related_oefenen',
    '/blog': 'related_blog',
    '/premium': 'related_premium',
  }[href];
}

export default async function PlannedSurface({
  surface,
  locale,
}: {
  surface: Surface;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: 'planned' });
  const tS = await getTranslations({ locale, namespace: `planned.${surface.key}` });
  const tB = await getTranslations({ locale, namespace: 'breadcrumbs' });

  const Icon = surface.kind === 'tool' ? Clock : BookOpen;
  const hub = hubHref(surface.section);

  return (
    <>
      {/* De kop: Gracht, onder de pil door. Het soort pagina (gratis / tool) staat als metachip
          onder de titel, niet als kicker erboven. */}
      <Field as="header" variant="gracht" veil className="g-readhead">
        <div className="g-wrap">
          <Crumbs
            items={[
              { label: tB('home'), href: '/' },
              { label: tB(surface.section), href: hub },
              { label: tS('breadcrumb') },
            ]}
          />
          <h1>{tS('title')}</h1>
          <p className="g-lead">{tS('intro')}</p>
          <span className="g-metachip g-glass mt-6">
            <Icon aria-hidden="true" />
            {t(surface.kind === 'tool' ? 'eyebrow_tool' : 'eyebrow_free')}
          </span>
        </div>
      </Field>

      <main className="g-sec">
        <div className="g-wrap max-w-[920px] g-stack">
          {/* De stand, één keer en gewoon gezegd. */}
          <div className="g-notice g-notice-klei !p-5 sm:!p-6">
            <Icon aria-hidden="true" />
            <div>
              <p className="m-0 mb-1 font-headline font-bold text-klei">{t('status_title')}</p>
              <p className="m-0 text-ink-2">{t('status_body', { milestone: surface.milestone })}</p>
            </div>
          </div>

          {/* Wat het gaat doen — drie concrete beloftes. */}
          <section className="bg-wit rounded-g-xl p-6 sm:p-8 mt-4" aria-labelledby="planned-what">
            <SectionHeading id="planned-what" title={t('what_title')} size="h3" className="mb-6" />
            <ol className="g-gsteps">
              {[1, 2, 3].map(n => (
                <li key={n} className="g-gstep">
                  <span className="g-gstep-n" aria-hidden="true">{n}</span>
                  <p className="!mt-2">{tS(`what_${n}`)}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* Waar de inhoud of de regel vandaan komt — de bronnendiscipline, zichtbaar. */}
          <section className="bg-wit rounded-g-xl p-6 sm:p-8" aria-labelledby="planned-built">
            <SectionHeading id="planned-built" title={t('built_title')} size="h3" className="mb-3" />
            <p className="g-body m-0">{tS('built_from')}</p>
          </section>

          {/* Nooit een doodlopende weg. */}
          <section className="mt-8" aria-labelledby="planned-meanwhile">
            <SectionHeading id="planned-meanwhile" title={t('meanwhile_title')} size="h2" />
            <p className="g-body mt-3 mb-6">{t('meanwhile_desc')}</p>
            <div className="g-grid2">
              {surface.related.map((href, i) => (
                <Link key={i} href={href} className="g-subject g-subject-row">
                  <b>{t(relatedLabelKey(href))}</b>
                  <ArrowRight className="rtl-flip size-4 text-navy shrink-0" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
