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
        required: ['dutch', 'article', 'plural', 'frame', 'meaning_nl', 'example', 'example_form', 'usage'],
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
          example_form: {
            type: 'string',
            /* Dit veld bestaat om de voorbeeldzin te kunnen controleren, en het is het
               antwoord op een check die niet te schrijven was. Zie `usesWord`: een
               stamvergelijking haalt "vind" uit "vinden", maar geen enkele regel haalt "ga"
               uit "gaan" of "geeft toe" uit "toegeven" — en dat zijn precies de woorden waar
               een A2-lijst vol mee staat. Het model wéét welke vorm het heeft neergezet; door
               het te laten opschrijven wordt de controle een exacte match in plaats van een
               gok, en de docent ziet er meteen bij welke vorm hij nakijkt. */
            description:
              'De vorm waarin het woord in de voorbeeldzin staat, LETTERLIJK zoals hij daar ' +
              'staat. Bij "gaan" met de zin "Ik ga morgen naar de dokter." is dat "ga"; bij ' +
              '"toegeven" met "Hij geeft toe dat hij fout zat." is dat "geeft toe".',
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
- Productief zijn de woorden die een kandidaat nodig heeft om zelf iets te zeggen of te
  schrijven over dit thema; receptief zijn de woorden die hij alleen moet begrijpen.
- meaning_nl gebruikt het woord zelf niet: "de huurbaas" wordt niet uitgelegd als "de baas van
  de huur".
- Elk woord staat één keer in de lijst. Geen twee vormen van hetzelfde woord.
- Nederlandse namen en plaatsen in de voorbeeldzinnen. Geen echte bedrijven of personen.
- Geen woord overnemen uit een bestaande lesmethode of een bestaand examen.
`.trim();

/**
 * Hoeveel van de lijst productief moet zijn, per onderdeel.
 *
 * **Dit is de reden dat elke cursus zijn eigen woorden heeft.** `lesson_words` is unique op
 * `(level, onderdeel, dutch)`, en die sleutel bestaat precies zodat dezelfde woordenschat per
 * onderdeel anders kan worden aangeleerd:
 *
 *   Luisteren   je hoeft "het perron" nooit te kunnen zeggen; je moet het herkennen als het
 *               door een luidspreker komt. Vrijwel de hele lijst is receptief, en een
 *               productieve opgave erover zou iets toetsen wat het examen niet vraagt.
 *   Schrijven   het omgekeerde: "Zou u mij kunnen laten weten" is waardeloos als je het alleen
 *               begrijpt.
 *   Spreken     idem, en nog sterker — dit is de enige cursus waarin een woord dat je niet kunt
 *               úitspreken geen woord is dat je kent.
 *   Lezen       de brede middenweg: twee derde receptief.
 *
 * `min` en `max` zijn fracties van de lijst en worden door `validateWords` afgedwongen, met
 * marge: een lijst opnieuw laten schrijven omdat hij 70% productief is in plaats van 75% kost
 * een call en levert niets.
 */
const USAGE_MIX = {
  lezen:     { min: 0.15, max: 0.55, hint: 'Ongeveer twee derde receptief en één derde productief.' },
  luisteren: {
    min: 0.0, max: 0.30,
    hint:
      'Bijna alles receptief. De cursist moet deze woorden HERKENNEN als hij ze hoort; hij ' +
      'hoeft ze niet zelf te kunnen zeggen. Alleen een woord dat hij aan een balie of aan de ' +
      'telefoon echt zelf nodig heeft, is productief.',
  },
  schrijven: {
    min: 0.55, max: 1.0,
    hint:
      'Bijna alles productief. Dit zijn de woorden en formules die de cursist zelf moet ' +
      'opschrijven in een e-mail, een briefje of op een formulier.',
  },
  spreken: {
    min: 0.55, max: 1.0,
    hint:
      'Bijna alles productief. Dit zijn de woorden en zinnen die de cursist zelf moet kunnen ' +
      'zeggen. Kies wat uitspreekbaar is op A2 — een woord dat hij niet over zijn lippen ' +
      'krijgt, kent hij niet.',
  },
};

export function mixFor(onderdeel) {
  const mix = USAGE_MIX[onderdeel];
  if (!mix) throw new Error(`geen usage-verhouding voor onderdeel "${onderdeel}"`);
  return mix;
}

export function createWordAuthor({ apiKey, gatewayKey, verbose = false }) {
  const author = createAuthor({ apiKey, gatewayKey, verbose, cacheDir: CACHE_DIR });

  async function writeTheme({ level, onderdeel, theme }) {
    const mix = mixFor(onderdeel);
    const result = await author.askValidated({
      key: `words-${level}-${onderdeel}-${theme.slug}`,
      system: SYSTEM,
      prompt:
        `Thema: ${theme.name}\n` +
        `Onderdeel: ${onderdeel}\n\n` +
        `Geef ${theme.words} woorden voor dit thema.\n\n` +
        `Verhouding receptief/productief: ${mix.hint}`,
      schema: WORD_SCHEMA,
      maxTokens: 8000,
      validate: u => validateWords(u, theme, onderdeel),
    });
    return result.words;
  }

  return { writeTheme, stats: author.stats };
}

/**
 * Gebruikt deze voorbeeldzin het woord echt?
 *
 * Op de stam vergeleken en niet op het hele woord, want de zin gebruikt een verbogen vorm:
 * "meldt zich" bij *zich melden*, "Ik vind" bij *vinden*. De eerste versie sneed het woord op
 * vijf letters af, en dat werkte voor zelfstandige naamwoorden en verwierp bijna elk werkwoord —
 * "vinde" staat niet in "Ik vind dat het te duur is". Op een lijst als "Je mening geven", die
 * vrijwel alleen uit werkwoorden bestaat, liep daardoor geen enkele schrijfronde meer door.
 *
 * Daarom: de infinitiefuitgang eraf, en dan is vier letters genoeg. Korter dan vier zou
 * toevalstreffers geven ("ga" staat in "vergadering").
 */
export function usesWord(example, word, form) {
  const hay = String(example).toLowerCase();
  const used = String(form ?? '').trim().toLowerCase();
  if (!used) return 'example_form is leeg; noem de vorm die in de zin staat';

  /* 1. Elk deel van de opgegeven vorm staat in de zin, als heel woord.

        **Per deel en niet als één string, en dat is een eis van het Nederlands.** Bij een
        scheidbaar werkwoord staat de vorm niet bij elkaar: *afslaan* wordt "U slaat rechts
        <em>af</em>", en de helft van de zin staat ertussen. Een aaneengesloten match verwierp
        daardoor precies de woorden waar een les over de weg wijzen uit bestaat.

        Op woordgrenzen, want zonder dat zit "ga" in "vergadering" en zou een zin over een
        vergadering als voorbeeld bij *gaan* doorgaan. Dát is de fout die deze check moet
        vangen, en die blijft hij vangen. */
  /* Alleen de delen die echt een woord zijn. Het model schrijft een scheidbaar werkwoord soms
     met een gat erin — "toets ... in", "belt ... terug" — en dat is een prima notatie voor wat
     er in de zin gebeurt; de puntjes zijn geen woord om te zoeken. */
  const parts_ = used.split(/\s+/).filter(part => /[a-zà-ü]/.test(part));
  const missing = parts_.filter(part => {
    const re = new RegExp(`(^|[^a-zà-ü])${part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-zà-ü]|$)`);
    return !re.test(hay);
  });
  if (missing.length) {
    return `de voorbeeldzin bevat ${missing.map(m => `"${m}"`).join(' en ')} niet als heel ` +
      `woord, terwijl example_form "${used}" zegt`;
  }

  /* 2. En die vorm hoort bij dít woord. Zonder deze tweede stap zou "ga" bij "vinden" mogen
        staan zolang het in de zin voorkomt. Twee letters is genoeg om de sterke werkwoorden
        door te laten (gaan → ga, zijn → is valt hier buiten en dat is de prijs) en de meeste
        verwisselingen te vangen. Een strengere eis is precies waar de vorige versie op stukliep. */
  const head = String(word)
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .split(/\s+/)
    .filter(w => w && !['zich', 'de', 'het', 'een'].includes(w))[0] ?? '';
  /* Twee kanten op vergeleken, en dat is nodig voor de scheidbare werkwoorden: bij *toegeven*
     staat er "geeft toe", en "geeft" begint niet als "toegeven" — maar "toegeven" bevat wél
     "ge". Sterke werkwoorden met klankwisseling (gaan → ga) komen langs de eerste tak.
     Wat hier bewust niet doorkomt is *zijn* → "is"; dat woord staat op A1 en niet in deze
     lijsten, en er één uitzondering voor inbouwen zou de check onbetrouwbaar maken. */
  const usedHead = used.split(/\s+/)[0] ?? '';
  const a = head.slice(0, 2);
  const b = usedHead.slice(0, 2);
  if (head && usedHead && a !== b && !head.includes(b) && !usedHead.includes(a)) {
    return `example_form "${used}" lijkt niet op "${word}"`;
  }

  return null;
}

/**
 * Valideer een woordenlijst.
 *
 * De aantalcheck heeft een marge omdat het streefaantal een streefaantal is: een lijst van 22
 * in plaats van 24 opnieuw laten schrijven kost een call en levert niets. Wat géén marge heeft
 * is het duplicaat — twee keer hetzelfde woord in één thema geeft een unique-fout in
 * `lesson_words` en laat de hele seedrun struikelen op iets triviaals.
 */
export function validateWords(unit, theme, onderdeel = 'lezen') {
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

    /* Een meervoud zonder lidwoord is altijd fout: alleen een zelfstandig naamwoord heeft een
       meervoud, en dat heeft dus ook een lidwoord.

       **Andersom is het géén fout, en dat was een te strenge regel.** "een lidwoord maar geen
       meervoud" verwierp precies de niet-telbare woorden — de kritiek, het geld, de post — en
       die zijn met een lijst als "Je mening geven" niet de uitzondering maar de helft. Drie
       schrijfrondes op rij liepen erop vast, en het antwoord dat de check wilde ("de kritieken")
       zou fóut Nederlands zijn geweest. De renderer kan een leeg meervoud aan; hij doet het al
       bij elk werkwoord. */
    if (w.plural && !w.article) problems.push(`"${w.dutch}" heeft een meervoud maar geen lidwoord`);

    if (!w.meaning_nl?.trim()) problems.push(`"${w.dutch}" heeft geen betekenis`);
    if (!w.example?.trim()) problems.push(`"${w.dutch}" heeft geen voorbeeldzin`);
    else {
      const issue = usesWord(w.example, key, w.example_form);
      if (issue) problems.push(`bij "${w.dutch}": ${issue}`);
    }
    if (w.article != null && !['de', 'het'].includes(w.article)) {
      problems.push(`"${w.dutch}" heeft lidwoord "${w.article}"; dat moet "de" of "het" zijn`);
    }
    if (!['receptief', 'productief'].includes(w.usage)) {
      problems.push(`"${w.dutch}" heeft geen geldige usage`);
    }
  }

  /* De verhouding receptief/productief, per onderdeel — zie `USAGE_MIX`. Bij Luisteren is een
     lijst die volledig receptief is juist góed; bij Schrijven en Spreken is hij dat nooit. */
  const mix = mixFor(onderdeel);
  const productief = words.filter(w => w.usage === 'productief').length;
  const share = productief / words.length;
  if (share < mix.min) {
    problems.push(
      `${productief} van ${words.length} woorden is productief; voor ${onderdeel} moet dat ` +
      `minstens ${Math.round(mix.min * 100)}% zijn`);
  }
  if (share > mix.max) {
    problems.push(
      `${productief} van ${words.length} woorden is productief; voor ${onderdeel} mag dat ` +
      `hoogstens ${Math.round(mix.max * 100)}% zijn`);
  }

  return problems;
}
