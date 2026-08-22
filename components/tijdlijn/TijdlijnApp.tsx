/**
 * The tool's client root: landing → wizard → result, all at one URL.
 *
 * ## Why the state lives here and nowhere else
 *
 * One `TimelineInput` in one `useState` is what makes four separate features fall out for free: the
 * live deadline preview inside the wizard, the shareable URL, "antwoorden aanpassen" returning to a
 * filled-in wizard, and what-if editing on the result screen. Any of those holding its own copy
 * would be a second source of truth about somebody's legal deadline.
 *
 * ## Why `today` is state and not `new Date()` at render
 *
 * The engine takes `today` as an argument and never reads a clock. This component resolves it **once**
 * on mount, in an effect, so the value is stable for the session and the server render is
 * deterministic. Reading the date during render would hydrate a different plan than it prerendered
 * for anyone loading near midnight; a deadline planner is exactly the wrong place for that class of
 * bug. Until it resolves, the landing page renders — which is also the correct static shell for SEO.
 *
 * ## Why the URL is written with `history.replaceState`
 *
 * The state is written straight onto the address bar rather than through the router, so recomputing
 * after every tap does not push a navigation, refetch a server component, or fill the back stack with
 * fifty identical entries. The state *arrives* through `?t=` and can be shared, bookmarked and
 * reloaded — which is all a share needs; what it must not do is make Back useless.
 */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { computeTimeline } from '@/lib/tijdlijn/engine/compute';
import { emptyInput } from '@/lib/tijdlijn/engine/input';
import { RULES } from '@/lib/tijdlijn/rules';
import { pd, type PlainDate } from '@/lib/tijdlijn/engine/dates';
import { decodeInput, encodeInput } from '@/lib/tijdlijn/state/encode';
import { clearState, loadState, saveState } from '@/lib/tijdlijn/state/storage';
import type { UiLocale } from '@/lib/tijdlijn/format';
import type { TimelineInput } from '@/lib/tijdlijn/engine/types';
import Landing from './Landing';
import Result from './Result';
import Wizard, { type Stage } from './Wizard';

type Phase = 'landing' | 'wizard' | 'result';

export default function TijdlijnApp() {
  const locale = useLocale() as UiLocale;
  const [input, setInput] = useState<TimelineInput>(emptyInput);
  const [stage, setStage] = useState<Stage | null>(null);
  const [phase, setPhase] = useState<Phase>('landing');
  const [today, setToday] = useState<PlainDate | null>(null);
  const [hasSaved, setHasSaved] = useState(false);

  /*
   * Mount: resolve today, then adopt state from the URL if there is any, otherwise notice a saved
   * plan without opening it. A returning visitor is *offered* their timeline; jumping them straight
   * into a stale result would be surprising, and the landing page is where the tool explains itself.
   *
   * `react-hooks/set-state-in-effect` is disabled for this one effect deliberately, and the reason is
   * hydration correctness rather than convenience. All three reads here — the clock, the query string
   * and `localStorage` — exist only in the browser. Moving them into a lazy `useState` initialiser
   * would make the client's first render disagree with the server's (a different date near midnight,
   * a result screen where the server sent a landing page), which is precisely the class of bug a
   * deadline calculator must not have. Reading the environment once after mount is the sanctioned
   * pattern for exactly this, and it runs once — there is no cascade to speak of.
   */
  useEffect(() => {
    const now = new Date();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToday(pd(now.getFullYear(), now.getMonth() + 1, now.getDate()));

    const fromUrl = decodeInput(new URLSearchParams(window.location.search).get('t'));
    if (fromUrl) {
      setInput(fromUrl);
      setPhase('result');
      return;
    }
    setHasSaved(Boolean(loadState()));
  }, []);

  const encoded = useMemo(() => encodeInput(input), [input]);

  /* Mirror the state to the address bar and to storage, but only once the reader is actually working
   * — an untouched landing page should not acquire a query string. */
  useEffect(() => {
    if (phase === 'landing') return;
    const url = `${window.location.pathname}?t=${encodeURIComponent(encoded)}`;
    window.history.replaceState(null, '', url);
    saveState(encoded);
  }, [encoded, phase]);

  const timeline = useMemo(
    () => (today ? computeTimeline(input, RULES, today) : null),
    [input, today],
  );

  const shareUrl = typeof window === 'undefined' ? '' : `${window.location.origin}${window.location.pathname}?t=${encodeURIComponent(encoded)}`;

  if (phase === 'landing' || !today || !timeline) {
    return (
      <Landing
        hasSaved={hasSaved}
        today={today ?? pd(2026, 1, 1)}
        locale={locale}
        onStart={() => {
          setInput(emptyInput());
          setStage(null);
          setPhase('wizard');
        }}
        onResume={() => {
          const saved = decodeInput(loadState());
          if (saved) {
            setInput(saved);
            setPhase('result');
          } else {
            setPhase('wizard');
          }
        }}
      />
    );
  }

  if (phase === 'wizard') {
    return (
      <Wizard
        input={input}
        onChange={setInput}
        stage={stage}
        onStageChange={s => {
          setStage(s);
          /* Q1 is the only answer that writes to more than one field: someone who came for a
           * passport has no obligation and no route, and someone whose term has ended still has one.
           * Doing it here keeps the question components pure option pickers. */
          if (s === 'passport') setInput(prev => ({ ...prev, law: 'none', route: 'naturalisatie_only', wantsNaturalisation: true }));
        }}
        onFinish={() => setPhase('result')}
        today={today}
        locale={locale}
      />
    );
  }

  return (
    <Result
      timeline={timeline}
      input={input}
      onChange={setInput}
      onEditAnswers={() => setPhase('wizard')}
      onReset={() => {
        clearState();
        setInput(emptyInput());
        setStage(null);
        setPhase('landing');
        window.history.replaceState(null, '', window.location.pathname);
      }}
      today={today}
      locale={locale}
      shareUrl={shareUrl}
      encodedState={encoded}
    />
  );
}
