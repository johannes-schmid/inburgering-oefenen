/**
 * De vijf manieren waarop de modules van een account veranderen, als pure functies over
 * `user_metadata`.
 *
 * Elke functie geeft een **patch** terug — de velden die de aanroeper naast de bestaande metadata
 * schrijft (`{ ...meta, ...patch }`). GoTrue merget `user_metadata`, dus een veld dat weg moet wordt
 * expliciet `null`, nooit weggelaten.
 *
 * Twee regels die alle vijf delen:
 *  - **Verlopen modules blijven staan, met hun datum** — zie `current()`.
 *  - **De oude gezamenlijke `modules_until` wordt omgezet naar een datum per module** en dan op
 *    `null` gezet. Zonder die omzetting wiste een nieuwe aankoop de opzegdatum van alles wat nog
 *    liep, en bleven die modules open zonder dat er iemand voor betaalde.
 */
import {
  moduleUntil,
  purchasedModules,
  normaliseModule,
  type ModuleId,
} from '@/lib/entitlements';

type Meta = Record<string, unknown> | null | undefined;

export type ModulesPatch = {
  modules: ModuleId[];
  module_until: Partial<Record<ModuleId, string>>;
  modules_until: null;
};

function ids(raw: string[]): ModuleId[] {
  return [...new Set(raw.map(normaliseModule).filter((x): x is ModuleId => x !== null))];
}

/**
 * Alles wat gekocht is, met elke einddatum als eigen datum per module.
 *
 * Verlopen modules blijven staan, met hun datum: `modulesFromMetadata()` laat ze toch al vallen,
 * en de MRR-grafiek in `/admin` leest uit die datums wanneer een module van de incasso viel. Wie
 * zo'n module opnieuw kiest, krijgt de datum gewist.
 */
function current(meta: Meta): { modules: ModuleId[]; until: Partial<Record<ModuleId, string>> } {
  const modules = purchasedModules(meta as never);
  const until: Partial<Record<ModuleId, string>> = {};
  for (const id of modules) {
    const date = moduleUntil(meta as never, id);
    if (date !== null) until[id] = date;
  }
  return { modules, until };
}

function patch(modules: ModuleId[], until: Partial<Record<ModuleId, string>>): ModulesPatch {
  const kept: Partial<Record<ModuleId, string>> = {};
  for (const id of modules) if (until[id]) kept[id] = until[id];
  return { modules, module_until: kept, modules_until: null };
}

/** Een eerste betaling via de checkout: wat gekocht is, verlengt. */
export function grantPurchase(meta: Meta, bought: string[]): ModulesPatch & { subscription_canceled_at: null } {
  const { modules, until } = current(meta);
  const add = ids(bought);
  for (const id of add) delete until[id];
  return { ...patch([...new Set([...modules, ...add])], until), subscription_canceled_at: null };
}

/**
 * Een maandelijkse incasso. Bevestigt wat het abonnement noemt, zonder einddatums te wissen: een
 * module die iemand deze periode opzegde, staat na een geslaagde PATCH al niet meer in de
 * metadata van het abonnement — maar als die PATCH mislukte, telt de opzegging toch.
 *
 * De uitzondering is een module waarvan de datum al voorbij is en die toch opnieuw betaald is:
 * die is gekocht, dus gaat weer open.
 */
export function grantRenewal(meta: Meta, billed: string[]): ModulesPatch {
  const { modules, until } = current(meta);
  const now = Date.now();
  for (const id of ids(billed)) {
    const date = until[id];
    if (date && Date.parse(date) < now) delete until[id];
  }
  return patch([...new Set([...modules, ...ids(billed)])], until);
}

/** Een wijziging halverwege de periode: erbij gaat meteen open, eraf loopt tot `periodEnd`. */
export function applyChange(
  meta: Meta,
  change: { add: string[]; remove: string[]; periodEnd: string },
): ModulesPatch {
  const { modules, until } = current(meta);
  const add = ids(change.add);
  for (const id of add) delete until[id];
  for (const id of ids(change.remove)) {
    if (modules.includes(id) && !until[id]) until[id] = change.periodEnd;
  }
  return patch([...new Set([...modules, ...add])], until);
}

/** De incasso voor een wijziging mislukte: wat daarmee openging, gaat weer dicht. */
export function revertGrant(meta: Meta, granted: string[]): ModulesPatch {
  const { modules, until } = current(meta);
  const drop = new Set(ids(granted));
  return patch(modules.filter(id => !drop.has(id)), until);
}

/**
 * Alles opzeggen. Elke module die nog verlengt, loopt tot `accessUntil`.
 *
 * Zonder datum (Mollie noemt geen volgende incasso meer) blijft alles open: gokken kan iemand
 * afsluiten binnen een maand waarvoor betaald is.
 */
export function cancelAll(meta: Meta, accessUntil: string | null): ModulesPatch {
  const { modules, until } = current(meta);
  if (accessUntil) for (const id of modules) if (!until[id]) until[id] = accessUntil;
  return patch(modules, until);
}
