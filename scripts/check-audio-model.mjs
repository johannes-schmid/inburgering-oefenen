/**
 * Does the grading model actually hear a WAV file part?
 *
 * This is the gate in front of Spreken grading, and it exists because the cheap version of the
 * check is worthless. The AI Gateway's `audio-input` capability tag is known to be missing from
 * the models response (vercel/ai#9417), and asking a model "did you receive audio?" gets a
 * confident yes from a model that received nothing — it will happily describe the transcript it
 * was also given, or invent one.
 *
 * So the test is falsifiable: synthesise a Dutch sentence the model has no other way of knowing,
 * send **only** the audio with no transcript, and check the words come back. If they do, the file
 * part is genuinely reaching the model and pronunciation grading is real. If they do not, Spreken
 * has to fall back to transcript-plus-signals and `SpeakingTask` does not need to record WAV.
 *
 *   node scripts/check-audio-model.mjs
 *
 * Needs ELEVEN_LAPS_API_KEY (to make the audio) and AI_GATEWAY_API_KEY (to grade it).
 */
import fs from 'node:fs';
import path from 'node:path';
import { generateObject, jsonSchema } from 'ai';

const MODEL = process.env.AI_GRADER_AUDIO_MODEL || 'google/gemini-2.5-flash';

// Deliberately mundane and specific: a plausible A2 answer, with two numbers and a street name
// that cannot be guessed from context. If the model is fabricating, it will not land these.
const SENTENCE =
  'Ik woon sinds drie jaar in de Bakkerstraat en ik werk vier dagen per week in een bakkerij.';
const MUST_CONTAIN = ['bakkerstraat', 'drie', 'vier', 'bakkerij'];

function loadEnv() {
  for (const file of ['.env.development.local', '.env.local', '.env']) {
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, 'utf8');
    for (const line of text.split('\n')) {
      const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }
}

/** ElevenLabs can return raw 16 kHz PCM; a WAV is that plus a 44-byte header. */
function wavFromPcm16(pcm, sampleRate = 16000) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

async function synthesise() {
  const key = process.env.ELEVEN_LAPS_API_KEY;
  if (!key) throw new Error('ELEVEN_LAPS_API_KEY is not set.');
  const voices = JSON.parse(fs.readFileSync('data/tts-voices.json', 'utf8'));
  const voiceId = voices.woman_young.id;

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=pcm_16000`,
    {
      method: 'POST',
      headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: SENTENCE,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.45, similarity_boost: 0.75, speed: 0.9 },
        apply_text_normalization: 'on',
      }),
    }
  );
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return wavFromPcm16(Buffer.from(await res.arrayBuffer()));
}

async function main() {
  loadEnv();
  if (!process.env.AI_GATEWAY_API_KEY) throw new Error('AI_GATEWAY_API_KEY is not set.');

  console.log(`Model: ${MODEL}`);
  process.stdout.write('Synthesising the probe sentence… ');
  const wav = await synthesise();
  console.log(`${(wav.length / 1024).toFixed(0)} KB WAV`);

  const outDir = path.join('temporary_screenshots');
  fs.mkdirSync(outDir, { recursive: true });
  const wavPath = path.join(outDir, 'audio-probe.wav');
  fs.writeFileSync(wavPath, wav);
  console.log(`Wrote ${wavPath} — play it to confirm it is real audio.`);

  process.stdout.write('Asking the model to transcribe it… ');
  const { object } = await generateObject({
    model: MODEL,
    schema: jsonSchema({
      type: 'object',
      additionalProperties: false,
      required: ['heard_audio', 'transcript'],
      properties: {
        heard_audio: { type: 'boolean' },
        transcript: { type: 'string' },
      },
    }),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text:
              'Transcribeer de bijgevoegde opname woord voor woord in het Nederlands. Als je geen ' +
              'audio ontvangt, zet heard_audio op false en laat transcript leeg. Verzin niets.',
          },
          { type: 'file', mediaType: 'audio/wav', data: wav },
        ],
      },
    ],
  });
  console.log('done\n');

  const got = (object.transcript || '').toLowerCase();
  console.log(`  heard_audio : ${object.heard_audio}`);
  console.log(`  transcript  : ${object.transcript || '(leeg)'}`);
  console.log(`  expected    : ${SENTENCE}\n`);

  const hits = MUST_CONTAIN.filter(w => got.includes(w));
  const missed = MUST_CONTAIN.filter(w => !got.includes(w));

  if (hits.length === MUST_CONTAIN.length) {
    console.log(`PASS — all ${hits.length} probe words came back. The audio reached the model.`);
    console.log('Spreken can be graded from the recording. Proceed with the WAV recorder.');
    process.exit(0);
  }

  console.log(`FAIL — matched ${hits.length}/${MUST_CONTAIN.length}; missing: ${missed.join(', ')}`);
  console.log(
    'The model is not reading the audio (or not this format). Do NOT rewrite the recorder:\n' +
      '  - try another model via AI_GRADER_AUDIO_MODEL, or\n' +
      '  - fall back to transcript + measured signals for the pronunciation criterion.'
  );
  process.exit(1);
}

main().catch(err => {
  console.error(`\nERROR: ${err.message}`);
  process.exit(1);
});
