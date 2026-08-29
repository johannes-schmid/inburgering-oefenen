/**
 * Guard + presets for the local-only dev state toolbar.
 *
 * Two independent conditions, both required:
 *   1. not a production build
 *   2. Supabase points at a local instance
 *
 * (2) is the one that matters: even if this code were deployed and NODE_ENV were somehow
 * wrong, a hosted deployment talks to a remote Supabase, so the API refuses rather than
 * mutating real users. The layouts also drop the component from the tree entirely, so
 * nothing about it reaches a production bundle.
 */
export function devToolsEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return url.includes('127.0.0.1') || url.includes('localhost');
}

/* ── Entitlement presets ──────────────────────────────────────────────────── */

export type StatePreset =
  | 'fresh'
  | 'started'
  | 'module_lezen'
  | 'module_knm'
  | 'bundle_a2'
  | 'everything'
  | 'expired'
  | 'legacy_plan';

export type DevState = {
  enabled: boolean;
  email: string | null;
  plan: 'free' | 'premium' | 'premium_plus';
  modules: string[];
  modulesUntil: string | null;
  expired: boolean;
  attemptCount: number;
};

export const STATE_PRESETS: { id: StatePreset; label: string; hint: string }[] = [
  { id: 'fresh',        label: 'Nieuw account',      hint: 'Gratis · geen modules · geen pogingen' },
  { id: 'started',      label: 'Gratis, begonnen',   hint: 'Gratis · A2 examen 1 van elk onderdeel gedaan' },
  { id: 'module_lezen', label: 'Eén module (A2 Lezen)', hint: 'a2:lezen · rest op slot' },
  { id: 'module_knm',   label: 'Alleen KNM',         hint: 'knm · buiten beide bundels' },
  { id: 'bundle_a2',    label: 'A2-bundel',          hint: 'vier A2-onderdelen' },
  { id: 'everything',   label: 'Alles',              hint: 'A2 + B1 + KNM' },
  { id: 'expired',      label: 'Opgezegd, verlopen', hint: 'modules_until in het verleden' },
  { id: 'legacy_plan',  label: 'Oude Compleet-klant', hint: 'plan = premium_plus (alles open)' },
];

/* ── Flow jumps ───────────────────────────────────────────────────────────── */

/**
 * The engines read this from the URL and jump straight into a phase that is otherwise only
 * reachable by playing through the flow. Both readers are guarded by `devToolsEnabled()`, so
 * the param is inert in any other environment.
 */
export const DEV_FLOW_PARAM = 'devFlow';

/** Phases of the exam player (`components/exam/ExamShell.tsx`). */
export type ExamFlow = 'mid' | 'results_pass' | 'results_fail' | 'results_empty';

/** Phases of the free taster (`app/[locale]/(main)/oefenen/[skill]/FreePracticeEngine.tsx`). */
export type TasterFlow = 'gate' | 'results_pass' | 'results_fail' | 'email_sent';

export function examFlow(value: string | null): ExamFlow | null {
  return value === 'mid' || value === 'results_pass' || value === 'results_fail' || value === 'results_empty'
    ? value
    : null;
}

export function tasterFlow(value: string | null): TasterFlow | null {
  return value === 'gate' || value === 'results_pass' || value === 'results_fail' || value === 'email_sent'
    ? value
    : null;
}

/**
 * A flow is a screen *plus the state it needs to exist*.
 *
 * `preset` is applied first where the screen only means something at a given entitlement —
 * a locked exam has to be looked at from an account that does not own it. Where it is absent
 * the current account is left alone, so a flow can be replayed without re-seeding.
 */
export type DevFlow = {
  id: string;
  label: string;
  hint: string;
  href: string;
  preset?: StatePreset;
  /** Needs a signed-in account; the toolbar says so rather than failing silently. */
  auth?: boolean;
};

export type DevFlowGroup = { title: string; flows: DevFlow[] };

