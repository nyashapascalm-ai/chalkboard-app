-- Chalkboard annual budgeting foundation.
-- Run in Supabase SQL Editor.

create table if not exists public.school_budgets (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  financial_year integer not null,
  version integer not null default 1,
  title text not null,
  currency text not null default 'USD',
  status text not null default 'draft'
    check (status in ('draft','submitted','approved','rejected','locked','archived')),
  start_date date,
  end_date date,
  projected_learner_count integer not null default 0,
  notes text,
  prepared_by uuid references public.profiles(id) on delete set null,
  submitted_by uuid references public.profiles(id) on delete set null,
  submitted_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  approval_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint school_budget_year_version_unique
    unique (school_id, financial_year, version),
  constraint school_budget_dates_valid
    check (
      end_date is null
      or start_date is null
      or end_date >= start_date
    )
);

create index if not exists school_budgets_school_year_idx
  on public.school_budgets(school_id, financial_year desc, version desc);

create table if not exists public.school_budget_lines (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.school_budgets(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  line_type text not null
    check (line_type in ('income','expense')),
  category text not null,
  subcategory text,
  source_type text,
  description text not null,
  quantity numeric(14,2) not null default 1,
  unit_rate numeric(14,2) not null default 0,
  periods numeric(14,2) not null default 1,
  amount numeric(14,2)
    generated always as (quantity * unit_rate * periods) stored,
  assumptions text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists school_budget_lines_budget_idx
  on public.school_budget_lines(budget_id, line_type, category, sort_order);

create table if not exists public.school_budget_approvals (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.school_budgets(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  action text not null
    check (action in ('submitted','approved','rejected','reopened','locked','archived')),
  action_by uuid references public.profiles(id) on delete set null,
  action_at timestamptz not null default now(),
  notes text
);

create index if not exists school_budget_approvals_budget_idx
  on public.school_budget_approvals(budget_id, action_at desc);

alter table public.school_budgets enable row level security;
alter table public.school_budget_lines enable row level security;
alter table public.school_budget_approvals enable row level security;

drop policy if exists "school budgets management" on public.school_budgets;
create policy "school budgets management"
on public.school_budgets
for all to authenticated
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
          and p.school_id = school_budgets.school_id
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
          and p.school_id = school_budgets.school_id
        )
      )
  )
);

drop policy if exists "school budget lines management" on public.school_budget_lines;
create policy "school budget lines management"
on public.school_budget_lines
for all to authenticated
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
          and p.school_id = school_budget_lines.school_id
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
          and p.school_id = school_budget_lines.school_id
        )
      )
  )
);

drop policy if exists "school budget approvals management" on public.school_budget_approvals;
create policy "school budget approvals management"
on public.school_budget_approvals
for all to authenticated
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
          and p.school_id = school_budget_approvals.school_id
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
          and p.school_id = school_budget_approvals.school_id
        )
      )
  )
);
