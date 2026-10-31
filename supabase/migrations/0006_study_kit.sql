-- حِصّة: the study kit. Each teacher adds books, explainer videos, summaries and links
-- for their subject, next to the lessons. Free items are open to anyone signed in;
-- the rest open with an active subscription.

create type public.resource_kind as enum ('book', 'video', 'summary', 'link');

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers on delete cascade,
  kind public.resource_kind not null,
  title text not null check (length(title) between 3 and 160),
  note text not null default '' check (length(note) <= 300),
  url text check (url is null or (url ~ '^https://' and length(url) <= 500)),
  storage_path text,              -- PDFs in the private "materials" bucket, under the teacher's id
  is_free boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now(),
  -- Books and summaries are PDF files; videos and links are web addresses.
  check ((kind in ('book', 'summary') and storage_path is not null and url is null)
      or (kind in ('video', 'link') and url is not null and storage_path is null)),
  check (storage_path is null or storage_path like teacher_id::text || '/%')
);
create index on public.resources (teacher_id, position);

alter table public.resources enable row level security;

-- Teachers manage their own kit. Students never read this table directly:
-- they go through teacher_resources and open_resource below, so a paid link stays hidden.
create policy "teacher manages resources" on public.resources for all
  using (teacher_id = public.my_teacher_id()) with check (teacher_id = public.my_teacher_id());
create policy "admin sees resources" on public.resources for select using (public.is_admin());

-- Can the signed-in user open this teacher's paid items?
create or replace function public.can_open_kit(p_teacher uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_active_sub(p_teacher) or p_teacher = public.my_teacher_id() or public.is_admin()
$$;

-- The kit as anyone sees it: every title, but the link only where they may open it.
create or replace function public.teacher_resources(p_teacher uuid)
returns table (id uuid, kind public.resource_kind, title text, note text, url text, has_file boolean, is_free boolean, sort_order int)
language sql stable security definer set search_path = public as $$
  select r.id, r.kind, r.title, r.note,
         case when (r.is_free and auth.uid() is not null) or public.can_open_kit(r.teacher_id) then r.url end,
         r.storage_path is not null, r.is_free, r.position
  from public.resources r join public.teachers t on t.id = r.teacher_id
  where r.teacher_id = p_teacher and (t.verified or t.id = public.my_teacher_id() or public.is_admin())
  order by r.position, r.created_at
$$;
grant execute on function public.teacher_resources(uuid) to anon, authenticated;

-- One item, only for someone allowed to open it. A student whose parent hasn't approved yet can't.
create or replace function public.open_resource(p_id uuid)
returns table (id uuid, teacher_id uuid, kind public.resource_kind, title text, note text, url text, storage_path text, is_free boolean)
language sql stable security definer set search_path = public as $$
  select r.id, r.teacher_id, r.kind, r.title, r.note, r.url, r.storage_path, r.is_free
  from public.resources r
  where r.id = p_id and auth.uid() is not null
    and (public.can_open_kit(r.teacher_id)
         or (r.is_free and exists (select 1 from public.profiles p where p.id = auth.uid() and p.consent in ('not_needed', 'approved'))))
$$;
grant execute on function public.open_resource(uuid) to authenticated;

-- Whose kit an item belongs to, so a student without access is sent to that teacher's page.
create or replace function public.resource_teacher(p_id uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select r.teacher_id from public.resources r join public.teachers t on t.id = r.teacher_id where r.id = p_id and t.verified
$$;
grant execute on function public.resource_teacher(uuid) to authenticated;

-- Teachers can remove files from their own folder (a kit book or summary they delete).
create policy "teacher removes own materials" on storage.objects for delete to authenticated
  using (bucket_id = 'materials' and (storage.foldername(name))[1] = public.my_teacher_id()::text);
