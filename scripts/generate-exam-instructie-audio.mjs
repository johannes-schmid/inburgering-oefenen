/**
 * De gesproken uitleg op een instructiescherm: B1 Luisteren, de geluidstest, en de twee delen van
 * B1 Spreken.
 *
 * ## Waarom dit een script is en geen knop in /admin
 * De uitleg hoort woord-voor-woord bij wat er op het scherm staat. Staat de tekst in de database
 * en de schermtekst in de code, dan lopen ze uit elkaar zodra iemand er één aanpast — en niemand
 * merkt dat, want je moet ernaar luisteren om het te zien. Nu is de bron een `.txt` in de repo,
 * naast de narratie van de lessen, en een wijziging is een diff die de docent kan nakijken.
 *
 * ## Waarom het bestand in `public/` landt
 * Hij is voor elk luisterexamen hetzelfde en hoort dus niet per examen in Storage. In `public/`
 * reist hij mee met de commit die de tekst verandert, wat precies de koppeling is die we willen.
 *
 *   node scripts/generate-exam-instructie-audio.mjs                       # b1-luisteren-instructie
 *   node scripts/generate-exam-instructie-audio.mjs b1-spreken-deel1      # elk bestand in narration/
 *   node scripts/generate-exam-instructie-audio.mjs b1-spreken-deel1 --dry-run
 *
 * ## Pieptoon en voorbeeldstem
 * Een regel `[pieptoon]` wordt `public/audio/exam/pieptoon.mp3`, met een korte stilte ervoor en
 * erna. Een regel die begint met `{stem:man_young}` spreekt die stem uit `data/tts-voices.json`
 * — zo klinkt het voorbeeldantwoord van Spreken als een kandidaat en niet als de verteller. Alle
 * andere regels zijn de verteller. De stukken worden met ffmpeg aan elkaar gezet.
 *
 * Nodig: ELEVEN_LAPS_API_KEY. ffmpeg op PATH voor de loudnorm- en staartpass.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { loadEnv, createTts, haveFfmpeg, mp3DurationSeconds } from './a2-content/lib.mjs';
import { NARRATOR_KEY } from './a2-content/lib.mjs';

const DRY = process.argv.includes('--dry-run');
const NAAM = process.argv.slice(2).find(a => !a.startsWith('--')) ?? 'b1-luisteren-instructie';
const BRON = `scripts/exam-content/narration/${NAAM}.txt`;
const DOEL = `public/audio/exam/${NAAM}.mp3`;
const PIEPTOON = 'public/audio/exam/pieptoon.mp3';

const bron = fs.readFileSync(BRON, 'utf8').trim();

/** De tekst in stukken: verteller, een andere stem, of de pieptoon. */
const stukken = [];
for (const regel of bron.split(/\n/)) {
  const r = regel.trim();
  if (!r) continue;
  if (/^\[pieptoon\]$/i.test(r)) { stukken.push({ soort: 'piep' }); continue; }
  const stem = r.match(/^\{stem:([a-z_]+)\}\s*(.+)$/);
  const laatste = stukken[stukken.length - 1];
  if (stem) stukken.push({ soort: 'tekst', stem: stem[1], tekst: stem[2] });
  else if (laatste?.soort === 'tekst' && laatste.stem === NARRATOR_KEY) laatste.tekst += `\n\n${r}`;
  else stukken.push({ soort: 'tekst', stem: NARRATOR_KEY, tekst: r });
}

const tekst = stukken.filter(s => s.soort === 'tekst').map(s => s.tekst).join(' ');
const woorden = tekst.split(/\s+/).length;
console.log(`${BRON} — ${woorden} woorden, ${stukken.length} stuk(ken)`);

if (DRY) {
  for (const s of stukken) console.log(s.soort === 'piep' ? '  [pieptoon]' : `  [${s.stem}] ${s.tekst}`);
  console.log('--dry-run: niets geschreven.');
  process.exit(0);
}

const env = loadEnv({ production: false });
if (!env.ELEVEN_LAPS_API_KEY) {
  console.error('ELEVEN_LAPS_API_KEY ontbreekt.');
  process.exit(1);
}
if (!haveFfmpeg()) {
  console.log('! ffmpeg niet op PATH — de opname mist de loudnorm- en staartpass.');
}
if (stukken.some(s => s.soort === 'piep') && !haveFfmpeg()) {
  console.error('Pieptonen samenvoegen vraagt ffmpeg.');
  process.exit(1);
}

const tts = createTts({ apiKey: env.ELEVEN_LAPS_API_KEY });

// Snelheid 1.0, net als de introtracks van de gesprekken: de verteller is één stem door het hele
// examen heen, en een uitleg die sneller loopt dan de rest leest als een andere opname.
const bufs = [];
for (const s of stukken) {
  bufs.push(s.soort === 'piep' ? fs.readFileSync(PIEPTOON) : await tts.narratorAudio(s.tekst, s.stem, 1.0));
}

let buf = bufs[0];
if (bufs.length > 1) {
  // Elk stuk opnieuw gecodeerd naar hetzelfde formaat, met 0,7 s stilte rond elke pieptoon.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'instructie-'));
  const lijst = [];
  const stilte = path.join(dir, 'stilte.mp3');
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono', '-t', '0.7', '-b:a', '128k', '-y', stilte]);
  bufs.forEach((b, i) => {
    const bron = path.join(dir, `in-${i}.mp3`);
    const uit = path.join(dir, `deel-${i}.mp3`);
    fs.writeFileSync(bron, b);
    execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', bron, '-ar', '44100', '-ac', '1', '-b:a', '128k', '-y', uit]);
    const piep = stukken[i].soort === 'piep';
    if (piep) lijst.push(stilte);
    lijst.push(uit);
    if (piep) lijst.push(stilte);
  });
  const txt = path.join(dir, 'lijst.txt');
  fs.writeFileSync(txt, lijst.map(f => `file '${f}'`).join('\n'));
  const uit = path.join(dir, 'uit.mp3');
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', txt, '-c', 'copy', '-y', uit]);
  buf = fs.readFileSync(uit);
  fs.rmSync(dir, { recursive: true, force: true });
}

fs.mkdirSync(path.dirname(DOEL), { recursive: true });
fs.writeFileSync(DOEL, buf);

const secs = mp3DurationSeconds(buf);
console.log(`${DOEL} — ${secs.toFixed(1)}s, ${Math.round(buf.length / 1024)} KB, ${Math.round((woorden / secs) * 60)} wpm`);
