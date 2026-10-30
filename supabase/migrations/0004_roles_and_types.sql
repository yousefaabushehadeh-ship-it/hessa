-- New account and lesson kinds. Kept in their own file: Postgres can't use a new
-- enum value in the same transaction that adds it.
alter type public.user_role add value if not exists 'school';
alter type public.lesson_type add value if not exists 'worksheet';
