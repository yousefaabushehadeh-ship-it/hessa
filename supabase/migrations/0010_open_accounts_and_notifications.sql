-- 1) No parent approval step any more: every account is active right away.
-- parent_consents stays as the store for the private report link a student can send a parent.
alter table public.profiles alter column consent set default 'not_needed';
update public.profiles set consent = 'not_needed' where consent in ('pending', 'revoked');
update public.parent_consents set status = 'approved', approved_at = coalesce(approved_at, now()) where status = 'pending';
alter table public.parent_consents alter column parent_phone set default '';
-- Approving went through this function; nothing calls it now.
revoke execute on function public.approve_consent(text) from public, anon, authenticated;

-- 2) In-app notifications: a new payment or hand-in for the teacher, a decision or a mark for the student.
-- The text is built in the app from kind + params, so it follows the reader's language.
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  kind text not null check (kind in ('payment_new', 'payment_approved', 'payment_rejected', 'handin_new', 'handin_graded', 'consent_approved')),
  params jsonb not null default '{}'::jsonb,
  link text not null default '',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;
create policy "own notifications" on public.notifications for select using (user_id = auth.uid());
-- No insert policy: only the triggers below write. Reading marks them through mark_notifications_read.

create or replace function public.mark_notifications_read() returns void
language sql security definer set search_path = public as $$
  update public.notifications set read_at = now() where user_id = auth.uid() and read_at is null;
$$;
grant execute on function public.mark_notifications_read() to authenticated;

create or replace function public.notify(p_user uuid, p_kind text, p_params jsonb, p_link text) returns void
language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, kind, params, link)
  select p_user, p_kind, p_params, p_link where p_user is not null;
$$;
revoke execute on function public.notify(uuid, text, jsonb, text) from public, anon, authenticated;

create or replace function public.on_payment_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_teacher public.teachers; v_student text;
begin
  select * into v_teacher from public.teachers where id = new.teacher_id;
  if tg_op = 'INSERT' then
    select full_name into v_student from public.profiles where id = new.student_id;
    perform public.notify(v_teacher.user_id, 'payment_new',
      jsonb_build_object('student', coalesce(v_student, ''), 'amount', trim_scale(new.amount)::text), '/teacher/payments');
  elsif old.status = 'pending' and new.status <> 'pending' then
    perform public.notify(new.student_id,
      case when new.status = 'approved' then 'payment_approved' else 'payment_rejected' end,
      jsonb_build_object('teacher', v_teacher.name, 'note', coalesce(new.note, '')),
      case when new.status = 'approved' then '/student/materials' else '/student/subscribe/' || v_teacher.slug end);
  end if;
  return new;
end $$;
create trigger notify_payment after insert or update of status on public.payment_requests
  for each row execute function public.on_payment_change();

create or replace function public.on_handin_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_lesson text; v_owner uuid; v_student text;
begin
  select l.title, t.user_id into v_lesson, v_owner
    from public.lessons l join public.units u on u.id = l.unit_id join public.teachers t on t.id = u.teacher_id
    where l.id = new.lesson_id;
  if tg_op = 'INSERT' then
    select full_name into v_student from public.profiles where id = new.student_id;
    perform public.notify(v_owner, 'handin_new',
      jsonb_build_object('student', coalesce(v_student, ''), 'lesson', coalesce(v_lesson, '')), '/teacher/worksheets');
  elsif old.status = 'submitted' and new.status = 'graded' then
    perform public.notify(new.student_id, 'handin_graded',
      jsonb_build_object('lesson', coalesce(v_lesson, ''), 'mark', coalesce(new.mark, '')), '/student/lesson/' || new.lesson_id);
  end if;
  return new;
end $$;
create trigger notify_handin after insert or update of status on public.worksheet_submissions
  for each row execute function public.on_handin_change();
