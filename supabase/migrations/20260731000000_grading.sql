-- ============================================================================
-- Phase 5 — rubric grading for Schrijven en Spreken
--
-- The first real migration after 20260729000000_a2_baseline.sql. The baseline has run on the
-- hosted project, so it is frozen; everything here is additive.
--
-- What this enables, and the reasoning that is not obvious from the DDL:
--
-- 1. `exam_attempts.feedback_mode` — the owner chose feedback after every answer, inside a full
--    oefenexamen too. That is the better learning loop, but it means the candidate can rewrite
--    task 1 once told what was wrong, so a coached sitting's score does not predict DUO. Stamping
--    the mode per sitting lets `lib/exam-readiness.ts` exclude coached attempts from any "ben je
--    er klaar voor" claim instead of quietly inflating it. Default 'practice' because that is the
--    default in the player.
--
-- 2. `open_submissions.speech_signals` is deliberately NOT part of `ai_result`. Those numbers are
--    arithmetic over ElevenLabs Scribe's per-word `logprob` output — measured, reproducible, and
--    reviewable by the docent without her having to trust a model's opinion. `ai_result` holds a
--    model's judgement. Mixing the two would make the honest half unciteable.
--
-- 3. The admin UPDATE policy is a real gap, not a nicety. The baseline gave admins
--    `FOR SELECT` only on `open_submissions`, so the docent could open her review inbox and not
--    save a single correction — every other admin surface in this app writes through the browser
--    client, and this one would have failed silently at RLS.
--
-- Deliberately NOT changed: the `speaking-submissions` bucket stays owner-only
-- (`owner = auth.uid()`). The review inbox signs object URLs server-side with
-- `createAdminClient()`. Widening a storage policy to every admin is a larger blast radius than
-- signing one URL per submission actually being reviewed.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Was this sitting coached?
-- ---------------------------------------------------------------------------
ALTER TABLE public.exam_attempts
  ADD COLUMN IF NOT EXISTS feedback_mode text NOT NULL DEFAULT 'practice';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'exam_attempts_feedback_mode_check'
  ) THEN
    ALTER TABLE public.exam_attempts
      ADD CONSTRAINT exam_attempts_feedback_mode_check
      CHECK (feedback_mode IN ('practice', 'exam'));
  END IF;
END $$;

COMMENT ON COLUMN public.exam_attempts.feedback_mode IS
  'practice = per-answer feedback was shown during the sitting; exam = feedback withheld until '
  'submit. Only ''exam'' attempts are evidence of readiness — in ''practice'' the candidate could '
  'revise an answer after being told what was wrong.';

-- ---------------------------------------------------------------------------
-- 2..4. What the grader needs on an open submission
-- ---------------------------------------------------------------------------
ALTER TABLE public.open_submissions
  ADD COLUMN IF NOT EXISTS audio_seconds  integer,
  ADD COLUMN IF NOT EXISTS speech_signals jsonb,
  ADD COLUMN IF NOT EXISTS grade_error    text;

COMMENT ON COLUMN public.open_submissions.audio_seconds IS
  'Recording length. The player already measures this (SpeakingAnswer.seconds) and used to throw '
  'it away; the rubric needs it to judge "te kort" against open_tasks.max_record_seconds.';

COMMENT ON COLUMN public.open_submissions.speech_signals IS
  'Measured, not judged: { mean_logprob, low_confidence_word_rate, words_per_minute, '
  'longest_silence_secs, word_count }. Derived arithmetically from Scribe per-word logprobs. '
  'Kept out of ai_result so the docent can trust these without reviewing a model opinion.';

COMMENT ON COLUMN public.open_submissions.grade_error IS
  'Last grading failure, so a stuck submission is visible in the inbox and retryable rather than '
  'sitting at status=''submitted'' forever looking like an ungraded answer.';

-- ---------------------------------------------------------------------------
-- 5. The docent must be able to save a correction
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins update open submissions" ON public.open_submissions;
CREATE POLICY "Admins update open submissions" ON public.open_submissions
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- 6. The eval query: AI-vs-teacher agreement per criterion, per rubric
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS open_criterion_scores_eval_idx
  ON public.open_criterion_scores (rubric_id, criterion_key, source);

COMMIT;

NOTIFY pgrst, 'reload schema';
