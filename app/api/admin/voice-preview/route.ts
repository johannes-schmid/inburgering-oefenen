import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/guard';
import { VOICES, voiceId, type VoiceKey } from '@/lib/tts-voices';

/**
 * One cached sample per voice, so the docent can hear the four standard voices before casting one.
 *
 * The sample is generated **once per voice** and then served from Storage: a preview button that
 * billed ElevenLabs on every click would cost more than the exam audio it exists to get right.
 * The sentence is fixed for the same reason a rubric's anchors are — comparing two voices only
 * means anything if they are saying the same words.
 */

const BUCKET = 'question-audio';
const SAMPLE =
  'Goedemiddag, wat leuk om u te zien. Hoe gaat het met u en met het Nederlands leren?';
/** Matches /api/generate-question-audio, or a preview would not predict the generated prompt. */
const MODEL_ID = 'eleven_multilingual_v2';
const SPEED = 0.9;

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  let body: { voice?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag.' }, { status: 400 });
  }
  const voice = body.voice;
  if (typeof voice !== 'string' || !(voice in VOICES)) {
    return NextResponse.json({ error: 'Onbekende stem.' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!;
  const path = `voice-previews/${voice}.mp3`;
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${path}`;

  // A HEAD first: the sample only has to be paid for the first time anyone asks for this voice.
  const head = await fetch(publicUrl, { method: 'HEAD' });
  if (head.ok) return NextResponse.json({ url: publicUrl, cached: true });

  const apiKey = process.env.ELEVEN_LAPS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'ELEVEN_LAPS_API_KEY ontbreekt.' }, { status: 503 });

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId(voice as VoiceKey)}`, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: SAMPLE,
      model_id: MODEL_ID,
      voice_settings: { stability: 0.45, similarity_boost: 0.75, use_speaker_boost: true, speed: SPEED },
      apply_text_normalization: 'on',
    }),
  });
  if (!res.ok) {
    return NextResponse.json(
      { error: `ElevenLabs ${res.status}: ${(await res.text()).slice(0, 200)}` },
      { status: 502 }
    );
  }

  const audio = await res.arrayBuffer();
  const up = await fetch(`${supabaseUrl}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'audio/mpeg',
      'x-upsert': 'true',
    },
    body: new Blob([audio], { type: 'audio/mpeg' }),
  });
  if (!up.ok) return NextResponse.json({ error: await up.text() }, { status: 500 });

  return NextResponse.json({ url: publicUrl, cached: false });
}
