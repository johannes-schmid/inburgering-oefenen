import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { localeHref } from '@/i18n/paths';
import { Link } from '@/i18n/navigation';
import { SectionHeader } from '@/components/site';
import { CategoryMark, DotField, ExamMark, HorizonHero, ValidationChip } from '@/components/horizon';
import { LEVELS, SKILLS, isLevel, levelLabel, skillsAtLevel, type Level } from '@/data/skills';
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

      {/* ── HEADER ── */}
      <HorizonHero houses={14} skylineHeight={84} containerClass="max-w-5xl pt-16 pb-16">
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-white/85 mb-5" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <ExamMark track={level} size={22} onDark />
            {t('eyebrow', vars)}
          </span>
          <h1 className="font-headline font-extrabold text-white tracking-tight mb-4" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.03em' }}>
            {t('heading', vars)}
          </h1>
          <p className="text-lg leading-relaxed max-w-2xl" style={{ color: 'rgba(255,255,255,0.85)' }}>
            {t('sub')}
          </p>
        </div>
      </HorizonHero>

      {/* ── DE VIER ONDERDELEN ── */}
      <section className="py-16 px-6 bg-surface">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <ValidationChip>{tHome('hero_badge')}</ValidationChip>
          </div>

          <SectionHeader eyebrow="" title={t('parts_title', vars)} subtitle="" mb="mb-8" />

          <ul className="grid sm:grid-cols-2 gap-4 list-none p-0 m-0">
            {parts.map(part => {
              const name = tSkills(`${part.key}.name`);
              const known = part.itemCount !== null && part.durationMinutes !== null;
              const metaKey = part.scoring === 'open' && part.slug === 'schrijven' ? 'part_meta_tasks' : 'part_meta';
              return (
                <li key={part.slug}>
                  {known ? (
                    <a
                      href={localeHref(locale, `oefenexamen/${level}/${part.slug}`)}
                      className="exam-card relative flex items-start gap-4 p-6 pb-7 rounded-2xl bg-surface-container-lowest no-underline overflow-hidden"
                      style={{ boxShadow: 'var(--shadow-ambient)' }}
                    >
                      <CategoryMark category={part.slug} size={48} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-headline font-bold text-on-surface text-lg m-0">{name} {label}</p>
                          <span className="text-[0.68rem] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full" style={{ background: 'rgba(254,118,44,0.16)', color: 'var(--color-secondary)' }}>
                            {t('free_chip')}
                          </span>
                        </div>
                        <p className="text-sm text-on-surface-variant mt-1 mb-3">
                          {t(metaKey, { items: part.itemCount as number, minutes: part.durationMinutes as number })} · {tSkills('exams_count', { count: part.examCount })}
                        </p>
                        <p className="text-sm text-on-surface-variant leading-relaxed m-0">{tSkills(`${part.key}.tagline`)}</p>
                        <span className="inline-flex items-center gap-1 text-sm font-semibold mt-4" style={{ color: '#a24000' }}>
                          {t('part_cta')}
                          <ArrowRight size={14} strokeWidth={2.2} aria-hidden="true" className="rtl-flip" />
                        </span>
                      </div>
                    </a>
                  ) : (
                    <div className="relative flex items-start gap-4 p-6 rounded-2xl bg-surface-container-low overflow-hidden">
                      <DotField on="dark" size={14} />
                      <CategoryMark category={part.slug} size={48} />
                      <div className="relative flex-1 min-w-0">
                        <p className="font-headline font-bold text-on-surface-variant text-lg m-0">{name} {label}</p>
                        <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/70 mt-1 mb-3">{t('part_soon')}</p>
                        <p className="text-sm text-on-surface-variant leading-relaxed m-0">{t('b1_luisteren_note')}</p>
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
      <section className="py-16 px-6 bg-surface-container-low">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-headline font-extrabold text-on-surface tracking-tight mb-4" style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2rem)', letterSpacing: '-0.02em' }}>
            {t('what_title', vars)}
          </h2>
          <p className="text-base leading-[1.7] text-on-surface-variant mb-4">{t(`what_p1_${level}`)}</p>
          <p className="text-base leading-[1.7] text-on-surface-variant mb-10">{t('what_p2')}</p>

          <h2 className="font-headline font-extrabold text-on-surface tracking-tight mb-4" style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2rem)', letterSpacing: '-0.02em' }}>
            {t('how_title', vars)}
          </h2>
          <p className="text-base leading-[1.7] text-on-surface-variant mb-4">{t('how_p1')}</p>
          <p className="text-base leading-[1.7] text-on-surface-variant mb-10">{t('how_p2')}</p>

          <div className="rounded-2xl p-8" style={{ background: '#002b6d' }}>
            <p className="font-headline font-bold text-lg text-white mb-2">{t('free_title')}</p>
            <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.75)' }}>{t('free_p')}</p>
            <a
              href={localeHref(locale, 'oefenen')}
              className="inline-flex items-center gap-2 px-6 py-3 font-bold rounded-xl text-sm no-underline"
              style={{ background: '#fe762c', color: '#5f2200', boxShadow: 'var(--shadow-btn-orange)' }}
            >
              {t('free_cta')}
              <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" className="rtl-flip" />
            </a>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 px-6 bg-surface">
        <div className="max-w-3xl mx-auto">
          <SectionHeader eyebrow="" title={t('faq_title', vars)} subtitle="" mb="mb-6" />
          <div className="faq-folds">
            {faq.map(f => (
              <details key={f.q} className="faq-fold">
                <summary>{f.q}</summary>
                <p className="text-sm leading-relaxed text-on-surface-variant m-0 pt-2">{f.a}</p>
              </details>
            ))}
          </div>

          {/* Naar de kennisbank. De overzichten zijn de sterkste pagina's van de site; de gidsen
              hebben deze link harder nodig dan andersom. */}
          <SectionHeader eyebrow="" title={t('guides_title', vars)} subtitle="" mb="mb-4" className="mt-14" />
          <ul className="list-none p-0 m-0 flex flex-col gap-2 text-sm">
            <li>
              <Link href={guideHref({ section: 'taalexamens', slug: 'taalexamens-a2-b1' }, locale)} className="font-semibold" style={{ color: '#a24000' }}>{t('guide_taalexamens')} →</Link>
            </li>
            {level === 'b1' && (
              <li>
                <Link href={guideHref({ section: 'taalexamens', slug: 'b1-examen' }, locale)} className="font-semibold" style={{ color: '#a24000' }}>{t('guide_b1')} →</Link>
              </li>
            )}
            <li>
              <Link href={guideHref({ section: 'inburgering', slug: 'inburgering-stappenplan' }, locale)} className="font-semibold" style={{ color: '#a24000' }}>{t('guide_stappenplan')} →</Link>
            </li>
          </ul>

          {/* Het andere niveau — één link, geen tweede rij tegels. */}
          <p className="mt-8 text-sm text-on-surface-variant">
            {LEVELS.filter(l => l !== level).map(other => (
              <a key={other} href={localeHref(locale, `oefenexamen/${other}`)} className="font-semibold" style={{ color: '#a24000' }}>
                {t('heading', { level: levelLabel(other) })} →
              </a>
            ))}
          </p>
        </div>
      </section>

      <style>{`
        .exam-card {
          transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s ease;
        }
        .exam-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 28px rgba(0,43,109,0.12) !important;
        }
        .exam-card:active { transform: translateY(-1px); }
        @media (prefers-reduced-motion: reduce) { .exam-card { transition: none; } }
      `}</style>
    </>
  );
}
