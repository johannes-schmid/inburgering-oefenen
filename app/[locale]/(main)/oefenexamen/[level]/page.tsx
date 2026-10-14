import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, Clock } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { localeHref } from '@/i18n/paths';
import { Link } from '@/i18n/navigation';
import Field from '@/components/glas/Field';
import SectionHeading from '@/components/glas/SectionHeading';
import { glasButton } from '@/components/glas/Button';
import ExamMark from '@/components/horizon/ExamMark';
import CategoryMark from '@/components/horizon/CategoryMark';
import FaqList from '../../_components/glas/FaqList';
import { OxCrumbs, OxHeader, OxTextLink } from '../_glas/parts';
import { LEVELS, isLevel, levelLabel, skillsAtLevel, type Level } from '@/data/skills';
import { guideHref } from '@/data/guides/helpers';
import JsonLd from '@/components/JsonLd';
import { langTag, WEBSITE_ID } from '@/lib/site';
import { PROVIDER_REF, absUrl, alternatesFor, breadcrumbs, courseId, ogImageFor } from '@/lib/schema';

/**
 * Het niveau-overzicht: één pagina per niveau, met de vier onderdelen en de weg naar hun
 * oefenexamens. Gebouwd op 25-09 voor de zoekterm die ertussen viel.
 *
 * **Waarom deze pagina bestaat.** De Semrush-export van 25-09 zet ~3.500 zoekopdrachten per
 * maand op "het A2-examen als geheel" — `inburgering examen oefenen a2` (880, KD 23), `oefenen
 * examen a2` (1.300, KD 18), `inburgering examen a2` (1.300, KD 34). De site sprong van de
 * homepage rechtstreeks naar de vier onderdeelpagina's; het niveau zelf had geen URL, dus
 * niets kon op die termen ranken. Dit is de pagina in de vorm die op knmoefenen.nl al werkt
 * (`/inburgering-knm-oefenen`): wat is het, hoe ziet het eruit, hoe oefen je, veelgestelde vragen.
 *
 * **Geen eigen `Course`-node.** De `Course` van een onderdeel is van de onderdeelpagina
 * (`[skill]/page.tsx`); deze pagina verwijst ernaar via `courseId()` in een `ItemList`, zoals de
 * homepage. Twee volledige Course-nodes voor één url met twee beschrijvingen is een tegenspraak
 * die geen validator meldt. `scripts/check-schema.mjs` verbiedt `Course` hier.
 *
 * **B1 Luisteren staat erop, als lege kaart.** Zijn `itemCount` is `null` — geen DUO-materiaal,
 * geen gekende vorm — en zijn onderdeelpagina is `noindex`. De kaart zegt dat en linkt nergens
 * heen: een link naar een noindex-pagina vanaf een geïndexeerde is een signaal dat we niet
 * hoeven te sturen, en "binnenkort" zonder verklaring is het patroon dat `CLAUDE.md` §2 verbiedt.
 */

type Props = { params: Promise<{ locale: string; level: string }> };

