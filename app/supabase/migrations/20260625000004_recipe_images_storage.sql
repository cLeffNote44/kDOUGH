-- Public bucket for recipe photos. Re-hosting images here (from the source site,
-- a pasted URL, or a device upload) means the app serves them from its own
-- origin, so hotlink-protected source images no longer fail to load.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'recipe-images', 'recipe-images', true, 5242880,
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public read (the bucket is public; be explicit for clarity).
drop policy if exists "recipe_images_public_read" on storage.objects;
create policy "recipe_images_public_read" on storage.objects
  for select using (bucket_id = 'recipe-images');

-- Authenticated users may write only inside their own {uid}/ folder.
drop policy if exists "recipe_images_user_insert" on storage.objects;
create policy "recipe_images_user_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'recipe-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "recipe_images_user_update" on storage.objects;
create policy "recipe_images_user_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'recipe-images' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'recipe-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "recipe_images_user_delete" on storage.objects;
create policy "recipe_images_user_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'recipe-images' and (storage.foldername(name))[1] = auth.uid()::text);
