'use client';

import { motion, useReducedMotion } from 'motion/react';
import { Check } from 'lucide-react';

/**
 * "Gehaald" — het enige feestje van Glas (glas.html §15, §G6): een groene schijf die met een veer
 * binnenkomt, één ring die uitdijt en acht vonken. Alleen bij een **gehaald** examen; een goed
 * antwoord krijgt de kleinere beloning van `AnswerRow`, zodat dit moment het grootste blijft.
 *
 * Eén keer, nooit in een lus. Met "beweging verminderen" staat meteen de stille eindstand: de
 * schijf met het vinkje, zonder ring en zonder vonken.
 */
const EO = [0.23, 1, 0.32, 1] as const;
const SPARKS = 8;

export default function PassBurst({ label }: { label: string }) {
  const reduce = useReducedMotion();

  return (
    <span className="g-xpass" role="img" aria-label={label}>
      {!reduce && (
        <>
          <motion.span
            className="g-xpass-rip"
            initial={{ transform: 'scale(0.9)', opacity: 0.8 }}
            animate={{ transform: 'scale(1.7)', opacity: 0 }}
            transition={{ duration: 0.7, delay: 0.18, ease: EO }}
          />
          {Array.from({ length: SPARKS }, (_, i) => {
            const a = (i / SPARKS) * Math.PI * 2;
            const d = 44 + (i % 2) * 8;
            const x = (Math.cos(a) * d).toFixed(1);
            const y = (Math.sin(a) * d).toFixed(1);
            return (
              <motion.span
                key={i}
                className="g-xpass-spk"
                initial={{ transform: 'translate(0px, 0px) scale(0.4)', opacity: 0 }}
                animate={{
                  transform: ['translate(0px, 0px) scale(0.4)', `translate(${x}px, ${y}px) scale(1)`],
                  opacity: [0, 1, 0],
                }}
                transition={{ duration: 0.76, delay: 0.2, ease: EO, opacity: { times: [0, 0.25, 1], duration: 0.76, delay: 0.2 } }}
              />
            );
          })}
        </>
      )}
      <motion.span
        className="g-xpass-disc"
        initial={reduce ? false : { transform: 'scale(0.6)', opacity: 0 }}
        animate={{ transform: 'scale(1)', opacity: 1 }}
        transition={{ type: 'spring', duration: 0.52, bounce: 0.3 }}
      >
        <Check strokeWidth={3} aria-hidden />
      </motion.span>
    </span>
  );
}
