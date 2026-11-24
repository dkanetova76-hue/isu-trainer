-- Позволяет студенту узнать дисциплины своей группы (таблицу groups студент читать не может).
-- Нужна, чтобы в окне «Выберите дисциплину» появлялся курс «UX» сразу после регистрации.
-- Выполнить ОДИН раз: Supabase → SQL Editor → New query → вставить → Run.
create or replace function public.my_courses() returns table (course text)
language sql stable security definer set search_path = public as $$
  select distinct g.course
  from public.profiles p join public.groups g on g.name = p.grp
  where p.id = auth.uid() and not g.is_teacher;
$$;
grant execute on function public.my_courses() to authenticated;
