-- COME-AND-FIGHT — bucket Storage pour les photos de profil.
-- Lecture publique (les avatars s'affichent partout dans l'app, y compris
-- pour les adversaires), écriture réservée à son propre dossier (nommé par
-- user_id), donc impossible d'écraser la photo de quelqu'un d'autre.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

drop policy if exists "avatars_own_folder_write" on storage.objects;
create policy "avatars_own_folder_write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_own_folder_update" on storage.objects;
create policy "avatars_own_folder_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_own_folder_delete" on storage.objects;
create policy "avatars_own_folder_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
