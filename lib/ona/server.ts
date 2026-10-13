import { createClient } from '@/lib/supabase/server';
import type { OnaEntry, OnaFlag } from './rules';

/**
 * ONA lezen uit de database — server-only.
 *
 * Elke query filtert expliciet op de gebruiker, óók waar RLS dat al doet: `lib/supabase/server.ts`
 * draait met de service-sleutel zodra er geen sessie is, en dan is RLS er niet om je te redden.
 */

export type OnaPortfolio = {
  id: number;
  beroep: string;
  route: 'wi2013' | 'map' | 'onbekend';
};

export type OnaPracticeSummary = {
  count: number;
  lastCardNos: number[];
};

export type OnaState = {
  portfolio: OnaPortfolio | null;
  entries: OnaEntry[];
  practice: OnaPracticeSummary;
};

const EMPTY: OnaState = { portfolio: null, entries: [], practice: { count: 0, lastCardNos: [] } };

type EntryRow = {
  card_no: number;
  answers: Record<string, string> | null;
  evidence: Record<string, boolean> | null;
  status: 'concept' | 'klaar';
  ai_flags: OnaFlag[] | null;
  ai_checked_at: string | null;
  updated_at: string | null;
};

export function entryFromRow(r: EntryRow): OnaEntry {
  return {
    cardNo: r.card_no,
    answers: r.answers ?? {},
    evidence: r.evidence ?? {},
    status: r.status,
    aiFlags: r.ai_flags,
    aiCheckedAt: r.ai_checked_at,
    updatedAt: r.updated_at,
  };
}

export async function fetchOnaPortfolio(userId: string): Promise<OnaPortfolio | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('ona_portfolios')
    .select('id, beroep, route')
    .eq('user_id', userId)
    .maybeSingle();
  return (data as OnaPortfolio | null) ?? null;
}

/** Alles wat het overzicht nodig heeft, in drie queries. Een fout geeft de lege staat. */
export async function fetchOnaState(userId: string | null): Promise<OnaState> {
  if (!userId) return EMPTY;
  try {
    const supabase = await createClient();
    const portfolio = await fetchOnaPortfolio(userId);

    const [entriesRes, practiceRes] = await Promise.all([
      portfolio
        ? supabase
          .from('ona_card_entries')
          .select('card_no, answers, evidence, status, ai_flags, ai_checked_at, updated_at')
          .eq('portfolio_id', portfolio.id)
        : Promise.resolve({ data: [] as EntryRow[] }),
      supabase
        .from('ona_practice_sessions')
        .select('card_nos, created_at', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1),
    ]);

    const entries = ((entriesRes.data ?? []) as EntryRow[]).map(entryFromRow);
    const last = (practiceRes.data?.[0] as { card_nos: number[] } | undefined)?.card_nos ?? [];
    return {
      portfolio,
      entries,
      practice: { count: (practiceRes as { count?: number | null }).count ?? 0, lastCardNos: last },
    };
  } catch {
    return EMPTY;
  }
}

export async function fetchOnaEntry(portfolioId: number, cardNo: number): Promise<OnaEntry | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('ona_card_entries')
    .select('card_no, answers, evidence, status, ai_flags, ai_checked_at, updated_at')
    .eq('portfolio_id', portfolioId)
    .eq('card_no', cardNo)
    .maybeSingle();
  return data ? entryFromRow(data as EntryRow) : null;
}

export async function countOnaPracticeSessions(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from('ona_practice_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  return count ?? 0;
}
