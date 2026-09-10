/**
 * Vertaalt de woorden van `lesson_words` naar Engels en Arabisch.
 *
 * ── WAT HIER MACHINAAL IS, EN WAT NIET ───────────────────────────────────────
 * De Nederlandse kant van een woordkaart is van de docent: het woord, het lidwoord, het meervoud,
 * de betekenis in eenvoudig Nederlands, de voorbeeldzin. Dáár gaat de claim van het product over,
 * en die verandert dit script niet — het leest die velden alleen om context te geven.
 *
 * De vertaling is machinaal, precies zoals de gidsvertalingen, en dus wordt
 * `translations_reviewed` op `false` gezet en zegt de kaart dat er niemand naar heeft gekeken.
 * Zodra de docent een scope heeft nagekeken zet zij die vlag op `true`; er is bewust geen
 * `--reviewed`-vlag hier, want dit script is niet de plek waar iemand kan verklaren dat zij het
 * heeft gedaan.
 *
 * ── HET IS ÉÉN WOORD, NIET EEN ZIN ───────────────────────────────────────────
 * Het model krijgt de betekenis en de voorbeeldzin mee, en dat is de hele reden dat dit niet met
 * een woordenboek kan: *de gemeente* is `municipality` en niet `community`, en welke van de twee
 * het is blijkt uit de Nederlandse uitleg, niet uit het woord.
 *
 * ── GEBRUIK ──────────────────────────────────────────────────────────────────
 *   node scripts/lesson-content/translate-words.mjs --level a2 --onderdeel lezen
 *   node scripts/lesson-content/translate-words.mjs --level a2 --onderdeel lezen --dry
 *   node scripts/lesson-content/translate-words.mjs --level a2 --onderdeel lezen --force
 *
 * Zonder `--force` worden alleen woorden zonder Engelse vertaling opgehaald, dus een tweede run
 * na een afgebroken eerste kost niets. `--dry` schrijft niets en print de eerste vijf.
 *
 * Schrijft standaard naar de **lokale** stack: `loadEnv` leest `.env.development.local` er
 * bovenop, precies zoals de rest van `scripts/`. Naar productie schrijven kost een expliciete
 * `--production`, en het script zegt welke van de twee het is voordat het begint.
 */

import { loadEnv, isLocalUrl, createDb } from '../a2-content/lib.mjs';
import { createAuthor } from '../b1-content/author.mjs';
import { CACHE_DIR } from './author.mjs';

/** Hoeveel woorden per modelaanroep. Boven ~30 gaat de kwaliteit van de late items merkbaar omlaag. */
const BATCH = 25;

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['translations'],
  properties: {
    translations: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['dutch', 'en', 'ar'],
        properties: {
          dutch: {
            type: 'string',
            description: 'Het Nederlandse woord, exact zoals het in de invoer stond. Niet vertalen.',
          },
          en: {
            type: 'string',
            description:
              'De Engelse vertaling van het woord zelf, niet van de voorbeeldzin. Eén woord of ' +
              'een korte woordgroep. Geen lidwoord, geen uitleg tussen haakjes.',
          },
          ar: {
            type: 'string',
            description:
              'De Arabische vertaling van het woord zelf, in Arabisch schrift. Modern Standaard ' +
              'Arabisch. Geen transliteratie, geen uitleg.',
          },
        },
      },
    },
  },
};

const SYSTEM = `Je vertaalt Nederlandse woorden uit een NT2-woordenlijst (niveau A2/B1) naar Engels en Arabisch.

Je krijgt per woord: het woord, het lidwoord, de betekenis in eenvoudig Nederlands en een voorbeeldzin.

Regels:
- Vertaal HET WOORD, niet de betekenis en niet de voorbeeldzin.
- De Nederlandse uitleg bepaalt welke betekenis je kiest. "de gemeente" met de uitleg "bestuur van
  een stad of dorp" is "municipality", niet "community".
- Bij een werkwoord: de infinitief ("to register"), niet een vervoegde vorm.
- Bij een samenstelling die in het Engels geen los woord heeft, geef een korte woordgroep
  ("rental contract"), niet een omschrijving van een halve zin.
- Arabisch in Arabisch schrift, Modern Standaard Arabisch, zonder klinkertekens.
- Geef exact evenveel items terug als je binnenkreeg, in dezelfde volgorde, met "dutch" letterlijk
  overgenomen.`;

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--')
    ? process.argv[i + 1]
    : fallback;
}
const has = name => process.argv.includes(`--${name}`);

/** Arabisch schrift, zodat een teruggevallen Latijnse transliteratie niet stil de database in gaat. */
const ARABIC = /[؀-ۿ]/;

