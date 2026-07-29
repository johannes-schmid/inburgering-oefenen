-- Add audio lesson columns to leren_content
ALTER TABLE public.leren_content
  ADD COLUMN IF NOT EXISTS audio_script TEXT,
  ADD COLUMN IF NOT EXISTS audio_url    TEXT,
  ADD COLUMN IF NOT EXISTS audio_cues   JSONB;

-- Create leren-audio storage bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('leren-audio', 'leren-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read
CREATE POLICY "Public read leren-audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'leren-audio');

-- Allow service role to upload
CREATE POLICY "Service role upload leren-audio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'leren-audio');

CREATE POLICY "Service role update leren-audio"
ON storage.objects FOR UPDATE
USING (bucket_id = 'leren-audio');
