/**
 * De Nederlandse uitspraak van één leerwoord, ingesproken en in Storage gezet.
 *
 * De tegenhanger van `/api/generate-wordcard-audio` op de andere tabel: dat spreekt de 366
 * KNM-kaarten in (`word_cards`), dit de leerwoorden van de cursussen (`lesson_words`). Twee
 * routes en niet één met een `table`-parameter, om dezelfde reden dat de tabellen twee tabellen
 * zijn: de kolomnamen verschillen (`dutch_example` tegen `example`, `audio_dutch_word` tegen
 * `audio_url`) en een route die de tabelnaam uit de request leest is een route die op verzoek in
 * een willekeurige tabel schrijft.
 *
 * **`LESSON_NARRATOR`, de oudere vrouwenstem** (besluit eigenaar, 14-09, na het beluisteren van
 * vijf varianten). De KNM-kaarten houden `NARRATOR`; dit is een andere tabel op een ander scherm
 * en de leerlaag klinkt nu overal als dezelfde docent. `multilingual_v2` en niet `flash`: dit
 * wordt één keer gemaakt en daarna uit Storage geserveerd, dus er is geen latentiebudget om
 * kwaliteit tegen af te wegen.
 *
 * ## Waarom een los woord anders wordt aangeleverd dan een zin
 *
 * `multilingual_v2` leidt de taal af uit de tékst, en één woord zonder context is te weinig:
 * *gezellig* en *uitnodiging* kwamen er met Engelse klinkers uit. `language_code` lost dat niet
 * op — de API negeert hem op dit model, hij werkt alleen op turbo/flash. Wat wél werkt zijn
 * `previous_text` en `next_text`: tekst die het model meeleest maar niet uitspreekt. Twee
 * Nederlandse zinnen eromheen en het woord is ondubbelzinnig Nederlands. De punt erachter maakt
 * er één afgeronde uiting van in plaats van een aangezette lettergreep.
 *
 * `stability` staat op 0.90 en niet op 0.45: hoog is vlak en voorspelbaar, en dat is precies wat
 * een uitspraakmodel moet zijn. En de snelheid is 1.0, niet 0.9 — een vertraagd los woord klinkt
 * uitgerekt, en de kaart heeft de knop *Langzaam* die in de browser op 0.6 afspeelt zonder dat er
 * een tweede opname voor nodig is.
 *
 * Deze vier keuzes staan letterlijk zo in `scripts/lesson-content/backfill-word-media.mjs`, die
 * hetzelfde in bulk doet. Wijk hier niet af zonder daar mee te gaan, of de ene helft van de 410
 * woorden klinkt anders dan de andere.
 *
 * **Deze route heeft wél een `requireAdmin()`.** Elke aanroep kost ElevenLabs-credits, en de drie
 * bestaande TTS-routes missen die poort — dat staat als open punt in CLAUDE.md §12. Een nieuwe
 * route mag dat gat niet groter maken.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin/guard';
import { LESSON_NARRATOR, voiceId } from '@/lib/tts-voices';

const VOICE_ID = voiceId(LESSON_NARRATOR);
const MODEL_ID = 'eleven_multilingual_v2';
const SPEED = 1.0;
const STABILITY = 0.9;
const BUCKET = 'wordcard-audio';

/** Meegelezen, niet uitgesproken — zie de kop. */
const NL_BEFORE = 'We oefenen nu de Nederlandse woorden van deze les. Het volgende woord is:';
const NL_AFTER = 'Spreek het woord nu zelf een keer hardop na.';

async function synthesize(text: string, apiKey: string, isWord: boolean): Promise<ArrayBuffer> {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: isWord ? `${text.trim()}.` : text,
      model_id: MODEL_ID,
      voice_settings: { stability: STABILITY, similarity_boost: 0.75, use_speaker_boost: true, speed: SPEED },
      apply_text_normalization: 'on',
      ...(isWord ? { previous_text: NL_BEFORE, next_text: NL_AFTER } : {}),
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs error ${res.status}: ${await res.text()}`);
  return res.arrayBuffer();
}

async function uploadAudio(
  supabaseUrl: string,
  serviceKey: string,
  storagePath: string,
  data: ArrayBuffer,
): Promise<string> {
  const res = await fetch(`${supabaseUrl}/storage/v1/object/${BUCKET}/${storagePath}`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'audio/mpeg',
      'x-upsert': 'true',
    },
    body: new Blob([data], { type: 'audio/mpeg' }),
  });
  if (!res.ok) throw new Error(`Storage upload failed: ${await res.text()}`);
  // De `?t=` is wat een hergenereerde opname zichtbaar maakt: het pad is hetzelfde, dus zonder
  // deze parameter blijft de browser de oude mp3 tonen en lijkt opnieuw inspreken niets te doen.
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${storagePath}?t=${Date.now()}`;
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const apiKey = process.env.ELEVEN_LAPS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Missing ELEVEN_LAPS_API_KEY' }, { status: 500 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!;

  const { id } = (await req.json()) as { id?: number };
  if (!id) return NextResponse.json({ error: 'Geen woord-id meegegeven.' }, { status: 400 });

  const supabase = createAdminClient();
  const { data: word, error } = await supabase
    .from('lesson_words')
    .select('id, dutch, example')
    .eq('id', id)
    .single();

  if (error || !word) return NextResponse.json({ error: 'Woord niet gevonden.' }, { status: 404 });

  try {
    // Het pad is `lesson/<id>/…` en niet `<id>/…`: die bucket draagt al de KNM-kaarten op hun
    // eigen id, en twee tabellen met overlappende ids zouden elkaars mp3 overschrijven.
    const wordAudio = await synthesize(word.dutch, apiKey, true);
    const audioUrl = await uploadAudio(supabaseUrl, serviceKey, `lesson/${id}/word.mp3`, wordAudio);

    let audioExampleUrl: string | null = null;
    if (word.example?.trim()) {
      const sentence = await synthesize(word.example, apiKey, false);
      audioExampleUrl = await uploadAudio(supabaseUrl, serviceKey, `lesson/${id}/sentence.mp3`, sentence);
    }

    const { error: updateErr } = await supabase
      .from('lesson_words')
      .update({ audio_url: audioUrl, audio_example_url: audioExampleUrl })
      .eq('id', id);
    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    return NextResponse.json({ audio_url: audioUrl, audio_example_url: audioExampleUrl });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Inspreken mislukt.' },
      { status: 500 },
    );
  }
}
