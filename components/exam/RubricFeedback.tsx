'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Check, Lock, RefreshCw, TriangleAlert, X } from 'lucide-react';
import {
  effectiveScores,
  isTeacherReviewed,
  MAX_CRITERION_SCORE,
  pctFromCriteria,
  pointsFromCriteria,
  scoreBand,
  type CriterionScore,
  type RubricCriterion,
} from '@/lib/rubrics';
import './glas-player.css';

/**
 * One rubric result, rendered the same way everywhere it appears: inline in the player and on the
 * results screen.
 *
 * ## Two rules this component exists to enforce
 * 1. **The docent's score wins.** Both her rows and the model's live in `open_criterion_scores`
 *    (`UNIQUE (submission_id, criterion_key, source)`) because that pairing is the eval dataset —
 *    but the candidate sees one number per criterion, and where the docent has entered one, it is
 *    hers. `effectiveScores()` does the collapsing; the provenance line changes with it.
 * 2. **Never "de AI beoordeelt je antwoord".** A model applies the docent's criteria, and the
 *    attribution line says exactly that, plus that this is practice feedback and no DUO result.
 *    See CLAUDE.md §2.
 *
 * Below Compleet the criteria text is withheld and only the scores show — the feedback itself is
 * what the tier buys. The score is never hidden, because the candidate earned it.
 *
 * ## Glas (§10 "Nakijken · terwijl het gebeurt")
 * Wat je ziet is wat er gebeurt: tijdens het nakijken gaat er een lichtstreep over de tekst (of
 * loopt de golf van de opname), dan vallen de criteria één voor één op hun plek, en pas daarna
 * komt het totaal. Met "beweging verminderen" staat meteen de uitslag.
 */

export type RubricFeedbackState = 'idle' | 'grading' | 'graded' | 'error';

/** A span of the candidate's own words, already located in the text by `matchHighlights`. */
export type FeedbackHighlight = {
  quote: string;
  criterion_key: string;
  note: string;
  kind: 'improve' | 'good';
  start: number;
  end: number;
};

type Props = {
  criteria: RubricCriterion[];
  scores: CriterionScore[];
  /** The candidate's answer, or the transcript for Spreken — what the highlights index into. */
  answerText?: string | null;
  highlights?: FeedbackHighlight[];
  state?: RubricFeedbackState;
  /** Compleet sees the per-criterion feedback; lower tiers see the scores and an upsell. */
  canSeeDetail?: boolean;
  premiumHref?: string;
  errorMessage?: string | null;
  onRetry?: () => void;
  /** The grader's forward-looking advice, listed under "wat kan beter" in the wide layout. */
  tips?: string[];
  passThresholdPct?: number;
  /** Show every score with its source instead of collapsing to one per criterion. */
  showSources?: boolean;
  /**
   * Set when the surrounding surface already shows the answer with its marks — Spreken annotates
   * the transcript in place, and a second annotated copy in this card is just duplication.
   */
  answerShownElsewhere?: boolean;
  /** Denser type and spacing, for the in-exam card that sits beside the question. */
  compact?: boolean;
  /**
   * `wide` spreads the criteria across a grid and splits the notes into "wat ging goed" and "wat
   * kan beter" — the Schrijven treatment, where the answer is long enough that a full-width strip
   * below reads better than a narrow column beside it.
   */
  layout?: 'stack' | 'wide';
  className?: string;
  /** Wat er tijdens het nakijken onder de lichtstreep ligt: de geschreven tekst. */
  pendingText?: string | null;
  /** Spreken laat de opname "uitschrijven" in plaats van een tekst te scannen. */
  medium?: 'tekst' | 'opname';
  /** De monoregel linksboven, bijv. "Opdracht 2 · E-mail aan je buurvrouw". */
  title?: string;
};

