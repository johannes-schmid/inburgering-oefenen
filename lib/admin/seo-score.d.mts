export type Verdict = 'healthy' | 'improve' | 'consolidate' | 'remove' | 'watch';

export type ScoreInput = {
  path: string;
  section: string;
  verdict: Verdict;
  demand: number;
  /** Laatste 28 dagen in Google; `null` = onbekend. */
  now: { impressions: number; position: number | null } | null;
  /** Bevindingen van de gezondheidscheck, zoals `title 68 tekens` of `status 404`. */
  issues: string[];
};

export type ScoreFactor = { key: 'verdict' | 'visibility' | 'position' | 'technical' | 'snippet'; delta: number; label: string };

export type HistoryRow = { week: string; date: string; site: number | null; sections: Record<string, number> };

export function expectedImpressions(demand: number): number;
export function pageScore(p: ScoreInput): { score: number; factors: ScoreFactor[] };
export function pageWeight(p: ScoreInput): number;
export function rollup(pages: ScoreInput[]): { site: number | null; sections: Record<string, number> };
export function upsertHistory(rows: HistoryRow[], row: HistoryRow): HistoryRow[];
