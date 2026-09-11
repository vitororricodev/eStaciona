-- eStaciona 0.4.0 — motor tarifário avançado e metadados de aplicabilidade
alter table public.organizations add column if not exists timezone text not null default 'America/Sao_Paulo';

alter table public.tariff_plans
  add column if not exists description text,
  add column if not exists category text not null default 'standard',
  add column if not exists first_period_minutes integer not null default 60,
  add column if not exists additional_fraction_price numeric(10,2),
  add column if not exists valid_weekdays smallint[] default array[0,1,2,3,4,5,6]::smallint[],
  add column if not exists valid_from date,
  add column if not exists valid_until date,
  add column if not exists starts_at_time time,
  add column if not exists ends_at_time time,
  add column if not exists priority integer not null default 0,
  add column if not exists updated_at timestamptz not null default now();

alter table public.tariff_plans drop constraint if exists tariff_plans_first_period_minutes_check;
alter table public.tariff_plans add constraint tariff_plans_first_period_minutes_check check (first_period_minutes > 0);
alter table public.tariff_plans drop constraint if exists tariff_plans_additional_fraction_price_check;
alter table public.tariff_plans add constraint tariff_plans_additional_fraction_price_check check (additional_fraction_price is null or additional_fraction_price >= 0);
alter table public.tariff_plans drop constraint if exists tariff_plans_daily_max_check;
alter table public.tariff_plans add constraint tariff_plans_daily_max_check check (daily_max is null or daily_max >= 0);
alter table public.tariff_plans drop constraint if exists tariff_plans_first_hour_price_check;
alter table public.tariff_plans add constraint tariff_plans_first_hour_price_check check (first_hour_price >= 0);
alter table public.tariff_plans drop constraint if exists tariff_plans_category_check;
alter table public.tariff_plans add constraint tariff_plans_category_check check (category in ('standard','weekend','night','event','agreement','custom'));
alter table public.tariff_plans drop constraint if exists tariff_plans_valid_range_check;
alter table public.tariff_plans add constraint tariff_plans_valid_range_check check (valid_from is null or valid_until is null or valid_until >= valid_from);

create index if not exists tariff_plans_org_active_idx on public.tariff_plans(organization_id, active, priority desc, name);

-- Preenche valor explícito da fração para planos existentes sem alterar sua equivalência financeira.
update public.tariff_plans
set additional_fraction_price = round((additional_hour_price * fraction_minutes / 60.0)::numeric, 2)
where additional_fraction_price is null;
