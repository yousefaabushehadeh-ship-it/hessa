-- حِصّة: initial schema. Run in the Supabase SQL editor, or with `supabase db push`.
-- Every table has row level security on. Students see only what they subscribed to;
-- teachers see only their own content and students.

create extension if not exists pgcrypto;

create type public.user_role as enum ('student', 'teacher', 'admin');
create type public.consent_status as enum ('not_needed', 'pending', 'approved', 'revoked');
create type public.lesson_type as enum ('video', 'pdf', 'quiz', 'live');
create type public.sub_plan as enum ('monthly', 'term');
create type public.sub_status as enum ('active', 'expired', 'refunded');

-- One row per signed-in person (auth.users holds the phone number).
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role public.user_role not null default 'student',
  full_name text not null default '',
  phone text,
  grade text,
  is_minor boolean not null default true,
  parent_phone text,
  consent public.consent_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- Parent approval for students under 18 (Jordan PDPL, law 24 of 2023).
create table public.parent_consents (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles on delete cascade,
  parent_phone text not null,
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  status public.consent_status not null default 'pending',
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.teachers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles on delete set null,
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,40}$'),
  name text not null,
  initial text not null,
  subject text not null,
  grade text not null,
  city text not null,
  years int not null default 0,
  headline text not null default '',
  bio text not null default '',
  education text not null default '',
  live_schedule text not null default '',
  price_month numeric(6,2) not null default 20,
  price_term numeric(6,2) not null default 54,
  color text not null default '#0f4c45',
  badge text,
  verified boolean not null default false,
  rating numeric(2,1) not null default 0,
  review_count int not null default 0,
  student_count int not null default 0,
  created_at timestamptz not null default now()
);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers on delete cascade,
  title text not null,
  position int not null default 0
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units on delete cascade,
  title text not null,
  type public.lesson_type not null,
  meta text not null default '',
  is_free boolean not null default false,
  position int not null default 0,
  storage_path text,          -- PDFs in the private "materials" bucket
  video_id text,              -- Bunny Stream video id (phase 2)
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles on delete cascade,
  teacher_id uuid not null references public.teachers on delete cascade,
  plan public.sub_plan not null default 'monthly',
  status public.sub_status not null default 'active',
  starts_on date not null default current_date,
  ends_on date not null,
  created_at timestamptz not null default now(),
  unique (student_id, teacher_id)
);

