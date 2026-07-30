import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Mint a single-use ElevenLabs token so the browser can stream to Scribe directly.
 *
 * ## Why a token rather than a relay
 * The live transcript needs audio to reach Scribe while the candidate is still speaking. Proxying it
 * would mean a WebSocket server holding open connections and forwarding every chunk — our
 * infrastructure carrying audio it has no use for. ElevenLabs issues short-lived single-use tokens
 * for exactly this: the key stays here, the audio goes straight from the candidate's browser to
 * ElevenLabs, and the token expires after 15 minutes.
 *
 * ## This endpoint spends money
 * A token is permission to bill us for realtime transcription, so it is available only to a
 * signed-in user and only for a short window. It is deliberately *not* tied to a specific
 * submission: the candidate needs it before they start speaking, when there is nothing to tie it to
 * yet.
 *
 * The live transcript is a **preview**, not the graded transcript. Grading runs on the submitted WAV
 * through the batch Scribe call in `lib/ai/transcribe.ts`, which also produces the per-word
 * confidence the docent reviews. The two can disagree, and the UI has to say which is which.
 */

const TOKEN_ENDPOINT = 'https://api.elevenlabs.io/v1/single-use-token/realtime_scribe';

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });
  }

  const apiKey = process.env.ELEVEN_LAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Live transcriptie is niet geconfigureerd.', code: 'not_configured' },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey },
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      // The commonest failure by far is the key lacking `speech_to_text`, which is a configuration
      // problem rather than something the candidate can act on — so it is surfaced as a distinct
      // code and the recorder falls back to recording without a readback.
      const missingScope = res.status === 401 && detail.includes('speech_to_text');
      console.error('[stt-token]', res.status, detail.slice(0, 300));
      return NextResponse.json(
        {
          error: missingScope
            ? 'De ElevenLabs-sleutel mist de permissie speech_to_text.'
            : 'Live transcriptie is nu niet beschikbaar.',
          code: missingScope ? 'missing_scope' : 'upstream_error',
        },
        { status: 503 }
      );
    }

    const json = (await res.json()) as { token?: string };
    if (!json.token) {
      return NextResponse.json({ error: 'Geen token ontvangen.' }, { status: 503 });
    }

    return NextResponse.json({ token: json.token });
  } catch (err) {
    console.error('[stt-token]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Live transcriptie is nu niet beschikbaar.' }, { status: 503 });
  }
}
