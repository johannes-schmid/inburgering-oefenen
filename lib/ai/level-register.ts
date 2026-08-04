/**
 * What each CEFR level means, in the words the prompts need.
 *
 * The grader and the authoring helper both used to hardcode A2 — "A2 is een beginnersniveau",
 * "houd hem op A2". Left alone, that is the quietest of the B1 bugs: a B1 answer would be
 * marked lenient against A2 expectations and a B1 stimulus would be written at A2 register,
 * and both come back looking entirely plausible. Nothing errors, the marks are just wrong.
 *
 * One place, so the two pipelines cannot drift. These are register descriptions for a prompt,
 * not claims about DUO's exam format — item counts and durations live in `exam_formats` and
 * `data/skills.ts`, and B1's are deliberately unverified.
 */
import type { Level } from '@/data/skills';

export type LevelRegister = {
  /** `'A2'` — how the level is named in Dutch prose. */
  label: string;
  /** One line placing the level, for the top of a system prompt. */
  summary: string;
  /** How tolerant the grader should be of error at this level. */
  tolerance: string;
  /** The register feedback and generated content must themselves be written in. */
  writeIn: string;
  /** Bullet rules for the authoring helper. */
  authoring: string[];
};

export const LEVEL_REGISTER: Record<Level, LevelRegister> = {
  a2: {
    label: 'A2',
    summary:
      'Je past de beoordelingscriteria van een NT2-docent toe op het antwoord van een kandidaat ' +
      'die het Nederlandse inburgeringsexamen op A2-niveau oefent.',
    tolerance:
      'A2 is een beginnersniveau. Eenvoudige zinnen met fouten zijn normaal en horen geen laag ' +
      'cijfer te krijgen zolang de boodschap duidelijk is.',
    writeIn:
      'Schrijf alle feedback in het Nederlands op A2-niveau: korte zinnen, "je", gewone woorden.',
    authoring: [
      'Je schrijft materiaal voor het Nederlandse inburgeringsexamen op niveau A2.',
      'Regels voor A2:',
      '- Korte zinnen, gemiddeld hooguit 12 woorden.',
      '- Alledaagse woorden. Leg een woord uit als het niet alledaags is.',
      '- Concrete, dagelijkse situaties: wonen, werk, gezondheid, school, boodschappen.',
      '- Gebruik "je", niet "u", tenzij de situatie formeel is.',
      '- Eén onderwerp per zin. Vermijd bijzinnen die stapelen.',
    ],
  },
  b1: {
    label: 'B1',
    summary:
      'Je past de beoordelingscriteria van een NT2-docent toe op het antwoord van een kandidaat ' +
      'die het Nederlandse inburgeringsexamen op B1-niveau oefent.',
    // Deliberately stricter than A2's line. A B1 candidate is expected to connect ideas and
    // handle less predictable subject matter; forgiving that as "normaal op dit niveau" would
    // hand out A2 marks on a B1 exam.
    tolerance:
      'B1 ligt boven beginnersniveau. Losse fouten mogen het cijfer niet drukken zolang de ' +
      'boodschap duidelijk is, maar op B1 mag je wel verwachten dat de kandidaat zinnen ' +
      'verbindt, een mening onderbouwt en ook een minder voorspelbaar onderwerp aankan. ' +
      'Beoordeel niet soepeler dan de ankers voorschrijven.',
    writeIn:
      'Schrijf alle feedback in het Nederlands op B1-niveau: heldere zinnen, "je", geen jargon.',
    authoring: [
      'Je schrijft materiaal voor het Nederlandse inburgeringsexamen op niveau B1.',
      'Regels voor B1:',
      '- Zinnen mogen langer zijn dan op A2, gemiddeld hooguit 18 woorden.',
      '- Gewone woorden, maar ook minder frequente woorden mogen, mits de context ze draagt.',
      '- Situaties mogen abstracter zijn: werk, opleiding, gezondheidszorg, nieuws, meningen.',
      '- Verbindingswoorden (omdat, hoewel, daardoor) zijn hier juist gewenst.',
      '- Gebruik "je", tenzij de situatie formeel is; dan "u".',
    ],
  },
};

export function registerFor(level: Level): LevelRegister {
  return LEVEL_REGISTER[level];
}
