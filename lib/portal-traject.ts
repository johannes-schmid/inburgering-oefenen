/**
 * De traject-kaart op het portaaloverzicht: waar sta je in het inburgeringstraject?
 *
 * De datums komen **uit de tijdlijn die de kandidaat zelf heeft laten mailen**, nooit uit een
 * aanname hier. `tijdlijn_plans` bewaart alleen het e-mailadres en de opaque state-string; die
 * wordt hier opnieuw door de engine gehaald tegen het *huidige* regelbestand — dezelfde discipline
 * als de herinneringsmail (`lib/tijdlijn/email-payload.ts`): een datum die maanden geleden is
 * uitgerekend mag geen wachttijd citeren die DUO sindsdien heeft gewijzigd.
 *
 * Zonder opgeslagen tijdlijn komt er **geen datum** terug, en toont de kaart de stappen zonder
 * datums plus een uitnodiging om de tijdlijn te maken. Een geraden termijn zou de enige claim van
 * de site — dat er iemand achter staat die het heeft nagekeken — voor niets uitgeven.
 *
 * Server-only: `tijdlijn_plans` heeft RLS aan zonder policy (deny-all), dus dit leest op de
 * service key. Het geeft nooit meer terug dan twee maanden.
 */
import { createAdminClient } from './supabase/admin';
import { decodeInput } from './tijdlijn/state/encode';
import { computeTimeline } from './tijdlijn/engine/compute';
import { RULES } from './tijdlijn/rules';
import { fmtMonth, type UiLocale } from './tijdlijn/format';
import { pd } from './tijdlijn/engine/dates';

export type TrajectDates = {
  /** Uiterlijk aanmelden voor het onderdeel met de minste ruimte. */
  registerBy: string | null;
  /** Einde inburgeringstermijn. */
  termijnEnd: string | null;
};

export async function fetchTraject(
  email: string | null | undefined,
  locale: string,
): Promise<TrajectDates | null> {
  if (!email) return null;
  const ui: UiLocale = locale === 'en' || locale === 'ar' ? locale : 'nl';

  try {
    const { data } = await createAdminClient()
      .from('tijdlijn_plans')
      .select('encoded_state')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const state = data?.encoded_state;
    if (typeof state !== 'string') return null;

    const input = decodeInput(state);
    if (!input) return null;

    const now = new Date();
    const timeline = computeTimeline(
      input,
      RULES,
      pd(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate()),
    );

    const binding = timeline.components.find(c => c.id === timeline.bindingComponent) ?? null;
    return {
      registerBy: binding?.registerBy ? fmtMonth(binding.registerBy.date, ui) : null,
      termijnEnd: timeline.termijnEnd ? fmtMonth(timeline.termijnEnd.date, ui) : null,
    };
  } catch {
    // Een decodeerfout of een trage query mag het portaaloverzicht niet omvergooien; de kaart
    // valt dan terug op de stappen zonder datums.
    return null;
  }
}
