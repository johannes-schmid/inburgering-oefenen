import { notFound } from 'next/navigation';
import { fetchFragment } from '@/lib/admin/stimuli';
import FragmentEditor from '../_components/FragmentEditor';

export const revalidate = 0;

/**
 * One fragment, full page: the text or audio, its questions, and a live candidate preview.
 *
 * This replaced the right-hand drawer in `/admin/questions`. A fragment is a text plus 2–3
 * questions plus their options and answer keys; the drawer could hold about a fifth of that, and
 * the questions were edited on a different screen from the text they are about.
 *
 * There is deliberately **one** editor for a fragment — clicking a fragment row anywhere lands
 * here. Two screens able to write the same rows is the thing CLAUDE.md already forbids for
 * questions and options, and for the same reason.
 */
export default async function FragmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  /** `?vraag=` opens one question of the fragment — how the content table links to a question. */
  searchParams: Promise<{ vraag?: string }>;
}) {
  const { locale, id } = await params;
  const { vraag } = await searchParams;
  const stimulusId = Number(id);
  if (!Number.isInteger(stimulusId) || stimulusId <= 0) notFound();

  const context = await fetchFragment(stimulusId);
  if (!context) notFound();

  const focusQuestionId = Number(vraag);

  return (
    <FragmentEditor
      context={context}
      locale={locale}
      focusQuestionId={Number.isInteger(focusQuestionId) ? focusQuestionId : null}
    />
  );
}
