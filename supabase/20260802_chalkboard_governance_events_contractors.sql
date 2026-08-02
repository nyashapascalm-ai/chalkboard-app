-- Chalkboard governance, events and contractor management.
-- Run in Supabase SQL Editor.

create table if not exists public.school_meetings (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  title text not null,
  meeting_type text not null default 'management',
  meeting_date date not null,
  start_time time,
  end_time time,
  venue text,
  chairperson text,
  secretary text,
  attendees text,
  agenda text,
  minutes text,
  status text not null default 'draft'
    check (status in ('draft','approved','archived')),
  created_by uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists school_meetings_school_date_idx
  on public.school_meetings(school_id, meeting_date desc);

create table if not exists public.meeting_resolutions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  meeting_id uuid not null references public.school_meetings(id) on delete cascade,
  resolution_number text,
  resolution text not null,
  responsible_person text,
  due_date date,
  status text not null default 'open'
    check (status in ('open','in_progress','completed','cancelled')),
  completion_notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists meeting_resolutions_meeting_idx
  on public.meeting_resolutions(meeting_id);

create index if not exists meeting_resolutions_school_status_idx
  on public.meeting_resolutions(school_id, status);

create table if not exists public.school_events (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  title text not null,
  category text not null default 'school',
  start_date date not null,
  end_date date,
  start_time time,
  end_time time,
  venue text,
  audience text,
  description text,
  organiser text,
  status text not null default 'scheduled'
    check (status in ('scheduled','completed','cancelled','postponed')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint school_events_dates_valid
    check (end_date is null or end_date >= start_date)
);

create index if not exists school_events_school_start_idx
  on public.school_events(school_id, start_date);

create table if not exists public.school_contractors (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  contractor_name text not null,
  company_name text,
  service_type text not null,
  phone text,
  email text,
  address text,
  tax_number text,
  contract_reference text,
  contract_start date,
  contract_end date,
  contract_value numeric(14,2),
  payment_terms text,
  status text not null default 'active'
    check (status in ('prospective','active','completed','suspended','terminated')),
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint school_contract_dates_valid
    check (
      contract_end is null
      or contract_start is null
      or contract_end >= contract_start
    )
);

create index if not exists school_contractors_school_status_idx
  on public.school_contractors(school_id, status);

create table if not exists public.contractor_payments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  contractor_id uuid not null references public.school_contractors(id) on delete cascade,
  payment_date date not null default current_date,
  amount numeric(14,2) not null check (amount > 0),
  payment_method text,
  reference text,
  description text,
  approved_by text,
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists contractor_payments_school_date_idx
  on public.contractor_payments(school_id, payment_date desc);

create index if not exists contractor_payments_contractor_idx
  on public.contractor_payments(contractor_id);

alter table public.school_meetings enable row level security;
alter table public.meeting_resolutions enable row level security;
alter table public.school_events enable row level security;
alter table public.school_contractors enable row level security;
alter table public.contractor_payments enable row level security;

drop policy if exists "school meetings management" on public.school_meetings;
create policy "school meetings management"
on public.school_meetings
for all to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'
      and (
        p.role = 'operator'
        or (p.role = 'school_admin' and p.school_id = school_meetings.school_id)
      )
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'
      and (
        p.role = 'operator'
        or (p.role = 'school_admin' and p.school_id = school_meetings.school_id)
      )
  )
);

drop policy if exists "meeting resolutions management" on public.meeting_resolutions;
create policy "meeting resolutions management"
on public.meeting_resolutions
for all to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'
      and (
        p.role = 'operator'
        or (p.role = 'school_admin' and p.school_id = meeting_resolutions.school_id)
      )
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'
      and (
        p.role = 'operator'
        or (p.role = 'school_admin' and p.school_id = meeting_resolutions.school_id)
      )
  )
);

drop policy if exists "school events management" on public.school_events;
create policy "school events management"
on public.school_events
for all to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'
      and (
        p.role = 'operator'
        or (p.role = 'school_admin' and p.school_id = school_events.school_id)
      )
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'
      and (
        p.role = 'operator'
        or (p.role = 'school_admin' and p.school_id = school_events.school_id)
      )
  )
);

drop policy if exists "school contractors management" on public.school_contractors;
create policy "school contractors management"
on public.school_contractors
for all to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'
      and (
        p.role = 'operator'
        or (p.role = 'school_admin' and p.school_id = school_contractors.school_id)
      )
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'
      and (
        p.role = 'operator'
        or (p.role = 'school_admin' and p.school_id = school_contractors.school_id)
      )
  )
);

drop policy if exists "contractor payments management" on public.contractor_payments;
create policy "contractor payments management"
on public.contractor_payments
for all to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'
      and (
        p.role = 'operator'
        or (p.role = 'school_admin' and p.school_id = contractor_payments.school_id)
      )
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'
      and (
        p.role = 'operator'
        or (p.role = 'school_admin' and p.school_id = contractor_payments.school_id)
      )
  )
);
