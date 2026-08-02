create table if not exists public.personnel_profiles (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  staff_id uuid references public.staff(id) on delete set null,
  personnel_type text not null check (personnel_type in ('teacher','staff','contractor','other')),
  full_name text not null,
  date_of_birth date,
  national_id text,
  employee_number text,
  position text,
  department text,
  employment_type text,
  employment_start date,
  employment_end date,
  professional_registration_number text,
  professional_registration_body text,
  professional_registration_expiry date,
  phone text,
  email text,
  address text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.personnel_qualifications (
  id uuid primary key default gen_random_uuid(),
  personnel_id uuid not null references public.personnel_profiles(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  qualification_type text not null,
  qualification_name text not null,
  field_of_study text,
  institution text not null,
  country text,
  start_year integer,
  graduation_year integer,
  qualification_number text,
  verification_status text not null default 'unverified',
  document_reference text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.personnel_employment_history (
  id uuid primary key default gen_random_uuid(),
  personnel_id uuid not null references public.personnel_profiles(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  employer text not null,
  job_title text not null,
  start_date date,
  end_date date,
  reason_for_leaving text,
  reference_name text,
  reference_phone text,
  reference_email text,
  verification_status text not null default 'unverified',
  verification_notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.personnel_union_memberships (
  id uuid primary key default gen_random_uuid(),
  personnel_id uuid not null references public.personnel_profiles(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  union_name text not null,
  membership_number text,
  joined_on date,
  ended_on date,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.personnel_vetting_records (
  id uuid primary key default gen_random_uuid(),
  personnel_id uuid not null references public.personnel_profiles(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  police_clearance_status text not null default 'not_requested',
  police_report_reference text,
  police_report_issue_date date,
  police_report_expiry_date date,
  conviction_disclosed boolean not null default false,
  offence_description text,
  conviction_year integer,
  court_or_jurisdiction text,
  sentence text,
  sentence_served boolean,
  sentence_completed_on date,
  rehabilitation_notes text,
  suitability_decision text,
  decision_notes text,
  decision_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.governance_terms (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  title text not null,
  governance_year integer not null,
  term_start date not null,
  term_end date not null,
  status text not null default 'planned',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, governance_year, title)
);

create table if not exists public.governance_members (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  governance_term_id uuid not null references public.governance_terms(id) on delete cascade,
  full_name text not null,
  board_role text not null,
  representing_group text,
  appointment_method text,
  appointment_date date,
  service_start date not null,
  service_end date,
  phone text,
  email text,
  national_id text,
  qualifications_or_expertise text,
  declaration_of_interests text,
  conflict_notes text,
  background_check_status text,
  status text not null default 'active',
  exit_date date,
  exit_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.personnel_profiles enable row level security;
alter table public.personnel_qualifications enable row level security;
alter table public.personnel_employment_history enable row level security;
alter table public.personnel_union_memberships enable row level security;
alter table public.personnel_vetting_records enable row level security;
alter table public.governance_terms enable row level security;
alter table public.governance_members enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'personnel_profiles','personnel_qualifications','personnel_employment_history',
    'personnel_union_memberships','governance_terms','governance_members'
  ] loop
    execute format('drop policy if exists %I on public.%I', t || ' school management', t);
    execute format(
      'create policy %I on public.%I for all to authenticated
       using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status=''active'' and (p.role=''operator'' or (p.role=''school_admin'' and p.school_id=%I.school_id))))
       with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status=''active'' and (p.role=''operator'' or (p.role=''school_admin'' and p.school_id=%I.school_id))))',
      t || ' school management', t, t, t
    );
  end loop;
end $$;

drop policy if exists "personnel vetting restricted management" on public.personnel_vetting_records;
create policy "personnel vetting restricted management"
on public.personnel_vetting_records
for all to authenticated
using (
  exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active' and p.role='school_admin' and p.school_id=personnel_vetting_records.school_id)
)
with check (
  exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active' and p.role='school_admin' and p.school_id=personnel_vetting_records.school_id)
);
