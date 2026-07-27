
  ALTER TABLE public.leren_content
    ADD COLUMN IF NOT EXISTS audio_script TEXT,
    ADD COLUMN IF NOT EXISTS audio_url    TEXT,
    ADD COLUMN IF NOT EXISTS audio_cues   JSONB;