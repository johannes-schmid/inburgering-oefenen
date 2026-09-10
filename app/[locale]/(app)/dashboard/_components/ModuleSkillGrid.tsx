import { getTranslations } from 'next-intl/server';
import { levelLabel, skillsAtLevel, type Level, type SkillSlug } from '@/data/skills';
import { CategoryMark } from '@/components/horizon';
import type { PortalProgress } from '@/lib/portal-progress';
import { moduleKey } from '@/lib/lessons/lessons-server';
import { readiness } from '@/lib/lessons/readiness';
import TrackCard, { type TrackCardMeta } from './TrackCard';

export type SkillNext = { title: string; href: string } | null;

/**
 * De vier onderdelen van één niveau, in dezelfde kaart als de modules op `/dashboard`.
 *
 * Het waren vier regels (`.skill-row`, nu weg uit `globals.css`). Dat werkte, maar het portaal
 * had daarmee twee vormen voor dezelfde vraag — *hoe ver ben ik en wat is de volgende stap?* —
 * één per pagina. `TrackCard` doet
 * het nu op beide altitudes, en de kandidaat die van `/dashboard` hierheen klikt ziet hetzelfde
 * object een niveau dieper in plaats van een nieuw scherm.
 *
 * **`layer="onderdeel"` en `tone="dark"` horen bij elkaar.** Het paneel is navy (de eigenaar,
 * 08-09), dus de cut-kleur van het merkteken moet de navy zijn — een `CategoryMark` op de lichte
 * tegel zou als een tweede tegel in het paneel lezen. Wat de twee altitudes onderscheidt is de
 * tekening plus het vlakke vlak tegen het merkverloop van een module, niet meer de tegelkleur.
 *
 * Alles wat hier niet staat — de tien examenslots, het zwakste concept, de lestelling — staat één
 * klik verder, op `/dashboard/[level]/[skill]`, waar het over dat ene onderdeel gaat.
 */
export default async function ModuleSkillGrid({
  locale,
  level,
  progress,
  lessons,
  next,
}: {
  locale: string;
  level: Level;
  progress: PortalProgress;
  /** Lestellingen per moduleKey — `fetchLessonCounts`. */
  lessons: Map<string, { done: number; total: number }>;
  /** De eerstvolgende les per onderdeel — `fetchNextLesson` per module. */
  next: Map<SkillSlug, SkillNext>;
}) {
  const t = await getTranslations('portal');
  const tSkills = await getTranslations('skills');

  return (
    <div className="ov-cards">
      {skillsAtLevel(level).map(skill => {
        const p = progress[skill.slug];
        const les = lessons.get(moduleKey(level, skill.slug)) ?? { done: 0, total: 0 };
        const r = readiness({
          lessonsDone: les.done,
          lessonsTotal: les.total,
          examsDone: p.examsDone,
          examCount: skill.examCount,
          averagePct: p.averagePct,
        });
        const step = next.get(skill.slug) ?? null;

        /* Gemeten of niet, en dat bepaalt welk gezicht de kaart krijgt: met een cijfer draagt de
           voet de examenstelling, zonder cijfer waar het onderdeel uit bestaat. Een balk op 0%
           bij iemand die nog niets deed leest als voortgang die hij kwijt is. */
        const measured = r.pct !== null;
        const meta: TrackCardMeta[] = [
          {
            icon: 'parts',
            label: les.total === 0
              ? t('mod_no_lessons')
              : t('mod_lessons', { done: les.done, total: les.total }),
          },
          { icon: 'exams', label: t('card_exams', { n: skill.examCount }) },
        ];

        return (
          <TrackCard
            key={skill.slug}
            layer="onderdeel"
            mark={<CategoryMark category={skill.slug} size={56} tone="dark" />}
            sub={t('level_section', { level: levelLabel(level) })}
            title={tSkills(`${skill.key}.name`)}
            state={measured ? 'active' : 'open'}
            meta={meta}
            note={step
              ? t('ov_next', { lesson: step.title })
              : les.total === 0
                ? t('ov_next_empty')
                : t('ov_next_none')}
            pct={r.pct}
            progressLabel={t('mod_exams', { done: p.examsDone, total: skill.examCount })}
            cta={t('mod_continue')}
            href={`/${locale}/dashboard/${level}/${skill.slug}`}
            soonLabel={t('tag_soon')}
          />
        );
      })}
    </div>
  );
}
