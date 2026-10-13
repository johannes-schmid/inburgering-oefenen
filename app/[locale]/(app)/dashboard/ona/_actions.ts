'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getOnaCard } from '@/data/ona/cards';
import { canOpenOnaCard, isOnaAvailable } from '@/lib/ona/access';
import { fetchOnaEntry, fetchOnaPortfolio } from '@/lib/ona/server';
import { cardProgress, sanitiseAnswers, sanitiseEvidence } from '@/lib/ona/rules';

/**
 * De schrijfacties van ONA. Elke actie leest de sessie zelf en schrijft alleen voor die
 * gebruiker; de client stuurt nooit een user-id mee.
 *
 * **RLS-val:** een geweigerde UPDATE via PostgREST geeft 200 met nul rijen (CLAUDE.md §4). Daarom
 * vraagt elke schrijfactie de rij terug (`.select()`) en meldt een fout als er niets terugkomt.
 */

type Result = { ok: true; savedAt?: string } | { ok: false; error: string };

async function sessionUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function saveOnaBeroep(input: { beroep: string; route: 'wi2013' | 'map' | 'onbekend' }): Promise<Result> {
  if (!isOnaAvailable()) return { ok: false, error: 'ONA is nog niet beschikbaar.' };
  const { supabase, user } = await sessionUser();
  if (!user) return { ok: false, error: 'Log eerst in.' };

  const beroep = (input.beroep ?? '').trim().replace(/\s+/g, ' ');
  if (beroep.length < 2 || beroep.length > 120) {
    return { ok: false, error: 'Schrijf de naam van een beroep (2 tot 120 tekens).' };
  }
  const route = ['wi2013', 'map', 'onbekend'].includes(input.route) ? input.route : 'onbekend';

  const { data, error } = await supabase
    .from('ona_portfolios')
    .upsert({ user_id: user.id, beroep, route }, { onConflict: 'user_id' })
    .select('id');
  if (error || !data?.length) return { ok: false, error: 'Opslaan lukte niet. Probeer het opnieuw.' };

  revalidatePath('/[locale]/dashboard/ona', 'layout');
  return { ok: true };
}

export async function saveOnaCard(input: {
  cardNo: number;
  answers: Record<string, string>;
  evidence: Record<string, boolean>;
}): Promise<Result> {
  if (!isOnaAvailable()) return { ok: false, error: 'ONA is nog niet beschikbaar.' };
  const card = getOnaCard(Number(input.cardNo));
  if (!card) return { ok: false, error: 'Deze kaart bestaat niet.' };

  const { supabase, user } = await sessionUser();
  if (!user) return { ok: false, error: 'Log eerst in om je antwoorden te bewaren.' };
  if (!canOpenOnaCard(user.user_metadata, card.number)) {
    return { ok: false, error: 'Deze kaart hoort bij de ONA-module.' };
  }

  const portfolio = await fetchOnaPortfolio(user.id);
  if (!portfolio) return { ok: false, error: 'Kies eerst je beroep.' };

  const answers = sanitiseAnswers(card, input.answers);
  const evidence = sanitiseEvidence(card, input.evidence);

  // Was de kaart klaar en is hij dat na deze wijziging niet meer, dan gaat hij terug naar concept.
  const previous = await fetchOnaEntry(portfolio.id, card.number);
  const stillComplete = cardProgress(card, {
    cardNo: card.number, answers, evidence, status: 'klaar', aiFlags: null, aiCheckedAt: null, updatedAt: null,
  }).complete;
  const status = previous?.status === 'klaar' && stillComplete ? 'klaar' : 'concept';

  const { data, error } = await supabase
    .from('ona_card_entries')
    .upsert(
      { portfolio_id: portfolio.id, card_no: card.number, answers, evidence, status },
      { onConflict: 'portfolio_id,card_no' },
    )
    .select('updated_at');
  if (error || !data?.length) return { ok: false, error: 'Opslaan lukte niet. Probeer het opnieuw.' };

  return { ok: true, savedAt: (data[0] as { updated_at: string }).updated_at };
}

export async function markOnaCardDone(input: { cardNo: number; done: boolean }): Promise<Result> {
  const card = getOnaCard(Number(input.cardNo));
  if (!card) return { ok: false, error: 'Deze kaart bestaat niet.' };

  const { supabase, user } = await sessionUser();
  if (!user) return { ok: false, error: 'Log eerst in.' };
  if (!canOpenOnaCard(user.user_metadata, card.number)) {
    return { ok: false, error: 'Deze kaart hoort bij de ONA-module.' };
  }
  const portfolio = await fetchOnaPortfolio(user.id);
  if (!portfolio) return { ok: false, error: 'Kies eerst je beroep.' };

  const entry = await fetchOnaEntry(portfolio.id, card.number);
  if (input.done && !cardProgress(card, entry ?? undefined).complete) {
    return { ok: false, error: 'Beantwoord eerst alle vragen en vink de verplichte bewijzen aan.' };
  }

  const { data, error } = await supabase
    .from('ona_card_entries')
    .update({ status: input.done ? 'klaar' : 'concept' })
    .eq('portfolio_id', portfolio.id)
    .eq('card_no', card.number)
    .select('card_no');
  if (error || !data?.length) return { ok: false, error: 'Opslaan lukte niet. Probeer het opnieuw.' };

  revalidatePath('/[locale]/dashboard/ona', 'layout');
  return { ok: true };
}
