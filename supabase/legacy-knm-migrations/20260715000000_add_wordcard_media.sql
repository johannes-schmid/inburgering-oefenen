alter table public.word_cards
  add column image_url text,
  add column audio_dutch_word text,
  add column audio_dutch_sentence text;

insert into storage.buckets (id, name, public)
values ('wordcard-images', 'wordcard-images', true)
on conflict do nothing;

insert into storage.buckets (id, name, public)
values ('wordcard-audio', 'wordcard-audio', true)
on conflict do nothing;

create policy "Admin upload wordcard images" on storage.objects
  for insert to service_role
  with check (bucket_id = 'wordcard-images');

create policy "Admin update wordcard images" on storage.objects
  for update to service_role
  using (bucket_id = 'wordcard-images');

create policy "Public read wordcard images" on storage.objects
  for select to public
  using (bucket_id = 'wordcard-images');

create policy "Admin upload wordcard audio" on storage.objects
  for insert to service_role
  with check (bucket_id = 'wordcard-audio');

create policy "Admin update wordcard audio" on storage.objects
  for update to service_role
  using (bucket_id = 'wordcard-audio');

create policy "Public read wordcard audio" on storage.objects
  for select to public
  using (bucket_id = 'wordcard-audio');
