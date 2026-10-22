-- حِصّة phase 2: auto-graded quizzes, real reviews, protected video (Bunny Stream).

-- Can the signed-in user open this lesson? Free lessons need any account;
-- the rest need an active subscription. Teachers can always open their own.
create or replace function public.can_open_lesson(p_lesson uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.lessons l join public.units u on u.id = l.unit_id
    where l.id = p_lesson
      and (l.is_free or public.has_active_sub(u.teacher_id) or u.teacher_id = public.my_teacher_id())
  )
$$;

-- Quizzes ----------------------------------------------------------------
-- Questions belong to a lesson of type 'quiz'. Students never read this table
-- directly (no select policy for them), so the answers stay on the server.
create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons on delete cascade,
  position int not null default 0,
  prompt text not null check (length(prompt) between 3 and 500),
  options text[] not null check (array_length(options, 1) between 2 and 6),
  answer int not null,
  check (answer >= 0 and answer < array_length(options, 1))
);
create index on public.quiz_questions (lesson_id, position);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles on delete cascade,
  lesson_id uuid not null references public.lessons on delete cascade,
  score int not null,
  total int not null,
  answers int[] not null,
  created_at timestamptz not null default now()
);
create index on public.quiz_attempts (lesson_id);
create index on public.quiz_attempts (student_id, created_at desc);

alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;

create policy "teacher manages questions" on public.quiz_questions for all
  using (exists (select 1 from public.lessons l join public.units u on u.id = l.unit_id
                 where l.id = lesson_id and u.teacher_id = public.my_teacher_id()))
  with check (exists (select 1 from public.lessons l join public.units u on u.id = l.unit_id
                      where l.id = lesson_id and u.teacher_id = public.my_teacher_id()));

create policy "own attempts" on public.quiz_attempts for select using (student_id = auth.uid());
create policy "teacher sees attempts" on public.quiz_attempts for select using (
  exists (select 1 from public.lessons l join public.units u on u.id = l.unit_id
          where l.id = lesson_id and u.teacher_id = public.my_teacher_id()));
-- No insert policy: attempts are only written by submit_quiz below.

-- Questions without the answers, for someone allowed to open the lesson.
create or replace function public.quiz_for_student(p_lesson uuid)
returns table (id uuid, qpos int, prompt text, options text[])
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.can_open_lesson(p_lesson) then raise exception 'no_access'; end if;
  return query select q.id, q.position, q.prompt, q.options
    from public.quiz_questions q where q.lesson_id = p_lesson order by q.position;
end $$;

-- Grades on the server, stores the attempt, marks the lesson done, and only
-- then returns the right answers.
create or replace function public.submit_quiz(p_lesson uuid, p_answers int[])
returns json
language plpgsql security definer set search_path = public as $$
declare v_correct int[]; v_score int := 0; v_total int; i int;
begin
  if auth.uid() is null or not public.can_open_lesson(p_lesson) then raise exception 'no_access'; end if;
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
  return json_build_object('score', v_score, 'total', v_total, 'correct', v_correct);
end $$;

-- Reviews ----------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles on delete cascade,
  teacher_id uuid not null references public.teachers on delete cascade,
  stars int not null check (stars between 1 and 5),
  body text not null default '' check (length(body) <= 600),
  author_name text not null default '',
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, teacher_id)
);
create index on public.reviews (teacher_id, created_at desc);
alter table public.reviews enable row level security;

create policy "reviews are public" on public.reviews for select using (not hidden or student_id = auth.uid() or public.is_admin());
-- Only current subscribers can review, once per teacher (they can edit it later).
create policy "subscribers review" on public.reviews for insert
  with check (student_id = auth.uid() and public.has_active_sub(teacher_id));
create policy "edit own review" on public.reviews for update
  using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "delete own review" on public.reviews for delete using (student_id = auth.uid());
create policy "admin moderates reviews" on public.reviews for update using (public.is_admin());

-- The shown name comes from the profile, not from the request, and students
-- can't hide or unhide reviews themselves.
create or replace function public.review_fill() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  select full_name into new.author_name from public.profiles where id = new.student_id;
  new.updated_at := now();
  if tg_op = 'INSERT' then new.hidden := false;
  elsif not public.is_admin() then new.hidden := old.hidden; end if;
  return new;
end $$;
create trigger review_fill before insert or update on public.reviews
  for each row execute function public.review_fill();

-- Keep teachers.rating and review_count equal to the visible reviews.
create or replace function public.review_totals() returns trigger
language plpgsql security definer set search_path = public as $$
declare t uuid := coalesce(new.teacher_id, old.teacher_id);
begin
  update public.teachers set
    rating = coalesce((select round(avg(stars)::numeric, 1) from public.reviews where teacher_id = t and not hidden), 0),
    review_count = (select count(*) from public.reviews where teacher_id = t and not hidden)
  where id = t;
  return null;
end $$;
create trigger review_totals after insert or update or delete on public.reviews
  for each row execute function public.review_totals();

-- Video --------------------------------------------------------------------
-- lessons.video_id already holds the Bunny Stream video GUID. Uploads go straight
-- from the teacher's browser to Bunny; the server signs each upload and each view.
-- Students who stop being subscribed lose access because every view needs a new token.
