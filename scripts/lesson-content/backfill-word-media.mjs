#!/usr/bin/env node
/**
 * Vult de woordkaarten van de leerlaag: een foto per woord, en de Nederlandse uitspraak van het
 * woord én van de voorbeeldzin.
 *
 * ── WAAROM DIT EEN SCRIPT IS EN GEEN KNOP ────────────────────────────────────
 * In `/admin/woorden` staat per woord een fotokiezer en een "Spreek in"-knop, en dat blijft de
 * plek waar de docent één kaart corrigeert. Maar 410 woorden één voor één is geen werk dat een
 * mens hoort te doen, en het is precies hoe de 366 KNM-kaarten zijn gevuld:
 * `scripts/backfill-wordcard-images.mjs` in `knm-website`. Dit is diezelfde pijplijn op
 * `lesson_words`, met de audio erbij.
 *
 * ── DE PIJPLIJN, PER WOORD ───────────────────────────────────────────────────
 *   foto : Claude Haiku maakt een Engelse fotozoekterm van (woord, vertaling, thema,
 *          voorbeeldzin) → Pexels' bovenste landschapsresultaat → sharp naar webp op 800px/q80
 *          → upload naar `wordcard-images` → **bytes teruglezen en vergelijken** → `image_url`.
 *   audio: ElevenLabs `multilingual_v2` met `LESSON_NARRATOR` (de oudere vrouwenstem) →
 *          twee mp3's (woord, zin) → `audio_url`, `audio_example_url`. De instellingen staan
 *          één op één in `app/api/admin/generate-lesson-word-audio/route.ts`, die hetzelfde
 *          per woord doet; zie de kop daar voor waarom een los woord anders wordt aangeleverd
 *          dan een zin. Wijk hier niet af zonder daar mee te gaan.
 *
 * De byte-vergelijking is niet defensief maar geleerd: in `knm-website` gingen alle 366 foto's
 * door een UTF-8-stringconversie vóór de upload, waardoor elke byte >= 0x80 U+FFFD werd. De
 * bestanden gaven 200, hadden het juiste content-type en `file` noemde ze WebP — alleen een
 * decodepoging liet de schade zien. Uploaden zonder terugleesvergelijking is hoe dat een jaar
 * onopgemerkt bleef.
 *
 * ── PEXELS GEEFT 200 AANROEPEN PER UUR ──────────────────────────────────────
 * 410 woorden zijn dus minstens drie vensters. `--wait-on-limit` slaapt tot het venster opnieuw
 * opengaat; zonder die vlag stopt het script en zegt hoelang. Opnieuw draaien is gratis: een
 * woord met een fotó die decodeert wordt overgeslagen, dus een afgebroken run gaat verder waar
 * hij stopte. De zoektermen staan in `.word-image-queries.json` zodat een tweede run niet
 * opnieuw voor dezelfde 410 woorden aan het model betaalt.
 *
 * ── GEBRUIK ──────────────────────────────────────────────────────────────────
 *   node scripts/lesson-content/backfill-word-media.mjs --level a2 --onderdeel lezen
 *   node scripts/lesson-content/backfill-word-media.mjs --level a2 --onderdeel lezen --apply
 *   node scripts/lesson-content/backfill-word-media.mjs --level a2 --onderdeel lezen --apply --audio
 *   node scripts/lesson-content/backfill-word-media.mjs --level a2 --onderdeel lezen --apply --production --yes
 *
 * Zonder `--apply` schrijft het niets en zegt het alleen wat het zou doen. Zonder `--images` of
 * `--audio` doet het beide. `--production` vereist ook `--yes`, want dat schrijft naar de kaarten
 * die kandidaten zien én kost geld bij twee externe partijen.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { loadEnv, isLocalUrl, createDb } from '../a2-content/lib.mjs';

const IMAGE_BUCKET = 'wordcard-images';
const AUDIO_BUCKET = 'wordcard-audio';
/** Zelfde pad-voorvoegsel als de route: die bucket draagt ook KNM's kaarten op hun eigen id. */
const IMAGE_PREFIX = 'lesson-words';
const AUDIO_PREFIX = 'lesson';
const QUERY_CACHE = path.join(process.cwd(), '.word-image-queries.json');