function validate(out, batch) {
  const problems = [];
  const got = out?.translations ?? [];
  if (got.length !== batch.length) {
    problems.push(`${batch.length} woorden gestuurd, ${got.length} terug`);
    return problems;
  }
  got.forEach((tr, i) => {
    const want = batch[i];
    const at = `"${want.dutch}"`;
    if (tr.dutch !== want.dutch) problems.push(`${at}: kwam terug als "${tr.dutch}"`);
    if (!tr.en?.trim()) problems.push(`${at}: geen Engelse vertaling`);
    if (!tr.ar?.trim()) problems.push(`${at}: geen Arabische vertaling`);
    else if (!ARABIC.test(tr.ar)) problems.push(`${at}: "${tr.ar}" staat niet in Arabisch schrift`);
    // Er is hier géén regel die "en gelijk aan dutch" afkeurt, en dat is een gerepareerde fout:
    // *diploma*, *container*, *specialist* en *taxi* zíjn in het Engels hetzelfde woord. Die regel
    // dwong drie batches tot een tweede poging waarin het model een slechter synoniem verzon om
    // aan de eis te voldoen. Een validator die correcte uitvoer afkeurt maakt de dataset slechter.
  });
  return problems;
}

async function main() {
  const level = arg('level', 'a2');
  const onderdeel = arg('onderdeel');
  const dry = has('dry');
  const force = has('force');

  if (!onderdeel) {
    console.error('Geef --onderdeel mee (lezen, luisteren, schrijven, spreken).');
    process.exit(1);
  }

  const env = loadEnv({ production: has('production') });
  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    console.error('Geen SUPABASE_URL / SUPABASE_SERVICE_KEY gevonden.');
    process.exit(1);
  }
  console.log(`Doel: ${isLocalUrl(url) ? 'de lokale stack' : 'PRODUCTIE'} (${url})`);

  const gatewayKey = env.AI_GATEWAY_API_KEY ?? null;
  const apiKey = env.ANTHROPIC_API_KEY ?? null;
  if (!gatewayKey && !apiKey) {
    console.error('Geen AI_GATEWAY_API_KEY en geen ANTHROPIC_API_KEY gevonden.');
    process.exit(1);
  }

  // PostgREST en niet supabase-js: die trekt de realtime-client mee, en die vraagt op Node 20 om
  // een `ws`-pakket dat hier niet staat. Elk ander script in `scripts/` gaat om dezelfde reden
  // via `createDb`.
  const db = createDb({ supabaseUrl: url, serviceKey: key });

  const query = [
    'select=id,dutch,article,meaning_nl,example',
    `level=eq.${level}`,
    `onderdeel=eq.${onderdeel}`,
    'order=sort_order',
    ...(force ? [] : ['translation_en=is.null']),
  ].join('&');

  const words = await db.selectRows('lesson_words', query);
  if (!words?.length) {
    console.log(`Niets te doen: geen woorden zonder vertaling in ${level}/${onderdeel}.`);
    return;
  }

  console.log(`${words.length} woorden te vertalen in ${level}/${onderdeel}.`);
  const author = createAuthor({ apiKey, gatewayKey, cacheDir: CACHE_DIR });

  const done = [];
  for (let i = 0; i < words.length; i += BATCH) {
    const batch = words.slice(i, i + BATCH);
    const n = Math.floor(i / BATCH) + 1;
    const total = Math.ceil(words.length / BATCH);

    const prompt = batch
      .map(w => {
        const head = w.article ? `${w.article} ${w.dutch}` : w.dutch;
        return [
          `- woord: ${w.dutch}`,
          `  vorm: ${head}`,
          `  betekenis: ${w.meaning_nl}`,
          w.example ? `  voorbeeld: ${w.example}` : null,
        ]
          .filter(Boolean)
          .join('\n');
      })
      .join('\n');

    const out = await author.askValidated({
      key: `translate-${level}-${onderdeel}-${batch[0].id}-${batch.at(-1).id}`,
      system: SYSTEM,
      prompt: `Vertaal deze ${batch.length} woorden:\n\n${prompt}`,
      schema: SCHEMA,
      validate: o => validate(o, batch),
      maxTokens: 8000,
    });

    out.translations.forEach((tr, k) => done.push({ id: batch[k].id, en: tr.en.trim(), ar: tr.ar.trim() }));
    console.log(`  batch ${n}/${total} klaar (${done.length}/${words.length})`);
  }

  if (dry) {
    console.log('\n--dry: niets geschreven. De eerste vijf:');
    for (const d of done.slice(0, 5)) {
      const w = words.find(x => x.id === d.id);
      console.log(`  ${w.dutch} → ${d.en} / ${d.ar}`);
    }
    return;
  }

  // Eén update per woord, want een upsert met een gedeeltelijke rij zou de door de docent
  // geschreven Nederlandse velden op NOT NULL laten struikelen. 126 updates is een paar seconden.
  let written = 0;
  for (const d of done) {
    try {
      await db.patch('lesson_words', `id=eq.${d.id}`, {
        translation_en: d.en,
        translation_ar: d.ar,
        translations_reviewed: false,
      });
      written++;
    } catch (e) {
      console.error(`  ${d.id}: ${e.message}`);
    }
  }

  console.log(`\n${written} woorden bijgewerkt. translations_reviewed staat op false —`);
  console.log('de kaart zegt tegen de lezer dat de vertaling niet is nagekeken.');
  const s = author.stats();
  console.log(`${s.calls} modelaanroepen · ${s.inTokens} in / ${s.outTokens} uit · $${s.usd.toFixed(3)}`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
