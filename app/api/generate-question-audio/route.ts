import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

const VOICE_ID = 'S2OWP8siwXK4AZRAs2ec';
const MODEL_ID = 'eleven_flash_v2_5';
const SPEED    = 0.76;
const BUCKET   = 'question-audio';

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
  if (!id) return NextResponse.json({ error: 'Missing question id' }, { status: 400 });

  const supabase = createAdminClient();
  const { data: q, error } = await supabase
    .from('questions')
    .select('id, question, option_a, option_b, option_c')
    .eq('id', id)
    .single();

  if (error || !q) return NextResponse.json({ error: 'Question not found' }, { status: 404 });

  const tracks: Record<string, string> = {};

  const items: [string, string][] = [
    ['question', q.question],
    ['a', q.option_a],
    ['b', q.option_b],
    ['c', q.option_c],
  ];

  for (const [track, text] of items) {
    const audio = await synthesize(text, apiKey);
    const url   = await uploadAudio(supabaseUrl, serviceKey, `${id}/${track}.mp3`, audio);
    tracks[track] = url;
  }

  const { error: updateErr } = await supabase.from('questions').update({
    audio_question: tracks.question,
    audio_a:        tracks.a,
    audio_b:        tracks.b,
    audio_c:        tracks.c,
  }).eq('id', id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  return NextResponse.json({
    audio_question: tracks.question,
    audio_a:        tracks.a,
    audio_b:        tracks.b,
    audio_c:        tracks.c,
  });
}
