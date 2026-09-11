-- eStaciona 1.0.0 — Portal, gestão, serviços, equipe, caixa, auditoria e integrações

alter table public.organizations
  add column if not exists exit_grace_minutes integer not null default 15,
  add column if not exists customer_lookup_phone_digits integer not null default 4,
  add column if not exists whatsapp_enabled boolean not null default false,
  add column if not exists pix_enabled boolean not null default false;

alter table public.customers
  add column if not exists cpf text,
  add column if not exists notes text,
  add column if not exists active boolean not null default true;

alter table public.vehicles
  add column if not exists year integer,
  add column if not exists notes text,
  add column if not exists active boolean not null default true;

alter table public.stays
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by uuid references auth.users(id),
  add column if not exists cancellation_reason text,
  add column if not exists paid_at timestamptz,
  add column if not exists paid_amount numeric(10,2),
  add column if not exists payment_grace_until timestamptz;

alter table public.payments
  add column if not exists cashier_user_id uuid references auth.users(id),
  add column if not exists source text not null default 'counter',
  add column if not exists provider text,
  add column if not exists external_reference text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.payments drop constraint if exists payments_source_check;
alter table public.payments add constraint payments_source_check check (source in ('counter','customer','adjustment'));

create table if not exists public.stay_services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  stay_id uuid not null references public.stays(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  service_name text not null,
  unit_price numeric(10,2) not null check (unit_price >= 0),
  quantity integer not null default 1 check (quantity > 0),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists stay_services_stay_idx on public.stay_services(stay_id);

create table if not exists public.cash_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  opened_at timestamptz not null default now(),
  opening_amount numeric(10,2) not null default 0 check (opening_amount >= 0),
  closed_at timestamptz,
  closing_amount numeric(10,2),
  expected_cash numeric(10,2),
  difference numeric(10,2),
  status text not null default 'open',
  notes text
);

alter table public.cash_sessions drop constraint if exists cash_sessions_status_check;
alter table public.cash_sessions add constraint cash_sessions_status_check check (status in ('open','closed','cancelled'));
create unique index if not exists one_open_cash_session_per_user on public.cash_sessions(user_id) where status='open';
create index if not exists cash_sessions_org_idx on public.cash_sessions(organization_id, opened_at desc);

create table if not exists public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  cash_session_id uuid not null references public.cash_sessions(id) on delete cascade,
  type text not null,
  amount numeric(10,2) not null check (amount > 0),
  description text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.cash_movements drop constraint if exists cash_movements_type_check;
alter table public.cash_movements add constraint cash_movements_type_check check (type in ('supply','withdrawal'));
create index if not exists cash_movements_session_idx on public.cash_movements(cash_session_id, created_at);

alter table public.payments add column if not exists cash_session_id uuid references public.cash_sessions(id) on delete set null;

create table if not exists public.integration_events (
  id bigserial primary key,
  organization_id uuid references public.organizations(id) on delete cascade,
  provider text not null,
  event_type text not null,
  external_id text,
  payload jsonb not null default '{}'::jsonb,
  processed boolean not null default false,
  error text,
  created_at timestamptz not null default now()
);
create index if not exists integration_events_provider_idx on public.integration_events(provider, external_id);

alter table public.stay_services enable row level security;
alter table public.cash_sessions enable row level security;
alter table public.cash_movements enable row level security;
alter table public.integration_events enable row level security;

create policy "org data stay services" on public.stay_services for all using (organization_id = public.current_org_id()) with check (organization_id = public.current_org_id());
create policy "org data cash sessions" on public.cash_sessions for all using (organization_id = public.current_org_id()) with check (organization_id = public.current_org_id());
create policy "org data cash movements" on public.cash_movements for all using (organization_id = public.current_org_id()) with check (organization_id = public.current_org_id());
create policy "org read integration events" on public.integration_events for select using (organization_id = public.current_org_id());

-- Perfis podem ser alterados por owner/manager da mesma organização.
create policy "managers update profiles" on public.profiles for update
using (organization_id = public.current_org_id() and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('owner','manager') and p.active=true))
with check (organization_id = public.current_org_id());

create index if not exists payments_org_paid_idx on public.payments(organization_id, paid_at desc) where status='paid';
create index if not exists customers_org_name_idx on public.customers(organization_id, name);
create index if not exists audits_org_created_idx on public.audit_logs(organization_id, created_at desc);
