/**
 * The answer's own words, lighting up one after the other in green.
 *
 * Same idea as `.sp-reading` in `SpeakingTask` — where the transcript lights word by word while
 * the answer is being checked — but pointing the other way: here the pass *confirms* a right
 * answer. The motion is `.answer-words` in `app/globals.css`; this only writes the spans and the
 * per-word delay, so the stagger is a real left-to-right pass rather than one flat shimmer.
 *
 * Whitespace is kept as its own text node so the line still wraps exactly where it did before.
 * `active` off renders the plain string and nothing else — no wrapper, no spans.
 */
export default function WordPass({ text, active }: { text: string; active: boolean }) {
  if (!active) return <>{text}</>;

  let word = 0;
  return (
    <span className="answer-words">
      {text.split(/(\s+)/).map((part, i) =>
        /^\s+$/.test(part) || part === '' ? (
          part
        ) : (
          <span key={i} style={{ animationDelay: `${word++ * 45}ms` }}>
            {part}
          </span>
        ),
      )}
    </span>
  );
}
