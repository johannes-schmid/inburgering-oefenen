import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { NARRATOR, VOICES, voiceId, type VoiceKey } from '@/lib/tts-voices';
import { requireAdmin } from '@/lib/admin/guard';

/**
 * Single-narrator exam audio: a question read aloud, or a Spreken prompt.
 *
 * Two-voice Luisteren *stimuli* are a different pipeline — /api/generate-stimulus-audio, which
 * uses text-to-dialogue. This one is one voice reading one text, which is why the Spreken prompt
 * belongs here rather than in a fourth TTS endpoint.
 *
 * **This route used to have no authentication at all.** It spends ElevenLabs credits per call and
 * was reachable by anyone who knew the path. `requireAdmin()` closes that.
 */

const isVoiceKey = (v: unknown): v is VoiceKey => typeof v === 'string' && v in VOICES;
// multilingual_v2, not flash: this audio is generated once and cached in Storage, so there
// is no latency budget to trade quality against. `language_code` is dropped — the API
// ignores it on multilingual_v2.
const MODEL_ID = 'eleven_multilingual_v2';
const SPEED    = 0.9;
const BUCKET   = 'question-audio';

async function synthesize(text: string, apiKey: string, voice: VoiceKey = NARRATOR): Promise<ArrayBuffer> {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId(voice)}`, {
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
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const apiKey = process.env.ELEVEN_LAPS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Missing ELEVEN_LAPS_API_KEY' }, { status: 500 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey  = process.env.SUPABASE_SERVICE_KEY!;

  const body = await req.json();
  const { id, openTaskId } = body as { id?: number; openTaskId?: number };
  // The script the docent is looking at, which may not be the one in the row: the editor holds
  // one draft and saves once, so generating from the saved row would speak the *previous* text.
  const draftScript = typeof body.script === 'string' ? body.script.trim() : '';
  if (body.voice !== undefined && body.voice !== null && !isVoiceKey(body.voice)) {
    return NextResponse.json({ error: `Onbekende stem: ${String(body.voice)}` }, { status: 400 });
  }
  const requestedVoice: VoiceKey | null = isVoiceKey(body.voice) ? body.voice : null;
  const supabase = createAdminClient();

  /* ── Spreken prompt audio ──────────────────────────────────────────────────────────────────
   * Until now nothing generated `open_tasks.prompt_audio_url` at all — it could only be pasted,
   * it was always the narrator, and nothing recorded which voice had spoken it.
   *
   * Draft mode (`script` with no `openTaskId`) exists for the same reason the stimulus route has
   * one: a new opgave has no id to key a file on, and the docent must be able to hear the line
   * before committing the row. The object is keyed by timestamp and no row is written; an
   * abandoned draft leaves one orphan mp3, which is the accepted cost.
   */
  if (openTaskId || draftScript) {
    let spoken = draftScript;
    let voice: VoiceKey = requestedVoice ?? NARRATOR;

    if (openTaskId) {
      const { data: task, error: taskErr } = await supabase
        .from('open_tasks')
        .select('id, prompt_script, prompt_voice')
        .eq('id', openTaskId)
        .single();
      if (taskErr || !task) return NextResponse.json({ error: 'Opgave niet gevonden.' }, { status: 404 });
      // `prompt_script` is what the candidate should HEAR; `prompt_html` is what they read. They
      // are not the same text, and reading the HTML aloud would speak the layout.
      if (!spoken) spoken = (task.prompt_script ?? '').trim();
      if (!requestedVoice && isVoiceKey(task.prompt_voice)) voice = task.prompt_voice;
    }

    if (!spoken) {
      return NextResponse.json(
        { error: 'Deze opgave heeft nog geen gesproken tekst (script van de vraag).' },
        { status: 400 }
      );
    }

    const audio = await synthesize(spoken, apiKey, voice);
    const path = openTaskId ? `task-${openTaskId}/prompt.mp3` : `task-draft/${Date.now()}.mp3`;
    const url = await uploadAudio(supabaseUrl, serviceKey, path, audio);

    if (openTaskId) {
      // The voice is written in the same UPDATE as the URL, so the row can never claim a voice
      // the file was not generated with.
      const { error: updErr } = await supabase
        .from('open_tasks')
        .update({ prompt_audio_url: url, prompt_voice: voice })
        .eq('id', openTaskId);
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
    }
    return NextResponse.json({ prompt_audio_url: url, voice });
  }

  if (!id) return NextResponse.json({ error: 'Missing question id' }, { status: 400 });
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
