-- Teacher photo and verification documents.
-- A teacher signs up, uploads a photo plus their ID and certificates, and the Hessa team
-- reviews them before linking a verified page to the account.

-- Photo shown on the public page. Before a page exists it lives on the profile,
-- and the team copies it to the page when they link it.
alter table public.teachers add column photo_url text;
alter table public.profiles add column photo_url text;

create type public.doc_kind as enum ('id', 'degree', 'certificate', 'experience', 'other');
create type public.doc_status as enum ('pending', 'approved', 'rejected');

create table public.teacher_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  kind public.doc_kind not null,
  file_name text not null,
  storage_path text not null,  -- in the private "teacher-docs" bucket, under the user's id
  status public.doc_status not null default 'pending',
  note text,                   -- why a document was rejected, written by the team
  created_at timestamptz not null default now()
);
create index on public.teacher_documents (user_id);

alter table public.teacher_documents enable row level security;
create policy "own documents" on public.teacher_documents for select using (user_id = auth.uid() or public.is_admin());
-- Teachers add documents as pending and can remove them until they are reviewed; only the team reviews.
create policy "add own documents" on public.teacher_documents for insert
  with check (user_id = auth.uid() and status = 'pending' and note is null);
create policy "remove own pending documents" on public.teacher_documents for delete
  using (user_id = auth.uid() and status = 'pending');
create policy "team reviews documents" on public.teacher_documents for update using (public.is_admin()) with check (public.is_admin());

-- Documents: private, each teacher writes and reads only their own folder; the team reads all.
insert into storage.buckets (id, name, public) values ('teacher-docs', 'teacher-docs', false) on conflict do nothing;
create policy "teacher uploads own docs" on storage.objects for insert to authenticated
  with check (bucket_id = 'teacher-docs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "teacher reads own docs" on storage.objects for select to authenticated
  using (bucket_id = 'teacher-docs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "teacher deletes own docs" on storage.objects for delete to authenticated
  using (bucket_id = 'teacher-docs' and (storage.foldername(name))[1] = auth.uid()::text);

-- Photos: public to read (they appear on public pages), written only into your own folder.
insert into storage.buckets (id, name, public) values ('teacher-photos', 'teacher-photos', true) on conflict do nothing;
create policy "teacher uploads own photo" on storage.objects for insert to authenticated
  with check (bucket_id = 'teacher-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "teacher replaces own photo" on storage.objects for update to authenticated
  using (bucket_id = 'teacher-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "teacher removes own photo" on storage.objects for delete to authenticated
  using (bucket_id = 'teacher-photos' and (storage.foldername(name))[1] = auth.uid()::text);
