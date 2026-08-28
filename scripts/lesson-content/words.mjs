/**
 * De woordenlijsten van blok A.
 *
 * ── DE RECEPTIEF/PRODUCTIEF-SPLITSING IS HET PUNT ────────────────────────────
 * Elk woord krijgt `usage`: moet je het *herkennen* als je het leest of hoort, of moet je het
 * *zelf kunnen gebruiken*? Dat onderscheid komt uit de didactiek en het is de reden dat deze
 * tabel bestaat naast de bestaande `word_cards` — die kennen het niet, en zonder dat verschil
 * is een woordenles een lijst zonder leerdoel. Een receptief woord toets je met "wat betekent
 * dit", een productief woord met "vul het zelf in".
 *
 * ── `frame` IS GEEN VERSIERING ───────────────────────────────────────────────
 * Veel Nederlandse woorden zijn onbruikbaar zonder hun vaste constructie: *zich melden (bij)*,
 * *wachten (op)*, *verslaafd zijn (aan)*. Een productieve opgave met alleen het kale woord
 * levert een zin op die grammaticaal niet klopt, en dan is de opgave niet na te kijken.
 *
 * ── WAT NIET UIT EEN METHODE KOMT ────────────────────────────────────────────
 * De thema-indeling is van ons (`plan.mjs`), afgeleid uit de onderwerpen van onze eigen veertig
 * oefenexamens. Geen woordenlijst van TaalCompleet of van DUO is hier gebruikt: die zijn
 * auteursrechtelijk beschermd, en een gekopieerde lijst zou precies de claim onderuit halen
 * waar dit product op staat.
 */

import { createAuthor, looksEscaped } from '../b1-content/author.mjs';
import { CACHE_DIR } from './author.mjs';

const WORD_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['words'],
  properties: {
    words: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['dutch', 'article', 'plural', 'frame', 'meaning_nl', 'example', 'usage'],
        properties: {
          dutch: {
            type: 'string',
            description: 'Het woord zelf, zonder lidwoord. Bij een werkwoord het hele werkwoord.',
          },
          article: {
            // Geen `enum` erbij: een enum met `null` erin naast `type: ['string','null']` wordt
            // door de API geweigerd ("Enum value 'de' does not match declared type"). De twee
            // toegestane waarden staan in de beschrijving, worden in `validateWords` gecheckt
            // en staan als CHECK op `lesson_words.article` — drie muren, geen ervan in het
            // JSON-schema.
            type: ['string', 'null'],
            description:
              'Het lidwoord bij een zelfstandig naamwoord: precies "de" of "het". ' +
              'null bij werkwoorden en bijvoeglijke naamwoorden.',
          },
          plural: {
            type: ['string', 'null'],
            description: 'Het meervoud, alleen bij een zelfstandig naamwoord. Anders null.',
          },
          frame: {
            type: ['string', 'null'],
            description:
              'De vaste constructie, als het woord die heeft: "zich melden (bij)", ' +
              '"wachten (op)". null als het woord los kan staan.',
          },
          meaning_nl: {
            type: 'string',
            description:
              'De betekenis in eenvoudig Nederlands, maximaal 12 woorden. Gebruik het woord ' +
              'zelf NIET in de uitleg.',
          },
          example: {
            type: 'string',
            description: 'Één korte voorbeeldzin (6 tot 12 woorden) waarin het woord voorkomt.',
          },
          usage: {
            type: 'string',
            enum: ['receptief', 'productief'],
            description:
              'receptief = de cursist moet het woord begrijpen als hij het leest of hoort. ' +
              'productief = hij moet het ook zelf kunnen gebruiken in een zin.',
          },
        },
      },
    },
  },
};

