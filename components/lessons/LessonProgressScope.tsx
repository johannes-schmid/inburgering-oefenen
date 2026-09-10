'use client';

import { createContext, useContext, useMemo, useState } from 'react';

/**
 * Wat er van deze les al gedaan is, gedeeld tussen de kop en de stroom.
 *
 * De kaart "Deze les" staat bóven de uitleg en telt dingen die eronder gebeuren: hoeveel
 * opgaven je hebt nagekeken, of je de uitleg voorbij bent gescrold, of de opname is
 * afgelopen. Twee componenten, één waarheid — vandaar een context en niet een tweede telling
 * in de kop.
 *
 * **Alleen echte signalen.** "Uitleg bekeken" betekent hier precies één ding: de uitleg is in
 * beeld geweest (`IntersectionObserver` op de opgavenkop, dus je bent eraan voorbij).
 * "Beluisterd" is het `ended`-event van de opname. Er wordt niets afgeleid uit tijd op de
 * pagina of uit een aanname dat lezen gelijk staat aan scrollen — een vinkje dat iets beweert
 * wat we niet weten is precies het soort verzonnen feit dat dit project niet zet.
 *
 * Buiten een `LessonProgressScope` doen de melders niets. Dat is de preview in `/admin/lessen`:
 * daar is er geen cursist en dus ook geen voortgang.
 */
export type LessonProgress = {
  /** De uitleg is in beeld geweest. */
  seenLearn: boolean;
  /** De opname is helemaal afgespeeld. */
  listened: boolean;
  /** Nagekeken opgaven, en hoeveel er zijn. */
  done: number;
  total: number;
};

type Ctx = LessonProgress & {
  report: (patch: Partial<LessonProgress>) => void;
};

const NOOP: Ctx = { seenLearn: false, listened: false, done: 0, total: 0, report: () => {} };

const LessonProgressContext = createContext<Ctx>(NOOP);

export function LessonProgressScope({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LessonProgress>({
    seenLearn: false, listened: false, done: 0, total: 0,
  });

  const value = useMemo<Ctx>(() => ({
    ...state,
    report: patch => setState(prev => {
      /* Geen render als niets verandert: `LessonStream` meldt zijn telling bij elke wijziging
         van de antwoorden, en dat mag geen lus worden. */
      const next = { ...prev, ...patch };
      return next.seenLearn === prev.seenLearn && next.listened === prev.listened
        && next.done === prev.done && next.total === prev.total
        ? prev
        : next;
    }),
  }), [state]);

  return <LessonProgressContext.Provider value={value}>{children}</LessonProgressContext.Provider>;
}

export function useLessonProgress(): Ctx {
  return useContext(LessonProgressContext);
}
