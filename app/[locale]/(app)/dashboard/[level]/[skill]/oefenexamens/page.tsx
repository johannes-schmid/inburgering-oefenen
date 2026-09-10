import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { ownsModule } from '@/lib/entitlements';
import { emptyLevelledProgress, fetchPortalProgress, fetchPublishedExamNumbers } from '@/lib/portal-progress';
import { getSkillAtLevel, isLevel } from '@/data/skills';
import { fetchPortalMenu } from '@/lib/portal-menu';
import { closeTrail, skillTrail } from '@/lib/portal-crumbs';
import AppShell from '../../../../components/AppShell';
import PortalCrumbs from '../../../../components/PortalCrumbs';
import { buildExamSlots } from '../../../_components/exam-slots';
import ExamCard from '../../../_components/ExamCard';

type Props = { params: Promise<{ locale: string; level: string; skill: string }> };

export const metadata: Metadata = {
  title: 'Alle oefenexamens | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

/**
 * Alle tien oefenexamens van één onderdeel op één scherm.
 *
 * De onderdeelpagina draagt de carrousel: die antwoordt op *welk examen is nu?* en houdt de
 * diagnose erboven in beeld. Deze pagina antwoordt op de andere vraag — *hoe sta ik er over de
 * hele reeks voor?* — en daarvoor moeten ze alle tien tegelijk te zien zijn, met hun scores naast
 * elkaar. Datzelfde onderscheid maakt het KNM-portaal met zijn examenweergave.
 *
 * Dezelfde kaartjes, dezelfde staten: alles komt uit `buildExamSlots`, dus een slot kan hier
 * nooit iets anders zeggen dan in de strook.
 *
 * Niet te verwarren met de publieke `(main)/oefenexamen/[level]/[skill]`: die is de SEO- en
 * funnelpagina en moet voor een anonieme bezoeker renderen. Deze toont scores en pakketstatus, en
 * die vereisen een sessie.
 */
export default async function AllExamsPage({ params }: Props) {
  const { locale, level: rawLevel, skill: slug } = await params;
  if (!isLevel(rawLevel)) notFound();
  const level = rawLevel;
  const skill = getSkillAtLevel(level, slug);
  if (!skill) notFound();

  const t = await getTranslations('portal');
  const tSkills = await getTranslations('skills');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  /** Een gast mag het portaal bekijken; de muur staat bij de speler zelf. */
  const isGuest = !user;
  const meta = user?.user_metadata ?? {};

  const [progress, published, menu] = await Promise.all([
    user ? fetchPortalProgress(user.id) : Promise.resolve(emptyLevelledProgress()),
    fetchPublishedExamNumbers(),
    fetchPortalMenu(),
  ]);

  const p = progress[level][skill.slug];
  const { cards, factLine } = await buildExamSlots({
    locale,
    level,
    skill,
    progress: p,
    published: published[level][skill.slug],
    isGuest,
    owns: ownsModule(meta, level, skill.slug),
  });

  return (
    <AppShell
      locale={locale}
      email={user?.email ?? ''}
      avatarUrl={String(meta.avatar_url ?? meta.picture ?? '')}
      active={skill.slug}
      activeGroup={level}
      menu={menu}
      isGuest={isGuest}
    >
      <div className="px-5 py-7 sm:px-8 sm:py-10">
        <div className="max-w-5xl mx-auto">
          <PortalCrumbs
            trail={closeTrail(
              skillTrail({
                locale, level, skill: skill.slug,
                overviewLabel: t('crumb_overview'),
                skillName: s => tSkills(`${s}.name`),
              }),
              { label: t('stat_exams') },
            )}
          />

          <div className="ov-head">
            <h1>{`${tSkills(`${skill.key}.name`)} · ${t('stat_exams')}`}</h1>
            <p>
              {t('exams_made', { done: p.examsDone, total: skill.examCount })}
              {p.averagePct != null && ` · ${t('card_average', { pct: p.averagePct })}`}
            </p>
          </div>

          {skill.scoring === 'open' && <p className="rubric-note mb-5">{t('rubric_note')}</p>}

          {/* Een raster, geen carrousel: hier is "alle tien in één beeld" de hele opdracht. */}
          <section className="panel exam-strip">
            <ul className="es-grid">
              {cards.map(card => (
                <li key={card.n}>
                  <ExamCard card={card} factLine={factLine} startLabel={tSkills('start_exam')} />
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
