-- حِصّة: schools, worksheets with student hand-ins, payment requests, quiz attempt limits.

-- Profiles: what a teacher applicant teaches, until the team creates their page.
alter table public.profiles add column teach_subject text;
alter table public.profiles add column teach_grade text;
alter table public.profiles add column city text;

-- Schools ----------------------------------------------------------------------
-- A school account adds its teachers by phone number. When that teacher signs in,
-- their page is created under the school, and it goes public once the school is verified.
create table public.schools (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid unique references public.profiles on delete set null,
  name text not null check (length(name) between 3 and 120),
  city text not null default '',
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.school_invites (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools on delete cascade,
  phone text not null check (phone ~ '^\+9627[789][0-9]{7}$'),
  name text not null check (length(name) between 3 and 80),
  subject text not null,
  grade text not null,
  used_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  unique (school_id, phone)
);
create index on public.school_invites (phone);

alter table public.teachers add column school_id uuid references public.schools on delete set null;
-- Where students send the money: the teacher's CliQ alias or number.
alter table public.teachers add column cliq_alias text not null default '' check (length(cliq_alias) <= 40);
create index on public.teachers (school_id);

create or replace function public.my_school_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.schools where owner_id = auth.uid()
$$;

alter table public.schools enable row level security;
alter table public.school_invites enable row level security;

create policy "verified schools are public" on public.schools for select using (verified or owner_id = auth.uid() or public.is_admin());
create policy "school edits itself" on public.schools for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "school sees invites" on public.school_invites for select using (school_id = public.my_school_id() or public.is_admin());
create policy "school invites" on public.school_invites for insert with check (school_id = public.my_school_id() and used_by is null);
create policy "school removes unused invites" on public.school_invites for delete using (school_id = public.my_school_id() and used_by is null);

create policy "school sees its teachers" on public.teachers for select using (school_id is not null and school_id = public.my_school_id());
create policy "school sees its subscriptions" on public.subscriptions for select using (
  exists (select 1 from public.teachers t where t.id = teacher_id and t.school_id is not null and t.school_id = public.my_school_id()));

-- Schools can't verify themselves; teachers can't move themselves under a school.
create or replace function public.protect_fields() returns trigger
language plpgsql as $$
begin
  if current_user = 'authenticated' then
    if tg_table_name = 'profiles' then new.role := old.role; new.consent := old.consent; end if;
    if tg_table_name = 'teachers' then new.verified := old.verified; new.rating := old.rating;
      new.review_count := old.review_count; new.student_count := old.student_count; new.school_id := old.school_id; end if;
    if tg_table_name = 'schools' then new.verified := old.verified; new.owner_id := old.owner_id; end if;
  end if;
  return new;
end $$;
create trigger protect_schools before update on public.schools for each row execute function public.protect_fields();

-- Does the signed-in teacher own this lesson?
create or replace function public.owns_lesson(p_lesson uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.lessons l join public.units u on u.id = l.unit_id
                 where l.id = p_lesson and u.teacher_id = public.my_teacher_id())
$$;

-- Worksheets -----------------------------------------------------------------------
-- A worksheet is a lesson with a PDF. Students upload their solution (photo or PDF),
-- and the teacher gives a mark and a comment.
create type public.submission_status as enum ('submitted', 'graded');

create table public.worksheet_submissions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons on delete cascade,
  student_id uuid not null references public.profiles on delete cascade,
  file_name text not null check (length(file_name) <= 120),
  storage_path text not null,   -- private "submissions" bucket, under the student's id
  note text not null default '' check (length(note) <= 500),
  status public.submission_status not null default 'submitted',
  mark text check (length(mark) <= 20),
  feedback text check (length(feedback) <= 1000),
  created_at timestamptz not null default now(),
  graded_at timestamptz
);
create index on public.worksheet_submissions (lesson_id, created_at desc);
create index on public.worksheet_submissions (student_id, created_at desc);

alter table public.worksheet_submissions enable row level security;
create policy "see submissions" on public.worksheet_submissions for select using (
  student_id = auth.uid() or public.owns_lesson(lesson_id) or public.is_admin());
create policy "hand in" on public.worksheet_submissions for insert with check (
  student_id = auth.uid() and status = 'submitted' and mark is null and feedback is null and graded_at is null
  and storage_path like auth.uid()::text || '/%' and public.can_open_lesson(lesson_id));
create policy "take back before grading" on public.worksheet_submissions for delete using (student_id = auth.uid() and status = 'submitted');
-- No update policy: grading goes through grade_submission, so a teacher can't change the hand-in itself.

create or replace function public.grade_submission(p_id uuid, p_mark text, p_feedback text) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_lesson uuid;
begin
  select lesson_id into v_lesson from public.worksheet_submissions where id = p_id;
  if v_lesson is null or not (public.owns_lesson(v_lesson) or public.is_admin()) then raise exception 'not_allowed'; end if;
  update public.worksheet_submissions
    set status = 'graded', mark = left(trim(p_mark), 20), feedback = left(trim(coalesce(p_feedback, '')), 1000), graded_at = now()
    where id = p_id;
  return true;
end $$;