export async function generateStaticParams() {
  return routing.locales.flatMap(locale => LEVELS.map(level => ({ locale, level })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, level: raw } = await params;
  if (!isLevel(raw)) return {};
  const t = await getTranslations({ locale, namespace: 'oefenexamen.level' });
  const vars = { level: levelLabel(raw) };
  const path = `oefenexamen/${raw}`;
  return {
    title: t('meta_title', vars),
    description: t('meta_description', vars),
    robots: { index: true, follow: true },
    alternates: alternatesFor(locale, path),
    openGraph: {
      images: ogImageFor(locale),
      title: t('meta_title', vars),
      description: t('meta_description', vars),
      type: 'website',
      url: absUrl(locale, path),
      siteName: 'Inburgering Oefenen',
    },
  };
}

export default async function LevelOverviewPage({ params }: Props) {
  const { locale, level: raw } = await params;
  if (!isLevel(raw)) notFound();
  const level: Level = raw;

  const t = await getTranslations({ locale, namespace: 'oefenexamen.level' });
  const tSkills = await getTranslations({ locale, namespace: 'skills' });
  const tB = await getTranslations({ locale, namespace: 'breadcrumbs' });
  const tHome = await getTranslations({ locale, namespace: 'home' });

  const label = levelLabel(level);
  const vars = { level: label };
  const parts = skillsAtLevel(level);
  const path = `oefenexamen/${level}`;
  const url = absUrl(locale, path);

  const faq = ([1, 2, 3, 4] as const).map(n => ({ q: t(`q${n}`), a: t(`a${n}`) }));

  /* Het niveau als verzameling van zijn onderdelen. De `ItemList` wijst per onderdeel naar de
     `Course`-node die de onderdeelpagina zelf definieert — behalve voor een onderdeel zonder
     geteld formaat, dat geen Course heeft en er dus ook niet in staat. */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${url}#page`,
        url,
        name: t('meta_title', vars),
        description: t('meta_description', vars),
        inLanguage: langTag(locale),
        isPartOf: { '@id': WEBSITE_ID },
        provider: PROVIDER_REF,
        mainEntity: {
          '@type': 'ItemList',
          '@id': `${url}#list`,
          numberOfItems: parts.filter(p => p.itemCount !== null).length,
          itemListElement: parts
            .filter(p => p.itemCount !== null)
            .map((p, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: tSkills(`${p.key}.name`),
              url: absUrl(locale, `oefenexamen/${level}/${p.slug}`),
              item: { '@id': courseId(locale, level, p.slug) },
            })),
        },
      },
      {
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        mainEntity: faq.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
      breadcrumbs(locale, tB('home'), [
        { name: tB('oefenexamen'), path: 'oefenen' },
        { name: tB('level', vars), path },
      ]),
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />

      {/* ── KOP ── Gracht met sluier; het track-merk groot, want dit is de pagina van het niveau. */}
      <OxHeader
        crumbs={
          <OxCrumbs
            label={tB('home')}
            items={[
              { label: tB('home'), href: localeHref(locale, '') },
              { label: tB('oefenexamen'), href: localeHref(locale, 'oefenen') },
              { label: tB('level', vars) },
            ]}
          />
        }
        marks={<ExamMark track={level} size={72} />}
        title={t('heading', vars)}
        lead={t('sub')}
        trust={tHome('hero_badge')}
      />

      {/* ── DE ONDERDELEN ── één kaart per onderdeel. Een onderdeel zonder geteld formaat
          (B1 Luisteren) is gestippeld, linkt nergens heen en zegt waarom. */}
      <section aria-labelledby="parts-heading" className="g-sec">
        <div className="g-wrap">
          <SectionHeading id="parts-heading" title={t('parts_title', vars)} size="h1" className="mb-8" />
          <ul className="g-ox-parts">
            {parts.map(part => {
              const name = tSkills(`${part.key}.name`);
              const known = part.itemCount !== null && part.durationMinutes !== null;
              const metaKey = part.scoring === 'open' && part.slug === 'schrijven' ? 'part_meta_tasks' : 'part_meta';
              return (
                <li key={part.slug}>
                  {known ? (
                    <a href={localeHref(locale, `oefenexamen/${level}/${part.slug}`)} className="g-ox-part">
                      <CategoryMark category={part.slug} size={52} />
                      <div className="flex-1 min-w-0">
                        <div className="g-ox-part-top">
                          <h3>{name} {label}</h3>
                          <span className="g-bdg g-bdg-zacht">{t('free_chip')}</span>
                        </div>
                        <p className="g-ox-part-meta g-tnum">
                          {t(metaKey, { items: part.itemCount as number, minutes: part.durationMinutes as number })} · {tSkills('exams_count', { count: part.examCount })}
                        </p>
                        <p className="g-ox-part-tag">{tSkills(`${part.key}.tagline`)}</p>
                        <span className="g-ox-part-cta">
                          {t('part_cta')}
                          <ArrowRight aria-hidden="true" className="rtl-flip" />
                        </span>
                      </div>
                    </a>
                  ) : (
                    <div className="g-ox-part g-ox-part-nog">
                      <CategoryMark category={part.slug} size={52} />
                      <div className="flex-1 min-w-0">
                        <div className="g-ox-part-top">
                          <h3>{name} {label}</h3>
                          <span className="g-bdg g-bdg-grijs"><Clock aria-hidden="true" />{t('part_soon')}</span>
                        </div>
                        <p className="g-ox-part-tag mt-2.5">{t('b1_luisteren_note')}</p>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ── DE UITLEG — wat is het, hoe oefen je, gratis beginnen ── */}
      <section className="g-sec g-sec-tier">
        <div className="g-wrap grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12 items-start">
          <article className="g-ox-read">
            <h2>{t('what_title', vars)}</h2>
            <p>{t(`what_p1_${level}`)}</p>
            <p>{t('what_p2')}</p>
            <h2>{t('how_title', vars)}</h2>
            <p>{t('how_p1')}</p>
            <p>{t('how_p2')}</p>
          </article>
          {/* Gratis beginnen: Nevel, de ene oranje knop van deze view. */}
          <Field variant="nevel" className="g-block p-7 sm:p-9 lg:sticky lg:top-[calc(var(--nav-h)+24px)]">
            <h2 className="g-head g-head-2">{t('free_title')}</h2>
            <p className="g-body mt-3">{t('free_p')}</p>
            <a href={localeHref(locale, 'oefenen')} className={glasButton({ variant: 'oranje', size: 'lg', className: 'mt-6' })}>
              {t('free_cta')}
              <ArrowRight aria-hidden="true" className="rtl-flip" />
            </a>
          </Field>
        </div>
      </section>

      {/* ── FAQ en de weg de kennisbank in ── */}
      <section className="g-sec">
        <div className="g-wrap grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14 items-start">
          <div>
            <SectionHeading title={t('faq_title', vars)} size="h1" />
            {/* Naar de kennisbank. De overzichten zijn de sterkste pagina's van de site; de gidsen
                hebben deze link harder nodig dan andersom. */}
            <h2 className="g-head g-head-3 mt-10">{t('guides_title', vars)}</h2>
            <ul className="g-ox-more !mt-4">
              <li>
                <Link href={guideHref({ section: 'taalexamens', slug: 'taalexamens-a2-b1' }, locale)} className="g-tlink">
                  {t('guide_taalexamens')}<ArrowRight aria-hidden="true" className="rtl-flip" />
                </Link>
              </li>
              {level === 'b1' && (
                <li>
                  <Link href={guideHref({ section: 'taalexamens', slug: 'b1-examen' }, locale)} className="g-tlink">
                    {t('guide_b1')}<ArrowRight aria-hidden="true" className="rtl-flip" />
                  </Link>
                </li>
              )}
              <li>
                <Link href={guideHref({ section: 'inburgering', slug: 'inburgering-stappenplan' }, locale)} className="g-tlink">
                  {t('guide_stappenplan')}<ArrowRight aria-hidden="true" className="rtl-flip" />
                </Link>
              </li>
              {/* Het andere niveau — één link, geen tweede rij tegels. */}
              {LEVELS.filter(l => l !== level).map(other => (
                <li key={other}>
                  <OxTextLink href={localeHref(locale, `oefenexamen/${other}`)}>{t('heading', { level: levelLabel(other) })}</OxTextLink>
                </li>
              ))}
            </ul>
          </div>
          <FaqList items={faq.map(f => ({ question: f.q, answer: f.a }))} />
        </div>
      </section>
    </>
  );
}
