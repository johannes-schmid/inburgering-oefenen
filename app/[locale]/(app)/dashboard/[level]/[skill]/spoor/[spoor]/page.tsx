import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ownsModule } from '@/lib/entitlements';
import { getSkillAtLevel, isLevel } from '@/data/skills';
import { CategoryMark } from '@/components/horizon';
import { fetchSporen } from '@/lib/lessons/sporen-server';
import { fetchConcepts, fetchMastery } from '@/lib/lessons/concepts-server';
import { conceptPath, weakestFirst } from '@/lib/lessons/lessons';
import { wordsPath } from '@/lib/lessons/words';
import { isSpoor, modulePath, spoorPath, SPOREN, type SpoorSlug } from '@/lib/lessons/sporen';
import { fetchPortalMenu } from '@/lib/portal-menu';
import { closeTrail, skillTrail } from '@/lib/portal-crumbs';
import PortalCrumbs from '../../../../../components/PortalCrumbs';
import AppShell from '../../../../../components/AppShell';

type Props = { params: Promise<{ locale: string; level: string; skill: string; spoor: string }> };

export const metadata: Metadata = {
  title: 'Lessen | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

/** De titel van een spoor staat al in de leerroute; twee keer hetzelfde woord vertalen loopt uit elkaar. */
const TITLE_KEY: Record<SpoorSlug, string> = {
  taalregels: 'leerroute_grammatica_title',
  examentraining: 'leerroute_strategie_title',
};

const MARK: Record<SpoorSlug, 'grammatica' | 'examentraining'> = {
  taalregels: 'grammatica',
  examentraining: 'examentraining',
};

/**
 * Eén leerspoor: een raster modules met de voortgang erin.
 *
 * Bewust exact de vorm van het woordkaartenscherm — een totaalbalk boven een raster kaarten —
 * want dit is dezelfde vraag ("waar sta ik, waar ga ik verder") en de kandidaat hoort niet per
 * stap van de leerroute een nieuw scherm te leren lezen. De lange blokkenlijst met de tweede
 * kolom ernaast is hiervoor ingeruild (beslissing eigenaar, 02-09).
 *
 * **De poort staat op de les, niet hier**, net als bij `leren` en `woorden`: het overzicht mag
 * laten zien wát er is, want dat is wat er te koop is.
 */
export default async function SpoorPage({ params }: Props) {
  const { locale, level: rawLevel, skill: slug, spoor: rawSpoor } = await params;
  if (!isLevel(rawLevel) || !isSpoor(rawSpoor)) notFound();
  const level = rawLevel;
  const spoor = rawSpoor;
  const skill = getSkillAtLevel(level, slug);
  if (!skill) notFound();

  const t = await getTranslations('lessons');
  const tPortal = await getTranslations('portal');
  const tSkills = await getTranslations('skills');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=${spoorPath(level, skill.slug, spoor)}`);

  const meta = user.user_metadata ?? {};
  const owned = ownsModule(meta, level, skill.slug);

  const [sporen, menu] = await Promise.all([
    fetchSporen(level, skill.slug, user.id),
    fetchPortalMenu(),
  ]);
  const current = sporen.find(s => s.slug === spoor);
  // Geen module met een vrijgegeven les = dit spoor bestaat hier niet. Zelfde gate als `leren`.
  if (!current || current.modules.length === 0) notFound();

  /**
   * Wat je nog kunt oefenen: de drie zwakste regels van dít onderdeel.
   *
   * Dit is het enige dat de vervallen conceptenpagina had en niets anders — en het staat nu
   * hier, in de cursus waar je er iets mee kunt. `weakestFirst` neemt alleen regels met
   * `seen > 0` mee, dus zolang er niets is geantwoord staat er niets: een strook met drie
   * regels op 0% zou de hele cursus als zwakte aanwijzen.
   */
  const ruleConcepts = spoor === 'taalregels' ? await fetchConcepts(level, skill.slug) : [];
  const weakest = ruleConcepts.length > 0
    ? weakestFirst(ruleConcepts, await fetchMastery(user.id, ruleConcepts.map(c => c.id)), 3)
    : [];

  /**
   * De naam en de inleiding komen uit de cursus zelf als die ze heeft.
   *
   * Voor het regelspoor heeft hij ze sinds 10-09 niet: `sporenFromBlocks` zet `name` en `intro`
   * daar op `null`, want ze kwamen uit blok B en dat blok is nu één module van zes. Deze stap
   * heet dus in elke cursus Taalregels. Het examenspoor gebruikt de kop van zijn blok nog wel.
   */
  const title = current.name ?? tPortal(TITLE_KEY[spoor]);
  const intro = current.intro ?? t(`spoor_${spoor}_intro`);

  /** Hetzelfde voor de zusjes in het kruimelpad, zodat de twee namen niet uit elkaar lopen. */
  const spoorLabel = (sl: SpoorSlug) =>
    sporen.find(x => x.slug === sl)?.name ?? tPortal(TITLE_KEY[sl]);

  return (
    <AppShell
      locale={locale}
      email={user.email ?? ''}
      avatarUrl={String(meta.avatar_url ?? meta.picture ?? '')}
      active={skill.slug}
      activeGroup={level}
      menu={menu}
      isGuest={false}
    >
      <div className="px-5 py-7 sm:px-8 sm:py-10">
        <div className="max-w-5xl mx-auto">
          {/* Het spoor is het laatste kruimeltje, met de twee andere sporen als zusjes:
              van Grammatica naar Examentraining is één klik en geen omweg via het onderdeel. */}
          <PortalCrumbs
            trail={closeTrail(
              skillTrail({
                locale, level, skill: skill.slug,
                overviewLabel: tPortal('crumb_overview'),
                skillName: slug => tSkills(`${slug}.name`),
              }),
              {
                label: title,
                siblings: [
                  {
                    label: tPortal('leerroute_woordenschat_title'),
                    href: `/${locale}${wordsPath(level, skill.slug)}`,
                  },
                  ...SPOREN.map(sl => ({
                    label: spoorLabel(sl),
                    href: `/${locale}${spoorPath(level, skill.slug, sl)}`,
                    current: sl === spoor,
                    muted: (sporen.find(x => x.slug === sl)?.modules.length ?? 0) === 0,
                  })),
                ],
              },
            )}
          />

          <header className="skill-head">
            <h1>{title}</h1>
            <p>{intro}</p>
          </header>

          {/* De totaalbalk, zoals op de woordkaarten: één regel over alle modules samen. */}
          <section className="panel wt-total">
            <span className="wt-total-mark">
              <CategoryMark category={MARK[spoor]} size={40} />
            </span>
            <span className="wt-total-body">
              <span className="wt-total-head">{t('spoor_total')}</span>
              <span className="wt-total-bar" aria-hidden>
                <span style={{ width: `${current.pct}%` }} />
              </span>
              <span className="wt-total-sub">
                {t('block_progress', { done: current.done, total: current.total })}
              </span>
            </span>
            <span className="wt-total-pct">{current.pct}%</span>
          </section>

          {weakest.length > 0 && (
            <section className="panel sp-weak">
              <span className="mini-label">{t('weakest_head')}</span>
              <div className="sp-weak-row">
                {weakest.map(({ concept, mastery: m }) => (
                  <a
                    key={concept.id}
                    href={`/${locale}${conceptPath(level, concept.slug)}`}
                    className="sp-weak-item"
                  >
                    <b>{concept.name_nl}</b>
                    <span>{m.mastery_pct}%</span>
                  </a>
                ))}
              </div>
            </section>
          )}

          <div className="wt-grid">
            {current.modules.map((m, i) => {
              // Een module is open zodra er één gratis les in zit: de etalage zit in de
              // module, niet ernaast. De les zelf weigert daarna wat niet gratis is.
              const openable = owned || m.lessons.some(l => l.is_free);
              const href = openable
                ? `/${locale}${modulePath(level, skill.slug, spoor, m.slug)}`
                : undefined;
              const Root = href ? 'a' : 'div';
              return (
                <Root
                  key={m.slug}
                  {...(href ? { href } : {})}
                  className={`leer-card wt-card${href ? '' : ' is-locked'}`}
                >
                  <span className="lc-cap">
                    <span className="lc-chip">{t('module_n', { n: i + 1 })}</span>
                    <span className="lc-mark" aria-hidden="true">
                      <CategoryMark category={MARK[spoor]} size={112} tone="dark" bare />
                    </span>
                  </span>
                  <span className="lc-body">
                    <span className="lc-copy">
                      <span className="lc-title">{m.name}</span>
                      <span className="lc-blurb">
                        {t('module_lessons', { n: m.total })}
                        {/* Het gewicht, en dat is alles wat `weight` nog doet: deze regel en de
                            volgorde van de kaarten. Het filtert niets meer weg — wat in dit
                            onderdeel staat, staat in deze lijst. `kern` is `null` voor de
                            module van de cursus zelf (Klank en tempo, Bouwstenen, Uitspraak),
                            want die bestaat niet uit regels en heeft dus geen gewicht. */}
                        {m.kern != null && (
                          <>
                            {' · '}
                            {m.kern === 0
                              ? t('rules_group_recognise')
                              : t('rules_group_core', { n: m.kern, total: m.total })}
                          </>
                        )}
                      </span>
                    </span>

                    <span className="wt-prog" aria-hidden>
                      <span style={{ width: `${m.pct}%` }} />
                    </span>

                    <span className="wt-foot">
                      <span className="wt-foot-n">
                        {t('module_done_of', { done: m.done, total: m.total })}
                        {/* Het percentage naast het aantal: "5 van 8 af" is de telling, het
                            percentage is hoe ver je bent — en dat is wat je van een module
                            wilt weten voordat je hem opent. */}
                        <b className="wt-foot-pct">{m.pct}%</b>
                      </span>
                      <span className="wt-foot-go">
                        {href ? (
                          <>
                            {m.done === 0
                              ? t('module_start')
                              : m.done === m.total
                                ? t('module_again')
                                : t('module_continue')}
                            <ArrowRight size={14} strokeWidth={2.4} className="rtl-flip" />
                          </>
                        ) : (
                          <>
                            <Lock size={13} strokeWidth={2.2} />
                            {t('module_locked')}
                          </>
                        )}
                      </span>
                    </span>
                  </span>
                </Root>
              );
            })}
          </div>

          {/* Hier stond een uitgang naar de bibliotheek. Die is vervallen (10-09): dit scherm
              ís de bibliotheek van dit examen — alle regels die het vraagt, in eigen modules —
              en er is dus geen verderop meer. Wat níet in dit onderdeel staat, staat er ook
              niet in de cursus: zie de kop van `fetchRuleModules`. */}

          {!owned && (
            <a
              href={`/${locale}/dashboard/pakketten?onderdeel=${level}:${skill.slug}&vanaf=spoor-${spoor}`}
              className="wt-upsell"
            >
              {t('spoor_upsell', { skill: tSkills(`${skill.key}.name`) })}
              <ArrowRight size={15} strokeWidth={2.4} className="rtl-flip" />
            </a>
          )}
        </div>
      </div>
    </AppShell>
  );
}
