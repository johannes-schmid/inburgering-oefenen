/**
 * Landingspagina's voor `/admin/seo` (besluit eigenaar, 13-11): richting A, "probeer direct". De
 * voorstellen staan in `seo-agent/landing-pages.json`, die de zaterdagrun bijhoudt; dit bestand
 * zet ze om naar rijen voor de pagina-tabel en bewaakt de regels. Puur, zodat de test het kan lezen.
 *
 * De belangrijkste regel: hooguit `new_urls_per_week` nieuwe URL's per week. Na de demotie van
 * september (spam-update) is "veel nieuwe pagina's snel" precies het patroon dat Google afstrafte;
 * een upgrade van een bestaande pagina telt niet mee.
 */

export type LandingStatus = 'suggested' | 'approved' | 'live' | 'dismissed';

export type LandingItem = {
  id: string;
  created: string;
  week: string;
  status: LandingStatus;
  kind: 'upgrade' | 'new';
  path: string;
  query: string;
  title: string;
  variant: string;
  demand: number;
  evidence: string;
  competitor: string;
  why: string;
  checks: boolean[];
  owner: string;
};

export type LandingFile = {
  updated: string;
  rules: { direction: string; suggestions_per_week: [number, number]; new_urls_per_week: number; checks: string[] };
  items: LandingItem[];
};

/** Wat de tabel van een landingspagina nodig heeft, naast de velden van een gewoon voorstel. */
export type LandingInfo = Pick<LandingItem, 'id' | 'status' | 'kind' | 'path' | 'query' | 'variant' | 'competitor'> & {
  checks: { label: string; ok: boolean }[];
};

/** Een week als maandag-datum (ISO 8601), voor de "starts"-kolom van een voorstel. */
export function weekStart(isoWeek: string): string {
  const [y, w] = isoWeek.split('-W').map(Number);
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const monday = new Date(jan4.getTime() - ((jan4.getUTCDay() + 6) % 7) * 86_400_000);
  return new Date(monday.getTime() + (w - 1) * 7 * 86_400_000).toISOString().slice(0, 10);
}

/** De open voorstellen (voorgesteld of goedgekeurd) als rijen; live en afgewezen staan er niet bij. */
export function landingSuggestions(file: LandingFile | null) {
  if (!file) return [];
  return file.items
    .filter(i => i.status === 'suggested' || i.status === 'approved')
    .map(i => ({
      id: `landing:${i.id}`,
      title: i.title,
      section: 'practice',
      demand: i.demand,
      evidence: i.evidence,
      why: i.why,
      owner: i.owner,
      week: i.week,
      starts: weekStart(i.week),
      landing: {
        id: i.id, status: i.status, kind: i.kind, path: i.path, query: i.query, variant: i.variant, competitor: i.competitor,
        checks: file.rules.checks.map((label, n) => ({ label, ok: !!i.checks[n] })),
      } satisfies LandingInfo,
    }));
}

/** Bestaande pagina's die een landingspagina zijn of worden: alles behalve afgewezen. */
export function landingPaths(file: LandingFile | null): string[] {
  return file ? [...new Set(file.items.filter(i => i.status !== 'dismissed').map(i => i.path))] : [];
}

/** Wat er aan het bestand niet klopt. Leeg = in orde. */
export function landingProblems(file: LandingFile): string[] {
  const out: string[] = [];
  const ids = new Set<string>();
  const newPerWeek = new Map<string, number>();
  for (const i of file.items) {
    if (ids.has(i.id)) out.push(`${i.id}: id used twice`);
    ids.add(i.id);
    if (!/^\d{4}-W\d{2}$/.test(i.week)) out.push(`${i.id}: week is not an ISO week`);
    if (!i.path.startsWith('/')) out.push(`${i.id}: path must start with /`);
    if (i.checks.length !== file.rules.checks.length) out.push(`${i.id}: ${i.checks.length} checks, the rules have ${file.rules.checks.length}`);
    if (!i.variant || !i.why || !i.evidence) out.push(`${i.id}: variant, why and evidence are required`);
    if ((i.status === 'approved' || i.status === 'live') && i.checks.some(c => !c)) out.push(`${i.id}: ${i.status} with a failed check`);
    if (i.kind === 'new' && i.status !== 'dismissed') newPerWeek.set(i.week, (newPerWeek.get(i.week) ?? 0) + 1);
  }
  for (const [week, n] of newPerWeek) {
    if (n > file.rules.new_urls_per_week) out.push(`${week}: ${n} new URLs, the cap is ${file.rules.new_urls_per_week}`);
  }
  return out;
}
