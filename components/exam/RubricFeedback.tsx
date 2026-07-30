'use client';

import { Check, Info, Lock, Loader2, RefreshCw, TriangleAlert } from 'lucide-react';
import {
  effectiveScores,
  isTeacherReviewed,
  MAX_CRITERION_SCORE,
  pctFromCriteria,
  scoreBand,
  type CriterionScore,
  type RubricCriterion,
} from '@/lib/rubrics';

/**
 * One rubric result, rendered the same way everywhere it appears: inline in the player, on the
 * results screen, and beside the docent's own scores in `/admin/beoordeling`.
 *
 * ## Two rules this component exists to enforce
 * 1. **The docent's score wins.** Both her rows and the model's live in `open_criterion_scores`
 *    (`UNIQUE (submission_id, criterion_key, source)`) because that pairing is the eval dataset —
 *    but the candidate sees one number per criterion, and where the docent has entered one, it is
 *    hers. `effectiveScores()` does the collapsing; the provenance line changes with it.
 * 2. **Never "de AI beoordeelt je antwoord".** The model applies the docent's criteria; that is
 *    the product's whole claim ("echt door een docent gevalideerd, geen AI") and the wording here
 *    is not decoration. See CLAUDE.md.
 *
 * Below Compleet the criteria text is withheld and only the band shows — the feedback itself is
 * what the tier buys. The score is never hidden, because the candidate earned it.
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
  /** Compleet sees the per-criterion feedback; lower tiers see the band and an upsell. */
  canSeeDetail?: boolean;
  premiumHref?: string;
  errorMessage?: string | null;
  onRetry?: () => void;
  passThresholdPct?: number;
  /** Admin drawer: show every score with its source instead of collapsing to one per criterion. */
  showSources?: boolean;
  /**
   * Set when the surrounding surface already shows the answer with its marks — Spreken annotates
   * the transcript in place, and a second annotated copy in this card is just duplication.
   */
  answerShownElsewhere?: boolean;
  /** Denser type and spacing, for the in-exam card that now sits beside the question. */
  compact?: boolean;
  className?: string;
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
  passThresholdPct = 60,
  showSources = false,
  answerShownElsewhere = false,
  compact = false,
  className = '',
}: Props) {
  if (state === 'grading') {
    return (
      <div className={`rf ${className}`}>
        <p className="rf-status">
          <Loader2 size={15} className="animate-spin" aria-hidden />
          Je antwoord wordt nagekeken met de criteria van de docent…
        </p>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className={`rf rf-error ${className}`}>
        <p className="rf-status">
          <TriangleAlert size={15} aria-hidden />
          {errorMessage || 'Nakijken is niet gelukt. Je antwoord is wel opgeslagen.'}
        </p>
        {onRetry && (
          <button type="button" onClick={onRetry} className="rf-retry">
            <RefreshCw size={13} aria-hidden />
            Opnieuw proberen
          </button>
        )}
        <style>{CSS}</style>
      </div>
    );
  }

  const shown = showSources ? scores : effectiveScores(scores);
  const pct = pctFromCriteria(effectiveScores(scores), criteria);
  const reviewed = isTeacherReviewed(scores);

  if (pct == null) return null;

  const band = scoreBand(pct, passThresholdPct);

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

  return (
    <div className={`rf${compact ? ' rf-compact' : ''} ${className}`}>
      <div className="rf-head">
        <div>
          <span className={`rf-band rf-band-${band}`}>{BAND_LABEL[band]}</span>
          <span className="rf-pct">{pct}%</span>
        </div>
      </div>

      {/* Whose criteria these are, with a face.
          The product's claim is that a certified NT2 docent stands behind every assessment, and an
          unattributed percentage reads exactly like the AI grading this product exists to be
          distinguished from. Wording stays honest about the order of events: her criteria applied
          now, her review to follow. */}
      <div className="rf-docent">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/marieke-schipper.jpg" alt="" className="rf-docent-face" />
        <p>
          {reviewed ? (
            <>
              <strong>Nagekeken door Marieke Schipper</strong>, gecertificeerde NT2-docent.
            </>
          ) : (
            <>
              Beoordeeld met de criteria van <strong>Marieke Schipper</strong>, gecertificeerde
              NT2-docent. Zij controleert deze beoordeling na.
            </>
          )}
        </p>
        {reviewed && <Check size={14} strokeWidth={3} className="rf-docent-check" aria-hidden />}
      </div>

      {missing.length > 0 && (
        <p className="rf-status rf-warn">
          <TriangleAlert size={14} aria-hidden />
          {missing.length === 1
            ? `Eén criterium ("${missing[0].criterion}") is nog niet beoordeeld.`
            : `${missing.length} criteria zijn nog niet beoordeeld.`}{' '}
          Het percentage gaat alleen over wat wél beoordeeld is.
        </p>
      )}

      {canSeeDetail && weak.length > 0 && (
        <p className="rf-focus">
          <TriangleAlert size={14} strokeWidth={2.4} aria-hidden />
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

      {canSeeDetail && !answerShownElsewhere && answerText?.trim() && highlights.length > 0 && (
        <AnnotatedAnswer
          text={answerText}
          highlights={highlights}
          criteria={criteria}
        />
      )}

      {canSeeDetail ? (
        <ul className={`rf-list${weak.length > 0 ? ' rf-has-weak' : ''}`}>
          {criteria.flatMap(c => {
            const rows = shown.filter(s => s.criterion_key === c.key);
            if (rows.length === 0) return [];
            const spans = highlights.filter(h => h.criterion_key === c.key);
            return rows.map(s => (
              <li
                key={`${c.key}-${s.source}`}
                className={`rf-item${weakKeys.has(c.key) ? ' rf-item-weak' : ''}`}
              >
                <div className="rf-item-head">
                  <span className="rf-crit">{c.criterion}</span>
                  {showSources && (
                    <span className={`rf-src rf-src-${s.source}`}>
                      {s.source === 'teacher' ? 'docent' : 'model'}
                    </span>
                  )}
                  <span className="rf-score">
                    {s.score}
                    <span className="rf-score-max">/{MAX_CRITERION_SCORE}</span>
                  </span>
                </div>
                <div
                  className="rf-bar"
                  role="img"
                  aria-label={`${s.score} van ${MAX_CRITERION_SCORE}`}
                >
                  {Array.from({ length: MAX_CRITERION_SCORE }, (_, i) => (
                    <span key={i} className={i < s.score ? 'on' : ''} />
                  ))}
                </div>
                {s.feedback && <p className="rf-fb">{s.feedback}</p>}
                {/* The spans this specific criterion was judged on. Without them a score is an
                    assertion; with them the candidate can see which of their own words it is
                    about. */}
                {spans.length > 0 && (
                  <ul className="rf-spans">
                    {spans.map((h, i) => (
                      <li key={i} className={`rf-span rf-span-${h.kind}`}>
                        <span className="rf-span-quote">&ldquo;{h.quote}&rdquo;</span>
                        <span className="rf-span-note">{h.note}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ));
          })}
        </ul>
      ) : (
        <div className="rf-locked">
          <p>
            <Lock size={14} aria-hidden />
            <strong>Wat er goed ging en wat beter kan</strong> staat per onderdeel klaar in
            Compleet.
          </p>
          {premiumHref && (
            <a href={premiumHref} className="rf-cta">
              Bekijk Compleet — €19,95
            </a>
          )}
        </div>
      )}

      <style>{CSS}</style>
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

  // Walk the text once, emitting plain runs and marked runs in order. The spans are sorted and
  // non-overlapping by construction.
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (const [i, h] of highlights.entries()) {
    if (h.start > cursor) parts.push(text.slice(cursor, h.start));
    parts.push(
      <mark key={i} className={`rf-mark rf-mark-${h.kind}`}>
        {text.slice(h.start, h.end)}
        <span className="rf-mark-note" role="note">
          <strong>{label(h.criterion_key)}</strong>
          {h.note}
        </span>
      </mark>
    );
    cursor = h.end;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));

  const improve = highlights.filter(h => h.kind === 'improve').length;

  return (
    <div className="rf-annotated">
      <p className="rf-annotated-head">
        Jouw antwoord
        {improve > 0 && (
          <span className="rf-annotated-count">
            {improve} {improve === 1 ? 'aandachtspunt' : 'aandachtspunten'}
          </span>
        )}
      </p>
      <p className="rf-annotated-body">{parts}</p>
      {/* No note list here: the same spans are listed under the criterion they belong to, which is
          both the accessible route (a hover tooltip is unreachable by touch and keyboard) and the
          answer to "how does this score relate to what I said". Repeating them twice on one card
          was noise. */}
    </div>
  );
}

const CSS = `
  .rf { border:1.5px solid var(--color-outline-variant); border-radius:16px; background:#fff; padding:16px; box-shadow:var(--shadow-card); }
  .rf-error { border-color:color-mix(in srgb, var(--color-error) 30%, transparent); }
  .rf-status { display:flex; align-items:center; gap:8px; font-size:0.82rem; color:var(--color-on-surface-variant); line-height:1.6; }
  .rf-warn { margin-top:10px; color:var(--color-secondary); }
  .rf-retry { display:inline-flex; align-items:center; gap:6px; margin-top:10px; font-size:0.78rem; font-weight:700; color:var(--color-primary); background:none; border:none; padding:0; cursor:pointer; }
  .rf-retry:hover { text-decoration:underline; }

  .rf-head { display:flex; flex-wrap:wrap; align-items:baseline; gap:8px; padding-bottom:12px; border-bottom:1px solid var(--color-surface-container-high); }
  .rf-band { font-family:var(--font-body); font-size:0.66rem; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; padding:3px 8px; border-radius:7px; margin-right:9px; }
  .rf-band-goed, .rf-band-voldoende { background:rgba(0,43,109,0.09); color:var(--color-primary); }
  .rf-band-bijna { background:rgba(254,118,44,0.13); color:var(--color-secondary); }
  .rf-band-onvoldoende { background:color-mix(in srgb, var(--color-error) 11%, transparent); color:var(--color-error); }
  .rf-pct { font-family:var(--font-headline); font-size:1.4rem; font-weight:800; letter-spacing:-0.03em; color:var(--color-primary); font-variant-numeric:tabular-nums; }
  .rf-prov { display:flex; align-items:center; gap:5px; font-size:0.72rem; color:var(--color-outline); line-height:1.5; max-width:34ch; }

  .rf-docent { display:flex; align-items:center; gap:10px; margin-top:12px; padding:10px 12px; border-radius:12px; background:var(--color-surface-container-low); }
  .rf-docent-face { width:34px; height:34px; border-radius:999px; object-fit:cover; object-position:65% 30%; flex-shrink:0; }
  .rf-docent p { margin:0; font-size:0.75rem; line-height:1.5; color:var(--color-on-surface-variant); }
  .rf-docent strong { font-weight:800; color:var(--color-on-surface); }
  .rf-docent-check { color:var(--color-primary); flex-shrink:0; }

  /* Compact: the card now shares the column with the question, so it trades air for fit. */
  .rf-compact { padding:14px; }
  .rf-compact .rf-pct { font-size:1.2rem; }
  .rf-compact .rf-list { gap:10px; margin-top:12px; }
  .rf-compact .rf-crit { font-size:0.8rem; }
  .rf-compact .rf-fb { font-size:0.74rem; margin-top:4px; }
  .rf-compact .rf-bar span { height:4px; }
  .rf-compact .rf-focus { font-size:0.8rem; padding:9px 11px; margin-top:12px; }
  .rf-compact .rf-docent { margin-top:10px; padding:8px 10px; }
  .rf-compact .rf-docent-face { width:30px; height:30px; }
  .rf-compact .rf-spans { gap:5px; }
  .rf-compact .rf-span-quote { font-size:0.74rem; }
  .rf-compact .rf-span-note { font-size:0.71rem; }

  .rf-focus { display:flex; align-items:flex-start; gap:8px; margin:14px 0 0; padding:11px 13px; border-radius:12px; background:rgba(254,118,44,0.1); border-left:3px solid var(--color-secondary-container); font-size:0.85rem; line-height:1.55; color:var(--color-on-secondary-container); }
  .rf-focus svg { flex-shrink:0; margin-top:2px; }
  .rf-focus strong { font-weight:800; }

  .rf-has-weak .rf-item { opacity:0.62; }
  .rf-has-weak .rf-item-weak { opacity:1; }
  .rf-item-weak .rf-crit { color:var(--color-on-surface); }
  .rf-item-weak .rf-bar span.on { background:linear-gradient(90deg,#fe762c,#a24000); }
  .rf-item-weak .rf-score { color:var(--color-secondary); }

  .rf-spans { list-style:none; margin:8px 0 0; padding:0; display:flex; flex-direction:column; gap:6px; }
  .rf-span { padding-left:10px; border-left:2px solid var(--color-outline-variant); }
  .rf-span-improve { border-left-color:var(--color-secondary-container); }
  .rf-span-good { border-left-color:var(--color-primary); }
  .rf-span-quote { display:block; font-size:0.78rem; font-style:italic; color:var(--color-on-surface); }
  .rf-span-note { display:block; font-size:0.74rem; line-height:1.5; color:var(--color-on-surface-variant); }

  .rf-list { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:14px; margin-top:14px; }
  .rf-item-head { display:flex; align-items:baseline; gap:8px; }
  .rf-crit { font-family:var(--font-headline); font-size:0.86rem; font-weight:700; color:var(--color-on-surface); flex:1; min-width:0; }
  .rf-src { font-size:0.6rem; font-weight:800; letter-spacing:0.07em; text-transform:uppercase; padding:2px 6px; border-radius:5px; }
  .rf-src-ai { background:var(--color-surface-container-high); color:var(--color-on-surface-variant); }
  .rf-src-teacher { background:rgba(0,43,109,0.1); color:var(--color-primary); }
  .rf-score { font-family:var(--font-headline); font-size:0.86rem; font-weight:800; color:var(--color-primary); font-variant-numeric:tabular-nums; }
  .rf-score-max { font-weight:600; color:var(--color-outline); }
  .rf-bar { display:flex; gap:3px; margin-top:5px; }
  .rf-bar span { flex:1; height:5px; border-radius:3px; background:var(--color-surface-container-high); }
  .rf-bar span.on { background:linear-gradient(90deg,#1d428a,#002b6d); }
  .rf-fb { font-size:0.79rem; line-height:1.65; color:var(--color-on-surface-variant); margin-top:6px; }

  .rf-annotated { margin-top:14px; padding:14px; border-radius:14px; background:var(--color-surface-container-low); }
  .rf-annotated-head { display:flex; align-items:baseline; justify-content:space-between; gap:10px; font-size:0.68rem; font-weight:800; letter-spacing:0.1em; text-transform:uppercase; color:var(--color-outline); margin:0 0 8px; }
  .rf-annotated-count { font-size:0.65rem; letter-spacing:0.04em; text-transform:none; font-weight:700; color:var(--color-secondary); }
  .rf-annotated-body { margin:0; font-size:0.95rem; line-height:1.9; color:var(--color-on-surface); }

  .rf-mark { position:relative; background:none; color:inherit; padding:1px 0; border-radius:3px; cursor:help; }
  .rf-mark-improve { box-shadow:inset 0 -0.42em 0 rgba(254,118,44,0.28); }
  .rf-mark-good { box-shadow:inset 0 -0.42em 0 rgba(0,43,109,0.13); }
  .rf-mark-note { position:absolute; left:0; bottom:calc(100% + 8px); z-index:5; width:max-content; max-width:270px; padding:8px 10px; border-radius:10px; background:var(--color-on-surface); color:#fff; font-size:0.75rem; line-height:1.5; opacity:0; pointer-events:none; transition:opacity .14s ease; }
  .rf-mark-note strong { display:block; font-size:0.62rem; letter-spacing:0.08em; text-transform:uppercase; opacity:0.72; margin-bottom:2px; }
  .rf-mark:hover .rf-mark-note, .rf-mark:focus-visible .rf-mark-note { opacity:1; }

  .rf-notes { list-style:none; margin:12px 0 0; padding:0; display:flex; flex-direction:column; gap:8px; }
  .rf-note { display:flex; flex-direction:column; gap:2px; padding-left:11px; border-left:3px solid var(--color-outline-variant); }
  .rf-note-improve { border-left-color:var(--color-secondary-container); }
  .rf-note-good { border-left-color:var(--color-primary); }
  .rf-note-quote { font-size:0.82rem; font-style:italic; color:var(--color-on-surface); }
  .rf-note-body { font-size:0.78rem; line-height:1.55; color:var(--color-on-surface-variant); }
  .rf-note-body strong { font-weight:800; color:var(--color-on-surface); }

  .rf-locked { margin-top:14px; padding:14px; border-radius:12px; background:var(--color-surface-container-low); border:1px dashed var(--color-outline-variant); }
  .rf-locked p { display:flex; align-items:center; gap:7px; font-size:0.8rem; line-height:1.6; color:var(--color-on-surface-variant); }
  .rf-locked strong { color:var(--color-on-surface); font-weight:700; }
  .rf-cta { display:inline-block; margin-top:10px; font-size:0.8rem; font-weight:800; color:var(--color-primary); text-decoration:none; }
  .rf-cta:hover { text-decoration:underline; }
`;
