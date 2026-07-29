insert into storage.buckets (id, name, public)
values ('question-images', 'question-images', true)
on conflict do nothing;

create policy "Admin upload" on storage.objects
  for insert to service_role
  with check (bucket_id = 'question-images');

create policy "Public read" on storage.objects
  for select to public
  using (bucket_id = 'question-images');
