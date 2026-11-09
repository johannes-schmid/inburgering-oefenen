import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { groupByDomain, prospectStatus, type Backlink, type Prospect, type ProspectStatus, type ReferringDomain } from './seo-backlinks-model';

/**
 * De tab Backlinks van `/admin/seo`. De links komen uit de wekelijkse snapshot
 * (`seo-agent/data/<week>/backlinks.json`, Bing Webmaster) en niet live: het zijn tientallen
 * API-aanroepen per keer en backlinks veranderen per week, niet per uur. De kandidaten staan met de
 * hand in `seo-agent/backlink-prospects.json`; de eigenaar zet daar `status` op asked / declined.
 */

const ROOT = path.join(process.cwd(), 'seo-agent');

export type BacklinkView = {
  checkedAt: string | null;
  week: string | null;
  /** null = nog nooit opgehaald (onbekend, niet nul). */
  domains: ReferringDomain[] | null;
  targets: { url: string; count: number }[];
  error: string | null;
  prospects: (Prospect & { state: ProspectStatus })[];
};

async function json<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path.join(ROOT, file), 'utf8')) as T;
  } catch {
    return null;
  }
}

type Snapshot = { skipped?: string; generated_at?: string; links?: Backlink[]; targets?: { url: string; count: number }[]; errors?: string[] };

export async function loadBacklinks(): Promise<BacklinkView> {
  let weeks: string[] = [];
  try {
    weeks = (await readdir(path.join(ROOT, 'data'))).filter(d => /^\d{4}-W\d{2}$/.test(d)).sort().reverse();
  } catch {}

  let snap: Snapshot | null = null;
  let week: string | null = null;
  let error: string | null = null;
  for (const w of weeks) {
    const s = await json<Snapshot>(`data/${w}/backlinks.json`);
    if (!s) continue;
    if (s.skipped) {
      error ??= s.skipped;
      continue;
    }
    snap = s;
    week = w;
    break;
  }

  const domains = snap ? groupByDomain(snap.links ?? []) : null;
  const prospects = (await json<{ prospects: Prospect[] }>('backlink-prospects.json'))?.prospects ?? [];
  return {
    checkedAt: snap?.generated_at ?? null,
    week,
    domains,
    targets: snap?.targets ?? [],
    error: snap ? null : error,
    prospects: prospects.map(p => ({ ...p, state: prospectStatus(p, domains) })),
  };
}
