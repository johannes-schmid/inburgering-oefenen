'use client';

import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

/**
 * The "magisch invullen" control: an optional line of scenario and a button.
 *
 * One component for both authoring screens, because the interaction is the same in both and the
 * *promise* it makes has to be worded the same way in both: the suggestion lands in the fields
 * below, nothing is saved, and the docent still decides. `/api/admin/suggest-item` writes nothing,
 * so that promise is structural rather than a matter of this component behaving.
 *
 * The scenario box is deliberately optional and empty by default — "no prompt at all" is the
 * primary case (the docent facing exam 7 with four slots left), and a required field would turn a
 * one-click affordance back into a blank page.
 *
 * Generic over the suggestion shape: the caller knows what it asked for, and a shared `any` here
 * would push the shape check into whichever screen forgot to do it.
 */
export default function MagicFill<T>({
  /** What to POST. A function, so it reads the form's *current* state at click time. */
  body,
  onSuggestion,
  placeholder,
  disabled,
  disabledReason,
}: {
  body: () => Record<string, unknown>;
  onSuggestion: (suggestion: T) => void;
  placeholder: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [scenario, setScenario] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  async function run() {
    setBusy(true);
    setError('');
    setNote('');
    try {
      const res = await fetch('/api/admin/suggest-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body(), scenario: scenario.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok || !json.suggestion) {
        throw new Error(json.error || 'Het voorstel is niet gelukt.');
      }
      onSuggestion(json.suggestion as T);
      setNote(
        (json.groundedIn
          ? `Voorstel op basis van ${json.groundedIn} bestaand${json.groundedIn === 1 ? ' fragment' : 'e fragmenten'}. `
          : 'Er was nog geen bestaand materiaal om op te varen. ') +
          'Ingevuld in de velden hieronder — lees na, pas aan en sla zelf op.'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Het voorstel is niet gelukt.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-outline-variant bg-surface-container p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={scenario}
          onChange={e => setScenario(e.target.value)}
          placeholder={placeholder}
          disabled={busy || disabled}
          onKeyDown={e => {
            // Enter submits the suggestion, not the form around it. Inside `QuestionForm` this
            // control sits in a <form>, where the default would be to save the item.
            if (e.key !== 'Enter') return;
            e.preventDefault();
            if (!busy && !disabled) void run();
          }}
          className="flex-1 min-w-[200px] rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary disabled:opacity-50"
        />
        <button
          type="button"
          onClick={run}
          disabled={busy || disabled}
          title={disabled ? disabledReason : undefined}
          className="inline-flex items-center gap-2 rounded-xl bg-secondary-container px-4 py-2 text-sm font-medium text-on-secondary-container transition-transform hover:-translate-y-px active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 motion-reduce:transform-none"
        >
          {busy ? (
            <Loader2 size={15} className="animate-spin motion-reduce:animate-none" aria-hidden />
          ) : (
            <Sparkles size={15} aria-hidden />
          )}
          Magisch invullen
        </button>
      </div>

      <p className="m-0 text-xs text-on-surface-variant">
        {disabled && disabledReason
          ? disabledReason
          : 'Leeg laten mag — dan komt er zelf een voorstel. Er wordt niets opgeslagen.'}
      </p>

      {error && <p className="m-0 text-xs text-error">{error}</p>}
      {note && <p className="m-0 text-xs text-[#a24000]">{note}</p>}
    </div>
  );
}
