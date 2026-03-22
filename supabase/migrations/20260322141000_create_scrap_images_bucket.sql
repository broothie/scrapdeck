insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'scrap-images',
  'scrap-images',
  true,
  10485760,
  array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'image/avif',
    'image/svg+xml'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view scrap images" on storage.objects;
create policy "Public can view scrap images"
on storage.objects
for select
to public
using (bucket_id = 'scrap-images');

drop policy if exists "Authenticated users can upload their scrap images" on storage.objects;
create policy "Authenticated users can upload their scrap images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'scrap-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "Authenticated users can update their scrap images" on storage.objects;
create policy "Authenticated users can update their scrap images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'scrap-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'scrap-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "Authenticated users can delete their scrap images" on storage.objects;
create policy "Authenticated users can delete their scrap images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'scrap-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
