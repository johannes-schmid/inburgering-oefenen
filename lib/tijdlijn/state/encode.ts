/**
 * The URL *is* the state. There is no database and no session behind this tool.
 *
 * That buys four things at once: a timeline is shareable with a teacher or klantmanager, it is
 * bookmarkable, the back button behaves, and **no personal data ever reaches a server**. The last one
 * is a promise made on the landing page ("geen DigiD, geen BSN, niets wordt opgeslagen") and this
 * encoding is what makes it true rather than a claim.
 *
 * ## Shape
 *
 * ```
 * ?t=1~w21~p2025-05-12d~gz~b1~b1~a0~6-3~0~~n~knm:s6,lez:p
 *    │  │   │            │   │   │   │   │   │ │ │
 *    │  │   │            │   │   │   │   │   │ │ per-component progress
 *    │  │   │            │   │   │   │   │   │ flags (n = wants naturalisation)
 *    │  │   │            │   │   │   │   │   extension signals
 *    │  │   │            │   │   │   │   granted extension months
 *    │  │   │            │   │   │   course-self study hours per week
 *    │  │   │            │   │   current level
 *    │  │   │            │   target level
 *    │  │   │            route
 *    │  │   anchor: kind + ISO date + precision
 *    │  law
 *    schema version
 * ```
 *
 * ## Two rules
 *
 * **The version prefix is load-bearing.** A link someone shared with their klantmanager must keep
 * working after we change the encoding, so an unknown version resolves to `null` and the page opens
 * the wizard with a friendly note rather than rendering a plan from misread fields — a silently
 * mis-parsed positional string would produce a *wrong deadline*, which is the worst failure this
 * feature has.
 *
 * **Nothing here identifies a person.** A route and a month are not identifying, and there is no
 * name, e-mail, BSN or V-number in the scheme. Keep it that way: the moment a field could identify
 * someone, the privacy line on the landing page becomes false.
 */
import { fromISO, toISO } from '../engine/dates';
import { emptyInput } from '../engine/input';
import type {
  ComponentId,
  ComponentState,
  ExtensionSignal,
  Law,
  Level,
  Route,
  Status,
  TimelineInput,
} from '../engine/types';

export const STATE_VERSION = '1';
const SEP = '~';

// Short codes. **Never renumber these** — a shared link is a promise. Add, don't reassign.
const LAW: Record<string, Law> = { w21: 'wi2021', w13: 'wi2013', non: 'none', xx: 'unknown' };
const STATUS: Record<string, Status> = { az: 'asiel', gz: 'gezin_overig', eu: 'eu_niet_plichtig', xx: 'unknown' };
const ROUTE: Record<string, Route> = {
  b1: 'b1',
  on: 'onderwijs',
  z: 'z',
  a2: 'a2_wi2013',
  na: 'naturalisatie_only',
  xx: 'unknown',
};
const ANCHOR_KIND: Record<string, 'pip' | 'duo_letter' | 'gemeente_registration'> = {
  p: 'pip',
  l: 'duo_letter',
  g: 'gemeente_registration',
};
const STATE: Record<string, ComponentState> = {
  n: 'not_started',
  s: 'studying',
  r: 'registered',
  w: 'awaiting_result',
  p: 'passed',
  f: 'failed',
};
const COMPONENT: Record<string, ComponentId> = {
  lez: 'lezen',
  lui: 'luisteren',
  spr: 'spreken',
  sch: 'schrijven',
  knm: 'knm',
  ona: 'ona',
  map: 'map',
  pvt: 'pvt',
  zeg: 'z_eindgesprek',
};
const SIGNAL: Record<string, ExtensionSignal> = {
  lit: 'literacy_course',
  edu: 'dutch_education',
  ill: 'illness',
  dth: 'death_in_family',
  bab: 'childbirth',
  hom: 'homeless_or_shelter',
  gem: 'gemeente_or_school_failure',
  non: 'none',
};

const invert = <T extends string>(m: Record<string, T>): Record<T, string> =>
  Object.fromEntries(Object.entries(m).map(([k, v]) => [v, k])) as Record<T, string>;

const LAW_OUT = invert(LAW);
const STATUS_OUT = invert(STATUS);
const ROUTE_OUT = invert(ROUTE);
const STATE_OUT = invert(STATE);
const COMPONENT_OUT = invert(COMPONENT);
const SIGNAL_OUT = invert(SIGNAL);
const ANCHOR_OUT = invert(ANCHOR_KIND);

