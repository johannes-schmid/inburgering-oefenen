import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { getOnderdeel, levelLabel, type Level } from '@/data/skills';
import { fetchAdminLesson, countBrokenItems } from '@/lib/lessons/lessons-server';
import { lessonPath } from '@/lib/lessons/lessons';
import LessonEditor from './_components/LessonEditor';
import LessonStatus from './_components/LessonStatus';

type Props = { params: Promise<{ locale: string; id: string }> };

export const metadata: Metadata = {
  title: 'Les bewerken | Admin',
  robots: { index: false, follow: false },
};

/**
 * Eén les, om te bewerken: de leerstof en de opgaven die eraan hangen, in één scherm.
 *
 * ── DIT IS WAT `/admin/lessen` MISTE ─────────────────────────────────────────
 * De lijst kon een les vrijgeven en terugtrekken, en dat was alles: de inhoud kwam uit
 * `scripts/lesson-content/seed.mjs` en was daarna alleen nog te wijzigen door opnieuw te seeden.
 * Voor de vier taalonderdelen was dat te verdedigen zolang de cursus in één run werd geschreven,
 * maar niet voor de docent die er één opgave in wil bijzetten of een uitleg wil herformuleren —
 * dat is precies het werk dat de belofte "door een docent gevalideerd" waarmaakt.
 *
 * ── DE LES BEWERKEN IS DE LES NIET NAKIJKEN ──────────────────────────────────
 * De kop draagt twee losse besluiten (`LessonStatus`), de rest van het scherm de inhoud
 * (`LessonEditor`). Sinds 03-09 zijn dat echt twee kolommen in de database; zie
 * `supabase/migrations/20260903100000_lesson_checked.sql`.
 */
export default async function AdminLessonPage({ params }: Props) {
  const { locale, id } = await params;
  const lessonId = Number(id);
  if (!Number.isInteger(lessonId)) notFound();

  const lesson = await fetchAdminLesson(lessonId);
  if (!lesson) notFound();

  // Items met een kapotte payload worden door `fetchAdminLesson` overgeslagen. In het portaal is
  // dat goed (één kapot item mag geen les slopen); hier moet het gezegd worden, want opslaan zou
  // ze definitief verwijderen zonder dat iemand ze heeft gezien.
  const broken = await countBrokenItems(lesson.id, lesson.items.length);

  const { level, onderdeel } = lesson.block;
  const tSkills = await getTranslations('skills');
  const skill = getOnderdeel(onderdeel);
  const onderdeelName = skill ? tSkills(`${skill.key}.name`) : onderdeel;

  const backHref = `/${locale}/admin/lessen?niveau=${level ?? 'knm'}&onderdeel=${onderdeel}`;

  return (
    <div className="p-5 sm:p-8">
      <header className="mb-6">
        <a href={backHref} className="lei-back">
          <ArrowLeft size={14} strokeWidth={2.6} className="rtl-flip" aria-hidden /> Alle lessen
        </a>
        <p className="mt-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
          {level ? levelLabel(level as Level) : 'KNM'} · {onderdeelName} · blok {lesson.block.letter} — {lesson.block.name_nl}
        </p>
        <h1 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface">
          {lesson.title}
        </h1>
        {lesson.concepts.length > 0 && (
          <p className="mt-1 text-sm text-on-surface-variant">
            {lesson.concepts.map(c => `${c.name_nl}${c.role === 'reviews' ? ' (herhaling)' : ''}`).join(' · ')}
          </p>
        )}
      </header>

      <LessonStatus
        lessonId={lesson.id}
        released={lesson.review_status === 'validated'}
        checkedBy={lesson.checked_by}
        checkedOn={lesson.checked_on}
        viewHref={`/${locale}${lessonPath(level as Level, onderdeel, lesson.slug)}`}
      />

      {broken > 0 && (
        <p className="lei-error">
          {broken} {broken === 1 ? 'item' : 'items'} van deze les {broken === 1 ? 'heeft' : 'hebben'} een
          payload die niet valideert en {broken === 1 ? 'staat' : 'staan'} daarom niet in de lijst
          hieronder. Opslaan raakt {broken === 1 ? 'hem' : 'ze'} niet aan, maar de les rendert
          {broken === 1 ? ' hem' : ' ze'} ook niet — kijk in de serverlog welke items dit zijn.
        </p>
      )}

      <LessonEditor lesson={lesson} />
    </div>
  );
}
