import { fetchContentRows } from '@/lib/admin/content-rows';
import { fetchAuthoringContext } from '@/lib/admin/authoring';
import { levelFromSearch } from '@/lib/admin/nav';
import { levelLabel } from '@/data/skills';
import ContentTable from './_components/ContentTable';

export const revalidate = 0;

/**
 * Every exam item, all four onderdelen, one table.
 *
 * There used to be three screens for this: `/admin/questions` (Lezen, Luisteren),
 * `/admin/opgaven` (Schrijven, Spreken) and briefly `/admin/content`. The first split mirrored the
 * database — `questions` versus `open_tasks` — and the docent does not think in tables; she thinks
 * in "de items van examen 3". The skill is a tab, the shape is a column, and which table a row
 * came from only matters to the code that writes it back.
 *
 * The per-item routes stay and are reached from the drawer's "Volledige editor":
 * `questions/[id]/edit`, `questions/new`, `opgaven/[id]/edit`, `opgaven/new`. They hold the parts
 * the drawer deliberately does not — per-option image sets, stimulus reassignment, the form schema.
 */
export default async function QuestionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ niveau?: string; onderdeel?: string }>;
}) {
  const { locale } = await params;
  const search = await searchParams;
  const level = levelFromSearch(search.niveau);
  const [rows, authoring] = await Promise.all([
    fetchContentRows(),
    fetchAuthoringContext(level),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <p className="font-headline text-xs font-bold tracking-[0.08em] text-secondary uppercase">
          Niveau {levelLabel(level)}
        </p>
        <h1 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface">
          Vragen en opdrachten
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
          Alle items van de vier onderdelen. Klik op een rij om hem te bewerken, tekst te laten
          voorstellen of audio te genereren.
        </p>
      </header>

      <ContentTable
        rows={rows}
        locale={locale}
        level={level}
        authoring={authoring}
        initialSkill={search.onderdeel}
      />
    </div>
  );
}