const QUERY_MODEL = 'claude-haiku-4-5';
/** Uit `lib/tts-voices.ts` — nooit een hardgecodeerde stem-id, zegt CLAUDE.md §9. */
const TTS_MODEL = 'eleven_multilingual_v2';
const TTS_SPEED = 1.0;
const TTS_STABILITY = 0.9;
/** Meegelezen, niet uitgesproken: zo weet het model dat het losse woord Nederlands is. */
const NL_BEFORE = 'We oefenen nu de Nederlandse woorden van deze les. Het volgende woord is:';
const NL_AFTER = 'Spreek het woord nu zelf een keer hardop na.';
/** 800px/q80, letterlijk de `wordcard`-spec uit `app/api/admin/upload-image/route.ts`. */
const IMG_WIDTH = 800;
const IMG_QUALITY = 80;

// ── argumenten ───────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const has = n => argv.includes(`--${n}`);
function arg(n, fallback = null) {
  const i = argv.indexOf(`--${n}`);
  return i > -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback;
}

const level = arg('level', 'a2');
const onderdeel = arg('onderdeel');
const apply = has('apply');
const production = has('production');
const force = has('force');
const waitOnLimit = has('wait-on-limit');
const limit = arg('limit') ? Number(arg('limit')) : Infinity;
const delayMs = Number(arg('delay') ?? 400);
/* Geen van de twee gevraagd betekent beide. Wél één gevraagd betekent alléén die. */
const wantImages = has('images') || !has('audio');
const wantAudio = has('audio') || !has('images');

if (!onderdeel) {
  console.error('Geef --onderdeel mee (lezen, luisteren, schrijven, spreken).');
  process.exit(1);
}
if (production && apply && !has('yes')) {
  console.error('--production --apply vereist ook --yes: dit schrijft naar productie en kost geld.');
  process.exit(1);
}

// ── omgeving ─────────────────────────────────────────────────────────────────

const env = loadEnv({ production });
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_KEY;
const PEXELS_KEY = env.PEXELS_API_KEY;
const ANTHROPIC_KEY = env.ANTHROPIC_API_KEY;
const ELEVEN_KEY = env.ELEVEN_LAPS_API_KEY;

/**
 * De doelbewaking, en hij staat er omdat `loadEnv` twee bestanden over elkaar legt.
 *
 * `--production` leest alleen `.env.local`, zonder vlag komt `.env.development.local` erbovenop.
 * Als iemand die bestanden door elkaar haalt schrijft een "lokale" run naar productie zonder dat
 * er iets van klaagt. Dus: controleer dat de URL echt is wat de vlag belooft, en weiger anders.
 */
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Geen SUPABASE_URL / SUPABASE_SERVICE_KEY gevonden.');
  process.exit(1);
}
if (production && isLocalUrl(SUPABASE_URL)) {
  console.error(`--production, maar .env.local wijst naar ${SUPABASE_URL}. Gestopt.`);
  process.exit(1);
}
if (!production && !isLocalUrl(SUPABASE_URL)) {
  console.error(`Geen --production, maar de URL is ${SUPABASE_URL} — dat is niet de lokale stack. Gestopt.`);
  process.exit(1);
}
if (wantImages) {
  for (const [n, v] of [['PEXELS_API_KEY', PEXELS_KEY], ['ANTHROPIC_API_KEY', ANTHROPIC_KEY]]) {
    if (!v) { console.error(`Missing ${n} — nodig voor --images.`); process.exit(1); }
  }
}
if (wantAudio && !ELEVEN_KEY) {
  console.error('Missing ELEVEN_LAPS_API_KEY — nodig voor --audio.');
  process.exit(1);
}

/**
 * De stem uit `data/tts-voices.json`, nooit een hardgecodeerde id (CLAUDE.md §9).
 *
 * Dit is `LESSON_NARRATOR` uit `lib/tts-voices.ts` — de oudere vrouwenstem, sinds 14-09 ook de
 * stem van de leerwoorden (besluit eigenaar, na vijf beluisterde varianten). `lib/tts-voices.ts`
 * is TypeScript, dus een `.mjs` kan hem niet
 * importeren — de sleutel staat hier daarom als string, precies zoals `seed-test-exams.mjs` en
 * `generate-free-practice-audio.mjs` het al doen. Wat níet mag is de id overtypen: die komt uit
 * de JSON, zodat een gewisselde stem op één plek wisselt.
 */
const NARRATOR = 'woman_older';
const VOICES = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'tts-voices.json'), 'utf8'));
if (!VOICES[NARRATOR]) {
  console.error(`Stem "${NARRATOR}" staat niet in data/tts-voices.json.`);
  process.exit(1);
}
const VOICE_ID = VOICES[NARRATOR].id;

