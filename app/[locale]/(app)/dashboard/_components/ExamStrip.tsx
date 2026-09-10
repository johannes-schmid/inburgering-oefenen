import { getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { CarouselItem } from '@/components/ui/carousel';
import type { Level, LevelledSkill } from '@/data/skills';
import type { SkillProgress } from '@/lib/portal-progress';
import { buildExamSlots } from './exam-slots';
import ExamCard from './ExamCard';
import ExamCarousel from './ExamCarousel';

/**
 * De tien oefenexamens als carrousel onderaan de onderdeelpagina.
 *
 * Dit waren tien rijen van elk 64px — 700px voor tien getallen, en de kandidaat kwam ze voor één
 * vraag halen: *waar sta ik en welk examen is nu?* De kaartjes zeggen dat naast elkaar; de
 * carrousel geeft de rij een greep zodra er iets buiten beeld staat (`ExamCarousel`).
 *
 * Alle tien zien is een andere vraag dan de volgende starten, en die krijgt zijn eigen scherm:
 * `oefenexamens/page.tsx` zet dezelfde kaartjes in een raster. De kop wijst daarheen.
 *
 * De staten en de hrefs komen uit `buildExamSlots`, dat beide schermen deelt.
 */
export default async function ExamStrip({
  locale, level, skill, progress, published, isGuest, owns,
}: {
  locale: string;
  level: Level;
  skill: LevelledSkill;
  progress: SkillProgress;
  published: Set<number>;
  isGuest: boolean;
  owns: boolean;
}) {
  const t = await getTranslations('portal');
  const tSkills = await getTranslations('skills');

  const { cards, factLine } = await buildExamSlots({
    locale, level, skill, progress, published, isGuest, owns,
  });

  const head = (
    <>
      <h2 className="es-title">{t('stat_exams')}</h2>
      <p className="es-meta">
        {t('exams_made', { done: progress.examsDone, total: skill.examCount })}
        {progress.averagePct != null && ` · ${t('card_average', { pct: progress.averagePct })}`}
      </p>
      <a
        href={`/${locale}/dashboard/${level}/${skill.slug}/oefenexamens`}
        className="es-all no-underline"
      >
        {t('exams_all')}
        <ArrowRight size={13} strokeWidth={2.6} className="rtl-flip" />
      </a>
    </>
  );

  return (
    <section className="panel exam-strip">
      <ExamCarousel
        head={head}
        rtl={locale === 'ar'}
        prevLabel={t('exams_prev')}
        nextLabel={t('exams_next')}
      >
        {cards.map(card => (
          <CarouselItem key={card.n} className="es-slide">
            <ExamCard card={card} factLine={factLine} startLabel={tSkills('start_exam')} />
          </CarouselItem>
        ))}
      </ExamCarousel>
    </section>
  );
}
