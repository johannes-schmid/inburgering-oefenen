import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Info } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ownsModule } from '@/lib/entitlements';
import { emptyLevelledProgress, fetchPortalProgress, fetchPublishedExamNumbers } from '@/lib/portal-progress';
import { getSkillAtLevel, isFreeExamOf, isLevel } from '@/data/skills';
import { fetchPortalMenu } from '@/lib/portal-menu';
import { closeTrail, skillTrail } from '@/lib/portal-crumbs';
import AppShell from '../../../../components/AppShell';
import PortalCrumbs from '../../../../components/PortalCrumbs';
import { buildExamSlots } from '../../../_components/exam-slots';
import { SlotGrid } from '../../../_components/GlasSkill';

type Props = { params: Promise<{ locale: string; level: string; skill: string }> };

export const metadata: Metadata = {
  title: 'Alle oefenexamens | Inburgering Oefenen',
  robots: { index: false, follow: false },
};

/**
 * Alle tien oefenexamens van één onderdeel op één scherm, als Glas-examenkaarten (§G5).
 *
 * De onderdeelpagina draagt de tien vierkantjes: die antwoorden op *welk examen is nu?* Deze
 * pagina antwoordt op *hoe sta ik er over de hele reeks voor?* — daarvoor moeten ze alle tien
 * groot naast elkaar staan, met hun scores. Dezelfde staten: alles komt uit `buildExamSlots`.
 *
 * Niet te verwarren met de publieke `(main)/oefenexamen/[level]/[skill]`: die is de SEO- en
 * funnelpagina. Deze toont scores en pakketstatus, en die vereisen een sessie.
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

  const owns = ownsModule(meta, level, skill.slug);
  const p = progress[level][skill.slug];
  const { cards, factLine } = await buildExamSlots({
    locale,
    level,
    skill,
    progress: p,
    published: published[level][skill.slug],
    isGuest,
    owns,
  });
  const freeNumbers = new Set(
    Array.from({ length: skill.examCount }, (_, i) => i + 1).filter(n => isFreeExamOf(level, n)),
  );

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
      <div className="g-page">
        <PortalCrumbs
          glas
          trail={closeTrail(
            skillTrail({
              locale, level, skill: skill.slug,
              overviewLabel: t('crumb_overview'),
              skillName: s => tSkills(`${s}.name`),
            }),
            { label: t('stat_exams') },
          )}
        />

        <header className="g-ph">
          <h1>{`${tSkills(`${skill.key}.name`)} · ${t('stat_exams')}`}</h1>
          <p>
            {t('exams_made', { done: p.examsDone, total: skill.examCount })}
            {p.averagePct != null && ` · ${t('card_average', { pct: p.averagePct })}`}
          </p>
        </header>

        {/* Hier kies je een examen zonder de criteria in beeld, dus "dit wordt nagekeken met het
            schema van de docent" is nieuwe informatie (eigenaar, 15-09). */}
        {skill.scoring === 'open' && (
          <p className="g-notice g-notice-gap">
            <Info aria-hidden />
            <span>{t('rubric_note')}</span>
          </p>
        )}

        <section className="g-slots-wrap">
          <SlotGrid
            cards={cards}
            freeNumbers={freeNumbers}
            owns={owns}
            numberLabel={t('glas.exam')}
            freeLabel={t('glas.free')}
            sub={card => (card.state === 'passed' || card.state === 'sat')
              ? t('glas.score_best', { pct: card.cap.replace('%', '') })
              : factLine}
          />
        </section>
      </div>
    </AppShell>
  );
}