console.log(`Doel     : ${isLocalUrl(SUPABASE_URL) ? 'de lokale stack' : 'PRODUCTIE'} (${SUPABASE_URL})`);
console.log(`Scope    : ${level}/${onderdeel}`);
console.log(`Doet     : ${[wantImages && 'foto', wantAudio && 'audio'].filter(Boolean).join(' + ')}`);
console.log(`Stem     : ${NARRATOR} (${VOICE_ID}) · ${TTS_MODEL} · snelheid ${TTS_SPEED}`);
console.log(`Modus    : ${apply ? 'APPLY — schrijft Storage en database' : 'DROOG — schrijft niets'}\n`);

// ── hulpjes ──────────────────────────────────────────────────────────────────

const db = createDb({ supabaseUrl: SUPABASE_URL, serviceKey: SERVICE_KEY });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const sha256 = b => crypto.createHash('sha256').update(b).digest('hex');

const storage = (p, init = {}) =>
  fetch(`${SUPABASE_URL}/storage/v1/object/${p}`, {
    ...init,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, ...(init.headers ?? {}) },
  });

async function decodes(buf) {
  if (!buf?.length) return false;
  try {
    const m = await sharp(buf).metadata();
    return Boolean(m.width && m.height);
  } catch {
    return false;
  }
}

class RateLimited extends Error {
  constructor(reset) { super('Pexels rate limit'); this.reset = reset; }
}

// ── de zoekterm ──────────────────────────────────────────────────────────────

const queryCache = fs.existsSync(QUERY_CACHE) ? JSON.parse(fs.readFileSync(QUERY_CACHE, 'utf8')) : {};

/**
 * De Engelse fotozoekterm, door Haiku, en gecached op woord-id.
 *
 * Dezelfde vraag als `/api/wordcard-pexels-query`, met het **thema** erbij: die route heeft dat
 * veld niet, maar hier wél, en het is het verschil tussen een foto van een willekeurige balie en
 * een gemeenteloket. "de aanvraag" in het thema *gemeente* is iets anders dan in *werk*.
 */
async function buildQuery(w) {
  /**
   * Op het wóórd en niet op het id.
   *
   * Een id is per omgeving anders — de lokale stack en productie krijgen hun rijen uit losse
   * seed-runs — en een cache op id zou bij een productierun de zoekterm van een ánder woord
   * teruggeven. Niet met een foutmelding: met een nette foto van iets anders. `(niveau, onderdeel,
   * dutch)` is de echte sleutel van deze tabel, dus dat is ook de sleutel van de cache.
   */
  const cacheKey = `${level}:${onderdeel}:${w.dutch}`;
  if (queryCache[cacheKey] && !force) return queryCache[cacheKey];

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: QUERY_MODEL,
      max_tokens: 30,
      messages: [{
        role: 'user',
        content:
          'Give me a 4-6 word English Pexels photo search query that visually illustrates this '
          + 'Dutch vocabulary word, used in a Dutch civic integration (inburgering) course at A2 '
          + 'level. Always include "Netherlands" in the query. Prefer a concrete, everyday scene '
          + 'over an abstract concept. Return ONLY the search query, nothing else.\n\n'
          + `Dutch word: ${w.article ? `${w.article} ` : ''}${w.dutch}\n`
          + `English translation: ${w.translation_en ?? ''}\n`
          + `Dutch meaning: ${w.meaning_nl ?? ''}\n`
          + `Theme: ${w.theme ?? ''}\n`
          + `Example sentence: ${w.example ?? ''}`,
      }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 160)}`);
  const data = await res.json();
  // Terugvallen op het woord zelf en niet overslaan: een kaart zonder foto is erger dan een
  // kaart met een matige foto, en de docent kan hem in /admin/woorden vervangen.
  const query = data.content?.[0]?.text?.trim()
    || `${w.translation_en || w.dutch} Netherlands`;
  queryCache[cacheKey] = query;
  fs.writeFileSync(QUERY_CACHE, JSON.stringify(queryCache, null, 2));
  return query;
}

async function topPexelsPhoto(query) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}`
    + '&per_page=5&orientation=landscape';
  const res = await fetch(url, { headers: { Authorization: PEXELS_KEY } });
  if (res.status === 429) throw new RateLimited(Number(res.headers.get('x-ratelimit-reset')) || 0);
  if (!res.ok) throw new Error(`Pexels ${res.status}: ${(await res.text()).slice(0, 160)}`);
  const data = await res.json();
  const photo = data.photos?.[0];
  return photo ? { url: photo.src.large2x || photo.src.large, id: photo.id } : null;
}

// ── de foto ──────────────────────────────────────────────────────────────────

