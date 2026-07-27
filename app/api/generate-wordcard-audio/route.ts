import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

const VOICE_ID = 'S2OWP8siwXK4AZRAs2ec';
const MODEL_ID = 'eleven_flash_v2_5';
const SPEED    = 0.76;
const BUCKET   = 'wordcard-audio';

async function synthesize(text: string, apiKey: string): Promise<ArrayBuffer> {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      language_code: 'nl',
      voice_settings: { stability: 1.0, similarity_boost: 1.0, speed: SPEED },
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs error ${res.status}: ${await res.text()}`);
  return res.arrayBuffer();
}

async function uploadAudio(supabaseUrl: string, serviceKey: string, storagePath: string, data: ArrayBuffer): Promise<string> {
  const blob = new Blob([data], { type: 'audio/mpeg' });
  const res = await fetch(`${supabaseUrl}/storage/v1/object/${BUCKET}/${storagePath}`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'audio/mpeg',
      'x-upsert': 'true',
    },
    body: blob,
  });
  if (!res.ok) throw new Error(`Storage upload failed: ${await res.text()}`);
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${storagePath}?t=${Date.now()}`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ELEVEN_LAPS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Missing ELEVEN_LAPS_API_KEY' }, { status: 500 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey  = process.env.SUPABASE_SERVICE_KEY!;

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing word card id' }, { status: 400 });

  const supabase = createAdminClient();
  const { data: card, error } = await supabase
    .from('word_cards')
    .select('id, dutch, dutch_example')
    .eq('id', id)
    .single();

  if (error || !card) return NextResponse.json({ error: 'Word card not found' }, { status: 404 });

  const wordAudio = await synthesize(card.dutch, apiKey);
  const audioDutchWord = await uploadAudio(supabaseUrl, serviceKey, `${id}/word.mp3`, wordAudio);

  let audioDutchSentence: string | null = null;
  if (card.dutch_example?.trim()) {
    const sentenceAudio = await synthesize(card.dutch_example, apiKey);
    audioDutchSentence = await uploadAudio(supabaseUrl, serviceKey, `${id}/sentence.mp3`, sentenceAudio);
  }

  const { error: updateErr } = await supabase.from('word_cards').update({
    audio_dutch_word: audioDutchWord,
    audio_dutch_sentence: audioDutchSentence,
  }).eq('id', id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  return NextResponse.json({
    audio_dutch_word: audioDutchWord,
    audio_dutch_sentence: audioDutchSentence,
  });
}
