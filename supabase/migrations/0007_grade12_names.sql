-- The site no longer says "توجيهي": the Grade 12 tracks are now
-- "الثاني عشر علمي / أدبي / صناعي". Rename the values already stored.
update public.profiles set grade = replace(grade, 'توجيهي', 'الثاني عشر') where grade like 'توجيهي%';
update public.profiles set teach_grade = replace(teach_grade, 'توجيهي', 'الثاني عشر') where teach_grade like 'توجيهي%';
update public.teachers set grade = replace(grade, 'توجيهي', 'الثاني عشر') where grade like 'توجيهي%';
update public.school_invites set grade = replace(grade, 'توجيهي', 'الثاني عشر') where grade like 'توجيهي%';
