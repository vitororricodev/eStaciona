create extension if not exists pgcrypto;

create type public.user_role as enum ('owner','manager','operator');
create type public.stay_status as enum ('open','finished','cancelled');
create type public.payment_status as enum ('pending','paid','cancelled');
create type public.payment_method as enum ('pix','card','cash','other');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  role public.user_role not null default 'operator',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  phone text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, phone)
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  plate text not null,
  make text,
  model text,
  color text,
  created_at timestamptz not null default now(),
  unique (organization_id, plate)
);

create table public.tariff_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null default 'Padrão',
  tolerance_minutes integer not null default 10 check (tolerance_minutes >= 0),
  first_hour_price numeric(10,2) not null default 10,
  additional_hour_price numeric(10,2) not null default 7,
  fraction_minutes integer not null default 30 check (fraction_minutes > 0),
  daily_max numeric(10,2),
  is_default boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index one_default_tariff_per_org on public.tariff_plans(organization_id) where is_default = true and active = true;

create table public.stays (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id),
  tariff_plan_id uuid not null references public.tariff_plans(id),
  public_token uuid not null default gen_random_uuid() unique,
  status public.stay_status not null default 'open',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  final_amount numeric(10,2),
  created_at timestamptz not null default now()
);

create unique index one_open_stay_per_vehicle on public.stays(vehicle_id) where status = 'open';
create index stays_org_status_idx on public.stays(organization_id, status, started_at desc);
create index vehicles_plate_idx on public.vehicles(organization_id, plate);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  stay_id uuid not null references public.stays(id),
  amount numeric(10,2) not null,
  method public.payment_method not null,
  status public.payment_status not null default 'paid',
  paid_at timestamptz default now(),
  created_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigserial primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id),
  action text not null,
  entity text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.vehicles enable row level security;
alter table public.tariff_plans enable row level security;
alter table public.stays enable row level security;
alter table public.payments enable row level security;
alter table public.services enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.current_org_id() returns uuid language sql stable security definer set search_path = public as $$
  select organization_id from public.profiles where id = auth.uid() and active = true limit 1;
$$;

create policy "org members read org" on public.organizations for select using (id = public.current_org_id());
create policy "org members read profiles" on public.profiles for select using (organization_id = public.current_org_id());
create policy "org data customers" on public.customers for all using (organization_id = public.current_org_id()) with check (organization_id = public.current_org_id());
create policy "org data vehicles" on public.vehicles for all using (organization_id = public.current_org_id()) with check (organization_id = public.current_org_id());
create policy "org data tariffs" on public.tariff_plans for all using (organization_id = public.current_org_id()) with check (organization_id = public.current_org_id());
create policy "org data stays" on public.stays for all using (organization_id = public.current_org_id()) with check (organization_id = public.current_org_id());
create policy "org data payments" on public.payments for all using (organization_id = public.current_org_id()) with check (organization_id = public.current_org_id());
create policy "org data services" on public.services for all using (organization_id = public.current_org_id()) with check (organization_id = public.current_org_id());
create policy "org read audits" on public.audit_logs for select using (organization_id = public.current_org_id());

-- Bootstrap manual após criar o primeiro usuário em Authentication:
-- insert into public.organizations(name, slug) values ('Meu Estacionamento','meu-estacionamento') returning id;
-- insert into public.profiles(id, organization_id, name, role) values ('UUID_DO_AUTH_USER','UUID_DA_ORG','Administrador','owner');
-- insert into public.tariff_plans(organization_id,name,tolerance_minutes,first_hour_price,additional_hour_price,fraction_minutes,daily_max,is_default)
-- values ('UUID_DA_ORG','Padrão',10,10,7,30,45,true);