const SYSTEM = `
Je stelt woordenlijsten samen voor het Nederlandse inburgeringsexamen op niveau A2.
De cursisten zijn volwassen anderstaligen die in Nederland wonen.

Regels:
- Alleen woorden die een A2-kandidaat in dit thema echt tegenkomt: op een brief van een
  instantie, in een gesprek aan een balie, op een formulier, in een advertentie.
- Geen woorden die iedereen op A1 al kent (huis, brood, goed) en geen woorden boven A2
  (mediation, indexering, contractuele).
- Ongeveer twee derde receptief en één derde productief. Productief zijn de woorden die een
  kandidaat nodig heeft om zelf iets te zeggen of te schrijven over dit thema.
- meaning_nl gebruikt het woord zelf niet: "de huurbaas" wordt niet uitgelegd als "de baas van
  de huur".
- Elk woord staat één keer in de lijst. Geen twee vormen van hetzelfde woord.
- Nederlandse namen en plaatsen in de voorbeeldzinnen. Geen echte bedrijven of personen.
- Geen woord overnemen uit een bestaande lesmethode of een bestaand examen.
`.trim();

export function createWordAuthor({ apiKey, gatewayKey, verbose = false }) {
  const author = createAuthor({ apiKey, gatewayKey, verbose, cacheDir: CACHE_DIR });

  async function writeTheme({ level, onderdeel, theme }) {
    const result = await author.askValidated({
      key: `words-${level}-${onderdeel}-${theme.slug}`,
      system: SYSTEM,
      prompt:
        `Thema: ${theme.name}\n` +
        `Onderdeel: ${onderdeel}\n\n` +
        `Geef ${theme.words} woorden voor dit thema.`,
      schema: WORD_SCHEMA,
      maxTokens: 8000,
      validate: u => validateWords(u, theme),
    });
    return result.words;
  }

  return { writeTheme, stats: author.stats };
}

/**
 * Valideer een woordenlijst.
 *
 * De aantalcheck heeft een marge omdat het streefaantal een streefaantal is: een lijst van 22
 * in plaats van 24 opnieuw laten schrijven kost een call en levert niets. Wat géén marge heeft
 * is het duplicaat — twee keer hetzelfde woord in één thema geeft een unique-fout in
 * `lesson_words` en laat de hele seedrun struikelen op iets triviaals.
 */
export function validateWords(unit, theme) {
  const problems = [];
  const words = unit?.words;
  if (!Array.isArray(words) || !words.length) return ['words is leeg'];

  if (looksEscaped(unit)) problems.push('er staan dubbel-escaped tekens in de lijst (\\u00xx)');

  const min = Math.floor(theme.words * 0.75);
  if (words.length < min) {
    problems.push(`${words.length} woorden is te weinig, het streefaantal is ${theme.words}`);
  }

  const seen = new Set();
  for (const w of words) {
    const key = String(w.dutch ?? '').trim().toLowerCase();
    if (!key) { problems.push('een woord heeft geen dutch'); continue; }
    if (seen.has(key)) problems.push(`"${w.dutch}" staat twee keer in de lijst`);
    seen.add(key);

    // Een lidwoord zonder meervoud of een meervoud zonder lidwoord is bijna altijd een half
    // ingevuld zelfstandig naamwoord, en de woordkaart rendert dan een leeg vak.
    if (w.article && !w.plural) problems.push(`"${w.dutch}" heeft een lidwoord maar geen meervoud`);

    if (!w.meaning_nl?.trim()) problems.push(`"${w.dutch}" heeft geen betekenis`);
    if (!w.example?.trim()) problems.push(`"${w.dutch}" heeft geen voorbeeldzin`);
    else if (!w.example.toLowerCase().includes(key.split(' ')[0].slice(0, 5))) {
      // Op de eerste vijf letters vergeleken, want de zin gebruikt een verbogen vorm
      // ("meldt zich" bij "zich melden"). Op de hele string vergelijken zou bijna elke
      // correcte zin afkeuren.
      problems.push(`de voorbeeldzin bij "${w.dutch}" gebruikt het woord niet`);
    }
    if (w.article != null && !['de', 'het'].includes(w.article)) {
      problems.push(`"${w.dutch}" heeft lidwoord "${w.article}"; dat moet "de" of "het" zijn`);
    }
    if (!['receptief', 'productief'].includes(w.usage)) {
      problems.push(`"${w.dutch}" heeft geen geldige usage`);
    }
  }

  const productief = words.filter(w => w.usage === 'productief').length;
  if (productief === 0) problems.push('geen enkel woord is productief');
  if (productief === words.length) problems.push('alle woorden zijn productief; ongeveer een derde is de bedoeling');

  return problems;
}
