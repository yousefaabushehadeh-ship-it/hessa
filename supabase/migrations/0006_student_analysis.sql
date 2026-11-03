-- حِصّة: student analysis, shown to three people in three depths.
--   * the teacher: each of their students in detail (their own subject only)
--   * the parent: their child, across all teachers, through the approval link they already have
--   * the school: totals per teacher, never a single student's marks
-- Everything goes through security-definer functions, so no new table policy opens raw rows.

-- One student's record with one teacher. Internal: only the functions below call it.
create or replace function public.student_report_json(p_student uuid, p_teacher uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  with ls as (
    select l.id, l.title, l.type from public.lessons l join public.units u on u.id = l.unit_id where u.teacher_id = p_teacher
  ),
  done as (
    select lp.completed_at from public.lesson_progress lp join ls on ls.id = lp.lesson_id where lp.student_id = p_student
  ),
  q as (
    select ls.title,
      (array_agg(a.score order by a.created_at desc))[1] as score,
      (array_agg(a.total order by a.created_at desc))[1] as total,
      count(*) as tries,
      max(a.created_at) as at
    from public.quiz_attempts a join ls on ls.id = a.lesson_id
    where a.student_id = p_student
    group by ls.id, ls.title
  ),
  w as (
    select ls.title, s.status, s.mark, s.feedback, s.created_at
    from public.worksheet_submissions s join ls on ls.id = s.lesson_id
    where s.student_id = p_student
  )
  select jsonb_build_object(
    'lessons_total', (select count(*) from ls),
    'lessons_done', (select count(*) from done),
    'worksheets_total', (select count(*) from ls where type = 'worksheet'),
    'quizzes', coalesce((select jsonb_agg(jsonb_build_object('title', title, 'score', score, 'total', total, 'tries', tries) order by at) from q), '[]'::jsonb),
    'worksheets', coalesce((select jsonb_agg(jsonb_build_object('title', title, 'status', status, 'mark', mark, 'feedback', feedback, 'at', created_at) order by created_at desc) from w), '[]'::jsonb),
    'last_active', greatest((select max(completed_at) from done), (select max(at) from q), (select max(created_at) from w))
  )
$$;
revoke execute on function public.student_report_json(uuid, uuid) from public, anon, authenticated;

-- The teacher opens one of their own students.
create or replace function public.teacher_student_report(p_student uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_teacher uuid := public.my_teacher_id();
begin
  if v_teacher is null or not exists (
    select 1 from public.subscriptions where student_id = p_student and teacher_id = v_teacher) then
    return null;
  end if;
  return jsonb_build_object('name', (select full_name from public.profiles where id = p_student))
    || public.student_report_json(p_student, v_teacher);
end $$;
revoke execute on function public.teacher_student_report(uuid) from public, anon;
grant execute on function public.teacher_student_report(uuid) to authenticated;

-- The parent opens the approval link again and sees their child's report, with no login.
-- Works only while the approval stands; if it's withdrawn, the link stops working.
create or replace function public.parent_report(p_token text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare c public.parent_consents;
begin
  select * into c from public.parent_consents where token = p_token and status = 'approved';
  if c is null or not exists (select 1 from public.profiles where id = c.student_id and consent = 'approved') then
    return null;
  end if;
  return jsonb_build_object(
    'name', (select full_name from public.profiles where id = c.student_id),
    'grade', (select grade from public.profiles where id = c.student_id),
    'teachers', coalesce((
      select jsonb_agg(
        jsonb_build_object('id', t.id, 'name', t.name, 'slug', t.slug, 'subject', t.subject, 'color', t.color,
                           'initial', t.initial, 'plan', s.plan, 'ends_on', s.ends_on)
        || public.student_report_json(c.student_id, t.id) order by t.name)
      from public.subscriptions s join public.teachers t on t.id = s.teacher_id
      where s.student_id = c.student_id and s.status = 'active' and s.ends_on >= current_date), '[]'::jsonb)
  );
end $$;
revoke execute on function public.parent_report(text) from public;
grant execute on function public.parent_report(text) to anon, authenticated;

-- The school: one row per teacher, totals only.
create or replace function public.school_stats()
returns table (teacher_id uuid, students int, avg_progress int, avg_quiz int, active_week int, need_follow_up int)
language sql stable security definer set search_path = public as $$
  with t as (
    select id from public.teachers where school_id is not null and school_id = public.my_school_id()
  ),
  tl as (
    select u.teacher_id, l.id as lesson_id from public.lessons l join public.units u on u.id = l.unit_id join t on t.id = u.teacher_id
  ),
  tot as (select teacher_id, count(*) as n from tl group by teacher_id),
  st as (
    select s.teacher_id, s.student_id from public.subscriptions s join t on t.id = s.teacher_id
    where s.status = 'active' and s.ends_on >= current_date
  ),
  per as (
    select st.teacher_id, st.student_id,
      (select count(*) from public.lesson_progress lp join tl on tl.lesson_id = lp.lesson_id and tl.teacher_id = st.teacher_id
        where lp.student_id = st.student_id) * 100.0 / nullif((select n from tot where tot.teacher_id = st.teacher_id), 0) as progress,
      (select avg(a.score::numeric / nullif(a.total, 0)) from public.quiz_attempts a join tl on tl.lesson_id = a.lesson_id and tl.teacher_id = st.teacher_id
        where a.student_id = st.student_id) as quiz,
      greatest(
        (select max(lp.completed_at) from public.lesson_progress lp join tl on tl.lesson_id = lp.lesson_id and tl.teacher_id = st.teacher_id where lp.student_id = st.student_id),
        (select max(a.created_at) from public.quiz_attempts a join tl on tl.lesson_id = a.lesson_id and tl.teacher_id = st.teacher_id where a.student_id = st.student_id),
        (select max(w.created_at) from public.worksheet_submissions w join tl on tl.lesson_id = w.lesson_id and tl.teacher_id = st.teacher_id where w.student_id = st.student_id)
      ) as last_active
    from st
  )
  select t.id,
    count(per.student_id)::int,
    coalesce(round(avg(per.progress)), 0)::int,
    round(avg(per.quiz) * 100)::int,
    count(*) filter (where per.last_active > now() - interval '7 days')::int,
    count(*) filter (where per.student_id is not null and (coalesce(per.progress, 0) < 30 or per.quiz < 0.6))::int
  from t left join per on per.teacher_id = t.id
  group by t.id
$$;
revoke execute on function public.school_stats() from public, anon;
grant execute on function public.school_stats() to authenticated;
