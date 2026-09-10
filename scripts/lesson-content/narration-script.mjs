/**
 * Het scriptbestand van een narratie: commentaar eruit, markers eruit, cues eruit.
 *
 * Apart bestand omdat het de enige logica is die het waard is om te testen — de generator
 * eromheen is netwerk en Storage. Zie `tests-unit/narration-script.test.ts`.
 *
 * **Waarom markers en geen tekstmatching.** KNM koppelde audio aan elementen door het script
 * tegen de `body_html` te matchen: 452 regels heuristiek die stil de verkeerde alinea koos als
 * een zin twee keer voorkwam. Een marker zégt het, en zijn positie in de schoongemaakte tekst
 * is exact het tekenoffset dat de ElevenLabs-alignment nodig heeft. Er is niets te raden.
 */

/** `[[id]]` of `[[id | extra uitleg]]`, en `#`-regels zijn commentaar. */
const MARKER = /\[\[\s*([a-z0-9-]+)\s*(?:\|([^\]]*))?\]\]/gi;



/**
 * @returns `text` zoals de stem hem krijgt, en per cue het tekenoffset daarin.
 */
export function parseScript(raw) {
  const withoutComments = raw
    .split('\n')
    .filter(line => !line.trimStart().startsWith('#'))
    .join('\n');

  const cues = [];
  let text = '';
  let last = 0;

  for (const m of withoutComments.matchAll(MARKER)) {
    text += withoutComments.slice(last, m.index);
    // Het offset is de lengte van wat er *tot hier* aan echte tekst staat — niet de index in
    // het ruwe bestand. Dat verschil is het hele punt: de stem krijgt de schone tekst.
    cues.push({
      id: m[1].toLowerCase(),
      offset: text.length,
      note: m[2]?.trim() || undefined,
    });
    last = m.index + m[0].length;
  }
  text += withoutComments.slice(last);

  /* Lege regels die door een weggehaalde marker zijn ontstaan opruimen, en het offset
     meeschuiven. Zonder dit staat er een gat van drie newlines waar de marker stond en leest
     de stem een pauze voor die er niet hoort. */
  const collapsed = collapseBlankLines(text, cues);

  return { text: collapsed.text.trim(), cues: collapsed.cues };
}

function collapseBlankLines(text, cues) {
  const out = [];
  const shifts = [];
  let removed = 0;
  let i = 0;
  while (i < text.length) {
    // Drie of meer newlines op rij worden twee.
    const run = /^\n{3,}/.exec(text.slice(i));
    if (run) {
      out.push('\n\n');
      removed += run[0].length - 2;
      shifts.push({ from: i, removed });
      i += run[0].length;
      continue;
    }
    out.push(text[i]);
    i += 1;
  }
  const joined = out.join('');
  return {
    text: joined,
    cues: cues.map(c => {
      const shift = [...shifts].reverse().find(s => s.from < c.offset);
      return { ...c, offset: Math.max(0, c.offset - (shift?.removed ?? 0)) };
    }),
  };
}

/**
 * Cues met een tijdstip erbij, uit de karakter-alignment van ElevenLabs.
 *
 * `character_start_times_seconds[i]` hoort bij het i-de teken van de tekst die we verstuurden,
 * dus het offset is de index. Valt een offset buiten de array — de API normaliseert tekst en
 * kan er tekens bij of af halen — dan wordt het de laatst bekende tijd in plaats van een
 * exception: één cue op een seconde te vroeg is oneindig veel beter dan geen opname.
 */
export function timeCues(cues, characterStartTimes) {
  if (!Array.isArray(characterStartTimes) || characterStartTimes.length === 0) {
    return cues.map(c => ({ id: c.id, at: 0, ...(c.note ? { note: c.note } : {}) }));
  }
  const lastIdx = characterStartTimes.length - 1;
  return cues
    .map(c => ({
      id: c.id,
      at: Number(characterStartTimes[Math.min(c.offset, lastIdx)].toFixed(2)),
      ...(c.note ? { note: c.note } : {}),
    }))
    // Op tijd, want de speler loopt ze op tijd af. Ze staan al op tijd, maar een script waarin
    // iemand twee markers omwisselt hoort geen speler te breken.
    .sort((a, b) => a.at - b.at);
}

/**
 * De woorden van het script met hun starttijd — het meelezen.
 *
 * Dezelfde alignment als `timeCues`, andere korrel: daar acht markers, hier elk woord. De
 * tokenizer staat **hier en nergens anders**, want het paneel op de lespagina rendert uit deze
 * uitvoer en niet uit `script`. Zou de client zelf knippen, dan zijn er twee tokenizers die
 * gelijk moeten blijven, en de fout die dat oplevert — het woord ernaast licht op — ziet
 * niemand in een test.
 *
 * `p` is de alinea-index: het paneel houdt daarmee de regelval van het script, en dat is wat
 * "meelezen" leesbaar houdt bij 250 woorden in één vlak.
 *
 * Interpunctie blijft aan het woord vastzitten. Los getokeniseerd zou "buurvrouw" en "," twee
 * woorden zijn die op dezelfde honderdste beginnen, en dan flikkert de markering.
 */
export function wordTimes(text, characterStartTimes) {
  const times = Array.isArray(characterStartTimes) ? characterStartTimes : [];
  const lastIdx = times.length - 1;
  /* De tijd van teken `i`, met dezelfde tolerantie als `timeCues`: de API normaliseert tekst,
     dus de array kan korter zijn dan onze string. */
  const at = i => (lastIdx < 0 ? 0 : Number(times[Math.min(i, lastIdx)].toFixed(2)));

  const out = [];
  let paragraph = 0;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (/\s/.test(ch)) {
      // Een lege regel is een nieuwe alinea. Eén newline binnen een alinea is een zachte
      // afbreking in het bestand en geen nieuwe alinea — het script is met de hand gezet.
      if (/^\n[ \t]*\n/.test(text.slice(i))) paragraph += 1;
      i += 1;
      continue;
    }
    let j = i;
    while (j < text.length && !/\s/.test(text[j])) j += 1;
    out.push({ w: text.slice(i, j), t: at(i), p: paragraph });
    i = j;
  }

  /* Monotoon maken. De alignment loopt op, maar een genormaliseerd getal ("twee" voor "2")
     schuift tekens op en kan één woord een tijd geven die vóór zijn voorganger ligt. De speler
     zoekt hier lineair van achteren in, en dan zou zo'n woord onbereikbaar zijn. */
  for (let k = 1; k < out.length; k += 1) {
    if (out[k].t < out[k - 1].t) out[k].t = out[k - 1].t;
  }
  return out;
}
