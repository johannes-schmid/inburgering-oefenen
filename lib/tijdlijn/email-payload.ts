/**
 * Turns an encoded plan into the strings an e-mail needs — on the server, at send time.
 *
 * Shared by `/api/tijdlijn-email` (the copy someone asks for) and the reminder branch of
 * `/api/send-campaign-emails` (the follow-up eight weeks before their last safe registration date).
 * Both paths must produce the same figures from the same state, so there is one builder rather than
 * two that drift.
 *
 * **It recomputes rather than reading stored dates.** The reminder may be queued eight months before
 * it is sent, and in between DUO can index a fee or lift the temporary 16-week notice. Decoding the
 * state and running the engine against today's rules file is what keeps a mail that lands in the
 * future from quoting the past.
 *
 * The locale strings are read straight out of the message JSON rather than through next-intl: a route
 * handler has no request locale to hang a formatter off, and the alternative — retyping component
 * names into the e-mail templates — is exactly the duplication that lets an e-mail disagree with the
 * page it was sent from.
 */
import { decodeInput } from './state/encode';
import { computeTimeline } from './engine/compute';
import { RULES } from './rules';
import { diffWeeks, type PlainDate } from './engine/dates';
import { fmtDate, fmtMonth, fmtMoney, type UiLocale } from './format';
import type { TimelineEmailPayload, TimelineEmailRow } from '@/lib/email/templates/timeline';
import { SITE_URL } from '@/lib/site';
import messagesNl from '@/messages/nl.json';
import messagesEn from '@/messages/en.json';
import messagesAr from '@/messages/ar.json';

type ResultStrings = Record<string, string> & { component: Record<string, string> };

const RESULT: Record<UiLocale, ResultStrings> = {
  nl: (messagesNl as never as { tijdlijn: { result: ResultStrings } }).tijdlijn.result,
  en: (messagesEn as never as { tijdlijn: { result: ResultStrings } }).tijdlijn.result,
  ar: (messagesAr as never as { tijdlijn: { result: ResultStrings } }).tijdlijn.result,
};

export const TIJDLIJN_PATH: Record<UiLocale, string> = {
  nl: '/nl/inburgering/tools/tijdlijn',
  en: '/en/inburgering/tools/tijdlijn',
  ar: '/ar/inburgering/tools/tijdlijn',
};

/** `null` when the state cannot be read — the caller answers 400 rather than sending a blank plan. */
export function buildTimelineEmailPayload(
  state: string,
  locale: UiLocale,
  today: PlainDate,
): { payload: TimelineEmailPayload; registerBy: PlainDate | null } | null {
  const input = decodeInput(state);
  if (!input) return null;

  const timeline = computeTimeline(input, RULES, today);
  const s = RESULT[locale];
  const name = (id: string) => s.component[id] ?? id;
  const payerLabel = (p: string) =>
    p === 'gemeente' ? s.payer_gemeente : p === 'loan_possible' ? s.payer_loan : p === 'free' ? s.payer_free : s.payer_self;

  const rows: TimelineEmailRow[] = timeline.components
    .filter(c => c.required && !c.done)
    .map(c => ({
      label: name(c.id),
      registerBy: c.registerBy ? fmtDate(c.registerBy.date, locale) : null,
      /* The "ongeveer" prefix travels with the value, never as a separate column: an estimate that
       * loses its label in a channel we cannot correct is the worst place to lose it. */
      readyBy: c.readyBy ? `${s.about} ${fmtMonth(c.readyBy.latest, locale)}` : null,
      fee: c.feeCents === 0 ? s.payer_free : fmtMoney(c.feeCents, locale),
      payer: payerLabel(c.payer),
    }));

  const binding = timeline.components.find(c => c.id === timeline.bindingComponent) ?? null;
  const registerBy = binding?.registerBy?.date ?? null;

  return {
    registerBy,
    payload: {
      headlineDate: registerBy ? fmtDate(registerBy, locale) : null,
      headlineWeeks: registerBy ? Math.max(0, diffWeeks(today, registerBy)) : null,
      bindingComponent: binding ? name(binding.id) : null,
      deadline: timeline.termijnEnd ? fmtDate(timeline.termijnEnd.date, locale) : null,
      rows,
      costBest: fmtMoney(timeline.cost.bestCaseCents, locale),
      costExpected: fmtMoney(timeline.cost.expectedCents, locale),
      shareUrl: `${SITE_URL}${TIJDLIJN_PATH[locale]}?t=${encodeURIComponent(state)}`,
      rulesVersion: timeline.rulesVersion,
    },
  };
}
