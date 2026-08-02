-- Chalkboard invoices, receipts, delivery logs and petty cash.
-- Run in Supabase SQL Editor.

create table if not exists public.school_invoices (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid references public.students(id) on delete set null,
  invoice_number text not null,
  invoice_date date not null default current_date,
  due_date date,
  issued_to text not null,
  email text,
  phone text,
  description text,
  line_items jsonb not null default '[]'::jsonb,
  subtotal numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  amount_paid numeric(14,2) not null default 0,
  balance numeric(14,2) generated always as (total - amount_paid) stored,
  currency text not null default 'USD',
  status text not null default 'draft'
    check (status in ('draft','issued','part_paid','paid','void','overdue')),
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint school_invoice_number_unique unique (school_id, invoice_number)
);

create index if not exists school_invoices_school_date_idx
  on public.school_invoices(school_id, invoice_date desc);

create index if not exists school_invoices_student_idx
  on public.school_invoices(student_id);

create table if not exists public.school_receipts (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid references public.students(id) on delete set null,
  invoice_id uuid references public.school_invoices(id) on delete set null,
  receipt_number text not null,
  receipt_date date not null default current_date,
  received_from text not null,
  email text,
  phone text,
  amount numeric(14,2) not null check (amount > 0),
  currency text not null default 'USD',
  payment_method text,
  payment_reference text,
  description text,
  notes text,
  issued_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint school_receipt_number_unique unique (school_id, receipt_number)
);

create index if not exists school_receipts_school_date_idx
  on public.school_receipts(school_id, receipt_date desc);

create index if not exists school_receipts_invoice_idx
  on public.school_receipts(invoice_id);

create table if not exists public.school_document_deliveries (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  document_type text not null
    check (document_type in ('invoice','receipt')),
  document_id uuid not null,
  delivery_method text not null
    check (delivery_method in ('email','whatsapp','print','download','other')),
  recipient text,
  status text not null default 'prepared'
    check (status in ('prepared','sent','failed')),
  provider_message_id text,
  error_message text,
  sent_by uuid references public.profiles(id) on delete set null,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists school_document_deliveries_document_idx
  on public.school_document_deliveries(document_type, document_id);

create table if not exists public.petty_cash_transactions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  transaction_date date not null default current_date,
  transaction_type text not null
    check (transaction_type in ('opening_balance','cash_in','expense','reimbursement','adjustment')),
  category text,
  description text not null,
  amount numeric(14,2) not null check (amount > 0),
  currency text not null default 'USD',
  reference text,
  payee text,
  requested_by text,
  approved_by text,
  receipt_reference text,
  notes text,
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists petty_cash_school_date_idx
  on public.petty_cash_transactions(school_id, transaction_date desc);

alter table public.school_invoices enable row level security;
alter table public.school_receipts enable row level security;
alter table public.school_document_deliveries enable row level security;
alter table public.petty_cash_transactions enable row level security;

drop policy if exists "school invoices management" on public.school_invoices;
create policy "school invoices management"
on public.school_invoices
for all to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'
      and (
        p.role = 'operator'
        or (p.role = 'school_admin' and p.school_id = school_invoices.school_id)
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
        or (p.role = 'school_admin' and p.school_id = school_invoices.school_id)
      )
  )
);

drop policy if exists "school receipts management" on public.school_receipts;
create policy "school receipts management"
on public.school_receipts
for all to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'
      and (
        p.role = 'operator'
        or (p.role = 'school_admin' and p.school_id = school_receipts.school_id)
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
        or (p.role = 'school_admin' and p.school_id = school_receipts.school_id)
      )
  )
);

drop policy if exists "school document deliveries management" on public.school_document_deliveries;
create policy "school document deliveries management"
on public.school_document_deliveries
for all to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'
      and (
        p.role = 'operator'
        or (p.role = 'school_admin' and p.school_id = school_document_deliveries.school_id)
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
        or (p.role = 'school_admin' and p.school_id = school_document_deliveries.school_id)
      )
  )
);

drop policy if exists "petty cash management" on public.petty_cash_transactions;
create policy "petty cash management"
on public.petty_cash_transactions
for all to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'
      and (
        p.role = 'operator'
        or (p.role = 'school_admin' and p.school_id = petty_cash_transactions.school_id)
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
        or (p.role = 'school_admin' and p.school_id = petty_cash_transactions.school_id)
      )
  )
);
