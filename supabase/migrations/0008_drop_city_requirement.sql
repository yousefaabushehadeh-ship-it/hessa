-- City is no longer asked at sign-up or shown on the site.
-- Keep the columns (old rows still have a value) but stop requiring one.
alter table public.teachers alter column city set default '';
alter table public.schools alter column city set default '';
