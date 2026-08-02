import { fetchContentRows } from '@/lib/admin/content-rows';
import ContentTable from './_components/ContentTable';

export const revalidate = 0;

/**
 * Every exam item, all four onderdelen, one table.
 *
 * This replaces the split between `/admin/questions` (Lezen, Luisteren) and `/admin/opgaven`
 * (Schrijven, Spreken). That split mirrored the database — `questions` versus `open_tasks` — and
 * the docent does not think in tables; she thinks in "the items of exam 3". The skill is a tab,
 * the shape is a column, and which table a row came from only matters to the code that writes it
 * back.
 *
 * The old routes stay for now: `/admin/questions/[id]/edit` is still the full editor for the parts
 * the drawer deliberately does not carry (per-option image sets, stimulus reassignment).
 */
export default async function ContentPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const rows = await fetchContentRows();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface">
          Content
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
          Alle vragen en opdrachten van de vier onderdelen. Klik op een rij om hem te bewerken,
          tekst te laten voorstellen of audio te genereren.
        </p>
      </header>

      <ContentTable rows={rows} locale={locale} />
    </div>
  );
}