/** "a", "a en b", "a, b en c" — Dutch joins the final item with "en", not a comma. */
function dutchList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} en ${items[items.length - 1]}`;
}

const BAND_LABEL: Record<string, string> = {
  goed: 'Goed',
  voldoende: 'Voldoende',
  bijna: 'Bijna voldoende',
  onvoldoende: 'Nog niet voldoende',
};

/** Hoe lang één criterium erover doet om op zijn plek te vallen (glas.html §10). */
const STEP_MS = 650;
/** De lichtstreep over de tekst, vóór de criteria. */
const SCAN_MS = 1200;

/** Vaste golfhoogtes voor Spreken: de opname wordt "uitgeschreven". */
const WVR = Array.from({ length: 64 }, (_, i) => 6 + Math.round(Math.abs(Math.sin(i * 0.42) * Math.cos(i * 0.17)) * 32));

type Phase = 'scan' | 'resolve' | 'done';

/**
 * De nakijkvolgorde, één keer, zodra de kaart in beeld komt. Timers in plaats van CSS-vertraging,
 * omdat de statusregel ("Criteria van de docent" → "Nagekeken") mee moet lopen.
 */
function useReveal(active: boolean, count: number, withScan: boolean) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [phase, setPhase] = useState<Phase>('scan');
  const [resolved, setResolved] = useState(0);
  const ran = useRef(false);

  useEffect(() => {
    if (!active || ran.current) return;
    const el = ref.current;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const run = () => {
      if (ran.current) return;
      ran.current = true;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setResolved(count);
        setPhase('done');
        return;
      }
      const t0 = withScan ? SCAN_MS : 0;
      timers.push(setTimeout(() => setPhase('resolve'), t0));
      for (let i = 0; i < count; i++) {
        timers.push(setTimeout(() => setResolved(i + 1), t0 + 400 + i * STEP_MS));
      }
      timers.push(setTimeout(() => setPhase('done'), t0 + 400 + count * STEP_MS));
    };
    if (!el || typeof IntersectionObserver === 'undefined') {
      run();
      return () => timers.forEach(clearTimeout);
    }
    const io = new IntersectionObserver(
      es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); run(); } },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => { io.disconnect(); timers.forEach(clearTimeout); };
  }, [active, count, withScan]);

  return { ref, phase, resolved };
}

function Who({ reviewed }: { reviewed: boolean }) {
  return (
    <div className="g-xrv-who">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/amber-van-der-zalm-264.webp" alt="" />
      <span>
        {reviewed ? (
          <>
            <b>Nagekeken door Amber van der Zalm</b>, gecertificeerde NT2-docent. Oefenfeedback,
            geen officiële uitslag van DUO.
          </>
        ) : (
          <>
            Een taalmodel beoordeelde dit met de criteria van <b>Amber van der Zalm</b>,
            gecertificeerde NT2-docent. Zij controleert deze beoordeling na. Oefenfeedback, geen
            officiële uitslag van DUO.
          </>
        )}
      </span>
    </div>
  );
}

export default function RubricFeedback({
  criteria,
  scores,
  answerText,
  highlights = [],
  state = 'graded',
  canSeeDetail = true,
  premiumHref,
  errorMessage,
  onRetry,
  tips = [],
  passThresholdPct = 60,
  showSources = false,
  answerShownElsewhere = false,
  compact = false,
  layout = 'stack',
  className = '',
  pendingText = null,
  medium = 'tekst',
  title,
}: Props) {
  const pct = state === 'graded' ? pctFromCriteria(effectiveScores(scores), criteria) : null;
  const graded = state === 'graded' && pct != null;
  const showDoc = canSeeDetail && !answerShownElsewhere && Boolean(answerText?.trim()) && highlights.length > 0;
  const shown = showSources ? scores : effectiveScores(scores);
  const rowCount = criteria.reduce((n, c) => n + shown.filter(s => s.criterion_key === c.key).length, 0);
  const { ref, phase, resolved } = useReveal(graded, rowCount, showDoc);

  const wide = layout === 'wide';
  const cls = `g-xrv${compact ? ' g-xrv-compact' : ''}${wide ? ' g-xrv-wide' : ''} ${className}`;
  const head = title ?? 'Beoordeling';

  if (state === 'error') {
    return (
      <div className={cls} data-phase="done">
        <p className="g-xrv-err">
          <TriangleAlert aria-hidden />
          {errorMessage || 'Nakijken is niet gelukt. Je antwoord is wel opgeslagen.'}
        </p>
        {onRetry && (
          <button type="button" onClick={onRetry} className="g-btn g-btn-ghost g-btn-sm" style={{ alignSelf: 'flex-start' }}>
            <RefreshCw aria-hidden />
            Opnieuw proberen
          </button>
        )}
      </div>
    );
  }

  /* Tijdens het nakijken: de lichtstreep gaat over je tekst (of de golf van je opname loopt), de
     criteriumrijen glanzen nog leeg, het totaal is er nog niet. Geen draaiend wieltje zonder uitleg. */
  if (state === 'grading') {
    return (
      <div className={cls} data-phase="scan" aria-busy="true">
        <div className="g-xrv-hd">
          <span className="g-mono">{head}</span>
          <span className="g-xrv-status">
            <span className="g-xrv-orb" aria-hidden />
            <span>{medium === 'opname' ? 'Wordt beluisterd' : 'Wordt nagekeken'}</span>
          </span>
        </div>
        <p className="g-xintro-line" role="status">
          Je antwoord wordt nagekeken met de criteria van de docent…
        </p>
        {medium === 'opname' ? (
          <div className="g-xrv-wvr" aria-hidden>
            {WVR.map((h, i) => (
              <b key={i} style={{ height: h, ['--i' as string]: i } as React.CSSProperties} />
            ))}
          </div>
        ) : pendingText?.trim() ? (
          <div className="g-xrv-doc" aria-hidden>{pendingText}</div>
        ) : null}
        <div className="g-xrv-crits" aria-hidden>
          {[0, 1, 2].map(i => (
            <div key={i} className="g-xrv-cr"><span className="g-xrv-cr-sk" /></div>
          ))}
        </div>
        <div className="g-xrv-tot" aria-hidden><div><b>&nbsp;</b></div></div>
        <Who reviewed={false} />
      </div>
    );
  }

  if (!graded || pct == null) return null;

  const reviewed = isTeacherReviewed(scores);
  const band = scoreBand(pct, passThresholdPct);
  const points = pointsFromCriteria(effectiveScores(scores), criteria);

  // A criterion the rubric defines but nobody scored is a grading bug, and it silently shrinks
  // the denominator. Say so rather than showing a percentage that quietly means something else.
  const scoredKeys = new Set(effectiveScores(scores).map(s => s.criterion_key));
  const missing = criteria.filter(c => !scoredKeys.has(c.key));

  // Which criteria actually lost points. Everything in the card looked equally weighted before, so
  // a 2/3 that is the whole lesson read the same as three 3/3s that need no action at all.
  const byKey = new Map(effectiveScores(scores).map(s => [s.criterion_key, s]));
  const weak = criteria.filter(c => {
    const sc = byKey.get(c.key);
    return sc != null && sc.score < MAX_CRITERION_SCORE;
  });
  const weakKeys = new Set(weak.map(c => c.key));

  // The two columns are a re-cut of data already present rather than a second model call: spans the
  // grader marked "good" on one side, spans marked "improve" plus its tips on the other. Quoting the
  // candidate's own words is what stops "wat ging goed" reading as flattery.
  const good = highlights.filter(h => h.kind === 'good').map(h => `${h.note} ("${h.quote}")`);
  const better = [
    ...highlights.filter(h => h.kind === 'improve').map(h => `${h.note} ("${h.quote}")`),
    ...tips,
  ];

  const passedBand = band === 'goed' || band === 'voldoende';
  const statusText =
    phase === 'done' ? 'Nagekeken' : phase === 'resolve' ? 'Criteria van de docent' : medium === 'opname' ? 'Wordt beluisterd' : 'Wordt nagekeken';
  let row = 0;

  return (
    <div ref={ref} className={cls} data-phase={phase}>
      <div className="g-xrv-hd">
        <span className="g-mono">{head}</span>
        <span className="g-xrv-status">
          <span className="g-xrv-orb" aria-hidden><Check strokeWidth={3} /></span>
          <span>{statusText}</span>
        </span>
      </div>

      {showDoc && answerText && (
        <AnnotatedAnswer text={answerText} highlights={highlights} criteria={criteria} />
      )}

      {missing.length > 0 && (
        <p className="g-xrv-focus">
          <TriangleAlert aria-hidden />
          <span>
            {missing.length === 1
              ? `Eén criterium ("${missing[0].criterion}") is nog niet beoordeeld.`
              : `${missing.length} criteria zijn nog niet beoordeeld.`}{' '}
            Het percentage gaat alleen over wat wél beoordeeld is.
          </span>
        </p>
      )}

      <div className="g-xrv-crits">
        {criteria.flatMap(c => {
          const rows = shown.filter(s => s.criterion_key === c.key);
          if (rows.length === 0) return [];
          const spans = highlights.filter(h => h.criterion_key === c.key);
          return rows.map(s => {
            const ok = phase === 'done' || row++ < resolved;
            return (
              <div
                key={`${c.key}-${s.source}`}
                className={`g-xrv-cr${ok ? ' ok' : ''}${weakKeys.has(c.key) ? ' g-xrv-weak' : ''}`}
              >
                <b>
                  {c.criterion}
                  {showSources && (
                    <span className="g-xbdg" style={{ height: 22, marginInlineStart: 8 }}>
                      {s.source === 'teacher' ? 'docent' : 'model'}
                    </span>
                  )}
                </b>
                <span className="g-xrv-pp" role="img" aria-label={`${s.score} van ${MAX_CRITERION_SCORE}`}>
                  {Array.from({ length: MAX_CRITERION_SCORE }, (_, i) => (
                    <i key={i} className={i < s.score ? 'on' : undefined} />
                  ))}
                  <em aria-hidden>{s.score}/{MAX_CRITERION_SCORE}</em>
                </span>
                {canSeeDetail && (s.feedback || (!wide && spans.length > 0)) && (
                  <div className="g-xrv-cr-body">
                    {s.feedback && <p>{s.feedback}</p>}
                    {/* The spans this specific criterion was judged on. Without them a score is an
                        assertion; with them the candidate can see which of their own words it is
                        about. */}
                    {!wide && spans.length > 0 && (
                      <ul className="g-xrv-spans">
                        {spans.map((h, i) => (
                          <li key={i}>
                            <q>{h.quote}</q>
                            {h.note}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          });
        })}
      </div>

      {canSeeDetail && weak.length > 0 && phase === 'done' && (
        <p className="g-xrv-focus">
          <TriangleAlert strokeWidth={2.4} aria-hidden />
          {/* Naming the weak criteria only helps while they are the minority. Once everything lost
              points there is nothing to single out, and a list of all five reads as a scolding. */}
          {weak.length === criteria.length ? (
            <span>Op alle punten valt nog winst te halen. Begin bij de inhoud van je antwoord.</span>
          ) : (
            <span>
              Let op <strong>{dutchList(weak.map(c => c.criterion.toLowerCase()))}</strong> — daar
              liggen je punten.
            </span>
          )}
        </p>
      )}

      {!canSeeDetail && (
        <div className="g-xrv-locked">
          <Lock size={14} aria-hidden style={{ display: 'inline', verticalAlign: '-2px', marginInlineEnd: 6 }} />
          <strong>Wat er goed ging en wat beter kan</strong> staat per onderdeel klaar in Compleet.
          {premiumHref && (
            <>
              <br />
              <a href={premiumHref} className="g-tlink">Bekijk Compleet — €19,95</a>
            </>
          )}
        </div>
      )}

      {canSeeDetail && wide && (good.length > 0 || better.length > 0) && phase === 'done' && (
        <div className="g-xrv-cols">
          {good.length > 0 && (
            <section className="g-xrv-col">
              <h4><Check strokeWidth={3} aria-hidden style={{ color: 'var(--goed)' }} />Wat ging goed</h4>
              <ul>{good.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </section>
          )}
          {better.length > 0 && (
            <section className="g-xrv-col">
              <h4><ArrowUp strokeWidth={3} aria-hidden style={{ color: 'var(--klei)' }} />Wat kan beter</h4>
              <ul>{better.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </section>
          )}
        </div>
      )}

      <div className="g-xrv-tot">
        <div>
          <b>{points ? `${points.earned} van ${points.max} punten` : `${pct}%`}</b>
          <small>{points ? `${pct}% · ` : ''}{BAND_LABEL[band]}</small>
        </div>
        <span
          className={`g-xbdg ${passedBand ? 'g-xbdg-goed' : band === 'bijna' ? 'g-xbdg-grijs' : 'g-xbdg-fout'}`}
          style={{ height: 32, fontSize: 13.5 }}
        >
          {passedBand ? <Check strokeWidth={3} aria-hidden /> : band === 'onvoldoende' ? <X strokeWidth={3} aria-hidden /> : null}
          {BAND_LABEL[band]}
        </span>
      </div>

      <Who reviewed={reviewed} />
    </div>
  );
}

/**
 * The candidate's own words with the graded spans marked.
 *
 * This is what turns "grammatica: 2" from an assertion into evidence — the score points at the
 * words that earned it. Spans arrive already located (`start`/`end` from `matchHighlights`), and
 * every quote has been verified to be a literal substring, so nothing here can underline text the
 * candidate did not write.
 */
function AnnotatedAnswer({
  text,
  highlights,
  criteria,
}: {
  text: string;
  highlights: FeedbackHighlight[];
  criteria: RubricCriterion[];
}) {
  const label = (key: string) => criteria.find(c => c.key === key)?.criterion ?? key;

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (const [i, h] of highlights.entries()) {
    if (h.start > cursor) parts.push(text.slice(cursor, h.start));
    parts.push(
      <mark key={i} className={`g-xmark g-xmark-${h.kind}`} tabIndex={0}>
        {text.slice(h.start, h.end)}
        <span className="g-xmark-note" role="note">
          <strong style={{ display: 'block', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.72 }}>
            {label(h.criterion_key)}
          </strong>
          {h.note}
        </span>
      </mark>
    );
    cursor = h.end;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));

  const improve = highlights.filter(h => h.kind === 'improve').length;

  return (
    <div>
      <div className="g-xqhead" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
        <span className="g-mono">Jouw antwoord</span>
        {improve > 0 && (
          <span className="g-xbdg g-xbdg-klei">
            {improve} {improve === 1 ? 'aandachtspunt' : 'aandachtspunten'}
          </span>
        )}
      </div>
      {/* No note list here: the same spans are listed under the criterion they belong to, which is
          both the accessible route (a hover tooltip is unreachable by touch and keyboard) and the
          answer to "how does this score relate to what I said". */}
      <p className="g-xrv-doc" style={{ margin: 0 }}>{parts}</p>
    </div>
  );
}