async function buildWebp(sourceUrl) {
  const res = await fetch(sourceUrl);
  if (!res.ok) throw new Error(`bron ${res.status}`);
  const input = Buffer.from(await res.arrayBuffer());
  if (!(await decodes(input))) throw new Error('bronafbeelding decodeert niet');
  const webp = await sharp(input)
    .rotate()
    .resize({ width: IMG_WIDTH, withoutEnlargement: true })
    .webp({ quality: IMG_QUALITY })
    .toBuffer();
  if (!(await decodes(webp))) throw new Error('gecodeerde webp decodeert niet');
  return webp;
}

async function uploadImage(id, webp) {
  const objectPath = `${IMAGE_PREFIX}/${id}.webp`;
  const up = await storage(`${IMAGE_BUCKET}/${objectPath}`, {
    method: 'POST',
    headers: { 'Content-Type': 'image/webp', 'x-upsert': 'true', 'Cache-Control': 'max-age=3600' },
    body: webp,
  });
  if (!up.ok) throw new Error(`upload ${up.status}: ${(await up.text()).slice(0, 160)}`);

  /* Terugleggen via het geauthenticeerde object-eindpunt en niet via de publieke CDN-weg: die
     kan een gecachte kopie geven en dan vergelijk je bytes met een oudere versie van jezelf. */
  const back = await storage(`${IMAGE_BUCKET}/${objectPath}`);
  if (!back.ok) throw new Error(`terugleggen ${back.status}`);
  const stored = Buffer.from(await back.arrayBuffer());
  if (sha256(stored) !== sha256(webp)) {
    throw new Error(`bytes wijken af: ${webp.length}B geüpload, ${stored.length}B opgeslagen`);
  }
  if (!(await decodes(stored))) throw new Error('opgeslagen object decodeert niet');

  return `${SUPABASE_URL}/storage/v1/object/public/${IMAGE_BUCKET}/${objectPath}?t=${Date.now()}`;
}

async function imageIsGood(w) {
  if (!w.image_url) return false;
  try {
    const res = await fetch(w.image_url);
    if (!res.ok) return false;
    return await decodes(Buffer.from(await res.arrayBuffer()));
  } catch {
    return false;
  }
}

// ── de audio ─────────────────────────────────────────────────────────────────

