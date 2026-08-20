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
import { GradientHero, Breadcrumb, SectionHeader } from '@/components/site';
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
      <GradientHero className="pb-14">
        <div className="max-w-3xl">
          <span className="inline-block px-3 py-1 rounded-full font-bold text-xs uppercase tracking-widest mb-5 bg-secondary-container text-on-secondary-container">
            {t(surface.kind === 'tool' ? 'eyebrow_tool' : 'eyebrow_free')}
          </span>
          <h1
            className="font-headline font-bold text-white tracking-tight mb-6 leading-tight"
            style={{ fontSize: 'clamp(1.9rem,4vw,2.8rem)' }}
          >
            {tS('title')}
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>
            {tS('intro')}
          </p>
        </div>
      </GradientHero>

      <Breadcrumb
        items={[
          { label: tB('home'), href: '/' },
          { label: tB(surface.section), href: hub },
          { label: tS('breadcrumb') },
        ]}
      />

      <main className="bg-surface">
        <section className="py-14 px-6">
          <div className="max-w-4xl mx-auto">
            {/* The status, said plainly and once. */}
            <div
              className="rounded-2xl p-6 md:p-7 mb-10 flex gap-4 items-start"
              style={{ background: '#fcecdd' }}
            >
              <Icon className="w-6 h-6 shrink-0 mt-0.5" style={{ color: '#a24000' }} aria-hidden="true" />
              <div>
                <p className="font-headline font-bold mb-1" style={{ color: '#a24000' }}>
                  {t('status_title')}
                </p>
                <p className="text-sm leading-relaxed text-on-surface-variant">
                  {t('status_body', { milestone: surface.milestone })}
                </p>
              </div>
            </div>

            {/* What it will do — three concrete promises, not a vague pitch. */}
            <SectionHeader title={t('what_title')} />
            <ul className="list-none p-0 m-0 grid gap-4 mb-12">
              {[1, 2, 3].map(n => (
                <li
                  key={n}
                  className="bg-surface-container-lowest rounded-2xl p-5 flex gap-4 items-start"
                  style={{ boxShadow: '0 2px 16px rgba(0,43,109,0.06)' }}
                >
                  <span
                    className="inline-flex items-center justify-center w-7 h-7 rounded-lg font-headline font-bold text-xs shrink-0"
                    style={{ background: 'rgba(0,43,109,0.07)', color: '#002b6d' }}
                    aria-hidden="true"
                  >
                    {n}
                  </span>
                  <p className="text-on-surface-variant leading-relaxed text-sm">{tS(`what_${n}`)}</p>
                </li>
              ))}
            </ul>

            {/* Where the content or the rule comes from — the sourcing discipline, visible. */}
            <div
              className="bg-surface-container-lowest rounded-2xl p-7 md:p-8 mb-12"
              style={{ boxShadow: '0 2px 32px rgba(0,43,109,0.06)' }}
            >
              <h2
                className="font-headline font-bold text-on-surface mb-3"
                style={{ fontSize: '1.15rem', letterSpacing: '-0.01em' }}
              >
                {t('built_title')}
              </h2>
              <p className="text-on-surface-variant leading-relaxed text-sm" style={{ lineHeight: 1.7 }}>
                {tS('built_from')}
              </p>
            </div>

            {/* Never a dead end. */}
            <SectionHeader title={t('meanwhile_title')} subtitle={t('meanwhile_desc')} />
            <div className="grid sm:grid-cols-2 gap-4">
              {surface.related.map((href, i) => (
                <Link
                  key={i}
                  href={href}
                  className="bg-surface-container-lowest rounded-2xl p-6 flex items-center justify-between gap-3 no-underline shadow-sm post-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{ textDecoration: 'none' }}
                >
                  <span className="font-headline font-bold text-on-surface text-sm leading-snug">
                    {t(relatedLabelKey(href))}
                  </span>
                  <ArrowRight className="w-4 h-4 shrink-0" style={{ color: '#fe762c' }} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
