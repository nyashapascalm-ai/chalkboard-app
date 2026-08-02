-- Chalkboard HR foundation for the shared Dari / Chalkboard database.
-- Run once in Supabase SQL Editor.

alter table if exists public.staff
  add column if not exists employee_number text,
  add column if not exists position text,
  add column if not exists employment_type text,
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists status text default 'active',
  add column if not exists address text,
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_phone text,
  add column if not exists updated_at timestamptz default now();

create unique index if not exists staff_school_employee_number_unique
  on public.staff(school_id, employee_number)
  where employee_number is not null;

create table if not exists public.hr_leave_requests (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete cascade,
  leave_type text not null,
  start_date date not null,
  end_date date not null,
  days numeric(8,2),
  reason text,
  supporting_document text,
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','cancelled')),
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hr_leave_dates_valid check (end_date >= start_date)
);

create index if not exists hr_leave_requests_school_idx
  on public.hr_leave_requests(school_id);

create index if not exists hr_leave_requests_staff_idx
  on public.hr_leave_requests(staff_id);

create index if not exists hr_leave_requests_dates_idx
  on public.hr_leave_requests(start_date, end_date);

create table if not exists public.hr_staff_absences (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete cascade,
  absence_date date not null,
  status text not null
    check (status in (
      'present',
      'absent',
      'on_leave',
      'off_duty',
      'training',
      'official_business',
      'suspended'
    )),
  leave_request_id uuid references public.hr_leave_requests(id) on delete set null,
  notes text,
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hr_staff_absence_unique unique (staff_id, absence_date)
);

create index if not exists hr_staff_absences_school_date_idx
  on public.hr_staff_absences(school_id, absence_date);

alter table public.hr_leave_requests enable row level security;
alter table public.hr_staff_absences enable row level security;

drop policy if exists "hr leave school management" on public.hr_leave_requests;
create policy "hr leave school management"
on public.hr_leave_requests
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'
      and (
        p.role = 'operator'
        or (
          p.role = 'school_admin'
          and p.school_id = hr_leave_requests.school_id
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'
      and (
        p.role = 'operator'
        or (
          p.role = 'school_admin'
          and p.school_id = hr_leave_requests.school_id
        )
      )
  )
);

drop policy if exists "hr absence school management" on public.hr_staff_absences;
create policy "hr absence school management"
on public.hr_staff_absences
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'
      and (
        p.role = 'operator'
        or (
          p.role = 'school_admin'
          and p.school_id = hr_staff_absences.school_id
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'
      and (
        p.role = 'operator'
        or (
          p.role = 'school_admin'
          and p.school_id = hr_staff_absences.school_id
        )
      )
  )
);
