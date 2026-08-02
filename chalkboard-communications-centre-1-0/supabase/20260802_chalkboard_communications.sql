create table if not exists public.communication_announcements (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  title text not null,
  body text not null,
  priority text not null default 'normal' check (priority in ('normal','important','urgent','emergency')),
  audience_type text not null check (audience_type in ('all','teachers','staff','learners','board','class','custom_group','manual')),
  audience_reference uuid,
  audience_label text,
  channels text[] not null default array['in_app']::text[],
  status text not null default 'draft' check (status in ('draft','scheduled','queued','sending','sent','partially_sent','failed','cancelled')),
  scheduled_for timestamptz,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz,
  cancelled_at timestamptz,
  attachment_references jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.communication_recipients (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  announcement_id uuid not null references public.communication_announcements(id) on delete cascade,
  recipient_type text not null check (recipient_type in ('profile','learner','staff','board_member','manual')),
  recipient_reference uuid,
  recipient_name text,
  email text,
  phone text,
  whatsapp_number text,
  preferred_language text,
  consent_email boolean not null default true,
  consent_sms boolean not null default true,
  consent_whatsapp boolean not null default true,
  opted_out boolean not null default false,
  resolved_at timestamptz not null default now()
);

create table if not exists public.communication_deliveries (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  announcement_id uuid not null references public.communication_announcements(id) on delete cascade,
  recipient_id uuid not null references public.communication_recipients(id) on delete cascade,
  channel text not null check (channel in ('in_app','email','sms','whatsapp')),
  recipient_address text,
  provider text,
  provider_message_id text,
  provider_conversation_id text,
  status text not null default 'queued' check (status in ('queued','pending_provider','sending','sent','delivered','read','failed','cancelled','skipped')),
  queued_at timestamptz not null default now(),
  sending_at timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  failed_at timestamptz,
  failure_code text,
  failure_reason text,
  retry_count integer not null default 0,
  next_retry_at timestamptz,
  request_payload jsonb not null default '{}'::jsonb,
  provider_response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (announcement_id, recipient_id, channel)
);

create table if not exists public.communication_templates (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  subject_template text,
  body_template text not null,
  category text,
  default_priority text not null default 'normal',
  default_channels text[] not null default array['in_app']::text[],
  variables text[] not null default '{}'::text[],
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, name)
);

create table if not exists public.communication_groups (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, name)
);

create table if not exists public.communication_group_members (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  group_id uuid not null references public.communication_groups(id) on delete cascade,
  member_type text not null check (member_type in ('profile','learner','staff','board_member','manual')),
  member_reference uuid,
  member_name text,
  email text,
  phone text,
  whatsapp_number text,
  created_at timestamptz not null default now()
);

create table if not exists public.communication_provider_settings (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  channel text not null check (channel in ('email','sms','whatsapp')),
  provider_key text,
  enabled boolean not null default false,
  sender_name text,
  sender_address text,
  reply_to text,
  default_country_code text,
  quiet_hours_start time,
  quiet_hours_end time,
  emergency_override boolean not null default true,
  configuration jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (school_id, channel)
);

create table if not exists public.communication_webhook_events (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete cascade,
  delivery_id uuid references public.communication_deliveries(id) on delete set null,
  provider text,
  event_type text,
  provider_message_id text,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_error text
);

create index if not exists communication_announcements_school_idx on public.communication_announcements(school_id, created_at desc);
create index if not exists communication_deliveries_queue_idx on public.communication_deliveries(status, next_retry_at, queued_at);
create index if not exists communication_group_members_group_idx on public.communication_group_members(group_id);

alter table public.communication_announcements enable row level security;
alter table public.communication_recipients enable row level security;
alter table public.communication_deliveries enable row level security;
alter table public.communication_templates enable row level security;
alter table public.communication_groups enable row level security;
alter table public.communication_group_members enable row level security;
alter table public.communication_provider_settings enable row level security;
alter table public.communication_webhook_events enable row level security;

do $$
declare t text;
begin
  foreach t in array array['communication_announcements','communication_recipients','communication_deliveries','communication_templates','communication_groups','communication_group_members','communication_provider_settings']
  loop
    execute format('drop policy if exists %I on public.%I', t || ' school management', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status=''active'' and (p.role=''operator'' or (p.role=''school_admin'' and p.school_id=%I.school_id)))) with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status=''active'' and (p.role=''operator'' or (p.role=''school_admin'' and p.school_id=%I.school_id))))',
      t || ' school management', t, t, t
    );
  end loop;
end $$;

drop policy if exists "communication webhook operator access" on public.communication_webhook_events;
create policy "communication webhook operator access" on public.communication_webhook_events for all to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active' and p.role='operator'))
with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.status='active' and p.role='operator'));
