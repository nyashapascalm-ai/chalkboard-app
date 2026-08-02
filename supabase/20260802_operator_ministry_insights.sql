-- Chalkboard Operator and Ministry insight upgrade
-- Run in Supabase SQL Editor before testing official invitations.

create table if not exists public.platform_official_invitations (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  role text not null check (
    role in (
      'operator',
      'ministry_official'
    )
  ),
  notes text,
  status text not null default 'pending'
    check (
      status in (
        'pending',
        'sent',
        'accepted',
        'cancelled'
      )
    ),
  invited_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists
  platform_official_invitations_email_idx
on public.platform_official_invitations(email);

alter table public.platform_official_invitations
  enable row level security;

drop policy if exists
  "Operators manage official invitations"
on public.platform_official_invitations;

create policy
  "Operators manage official invitations"
on public.platform_official_invitations
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'operator'
      and profiles.status = 'active'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'operator'
      and profiles.status = 'active'
  )
);

grant select, insert, update, delete
on public.platform_official_invitations
to authenticated;
