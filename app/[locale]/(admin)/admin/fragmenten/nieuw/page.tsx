import { notFound } from 'next/navigation';
import { fetchNewFragmentContext } from '@/lib/admin/stimuli';
import { levelFromSearch } from '@/lib/admin/nav';
import FragmentEditor from '../_components/FragmentEditor';

export const revalidate = 0;

/**
 * A new fragment. It lands in the **backlog** — exam number 0 of the (level, skill) — and is
 * assigned to one of the ten oefenexamens later, in `/admin/exams`.
 *
 * Writing an item and filling a slot are separate actions (owner's decision, 2026-08-07), so this
 * route takes no exam: `?niveau=` and `?onderdeel=` are all it needs, and if that pair has no
 * backlog there is nowhere for the fragment to live and the page 404s rather than inventing one.
 *
 * A static segment, so it wins over `[id]` — `nieuw` is never parsed as a stimulus id.
 */
export default async function NewFragmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ niveau?: string; onderdeel?: string }>;
}) {
  const { locale } = await params;
  const search = await searchParams;
  const level = levelFromSearch(search.niveau);
  const skill = search.onderdeel;
  if (!skill) notFound();

  const context = await fetchNewFragmentContext(level, skill);
  if (!context) notFound();

  return <FragmentEditor context={context} locale={locale} />;
}
