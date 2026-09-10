'use client';

import { createContext, useContext, useMemo, useState } from 'react';

export type NarrationCue = { id: string; at: number; note?: string };

type Scope = {
  /** Het element waar de stem nu over praat, of null als er niets speelt. */
  activeId: string | null;
  /** De extra uitleg die bij dat element hoort, als het script er een heeft. */
  note: string | null;
  setActive: (cue: NarrationCue | null) => void;
};

const NarrationContext = createContext<Scope>({
  activeId: null,
  note: null,
  setActive: () => {},
});

/**
 * De koppeling tussen de speler en de uitleg eronder.
 *
 * De speler staat in de leskop en de elementen die oplichten staan in `LessonStream`: twee
 * broers, geen ouder-kind. Een context om ze te verbinden en geen module-store zoals KNM die
 * had — een store op moduleniveau leeft langer dan de pagina, en de vorige les liet zijn
 * laatste cue staan als je door navigeerde.
 *
 * Bewust géén `activeIndex` of tijd in de context: als de tijd hierin zou staan, zou elke
 * `timeupdate` — vier keer per seconde — de hele lesstroom hertekenen. Nu verandert de context
 * alleen als de cue verandert, dus acht keer in anderhalve minuut.
 */
export function NarrationScope({
  hasNarration = false, children,
}: { hasNarration?: boolean; children: React.ReactNode }) {
  const [cue, setCue] = useState<NarrationCue | null>(null);

  const value = useMemo<Scope>(() => ({
    activeId: cue?.id ?? null,
    note: cue?.note ?? null,
    setActive: setCue,
  }), [cue]);

  /* De wrapper draagt `les-narrating` zolang er een cue actief is. Daar hangt het terugtreden
     van de níet-besproken elementen aan: dat mag alleen gebeuren terwijl de opname loopt, want
     een halfdoorzichtige pagina zonder geluid leest als een defect. Eén klasse op één ouder in
     plaats van een prop naar vijf kinderen.

     `les-has-narration` staat er de hele tijd op: daar hangt de ruimte aan die het navy
     voorbeeldpaneel onderaan vrijhoudt voor zijn noot. Die moet gereserveerd zijn vóórdat er
     iets speelt, anders springt het paneel open op de eerste cue. */
  return (
    <NarrationContext.Provider value={value}>
      <div className={`${hasNarration ? 'les-has-narration' : ''}${cue ? ' les-narrating' : ''}`.trim() || undefined}>
        {children}
      </div>
    </NarrationContext.Provider>
  );
}

/** Voor de elementen: ben ik aan de beurt, en met welke extra uitleg? */
export function useNarrated(id: string): { active: boolean; note: string | null } {
  const { activeId, note } = useContext(NarrationContext);
  const active = activeId === id;
  return { active, note: active ? note : null };
}

/** Voor de speler. */
export function useNarrationSetter(): (cue: NarrationCue | null) => void {
  return useContext(NarrationContext).setActive;
}

/**
 * De ruwe cue, voor een element dat zélf beslist of het aan de beurt is.
 *
 * `useNarrated(id)` vergelijkt op gelijkheid, en dat is precies goed voor de regelkaart en de
 * voorbeelden: één id, één element. Het lesplaatje heeft die vorm niet — het is één element met
 * genummerde stappen, en de cues heten `vis`, `vis-1`, `vis-2`. Dat kan `useNarrated` niet
 * beantwoorden zonder alle stapnamen te kennen, dus krijgt de visual de cue en doet hij de
 * vergelijking zelf.
 */
export function useNarrationCue(): { id: string | null; note: string | null } {
  const { activeId, note } = useContext(NarrationContext);
  return { id: activeId, note };
}
