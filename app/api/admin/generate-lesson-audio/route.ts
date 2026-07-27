import { createAdminClient } from '@/lib/supabase/admin';
import { extractCues } from '@/lib/leren-audio-cues';
import { NextRequest, NextResponse } from 'next/server';

const VOICE_ID = 'S2OWP8siwXK4AZRAs2ec';
const MODEL_ID = 'eleven_flash_v2_5';
const BUCKET   = 'leren-audio';

export async function POST(req: NextRequest) {
  const apiKey = process.env.ELEVEN_LAPS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Missing ELEVEN_LAPS_API_KEY' }, { status: 500 });

  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey   = process.env.SUPABASE_SERVICE_KEY!;

  const body = await req.json();
  const { themeId, anchor, script } = body as { themeId: number; anchor: string; script: string };
  if (!themeId || !anchor || !script?.trim()) {
    return NextResponse.json({ error: 'Missing themeId, anchor, or script' }, { status: 400 });
  }

  // 1. Fetch current body_html so we know which widget-specific cues to extract
  const supabase = createAdminClient();
  const { data: section, error: fetchErr } = await supabase
    .from('leren_content')
    .select('body_html')
    .eq('theme_id', themeId)
    .eq('anchor', anchor)
    .single();

  if (fetchErr || !section) {
    return NextResponse.json({ error: 'Section not found' }, { status: 404 });
  }

  // 2. Generate audio with character-level timestamps
  const ttsRes = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps`,
    {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: script,
        model_id: MODEL_ID,
        language_code: 'nl',
        voice_settings: { stability: 1.0, similarity_boost: 1.0, speed: 0.76 },
      }),
    }
  );
  if (!ttsRes.ok) {
    const err = await ttsRes.text();
    return NextResponse.json({ error: `ElevenLabs error: ${err}` }, { status: 502 });
  }

  const { audio_base64, alignment } = await ttsRes.json();

  // 3. Extract sync cues
  const cues = extractCues(script, section.body_html, alignment);

  // 4. Upload MP3 to Supabase Storage
  const storagePath = `thema${themeId}/${anchor}.mp3`;
  const mp3Bytes = Buffer.from(audio_base64, 'base64');

  const uploadRes = await fetch(
    `${supabaseUrl}/storage/v1/object/${BUCKET}/${storagePath}`,
    {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'audio/mpeg',
        'x-upsert': 'true',
      },
      body: mp3Bytes,
    }
  );
  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    return NextResponse.json({ error: `Storage upload failed: ${err}` }, { status: 502 });
  }

  const audioUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${storagePath}?t=${Date.now()}`;

  // 5. Save to DB
  const { error: updateErr } = await supabase
    .from('leren_content')
    .update({ audio_script: script, audio_url: audioUrl, audio_cues: cues })
    .eq('theme_id', themeId)
    .eq('anchor', anchor);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ audioUrl, cues });
}
