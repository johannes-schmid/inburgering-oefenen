-- The Spreken prompt's voice, chosen by the docent in /admin/opgaven.
--
-- Until now `prompt_audio_url` was generated with NARRATOR (woman_young) and nothing recorded
-- which voice had been used. That is not recoverable from the mp3, so a regeneration after a
-- script edit silently swapped the speaker — and at onderdeel 1 the voice must match the person
-- in the picture, which is a content decision the row has to remember.
--
-- NULL means "never chosen" and still renders as the narrator; it is not the same as a choice.
ALTER TABLE open_tasks ADD COLUMN prompt_voice text;

ALTER TABLE open_tasks ADD CONSTRAINT open_tasks_prompt_voice_check
  CHECK (prompt_voice IS NULL
         OR prompt_voice IN ('woman_young', 'woman_older', 'man_young', 'man_older'));

-- Same shape as `open_tasks_image_usage_is_speaking`: a Schrijven opgave has no spoken prompt.
ALTER TABLE open_tasks ADD CONSTRAINT open_tasks_prompt_voice_is_speaking
  CHECK (skill = 'spreken' OR prompt_voice IS NULL);

COMMENT ON COLUMN open_tasks.prompt_voice IS
  'Key into data/tts-voices.json used to generate prompt_audio_url. NULL = narrator default.';
