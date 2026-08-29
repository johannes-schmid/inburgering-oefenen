import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, Check, Lock, Minus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { isLevel, levelLabel, SKILLS, isKnm } from '@/data/skills';
import { fetchPortalMenu } from '@/lib/portal-menu';
import { fetchConcept, fetchConcepts, fetchConceptTracks, fetchMastery } from '@/lib/lessons/concepts-server';
import { conceptPath, conceptsPath, isMastered, masteryState, MASTERY_STREAK } from '@/lib/lessons/lessons';
import { LensRing, ValidationChip } from '@/components/horizon';
import AppShell from '../../../../components/AppShell';
import { conceptsPanel } from '../../../../components/nav';

type Props = { params: Promise<{ locale: string; level: string; slug: string }> };

export const metadata: Metadata = {
  title: 'Concept | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

/**
 * Eén concept: de uitleg, de beheersing, en waar je het kunt oefenen.
 *
 * ── DE SPOREN ZIJN PER ONDERDEEL GEFILTERD OP BEZIT ──────────────────────────
 * De uitleg is gedeeld — één formulering per niveau. De oefening is dat niet: elk onderdeel
 * heeft zijn eigen les over hetzelfde concept, want Luisteren oefent `omdat` op het gehoor en
 * Schrijven laat hem bouwen.
 *
 * `fetchConceptTracks` filtert **per spoor** met `ownsModule(meta, level, skill)`, niet met
 * "bezit iets op dit niveau". Alle vier als bezit renderen voor iemand die alleen Luisteren
 * heeft gekocht is chrome die zegt dat je iets hebt waar de speler je uit gooit — precies de
 * fout die de zijbalk op 27-08 maakte. Een niet-bezeten spoor wordt aanbod, niet weggelaten:
 * weglaten maakt het concept smaller dan het is.
 */
export default async function ConceptPage({ params }: Props) {
  const { locale, level: rawLevel, slug } = await params;
  if (!isLevel(rawLevel)) notFound();
  const level = rawLevel;

  const t = await getTranslations('lessons');
  const tSkills = await getTranslations('skills');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/dashboard/${level}/concepten/${slug}`);

  const concept = await fetchConcept(level, slug);
  if (!concept || concept.review_status !== 'validated') notFound();

  const meta = user.user_metadata ?? {};
  const [tracks, mastery, menu, siblings] = await Promise.all([
    fetchConceptTracks(concept.id, level, meta),
    fetchMastery(user.id, [concept.id]),
    fetchPortalMenu(),
    // De hele bibliotheek, voor het lespaneel: binnen een concept is "welk concept" de tweede
    // as, en zonder de buren is het paneel een lijst van één.
    fetchConcepts(level),
  ]);

  const panelGroups = [...siblings
    .reduce((acc, c) => {
      const key = c.group?.slug ?? '_strategie';
      const entry = acc.get(key) ?? {
        key,
        name: c.group?.name_nl ?? t('group_strategy'),
        sort: c.group?.sort_order ?? 999,
        concepts: [] as typeof siblings,
      };
      entry.concepts.push(c);
      acc.set(key, entry);
      return acc;
    }, new Map<string, { key: string; name: string; sort: number; concepts: typeof siblings }>())
    .values()]
    .sort((a, b) => a.sort - b.sort);

  const m = mastery.get(concept.id);
  const state = masteryState(m);
  const toGo = m ? Math.max(0, MASTERY_STREAK - m.streak) : MASTERY_STREAK;

  const skillName = (s: string) => {
    if (isKnm(s)) return 'KNM';
    const found = SKILLS.find(x => x.slug === s);
    return found ? tSkills(`${found.key}.name`) : s;
  };

  return (
    <AppShell
      locale={locale}
      email={user.email ?? ''}
      avatarUrl={String(meta.avatar_url ?? meta.picture ?? '')}
      active="concepten"
      activeGroup={level}
      menu={menu}
      learn={conceptsPanel(panelGroups, {
        title: t('concepts_title', { level: levelLabel(level) }),
        backHref: conceptsPath(level),
        backLabel: t('concepts_title', { level: levelLabel(level) }),
        conceptHref: (slug: string) => conceptPath(level, slug),
        currentSlug: concept.slug,
      })}
    >
      <div className="px-5 py-7 sm:px-8 sm:py-10">
        <div className="mx-auto flex max-w-4xl flex-col gap-7 lg:flex-row lg:gap-9">

          <main className="min-w-0 flex-1">
            <a
              href={`/${locale}${conceptsPath(level)}`}
              className="text-xs font-bold text-on-surface-variant no-underline hover:underline"
            >
              ← {t('concepts_title', { level: levelLabel(level) })}
            </a>

            <span className="mt-3 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              {concept.group?.name_nl ?? t('group_strategy')}
              {concept.onderdelen.length > 0 && (
                <> · {t('appears_in')} {concept.onderdelen.map(skillName).join(' · ')}</>
              )}
            </span>

            <h1
              className="mt-1.5 font-headline font-extrabold text-on-surface"
              style={{ fontSize: 'clamp(1.5rem,3.2vw,2rem)', letterSpacing: '-0.03em' }}
            >
              {concept.name_nl}
            </h1>
            <p className="mt-2 text-on-surface-variant" style={{ lineHeight: 1.7 }}>
              {concept.one_liner}
            </p>

            {concept.example_html && (
              <p className="cc-example mt-4" dangerouslySetInnerHTML={{ __html: concept.example_html }} />
            )}

            {concept.body_html && (
              <div className="blk mt-5">
                <div className="blk-body" dangerouslySetInnerHTML={{ __html: concept.body_html }} />
              </div>
            )}

            <h2 className="mt-8 mb-3 font-headline text-lg font-extrabold text-primary">
              {t('practise_head')}
            </h2>
            <ul className="flex list-none flex-col gap-2 p-0 m-0">
              {tracks.map(track => {
                /**
                 * Drie toestanden, en ze moeten visueel verschillen.
                 *
                 * `open`     — er is een les en je hebt hem: klei-vinkje en een pijl.
                 * `locked`   — er is een les, maar niet in jouw cursus: slot, en de rij is een
                 *              link naar het aanbod.
                 * `unbuilt`  — er is nog geen les voor dit onderdeel. **Geen slot**, want er is
                 *              niets om te ontsluiten; een slot zou zeggen "betaal en je krijgt
                 *              het", en dat is niet waar. Geen link ook.
                 *
                 * Eén "vergrendeld"-toestand voor beide vertelt de kandidaat niets — precies
                 * wat de examenslots op de onderdeelpagina met drie eigen toestanden vermijden.
                 */
                const state = !track.lesson ? 'unbuilt' : track.owned ? 'open' : 'locked';
                const href = state === 'open'
                  ? `/${locale}${track.href}`
                  : state === 'locked'
                    ? `/${locale}/dashboard/pakketten?onderdeel=${track.level ? `${track.level}:` : ''}${track.onderdeel}&vanaf=concept-${concept.slug}`
                    : undefined;
                const Row = href ? 'a' : 'div';
                return (
                  <li key={`${track.level ?? 'knm'}:${track.onderdeel}`}>
                    <Row
                      {...(href ? { href } : {})}
                      className={`les-row${state === 'unbuilt' ? ' is-unbuilt' : ''}`}
                      style={{ padding: '0.7rem 0.9rem' }}
                    >
                      {state === 'open' && <Check size={15} strokeWidth={3} className="les-done" />}
                      {state === 'locked' && <Lock size={13} strokeWidth={2.5} className="text-outline shrink-0" />}
                      {state === 'unbuilt' && <Minus size={13} strokeWidth={2.5} className="text-outline shrink-0" />}
                      <span className="min-w-0">
                        <span className="block font-bold">{skillName(track.onderdeel)}</span>
                        <span className="block text-xs text-on-surface-variant truncate">
                          {state === 'open' ? track.lesson!.title
                            : state === 'locked' ? t('track_locked')
                            : t('track_none')}
                        </span>
                      </span>
                      {state === 'open' && (
                        <ArrowRight size={16} strokeWidth={2.5} className="ms-auto shrink-0 text-secondary rtl-flip" />
                      )}
                    </Row>
                  </li>
                );
              })}
            </ul>
          </main>

          {/* De rechterrail uit de mockup: beheersing, de reeks, en de reviewregel. */}
          <aside className="w-full shrink-0 lg:w-64">
            <div
              className="rounded-2xl px-4 py-5 text-center"
              style={{ background: 'var(--color-surface-container-lowest)', boxShadow: 'var(--shadow-ambient)' }}
            >
              <div className="flex justify-center">
                <LensRing size={96} ring={9}>
                  <span className="font-headline text-xl font-extrabold">{m?.mastery_pct ?? 0}%</span>
                </LensRing>
              </div>
              <span className="mini-label mt-3">{t('mastery_head')}</span>
              <p className="text-sm text-on-surface-variant" style={{ lineHeight: 1.6 }}>
                {m && isMastered(m)
                  ? t('mastery_done')
                  : t('mastery_togo', { n: toGo })}
              </p>

              {m && m.seen > 0 && (
                <dl className="mt-4 flex flex-col gap-1.5 text-start text-xs">
                  <div className="flex justify-between gap-2">
                    <dt className="text-on-surface-variant">{t('receptive')}</dt>
                    <dd className="font-bold">{m.correct_receptief}/{m.seen_receptief}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-on-surface-variant">{t('productive')}</dt>
                    <dd className="font-bold">{m.correct_productief}/{m.seen_productief}</dd>
                  </div>
                </dl>
              )}
              {/* Twee getallen en geen derde: `mastery_pct` is ONS getal en geen voorspelling
                  van een DUO-uitslag. SEO/facts.md §9 verbiedt een onnavolgbare slaagnorm, en
                  een percentage dat als slaagkans leest zou datzelfde doen. */}
              <p className="mt-3 text-[0.7rem] text-outline" style={{ lineHeight: 1.5 }}>
                {t('mastery_disclaimer')}
              </p>
            </div>

            {concept.reviewed_by && (
              <div className="mt-3 flex justify-center">
                <ValidationChip>
                  {t('reviewed_by', { who: concept.reviewed_by, when: concept.reviewed_on ?? '' })}
                </ValidationChip>
              </div>
            )}
            <span className="sr-only">{t(`mastery.${state}`)}</span>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
