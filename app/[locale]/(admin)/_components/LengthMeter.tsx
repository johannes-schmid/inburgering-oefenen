'use client';

import {
  measure,
  sentenceTarget,
  targetSentence,
  type LengthField,
} from '@/lib/admin/length-targets';
import type { Level } from '@/data/skills';

/**
 * The line under an authoring field: how long this is, and how long it should be.
 *
 * Every number is advisory. Nothing here blocks a save, because the docent writing 140 words where
 * the guideline says 130 is not making a mistake — she is the standard, and a meter that argues with
 * her is a meter she learns to ignore. The colour says "look at this", never "this is wrong".
 *
 * Out-of-band uses **`#a24000`**, the brand orange text token — not `text-warning`, which resolves
 * to `yellow-500` and is unreadable on its own tint (CLAUDE.md, design rules).
 *
 * A `richtlijn` target is labelled as one. The docent has to be able to tell our working guideline
 * from the audio band that was actually measured off DUO's material, because only one of those is
 * worth rewriting a text over.
 */
export default function LengthMeter({
  text,
  level,
  field,
  skill,
  /** Show average sentence length too — useful on prose, noise on a four-word vraagzin. */
  showSentences = false,
}: {
  text: string;
  level: Level;
  field: LengthField;
  skill?: string;
  showSentences?: boolean;
}) {
  const r = measure(text, level, field, skill);
  const band = targetSentence(r.target);
  const perSentenceMax = sentenceTarget(level);

  const parts: string[] = [];
  if (field === 'script') {
    parts.push(`± ${r.seconds} sec`, `${r.words} woorden`);
  } else {
    parts.push(`${r.words} woorden`, `${r.chars} tekens`);
  }
  if (showSentences && r.sentences > 0) {
    parts.push(`${r.sentences} ${r.sentences === 1 ? 'zin' : 'zinnen'}`);
  }

  const off = r.status === 'under' || r.status === 'over';
  const longSentences = showSentences && r.perSentence > perSentenceMax;
  const empty = text.trim() === '';

  // On an empty field the counts are three zeroes of noise — and on a question with three blank
  // options, the same three zeroes three times over. The band alone is what is useful there: it
  // gives the docent a sense of scale before she starts typing.
  if (empty && !band) return null;

  return (
    <p className="mt-1 mb-0 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs tabular-nums">
      {!empty && (
        <span className={off ? 'text-[#a24000]' : 'text-on-surface-variant'}>{parts.join(' · ')}</span>
      )}

      {band && (
        <span className="text-on-surface-variant">
          {/* Named for what it is. `format` was measured off DUO's own material and is worth
              rewriting a fragment over; `richtlijn` is our own working guideline and is not. Saying
              "richtlijn … (eigen richtlijn)" said it twice and distinguished nothing. */}
          {r.target?.source === 'format' ? `richtlijn ${band}` : `eigen richtlijn ${band}`}
          {r.status === 'under' ? ' — nog wat kort' : r.status === 'over' ? ' — wat lang' : ''}
        </span>
      )}

      {longSentences && (
        <span className="text-[#a24000]">
          gem. {r.perSentence} woorden per zin — {level.toUpperCase()} houdt {perSentenceMax} aan
        </span>
      )}
    </p>
  );
}
