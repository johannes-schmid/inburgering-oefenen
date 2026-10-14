import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArrowLeft, ArrowRight, Lock, Minus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { isLevel, levelLabel, SKILLS, isKnm } from '@/data/skills';
import { fetchPortalMenu } from '@/lib/portal-menu';
import { fetchConcept, fetchConcepts, fetchConceptTracks, fetchMastery } from '@/lib/lessons/concepts-server';
import { conceptPath, isMastered, masteryState, MASTERY_STREAK } from '@/lib/lessons/lessons';
import CategoryMark from '@/components/horizon/CategoryMark';
import ValidationSeal from '@/components/glas/ValidationSeal';
import '@/app/glas-leerlaag.css';
import AppShell from '../../../../components/AppShell';
import { conceptsPanel } from '../../../../components/nav';

type Props = { params: Promise<{ locale: string; level: string; slug: string }> };

export const metadata: Metadata = {
  title: 'Taalregel | Inburgering Oefenen',
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
  if (!user) redirect(`/${locale}/login?next=/dashboard/${level}/taalregel/${slug}`);

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
      active={undefined}
      activeGroup={level}
      menu={menu}
      learn={conceptsPanel(panelGroups, {
        title: t('rules_panel_title', { level: levelLabel(level) }),
        backHref: `/dashboard/${level}`,
        backLabel: levelLabel(level),
        conceptHref: (slug: string) => conceptPath(level, slug),
        currentSlug: concept.slug,
      })}
    >
      <div className="g-leer gl-shell">
        <div className="gl-rule">

          <main className="gl-rule-main">
            {/* Terug naar het niveau, want boven deze pagina staat geen bibliotheek meer:
                de regels van een examen staan in stap 2 van die cursus. De vier oefenwegen
                verderop op deze pagina zijn de echte weg vooruit. */}
            <a href={`/${locale}/dashboard/${level}`} className="gl-back">
              <ArrowLeft size={15} strokeWidth={2.4} className="rtl-flip" aria-hidden />
              {levelLabel(level)}
            </a>

            <article className="gl-page">
              <div className="gl-in">
                <header className="gl-head">
                  <CategoryMark category="taalregels" size={44} />
                  <h1 className="g-head gl-title">{concept.name_nl}</h1>
                  <p className="g-mono gl-rule-meta">
                    {concept.group?.name_nl ?? t('group_strategy')}
                    {concept.onderdelen.length > 0 && (
                      <> · {t('appears_in')} {concept.onderdelen.map(skillName).join(' · ')}</>
                    )}
                  </p>
                  <p className="gl-learn">{concept.one_liner}</p>
                </header>

                {concept.example_html && (
                  <p className="cc-example gl-rule-example" dangerouslySetInnerHTML={{ __html: concept.example_html }} />
                )}

                {concept.body_html && (
                  <div className="rule-panel">
                    <div dangerouslySetInnerHTML={{ __html: concept.body_html }} />
                  </div>
                )}
              </div>
            </article>

            <section className="gl-block">
              <h2 className="gl-rule-h2">{t('practise_head')}</h2>
              <ul className="gl-lessons">
                {tracks.map(track => {
                  /**
                   * Drie toestanden, en ze moeten visueel verschillen.
                   *
                   * `open`     — er is een les en je hebt hem: een pijl.
                   * `locked`   — er is een les, maar niet in jouw cursus: slot, en de rij is een
                   *              link naar het aanbod.
                   * `unbuilt`  — er is nog geen les voor dit onderdeel. **Geen slot**, want er is
                   *              niets om te ontsluiten; een slot zou zeggen "betaal en je krijgt
                   *              het", en dat is niet waar. Geen link ook, en gestippeld.
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
                        className={`gl-les gl-track is-${state}`}
                      >
                        <span className="gl-les-ic" aria-hidden>
                          {state === 'locked' && <Lock size={12} strokeWidth={2.5} />}
                          {state === 'unbuilt' && <Minus size={12} strokeWidth={2.5} />}
                        </span>
                        <span className="gl-les-t">
                          <b>{skillName(track.onderdeel)}</b>
                          <small>
                            {state === 'open' ? track.lesson!.title
                              : state === 'locked' ? t('track_locked')
                              : t('track_none')}
                          </small>
                        </span>
                        {state === 'open' && (
                          <span className="gl-next-go" aria-hidden>
                            <ArrowRight size={16} strokeWidth={2.4} className="rtl-flip" />
                          </span>
                        )}
                      </Row>
                    </li>
                  );
                })}
              </ul>
            </section>
          </main>

          {/* De rechterrail: beheersing, de reeks, en de reviewregel. */}
          <aside className="gl-rule-side">
            <div className="gl-mastery">
              <span className="g-mono">{t('mastery_head')}</span>
              <MasteryRing pct={m?.mastery_pct ?? 0} />
              <p>
                {m && isMastered(m)
                  ? t('mastery_done')
                  : t('mastery_togo', { n: toGo })}
              </p>

              {m && m.seen > 0 && (
                <dl className="gl-mastery-dl">
                  <div>
                    <dt>{t('receptive')}</dt>
                    <dd className="g-tnum">{m.correct_receptief}/{m.seen_receptief}</dd>
                  </div>
                  <div>
                    <dt>{t('productive')}</dt>
                    <dd className="g-tnum">{m.correct_productief}/{m.seen_productief}</dd>
                  </div>
                </dl>
              )}
              {/* Twee getallen en geen derde: `mastery_pct` is ONS getal en geen voorspelling
                  van een DUO-uitslag. SEO/facts.md §9 verbiedt een onnavolgbare slaagnorm, en
                  een percentage dat als slaagkans leest zou datzelfde doen. */}
              <small>{t('mastery_disclaimer')}</small>
            </div>

            {concept.reviewed_by && (
              <ValidationSeal>
                {t('reviewed_by', { who: concept.reviewed_by, when: concept.reviewed_on ?? '' })}
              </ValidationSeal>
            )}
            <span className="sr-only">{t(`mastery.${state}`)}</span>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

/**
 * De beheersing als één navy ring om het getal. Geen segmenten en geen oefengrens: dit is ons
 * eigen getal over jouw oefeningen, geen slaagkans (zie de disclaimer ernaast).
 */
function MasteryRing({ pct }: { pct: number }) {
  const C = 2 * Math.PI * 42;
  return (
    <span className="gl-ring">
      <svg viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(0,43,109,.1)" strokeWidth="9" />
        {pct > 0 && (
          <circle
            cx="50" cy="50" r="42" fill="none" stroke="#002b6d" strokeWidth="9" strokeLinecap="round"
            strokeDasharray={`${((Math.min(100, pct) / 100) * C).toFixed(1)} ${C.toFixed(1)}`}
            transform="rotate(-90 50 50)"
          />
        )}
      </svg>
      <b className="g-tnum">{pct}<small>%</small></b>
    </span>
  );
}
