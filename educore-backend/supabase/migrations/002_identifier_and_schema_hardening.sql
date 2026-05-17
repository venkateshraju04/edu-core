-- ============================================================
-- 002_identifier_and_schema_hardening.sql
-- Adds structured readable identifiers and schema hardening.
-- ============================================================

-- Keep trigger function safe from mutable search_path warnings.
create or replace function public.update_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Sequences used by readable ID generators.
create sequence if not exists public.employee_id_seq;
create sequence if not exists public.student_code_seq;

alter table public.students
  add column if not exists student_code varchar(24);

-- Sync sequence values with existing data where possible.
select setval(
  'public.employee_id_seq',
  coalesce(
    (
      select max((regexp_match(employee_id, '([0-9]{4})$'))[1]::int)
      from public.teachers
      where employee_id ~ '^EMP-[A-Z0-9]{3}-[0-9]{2}-[0-9]{4}$'
    ),
    0
  ) + 1,
  false
);

select setval(
  'public.student_code_seq',
  coalesce(
    (
      select max((regexp_match(student_code, '([0-9]{6})$'))[1]::int)
      from public.students
      where student_code ~ '^STU-G[0-9]{2}[A-Z]-[0-9]{2}-[0-9]{6}$'
    ),
    0
  ) + 1,
  false
);

create or replace function public.generate_employee_id(p_department_id uuid)
returns text
language plpgsql
set search_path = public
as $$
declare
  dept_name text;
  dept_code text;
begin
  select name into dept_name
  from public.departments
  where id = p_department_id;

  dept_code := regexp_replace(upper(coalesce(dept_name, 'GEN')), '[^A-Z0-9]', '', 'g');
  dept_code := substr(dept_code, 1, 3);
  dept_code := rpad(coalesce(nullif(dept_code, ''), 'GEN'), 3, 'X');

  return format(
    'EMP-%s-%s-%s',
    dept_code,
    to_char(current_date, 'YY'),
    lpad(nextval('public.employee_id_seq')::text, 4, '0')
  );
end;
$$;

create or replace function public.generate_student_code(p_class_id uuid, p_created_at timestamp without time zone default now())
returns text
language plpgsql
set search_path = public
as $$
declare
  v_grade int;
  v_section char(1);
begin
  select grade, section
    into v_grade, v_section
  from public.classes
  where id = p_class_id;

  if v_grade is null then
    raise exception 'Cannot generate student code: class % not found', p_class_id;
  end if;

  return format(
    'STU-G%s%s-%s-%s',
    lpad(v_grade::text, 2, '0'),
    upper(trim(v_section::text)),
    to_char(coalesce(p_created_at, now()), 'YY'),
    lpad(nextval('public.student_code_seq')::text, 6, '0')
  );
end;
$$;

create or replace function public.generate_student_code(p_class_id uuid, p_created_at timestamp with time zone)
returns text
language sql
set search_path = public
as $$
  select public.generate_student_code(p_class_id, p_created_at::timestamp without time zone);
$$;

create or replace function public.trg_assign_employee_id()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.employee_id is null
     or btrim(new.employee_id) = ''
     or new.employee_id !~ '^EMP-[A-Z0-9]{3}-[0-9]{2}-[0-9]{4}$' then
    new.employee_id := public.generate_employee_id(new.department_id);
  end if;

  return new;
end;
$$;

create or replace function public.trg_assign_student_identifiers()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.roll_number is null or new.roll_number <= 0 then
    select coalesce(max(s.roll_number), 0) + 1
      into new.roll_number
    from public.students s
    where s.class_id = new.class_id;
  end if;

  if new.student_code is null or btrim(new.student_code) = '' then
    new.student_code := public.generate_student_code(new.class_id, coalesce(new.created_at, now()::timestamp));
  end if;

  return new;
end;
$$;

drop trigger if exists trg_teachers_assign_employee_id on public.teachers;
create trigger trg_teachers_assign_employee_id
before insert on public.teachers
for each row
execute function public.trg_assign_employee_id();

update public.students
set student_code = public.generate_student_code(class_id, created_at)
where student_code is null or btrim(student_code) = '';

update public.teachers
set employee_id = public.generate_employee_id(department_id)
where employee_id is null
   or btrim(employee_id) = ''
   or employee_id !~ '^EMP-[A-Z0-9]{3}-[0-9]{2}-[0-9]{4}$';

alter table public.teachers
  alter column employee_id type varchar(24);

alter table public.students
  alter column student_code set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'students_student_code_key'
  ) then
    alter table public.students
      add constraint students_student_code_key unique (student_code);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'students_class_roll_unique'
  ) then
    alter table public.students
      add constraint students_class_roll_unique unique (class_id, roll_number);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'teachers_employee_id_format_chk'
  ) then
    alter table public.teachers
      add constraint teachers_employee_id_format_chk
      check (employee_id ~ '^EMP-[A-Z0-9]{3}-[0-9]{2}-[0-9]{4}$');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'students_student_code_format_chk'
  ) then
    alter table public.students
      add constraint students_student_code_format_chk
      check (student_code ~ '^STU-G[0-9]{2}[A-Z]-[0-9]{2}-[0-9]{6}$');
  end if;
end $$;

drop trigger if exists trg_students_assign_identifiers on public.students;
create trigger trg_students_assign_identifiers
before insert on public.students
for each row
execute function public.trg_assign_student_identifiers();

-- Performance indexes for FK columns reported by advisors.
create index if not exists idx_admissions_reviewed_by on public.admissions(reviewed_by);
create index if not exists idx_attendance_class_id on public.attendance(class_id);
create index if not exists idx_attendance_marked_by on public.attendance(marked_by);
create index if not exists idx_behavior_records_class_id on public.behavior_records(class_id);
create index if not exists idx_behavior_records_recorded_by on public.behavior_records(recorded_by);
create index if not exists idx_behavior_records_student_id on public.behavior_records(student_id);
create index if not exists idx_class_teachers_assigned_by on public.class_teachers(assigned_by);
create index if not exists idx_class_teachers_class_id on public.class_teachers(class_id);
create index if not exists idx_departments_hod_id on public.departments(hod_id);
create index if not exists idx_fees_updated_by on public.fees(updated_by);
create index if not exists idx_lesson_plans_class_id on public.lesson_plans(class_id);
create index if not exists idx_lesson_plans_reviewed_by on public.lesson_plans(reviewed_by);
create index if not exists idx_marks_class_id on public.marks(class_id);
create index if not exists idx_marks_entered_by on public.marks(entered_by);
create index if not exists idx_teacher_evaluations_evaluated_by on public.teacher_evaluations(evaluated_by);
create index if not exists idx_teacher_evaluations_teacher_id on public.teacher_evaluations(teacher_id);
create index if not exists idx_teachers_department_id on public.teachers(department_id);
create index if not exists idx_timetable_teacher_id on public.timetable(teacher_id);
create index if not exists idx_timetable_updated_by on public.timetable(updated_by);
create index if not exists idx_users_department_id on public.users(department_id);

-- Baseline security hardening: enable RLS on all public tables.
alter table public.departments enable row level security;
alter table public.users enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.admissions enable row level security;
alter table public.teachers enable row level security;
alter table public.class_teachers enable row level security;
alter table public.fees enable row level security;
alter table public.timetable enable row level security;
alter table public.lesson_plans enable row level security;
alter table public.attendance enable row level security;
alter table public.marks enable row level security;
alter table public.behavior_records enable row level security;
alter table public.teacher_evaluations enable row level security;
alter table public.notifications enable row level security;