export function encodeInput(input: TimelineInput): string {
  const anchor =
    input.anchor.kind === 'unknown'
      ? 'x'
      : `${ANCHOR_OUT[input.anchor.kind]}${toISO(input.anchor.date)}${input.anchor.precision === 'month' ? 'm' : 'd'}`;

  const progress = Object.entries(input.progress)
    .filter(([, p]) => p && p.state !== 'not_started')
    .map(([id, p]) => {
      const code = COMPONENT_OUT[id as ComponentId];
      let out = `${code}:${STATE_OUT[p!.state]}`;
      if (p!.diagnosticScore !== undefined) out += String(p!.diagnosticScore);
      if (p!.attempts) out += `a${p!.attempts}`;
      if (p!.examDate) out += `@${toISO(p!.examDate)}`;
      return out;
    })
    .join(',');

  const flags = [input.wantsNaturalisation ? 'n' : '', input.residenceStart ? `r${toISO(input.residenceStart)}` : '']
    .filter(Boolean)
    .join('');

  return [
    STATE_VERSION,
    LAW_OUT[input.law],
    anchor,
    STATUS_OUT[input.status],
    ROUTE_OUT[input.route],
    input.targetLevel,
    input.currentLevel,
    `${round1(input.courseHoursPerWeek)}-${round1(input.selfStudyHoursPerWeek)}`,
    String(Math.max(0, Math.round(input.grantedExtensionMonths))),
    input.extensionSignals.map(s => SIGNAL_OUT[s]).join(','),
    flags,
    progress,
  ].join(SEP);
}

/** `null` for anything we cannot read with confidence — the caller opens the wizard instead. */
export function decodeInput(raw: string | null | undefined): TimelineInput | null {
  if (!raw) return null;
  const parts = raw.split(SEP);
  if (parts[0] !== STATE_VERSION || parts.length < 12) return null;

  const [, law, anchor, status, route, target, current, hours, ext, signals, flags, progress] = parts;
  const out = emptyInput();

  out.law = LAW[law] ?? 'unknown';
  out.status = STATUS[status] ?? 'unknown';
  out.route = ROUTE[route] ?? 'unknown';
  out.targetLevel = (['a2', 'b1', 'b2', 'unknown'] as const).includes(target as never)
    ? (target as TimelineInput['targetLevel'])
    : 'unknown';
  out.currentLevel = (['a0', 'a1', 'a2', 'b1', 'b2', 'unknown'] as const).includes(current as never)
    ? (current as Level)
    : 'unknown';

  if (anchor && anchor !== 'x') {
    const kind = ANCHOR_KIND[anchor[0]];
    const date = fromISO(anchor.slice(1, 11));
    const precision = anchor[11] === 'm' ? 'month' : 'day';
    /* A malformed anchor is the one field worth rejecting the whole string over: every date on the
     * result screen is derived from it, so reading it wrong is worse than not reading it at all. */
    if (!kind || !date) return null;
    out.anchor = { kind, date, precision };
  }

  const [ch, sh] = (hours ?? '').split('-').map(Number);
  out.courseHoursPerWeek = Number.isFinite(ch) ? clamp(ch, 0, 60) : 0;
  out.selfStudyHoursPerWeek = Number.isFinite(sh) ? clamp(sh, 0, 60) : 0;
  out.grantedExtensionMonths = clamp(Number(ext) || 0, 0, 60);

  out.extensionSignals = (signals ?? '')
    .split(',')
    .map(s => SIGNAL[s])
    .filter((s): s is ExtensionSignal => Boolean(s));

  out.wantsNaturalisation = (flags ?? '').includes('n');
  const res = /r(\d{4}-\d{2}-\d{2})/.exec(flags ?? '');
  if (res) out.residenceStart = fromISO(res[1]) ?? undefined;

  for (const chunk of (progress ?? '').split(',').filter(Boolean)) {
    const m = /^([a-z]{3}):([nsrwpf])(\d{1,2})?(?:a(\d))?(?:@(\d{4}-\d{2}-\d{2}))?$/.exec(chunk);
    if (!m) continue; // one unreadable component is not worth discarding the whole plan
    const id = COMPONENT[m[1]];
    const state = STATE[m[2]];
    if (!id || !state) continue;
    out.progress[id] = {
      state,
      ...(m[3] !== undefined ? { diagnosticScore: clamp(Number(m[3]), 0, 10) } : {}),
      ...(m[4] !== undefined ? { attempts: clamp(Number(m[4]), 0, 9) } : {}),
      ...(m[5] ? { examDate: fromISO(m[5]) ?? undefined } : {}),
    };
  }

  return out;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const round1 = (n: number) => Math.round(n * 10) / 10;
