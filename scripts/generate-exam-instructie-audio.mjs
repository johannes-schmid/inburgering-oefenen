/**
 * De gesproken uitleg op het instructiescherm van een luisterexamen.
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
 *   node scripts/generate-exam-instructie-audio.mjs            # schrijft het mp3
 *   node scripts/generate-exam-instructie-audio.mjs --dry-run  # alleen de tekst en de telling
 *
 * Nodig: ELEVEN_LAPS_API_KEY. ffmpeg op PATH voor de loudnorm- en staartpass.
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadEnv, createTts, haveFfmpeg, mp3DurationSeconds } from './a2-content/lib.mjs';
import { NARRATOR_KEY } from './a2-content/lib.mjs';

const DRY = process.argv.includes('--dry-run');
const BRON = 'scripts/exam-content/narration/b1-luisteren-instructie.txt';
const DOEL = 'public/audio/exam/b1-luisteren-instructie.mp3';

const tekst = fs.readFileSync(BRON, 'utf8').trim();
const woorden = tekst.split(/\s+/).length;
console.log(`${BRON} — ${woorden} woorden`);

if (DRY) {
  console.log('\n' + tekst + '\n');
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

const tts = createTts({ apiKey: env.ELEVEN_LAPS_API_KEY });

// Snelheid 1.0, net als de introtracks van de gesprekken: de verteller is één stem door het hele
// examen heen, en een uitleg die sneller loopt dan de rest leest als een andere opname.
const buf = await tts.narratorAudio(tekst, NARRATOR_KEY, 1.0);

fs.mkdirSync(path.dirname(DOEL), { recursive: true });
fs.writeFileSync(DOEL, buf);

const secs = mp3DurationSeconds(buf);
console.log(`${DOEL} — ${secs.toFixed(1)}s, ${Math.round(buf.length / 1024)} KB, ${Math.round((woorden / secs) * 60)} wpm`);
