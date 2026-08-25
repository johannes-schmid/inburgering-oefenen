/**
 * PostgREST caps a plain `select()` at 1,000 rows, and it does so **silently** — no error, no
 * flag on the response, just a shorter array.
 *
 * That cap turned into a wrong number on a screen the docent works from. `/admin/exams` counts
 * items per exam by fetching every `questions` row and tallying them; once the table passed a
 * thousand rows (B1's thirty exams got it close, KNM's 419 questions took it past), the tally
 * only saw the first thousand and every exam beyond that point rendered as incomplete. A full
 * forty-question exam showed "23 / 40" and its progress bar sat two-thirds full. Nothing
 * errored, and the number is plausible enough that it reads as missing content rather than as
 * a bug — which is the worst kind, on a screen whose whole job is telling you what is missing.
 *
 * So: any admin query that tallies or lists a whole table must go through this. It pages with
 * `range()` until a short page comes back.
 */
const PAGE = 1000;

export async function fetchAll<T>(
  /**
   * Builds one page. A factory taking the range rather than a query object, because a
   * PostgrestFilterBuilder is a thenable that resolves once — the same instance cannot be
   * ranged twice, and reusing it returns the first page forever.
   *
   *   fetchAll<Row>((from, to) => supabase.from('questions').select('exam_id').range(from, to))
   */
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error || !data) break;
    out.push(...data);
    if (data.length < PAGE) break;
  }
  return out;
}