insert into storage.buckets (id, name, public) values ('submissions', 'submissions', false) on conflict do nothing;
create policy "student uploads own hand-in" on storage.objects for insert to authenticated
  with check (bucket_id = 'submissions' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "student reads own hand-in" on storage.objects for select to authenticated
  using (bucket_id = 'submissions' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "student removes own hand-in" on storage.objects for delete to authenticated
  using (bucket_id = 'submissions' and (storage.foldername(name))[1] = auth.uid()::text);
-- Teachers open hand-ins through a short-lived link the server signs after checking owns_lesson.

-- Payments -----------------------------------------------------------------------
-- Until a payment gateway is connected: the student pays by CliQ or wallet and types the
-- transfer reference; the teacher (or the team) checks it and the subscription opens.
create type public.payment_status as enum ('pending', 'approved', 'rejected');

create table public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles on delete cascade,
  teacher_id uuid not null references public.teachers on delete cascade,
  plan public.sub_plan not null,
  amount numeric(6,2) not null,
  method text not null default 'cliq' check (method in ('cliq', 'wallet', 'cash')),
  reference text not null check (length(reference) between 3 and 60),
  status public.payment_status not null default 'pending',
  note text check (length(note) <= 300),
  reviewed_by uuid references public.profiles on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.payment_requests (teacher_id, status, created_at desc);
create index on public.payment_requests (student_id, created_at desc);
create unique index one_pending_payment on public.payment_requests (student_id, teacher_id) where status = 'pending';

alter table public.payment_requests enable row level security;
create policy "see payments" on public.payment_requests for select using (
  student_id = auth.uid() or teacher_id = public.my_teacher_id() or public.is_admin()
  or exists (select 1 from public.teachers t where t.id = teacher_id and t.school_id is not null and t.school_id = public.my_school_id()));
-- No insert or update policy: request_payment and review_payment below do the writing.

-- The amount comes from the teacher's price, never from the request.
create or replace function public.request_payment(p_teacher uuid, p_plan public.sub_plan, p_method text, p_reference text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_price numeric; v_id uuid;
begin
  if auth.uid() is null then raise exception 'no_access'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'student' and consent in ('not_needed', 'approved')) then
    raise exception 'no_access'; end if;
  select case when p_plan = 'term' then price_term else price_month end into v_price
    from public.teachers where id = p_teacher and verified;
  if v_price is null then raise exception 'no_teacher'; end if;
  insert into public.payment_requests (student_id, teacher_id, plan, amount, method, reference)
    values (auth.uid(), p_teacher, p_plan, v_price, p_method, left(trim(p_reference), 60))
    returning id into v_id;
  return v_id;
end $$;

-- Approving opens (or extends) the subscription in the same transaction.
create or replace function public.review_payment(p_id uuid, p_approve boolean, p_note text) returns boolean
language plpgsql security definer set search_path = public as $$
declare r public.payment_requests;
begin
  select * into r from public.payment_requests where id = p_id and status = 'pending' for update;
  if r is null then raise exception 'not_pending'; end if;
  -- my_teacher_id() is null for students, so compare with "is distinct from" (a plain = would be null and let them through).
  if r.teacher_id is distinct from public.my_teacher_id() and not public.is_admin() then raise exception 'not_allowed'; end if;
  update public.payment_requests
    set status = case when p_approve then 'approved'::public.payment_status else 'rejected'::public.payment_status end,
        note = left(nullif(trim(coalesce(p_note, '')), ''), 300), reviewed_by = auth.uid(), reviewed_at = now()
    where id = p_id;
  if p_approve then
    insert into public.subscriptions (student_id, teacher_id, plan, ends_on)
    values (r.student_id, r.teacher_id, r.plan, current_date + case when r.plan = 'term' then 90 else 30 end)
    on conflict (student_id, teacher_id) do update
      set status = 'active', plan = excluded.plan,
          ends_on = greatest(public.subscriptions.ends_on, current_date) + case when excluded.plan = 'term' then 90 else 30 end;
  end if;
  return true;
end $$;

-- Quizzes: a limited number of tries, and the right answers only after the last one -----
alter table public.lessons add column max_attempts int not null default 3 check (max_attempts between 1 and 20);

drop function public.submit_quiz(uuid, int[]);
create function public.submit_quiz(p_lesson uuid, p_answers int[])
returns json
language plpgsql security definer set search_path = public as $$
declare v_correct int[]; v_score int := 0; v_total int; i int; v_max int; v_used int;
begin
  if auth.uid() is null or not public.can_open_lesson(p_lesson) then raise exception 'no_access'; end if;
  select max_attempts into v_max from public.lessons where id = p_lesson;
  select count(*) into v_used from public.quiz_attempts where lesson_id = p_lesson and student_id = auth.uid();
  if v_used >= v_max then raise exception 'no_attempts_left'; end if;
  select array_agg(answer order by position) into v_correct from public.quiz_questions where lesson_id = p_lesson;
  v_total := coalesce(array_length(v_correct, 1), 0);
  if v_total = 0 then raise exception 'empty_quiz'; end if;
  for i in 1..v_total loop
    if p_answers[i] = v_correct[i] then v_score := v_score + 1; end if;
  end loop;
  insert into public.quiz_attempts (student_id, lesson_id, score, total, answers)
    values (auth.uid(), p_lesson, v_score, v_total, p_answers);
  insert into public.lesson_progress (student_id, lesson_id) values (auth.uid(), p_lesson)
    on conflict do nothing;
  v_used := v_used + 1;
  return json_build_object('score', v_score, 'total', v_total, 'left', v_max - v_used,
    'correct', case when v_used >= v_max or v_score = v_total then to_json(v_correct) else null end);
end $$;

-- Admin reads ------------------------------------------------------------------
-- The admin dashboard reads with the service key after checking the role; these
-- policies also let an admin's own session see the same rows.
create policy "admin sees attempts" on public.quiz_attempts for select using (public.is_admin());
create policy "admin sees progress" on public.lesson_progress for select using (public.is_admin());
create policy "admin sees codes" on public.activation_codes for select using (public.is_admin());