export const DEV_FLOWS: DevFlowGroup[] = [
  {
    title: 'Gratis funnel (anoniem)',
    flows: [
      { id: 'taster-gate',   label: 'Taster — e-mailpoort',      hint: '10 beantwoord, score achtergehouden', href: `/oefenen/lezen?${DEV_FLOW_PARAM}=gate` },
      { id: 'taster-sent',   label: 'Taster — e-mail verstuurd', hint: 'bedankscherm van de poort',           href: `/oefenen/lezen?${DEV_FLOW_PARAM}=email_sent` },
      { id: 'taster-pass',   label: 'Taster — uitslag goed',     hint: '9/10 · upsell naar het onderdeel',    href: `/oefenen/lezen?${DEV_FLOW_PARAM}=results_pass` },
      { id: 'taster-fail',   label: 'Taster — uitslag zwak',     hint: '3/10 · upsell naar het onderdeel',    href: `/oefenen/luisteren?${DEV_FLOW_PARAM}=results_fail` },
      { id: 'taster-knm',    label: 'Taster KNM — uitslag',      hint: 'stimulusloos, één kolom',             href: `/oefenen/knm?${DEV_FLOW_PARAM}=results_fail` },
    ],
  },
  {
    title: 'Onboarding',
    flows: [
      { id: 'onb-fresh',    label: 'Vers account, leeg portaal', hint: 'geen modules, geen pogingen',        href: '/dashboard',              preset: 'fresh',        auth: true },
      { id: 'onb-first',    label: 'Eerste gratis examen',       hint: 'de startkaart van een gratis examen', href: '/oefenexamen/knm/1',     preset: 'fresh',        auth: true },
      { id: 'onb-locked',   label: 'Examen 2 op slot',           hint: 'gratis account → upsell',             href: '/oefenexamen/knm/2',     preset: 'fresh',        auth: true },
      { id: 'onb-paid',     label: 'Net betaald',                hint: 'bevestigingspagina na Mollie',       href: '/betaling-gelukt',        preset: 'module_lezen', auth: true },
    ],
  },
  {
    // Which exams have items depends on what has been seeded into *this* database, so the
    // flows that always work on a fresh local stack are listed first and the rest say what
    // they need. A player with no items renders "nog geen opgaven" rather than a result.
    title: 'Examen afronden',
    flows: [
      { id: 'exam-knm-fail', label: 'KNM — uitslag gezakt',   hint: '12/40 · 43 sub-onderwerpen uitgesplitst', href: `/oefenexamen/knm/1?${DEV_FLOW_PARAM}=results_fail`, auth: true },
      { id: 'exam-knm-pass', label: 'KNM — uitslag geslaagd', hint: '~85% · geslaagd-variant',                 href: `/oefenexamen/knm/1?${DEV_FLOW_PARAM}=results_pass`, auth: true },
      { id: 'exam-knm-mid',  label: 'KNM — midden in het examen', hint: 'helft beantwoord, klok stil',        href: `/oefenexamen/knm/1?${DEV_FLOW_PARAM}=mid`,          auth: true },
      { id: 'exam-pass',     label: 'A2 Lezen — uitslag geslaagd', hint: 'vereist geseede A2-content',        href: `/oefenexamen/a2/lezen/1?${DEV_FLOW_PARAM}=results_pass`, auth: true },
      { id: 'exam-fail',     label: 'A2 Lezen — uitslag gezakt',   hint: 'vereist geseede A2-content',        href: `/oefenexamen/a2/lezen/1?${DEV_FLOW_PARAM}=results_fail`, auth: true },
      { id: 'exam-write',    label: 'Schrijven — ingeleverd',      hint: 'uitslag zonder nakijkresultaat · vereist A2-content', href: `/oefenexamen/a2/schrijven/1?${DEV_FLOW_PARAM}=results_empty`, auth: true },
      { id: 'exam-speak',    label: 'Spreken — ingeleverd',        hint: 'idem, zonder opnames · vereist A2-content',           href: `/oefenexamen/a2/spreken/1?${DEV_FLOW_PARAM}=results_empty`,   auth: true },
    ],
  },
  {
    title: 'Portaal · voortgang',
    flows: [
      { id: 'portal-start',  label: 'Net begonnen',        hint: 'gratis · examen 1 van elk onderdeel gedaan', href: '/dashboard',          preset: 'started',      auth: true },
      { id: 'portal-module', label: 'Eén module gekocht',  hint: 'A2 Lezen open, de rest op slot',            href: '/dashboard/a2/lezen', preset: 'module_lezen', auth: true },
      { id: 'portal-knm',    label: 'Alleen KNM gekocht',  hint: 'buiten beide bundels',                      href: '/dashboard/knm',      preset: 'module_knm',   auth: true },
      { id: 'portal-bundle', label: 'A2-bundel',           hint: 'vier onderdelen open',                      href: '/dashboard',          preset: 'bundle_a2',    auth: true },
      { id: 'portal-all',    label: 'Alles',               hint: 'A2 + B1 + KNM',                             href: '/dashboard',          preset: 'everything',   auth: true },
      { id: 'portal-exp',    label: 'Opgezegd, verlopen',  hint: 'modules_until in het verleden',             href: '/dashboard',          preset: 'expired',      auth: true },
      { id: 'portal-legacy', label: 'Oude Compleet-klant', hint: 'plan = premium_plus, alles open',           href: '/dashboard',          preset: 'legacy_plan',  auth: true },
      { id: 'portal-profile',label: 'Profiel & opzeggen',  hint: 'abonnementen van een bundelklant',          href: '/dashboard/profiel',  preset: 'bundle_a2',    auth: true },
    ],
  },
];
