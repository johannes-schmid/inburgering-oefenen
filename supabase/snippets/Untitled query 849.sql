 INSERT INTO storage.buckets (id, name, public)
  VALUES ('leren-audio', 'leren-audio', true)
  ON CONFLICT (id) DO NOTHING;
  
  CREATE POLICY "Public read leren-audio"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'leren-audio');

  CREATE POLICY "Service role upload leren-audio"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'leren-audio');

  CREATE POLICY "Service role update leren-audio"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'leren-audio');