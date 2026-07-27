create table public.payments (
  id uuid primary key default gen_random_uuid(),
  mollie_payment_id text unique not null,
  user_id uuid references auth.users(id) on delete set null,
  email text,
  amount_cents integer not null default 1000,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payments enable row level security;

-- Only the service role (backend) can read and write payments.
-- No user-facing policies are needed.