-- Phase 1 activation: the teacher hands out codes, the student redeems one.
create table public.activation_codes (
  code text primary key,
  teacher_id uuid not null references public.teachers on delete cascade,
  plan public.sub_plan not null default 'monthly',
  used_by uuid references public.profiles,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.lesson_progress (
  student_id uuid not null references public.profiles on delete cascade,
  lesson_id uuid not null references public.lessons on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (student_id, lesson_id)
);

create index on public.units (teacher_id, position);
create index on public.lessons (unit_id, position);
create index on public.subscriptions (teacher_id);

-- Helpers ---------------------------------------------------------------
create or replace function public.my_teacher_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.teachers where user_id = auth.uid()
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;

create or replace function public.has_active_sub(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.subscriptions s join public.profiles p on p.id = s.student_id
    where s.student_id = auth.uid() and s.teacher_id = t and s.status = 'active'
      and s.ends_on >= current_date and p.consent in ('not_needed', 'approved')
  )
$$;

-- New auth user → profile row.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, phone) values (new.id, new.phone) on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Redeem a code: one transaction, so a code can't be used twice.
create or replace function public.redeem_code(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare c public.activation_codes; sub_id uuid;
begin
  select * into c from public.activation_codes where code = upper(trim(p_code)) for update;
  if c is null or c.used_by is not null then raise exception 'invalid_code'; end if;
  update public.activation_codes set used_by = auth.uid(), used_at = now() where code = c.code;
  insert into public.subscriptions (student_id, teacher_id, plan, ends_on)
  values (auth.uid(), c.teacher_id, c.plan, current_date + case when c.plan = 'term' then 90 else 30 end)
  on conflict (student_id, teacher_id) do update
    set status = 'active', plan = excluded.plan,
        ends_on = greatest(public.subscriptions.ends_on, current_date) + case when excluded.plan = 'term' then 90 else 30 end
  returning id into sub_id;
  return sub_id;
end $$;

-- Parent approves through the link sent to their phone (no login needed).
create or replace function public.approve_consent(p_token text) returns boolean
language plpgsql security definer set search_path = public as $$
declare c public.parent_consents;
begin
  select * into c from public.parent_consents where token = p_token and status = 'pending';
  if c is null then return false; end if;
  update public.parent_consents set status = 'approved', approved_at = now() where id = c.id;
  update public.profiles set consent = 'approved' where id = c.student_id;
  return true;
end $$;
grant execute on function public.approve_consent(text) to anon, authenticated;

-- Row level security ------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.parent_consents enable row level security;
alter table public.teachers enable row level security;
alter table public.units enable row level security;
alter table public.lessons enable row level security;
alter table public.subscriptions enable row level security;
alter table public.activation_codes enable row level security;
alter table public.lesson_progress enable row level security;

create policy "own profile" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "teacher sees own students" on public.profiles for select using (
  exists (select 1 from public.subscriptions s where s.student_id = profiles.id and s.teacher_id = public.my_teacher_id()));
create policy "edit own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "own consents" on public.parent_consents for select using (student_id = auth.uid() or public.is_admin());
create policy "request consent" on public.parent_consents for insert with check (student_id = auth.uid());

create policy "public verified teachers" on public.teachers for select using (verified or user_id = auth.uid() or public.is_admin());
create policy "teacher edits own page" on public.teachers for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Signed-in users can't raise their own role, approve their own consent or verify themselves.
-- The security-definer functions above run as the owner, so they still can.
create or replace function public.protect_fields() returns trigger
language plpgsql as $$
begin
  if current_user = 'authenticated' then
    if tg_table_name = 'profiles' then new.role := old.role; new.consent := old.consent; end if;
    if tg_table_name = 'teachers' then new.verified := old.verified; new.rating := old.rating;
      new.review_count := old.review_count; new.student_count := old.student_count; end if;
  end if;
  return new;
end $$;
create trigger protect_profiles before update on public.profiles for each row execute function public.protect_fields();
create trigger protect_teachers before update on public.teachers for each row execute function public.protect_fields();

create policy "units are public" on public.units for select using (true);
create policy "teacher manages units" on public.units for all using (teacher_id = public.my_teacher_id()) with check (teacher_id = public.my_teacher_id());

-- Lesson titles are public (the profile lists them); the file paths are only
-- handed out by the server after it checks has_active_sub or is_free.
create policy "lessons are listed" on public.lessons for select using (true);
create policy "teacher manages lessons" on public.lessons for all
  using (exists (select 1 from public.units u where u.id = unit_id and u.teacher_id = public.my_teacher_id()))
  with check (exists (select 1 from public.units u where u.id = unit_id and u.teacher_id = public.my_teacher_id()));

create policy "own subscriptions" on public.subscriptions for select using (
  student_id = auth.uid() or teacher_id = public.my_teacher_id() or public.is_admin());

create policy "teacher sees own codes" on public.activation_codes for select using (teacher_id = public.my_teacher_id());
create policy "teacher makes codes" on public.activation_codes for insert with check (teacher_id = public.my_teacher_id());

create policy "own progress" on public.lesson_progress for all using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "teacher sees progress" on public.lesson_progress for select using (
  exists (select 1 from public.lessons l join public.units u on u.id = l.unit_id
          where l.id = lesson_id and u.teacher_id = public.my_teacher_id()));

-- Storage: private bucket; files are served through short-lived signed URLs.
insert into storage.buckets (id, name, public) values ('materials', 'materials', false) on conflict do nothing;
create policy "teacher uploads own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'materials' and (storage.foldername(name))[1] = public.my_teacher_id()::text);
create policy "subscribers read" on storage.objects for select to authenticated
  using (bucket_id = 'materials' and (
    (storage.foldername(name))[1] = public.my_teacher_id()::text
    or public.has_active_sub(((storage.foldername(name))[1])::uuid)));
