import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin/guard';
import { mp3DurationSeconds } from '@/lib/mp3-duration';
import {
  buildDialogueInputs,
  DIALOGUE_ENDPOINT,
  DIALOGUE_MODEL,
  DIALOGUE_SETTINGS,
  validateCast,
} from '@/lib/tts-dialogue';

/**
 * Generate the audio for one or more Luisteren stimuli from their script and casting.
 *
 * Until now an audio stimulus took a **pasted URL**: the docent had to run
 * `scripts/generate-free-practice-audio.mjs` locally, or produce an mp3 some other way, and drop a
 * link into the builder. That is the last piece of the content pipeline that was not in admin.
 *
 * ## One scene, one call
 * `/v1/text-to-dialogue` with `eleven_v3` renders the whole dialogue in a single generation, so the
 * model paces the turns itself. The alternative — one text-to-speech call per turn stitched with
 * ffmpeg — is what the taster script used to do and cannot work here anyway: there is no ffmpeg
 * binary in a serverless function.
 *
 * ## What this deliberately does not do
 * **No loudness normalisation.** The taster pipeline runs a two-pass ffmpeg loudnorm to −20 LUFS,
 * measured off DUO's own audio, and cannot run here. Exam audio generated from admin is therefore
 * at ElevenLabs' native level and may sit louder than the taster mp3s. That is a known, accepted
 * difference — not something to "fix" by dropping the loudnorm from the taster script, which is the
 * surface where a level mismatch between items inside one sitting would actually hurt.
 *
 * ## Cost
 * Admin-only, by allowlist, because every call bills ElevenLabs. Bulk generation is capped and
 * skips stimuli that already have audio unless `force` is passed, so the obvious "generate all"
 * click on an exam that is already done costs nothing.
 */

const BUCKET = 'question-audio';
/** A whole Luisteren exam is ~10 stimuli; the cap is a runaway guard, not a product limit. */
const MAX_BATCH = 25;

type StimulusRow = {
  id: number;
  exam_id: number;
  skill: string;
  kind: string;
  script: string | null;
  audio_url: string | null;
  voice_cast: Record<string, string> | null;
};

