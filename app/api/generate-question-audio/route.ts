import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { NARRATOR, voiceId } from '@/lib/tts-voices';

const VOICE_ID = voiceId(NARRATOR);
// multilingual_v2, not flash: this audio is generated once and cached in Storage, so there
// is no latency budget to trade quality against. `language_code` is dropped — the API
// ignores it on multilingual_v2.
const MODEL_ID = 'eleven_multilingual_v2';
const SPEED    = 0.9;
const BUCKET   = 'question-audio';

async function synthesize(text: string, apiKey: string): Promise<ArrayBuffer> {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: { stability: 0.45, similarity_boost: 0.75, use_speaker_boost: true, speed: SPEED },
      apply_text_normalization: 'on',
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
    .select('id, prompt, option_layout, question_options(id, label, body)')
    .eq('id', id)
    .single();

  if (error || !q) return NextResponse.json({ error: 'Question not found' }, { status: 404 });

  // Options are rows now, and there may be three or four of them. Image options have no
  // text to read, so they are skipped rather than synthesised as an empty string.
  const options = ((q.question_options ?? []) as { id: number; label: string; body: string | null }[])
    .filter((o) => o.body?.trim())
    .sort((a, b) => a.label.localeCompare(b.label));

  // The spoken question itself. On Luisteren this is the second player in the question
  // pane, independent of the stimulus audio.
  const promptAudio = await synthesize(q.prompt, apiKey);
  const promptUrl = await uploadAudio(supabaseUrl, serviceKey, `${id}/question.mp3`, promptAudio);

  const { error: promptErr } = await supabase
    .from('questions')
    .update({ prompt_audio_url: promptUrl })
    .eq('id', id);
  if (promptErr) return NextResponse.json({ error: promptErr.message }, { status: 500 });

  // One UPDATE per option row — no read-modify-write of a shared array, so two
  // concurrent generations cannot lose each other's writes. The path is keyed on the
  // option's own id, which stays stable if the options are reordered.
  const optionUrls: Record<string, string> = {};
  for (const o of options) {
    const audio = await synthesize(o.body!, apiKey);
    const url = await uploadAudio(
      supabaseUrl, serviceKey, `${id}/option-${o.id}.mp3`, audio
    );
    const { error: optErr } = await supabase
      .from('question_options')
      .update({ audio_url: url })
      .eq('id', o.id);
    if (optErr) return NextResponse.json({ error: optErr.message }, { status: 500 });
    optionUrls[o.label] = url;
  }

  return NextResponse.json({ prompt_audio_url: promptUrl, options: optionUrls });
}