async function synthesize(text, isWord) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: 'POST',
    headers: { 'xi-api-key': ELEVEN_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: isWord ? `${text.trim()}.` : text,
      model_id: TTS_MODEL,
      voice_settings: {
        stability: TTS_STABILITY, similarity_boost: 0.75, use_speaker_boost: true, speed: TTS_SPEED,
      },
      apply_text_normalization: 'on',
      ...(isWord ? { previous_text: NL_BEFORE, next_text: NL_AFTER } : {}),
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 160)}`);
  return Buffer.from(await res.arrayBuffer());
}

async function uploadAudio(objectPath, bytes) {
  const up = await storage(`${AUDIO_BUCKET}/${objectPath}`, {
    method: 'POST',
    headers: { 'Content-Type': 'audio/mpeg', 'x-upsert': 'true' },
    body: bytes,
  });
  if (!up.ok) throw new Error(`upload ${up.status}: ${(await up.text()).slice(0, 160)}`);
  return `${SUPABASE_URL}/storage/v1/object/public/${AUDIO_BUCKET}/${objectPath}?t=${Date.now()}`;
}

// ── main ─────────────────────────────────────────────────────────────────────

const words = await db.selectRows('lesson_words', [
  'select=id,theme,dutch,article,meaning_nl,example,translation_en,image_url,audio_url,audio_example_url',
  `level=eq.${level}`,
  `onderdeel=eq.${onderdeel}`,
  'order=sort_order',
].join('&'));

if (!words?.length) {
  console.log(`Geen woorden in ${level}/${onderdeel}.`);
  process.exit(0);
}
console.log(`${words.length} woorden in scope.\n`);

const stats = { imgOk: 0, imgSkip: 0, imgNone: 0, imgFail: 0, audOk: 0, audSkip: 0, audFail: 0, would: 0 };
const failures = [];
let done = 0;

for (const w of words) {
  if (done >= limit) { console.log(`\n--limit=${limit} bereikt. Draai opnieuw om verder te gaan.`); break; }

  const label = `#${String(w.id).padStart(4)} ${w.dutch}`.padEnd(32);
  const needsImage = wantImages && (force || !(await imageIsGood(w)));
  const needsAudio = wantAudio && (force || !w.audio_url);

  if (!needsImage && !needsAudio) {
    if (wantImages) stats.imgSkip++;
    if (wantAudio) stats.audSkip++;
    continue;
  }

  if (!apply) {
    stats.would++;
    console.log(`${label} zou ${[needsImage && 'foto', needsAudio && 'audio'].filter(Boolean).join(' + ')} maken`);
    done++;
    continue;
  }

  const patch = {};
  let note = [];

  /**
   * De foto, met een herkansing ná het wachten op de Pexels-limiet.
   *
   * De lus zit er omdat de eerste versie hier `continue` deed: dat slaapt netjes tot het venster
   * opengaat en gaat dan door naar het **volgende** woord — het woord dat de limiet raakte werd
   * dus overgeslagen. Erger nog: `RateLimited` telde niet als mislukking, dus de samenvatting zei
   * "mislukt: 0" terwijl 43 van de 105 Spreken-woorden niets hadden gekregen. Een script dat
   * overslaat hoort dat te zeggen; dit script probeert het gewoon opnieuw.
   */
  if (needsImage) {
    let stop = false;
    for (;;) {
      try {
        const query = await buildQuery(w);
        const photo = await topPexelsPhoto(query);
        if (!photo) {
          stats.imgNone++;
          note.push(`geen Pexels-resultaat voor "${query}"`);
        } else {
          const webp = await buildWebp(photo.url);
          patch.image_url = await uploadImage(w.id, webp);
          stats.imgOk++;
          note.push(`foto ${(webp.length / 1024).toFixed(0)}KB "${query}"`);
        }
        break;
      } catch (e) {
        if (e instanceof RateLimited) {
          const waitMs = Math.max(0, e.reset * 1000 - Date.now()) + 5000;
          if (!waitOnLimit) {
            console.log(`\nPexels-limiet bereikt na ${stats.imgOk} foto's.`);
            console.log(`Opent weer in ~${Math.ceil(waitMs / 60000)} min. Draai dan hetzelfde commando —`);
            console.log('woorden die al een foto hebben worden overgeslagen.');
            stop = true;
            break;
          }
          console.log(`   limiet — ${Math.ceil(waitMs / 60000)} min slapen, daarna opnieuw voor "${w.dutch}"`);
          await sleep(waitMs);
          continue;
        }
        stats.imgFail++;
        failures.push({ id: w.id, dutch: w.dutch, what: 'foto', error: e.message });
        note.push(`FOTO MISLUKT: ${e.message}`);
        break;
      }
    }
    if (stop) break;
  }

  if (needsAudio) {
    try {
      patch.audio_url = await uploadAudio(`${AUDIO_PREFIX}/${w.id}/word.mp3`, await synthesize(w.dutch, true));
      if (w.example?.trim()) {
        patch.audio_example_url = await uploadAudio(
          `${AUDIO_PREFIX}/${w.id}/sentence.mp3`, await synthesize(w.example, false),
        );
      }
      stats.audOk++;
      note.push(patch.audio_example_url ? 'audio woord+zin' : 'audio woord');
    } catch (e) {
      stats.audFail++;
      failures.push({ id: w.id, dutch: w.dutch, what: 'audio', error: e.message });
      note.push(`AUDIO MISLUKT: ${e.message}`);
    }
  }

  if (Object.keys(patch).length > 0) {
    try {
      await db.patch('lesson_words', `id=eq.${w.id}`, patch);
    } catch (e) {
      failures.push({ id: w.id, dutch: w.dutch, what: 'database', error: e.message });
      note.push(`DB MISLUKT: ${e.message}`);
    }
  }

  console.log(`${label} ${note.join(' · ')}`);
  done++;
  if (done % 25 === 0) console.log(`   … ${stats.imgOk} foto's, ${stats.audOk} opnames`);
  await sleep(delayMs);
}

console.log('\n─── samenvatting ───');
if (!apply) {
  console.log(`zou doen        : ${stats.would}`);
  console.log(`al klaar        : foto ${stats.imgSkip} · audio ${stats.audSkip}`);
  console.log('\nDraai opnieuw met --apply om te schrijven.');
} else {
  if (wantImages) {
    console.log(`foto's gemaakt  : ${stats.imgOk}`);
    console.log(`al goed         : ${stats.imgSkip}`);
    console.log(`geen resultaat  : ${stats.imgNone}`);
    console.log(`mislukt         : ${stats.imgFail}`);
  }
  if (wantAudio) {
    console.log(`opnames gemaakt : ${stats.audOk}`);
    console.log(`al aanwezig     : ${stats.audSkip}`);
    console.log(`mislukt         : ${stats.audFail}`);
  }
}
if (failures.length) {
  console.log('\nMislukt:');
  for (const f of failures) console.log(`  #${f.id} ${f.dutch} (${f.what}): ${f.error}`);
}