async function synthesizeDialogue(
  inputs: { text: string; voice_id: string }[],
  apiKey: string
): Promise<ArrayBuffer> {
  const res = await fetch(DIALOGUE_ENDPOINT, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      inputs,
      model_id: DIALOGUE_MODEL,
      settings: DIALOGUE_SETTINGS,
      // Dutch prices, times and abbreviations must be spoken, not spelled out.
      apply_text_normalization: 'on',
      // A stable seed means regenerating an unchanged script returns the same audio, so a
      // re-run after an unrelated edit does not silently change an exam the docent validated.
      seed: 20260731,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ElevenLabs ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.arrayBuffer();
}

async function uploadAudio(path: string, data: ArrayBuffer): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!;
  const res = await fetch(`${supabaseUrl}/storage/v1/object/${BUCKET}/${path}`, {
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
  // Cache-buster: the path is stable across regenerations (deliberately — see below), so without
  // it the browser and the CDN would keep serving the previous take.
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${path}?t=${Date.now()}`;
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const apiKey = process.env.ELEVEN_LAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ELEVEN_LAPS_API_KEY ontbreekt.' }, { status: 503 });
  }

  let body: {
    stimulusId?: unknown;
    examId?: unknown;
    force?: unknown;
    script?: unknown;
    voiceCast?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag.' }, { status: 400 });
  }
  const force = body.force === true;

  const db = createAdminClient();

  /* ── Draft mode ────────────────────────────────────────────────────────────────────────────
   * Generate from a script that is not saved yet and return the URL, writing no row.
   *
   * This exists because of an ordering problem: `stimuli_payload_matches_kind` requires an audio
   * stimulus to have an `audio_url`, so a new one cannot be saved script-first and then generated
   * from — there would be no row to generate from. Relaxing the CHECK would let a half-authored
   * stimulus reach the table, which is exactly what that constraint is for. So the editor
   * generates first and saves the URL it gets back.
   *
   * The object is keyed by exam and timestamp rather than by stimulus id, because there is no id
   * yet. A draft that is generated and then abandoned leaves one orphan mp3 in the bucket; that is
   * the accepted cost of not weakening the constraint.
   */
  if (typeof body.script === 'string' && body.script.trim()) {
    if (typeof body.examId !== 'number') {
      return NextResponse.json({ error: 'examId ontbreekt.' }, { status: 400 });
    }
    const cast = validateCast(body.script, body.voiceCast);
    if (!cast.ok) return NextResponse.json({ error: cast.error }, { status: 400 });

    try {
      const audio = await synthesizeDialogue(buildDialogueInputs(body.script, cast.cast), apiKey);
      const url = await uploadAudio(`exam-${body.examId}/draft-${Date.now()}.mp3`, audio);
      // The editor saves this alongside the URL: there is no row to write it to yet, and the
      // length is not recoverable from the URL afterwards.
      return NextResponse.json({ audio_url: url, audio_seconds: mp3DurationSeconds(audio) });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[generate-stimulus-audio] draft', message);
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }
  const cols = 'id, exam_id, skill, kind, script, audio_url, voice_cast';

  let rows: StimulusRow[];
  if (typeof body.stimulusId === 'number') {
    const { data, error } = await db.from('stimuli').select(cols).eq('id', body.stimulusId).single();
    if (error || !data) return NextResponse.json({ error: 'Stimulus niet gevonden.' }, { status: 404 });
    rows = [data as StimulusRow];
  } else if (typeof body.examId === 'number') {
    const { data, error } = await db
      .from('stimuli')
      .select(cols)
      .eq('exam_id', body.examId)
      .eq('kind', 'audio')
      .order('sort_order');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    rows = (data ?? []) as StimulusRow[];
    // Already-generated stimuli are skipped rather than re-billed. `force` is the explicit
    // "I changed the script, do it again" path.
    if (!force) rows = rows.filter(r => !r.audio_url);
  } else {
    return NextResponse.json({ error: 'Geef stimulusId of examId mee.' }, { status: 400 });
  }

  if (rows.length === 0) {
    return NextResponse.json({ generated: [], skipped: 0, message: 'Niets te genereren.' });
  }
  if (rows.length > MAX_BATCH) {
    return NextResponse.json(
      { error: `Te veel stimuli in één keer (${rows.length}, max ${MAX_BATCH}).` },
      { status: 400 }
    );
  }

  const generated: { id: number; audio_url: string; audio_seconds: number | null }[] = [];
  const failed: { id: number; error: string }[] = [];

  for (const row of rows) {
    if (row.kind !== 'audio') {
      failed.push({ id: row.id, error: 'Geen audiostimulus.' });
      continue;
    }
    if (!row.script?.trim()) {
      failed.push({ id: row.id, error: 'Geen script om uit te genereren.' });
      continue;
    }

    // Casting is validated before the call, not after: an uncast speaker is a content bug the
    // generator must not paper over by choosing a voice itself.
    const cast = validateCast(row.script, row.voice_cast);
    if (!cast.ok) {
      failed.push({ id: row.id, error: cast.error });
      continue;
    }

    try {
      const audio = await synthesizeDialogue(buildDialogueInputs(row.script, cast.cast), apiKey);
      // Path keyed on the stimulus id and stable across regenerations, so an exam that was
      // published keeps one canonical object rather than accumulating orphans in the bucket.
      const url = await uploadAudio(`stimulus-${row.id}/stimulus.mp3`, audio);

      // Written in the same UPDATE as the URL, so the two can never disagree about which
      // file the length describes.
      const seconds = mp3DurationSeconds(audio);
      const { error: updErr } = await db
        .from('stimuli')
        .update({ audio_url: url, audio_seconds: seconds })
        .eq('id', row.id);
      if (updErr) throw new Error(updErr.message);

      generated.push({ id: row.id, audio_url: url, audio_seconds: seconds });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[generate-stimulus-audio]', row.id, message);
      // Reported per stimulus rather than aborting the batch: nine good scenes should not be
      // lost because the tenth has a bad script.
      failed.push({ id: row.id, error: message });
    }
  }

  return NextResponse.json({ generated, failed });
}
