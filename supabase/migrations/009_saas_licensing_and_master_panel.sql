-- eStaciona 1.1.0 — painel master, planos SaaS, licenças e bloqueio multi-camada.

create table if not exists public.platform_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'master' check (role in ('master')),
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saas_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  duration_days integer not null check (duration_days > 0),
  price_cents bigint not null default 0 check (price_cents >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.saas_plans(code, name, description, duration_days, price_cents)
values
  ('monthly', 'Mensal', 'Licença com validade de 30 dias.', 30, 0),
  ('semiannual', 'Semestral', 'Licença com validade de 180 dias.', 180, 0),
  ('annual', 'Anual', 'Licença com validade de 365 dias.', 365, 0)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  duration_days = excluded.duration_days;

create table if not exists public.organization_licenses (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  plan_id uuid not null references public.saas_plans(id),
  status text not null default 'active'
    check (status in ('pending','active','blocked','cancelled')),
  starts_at timestamptz,
  expires_at timestamptz,
  blocked_at timestamptz,
  blocked_by uuid references auth.users(id) on delete set null,
  block_reason text,
  plan_snapshot jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at is null or starts_at is null or expires_at > starts_at)
);

create index if not exists organization_licenses_status_expiry_idx
  on public.organization_licenses(status, expires_at);

create table if not exists public.license_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  previous_state jsonb,
  new_state jsonb not null,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists license_events_org_created_idx
  on public.license_events(organization_id, created_at desc);

create table if not exists public.platform_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists platform_audit_created_idx
  on public.platform_audit_logs(created_at desc);

alter table public.platform_users enable row level security;
alter table public.saas_plans enable row level security;
alter table public.organization_licenses enable row level security;
alter table public.license_events enable row level security;
alter table public.platform_audit_logs enable row level security;

drop policy if exists "platform users read own membership" on public.platform_users;
create policy "platform users read own membership" on public.platform_users
for select to authenticated using (user_id = auth.uid() and active = true);

create or replace function public.current_profile_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id
  from public.profiles
  where id = auth.uid() and active = true
  limit 1;
$$;

create or replace function public.organization_license_status(p_organization_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when l.organization_id is null then 'pending'
    when l.status = 'blocked' then 'blocked'
    when l.status = 'cancelled' then 'cancelled'
    when l.status <> 'active' then l.status
    when l.expires_at is null or l.expires_at <= now() then 'expired'
    else 'active'
  end
  from (select p_organization_id as organization_id) input
  left join public.organization_licenses l on l.organization_id = input.organization_id;
$$;

create or replace function public.organization_has_active_license(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.organization_license_status(p_organization_id) = 'active';
$$;

create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.organization_id
  from public.profiles p
  where p.id = auth.uid()
    and p.active = true
    and public.organization_has_active_license(p.organization_id)
  limit 1;
$$;

drop policy if exists "active member reads organization" on public.organizations;
create policy "active profile reads organization" on public.organizations
for select using (id = public.current_profile_org_id());

drop policy if exists "active members read profiles" on public.profiles;
drop policy if exists "owner updates profiles" on public.profiles;
create policy "active profiles read organization profiles" on public.profiles
for select using (organization_id = public.current_profile_org_id());
create policy "licensed owners update profiles" on public.profiles
for update using (
  organization_id = public.current_org_id()
  and public.current_user_role() = 'owner'
)
with check (organization_id = public.current_org_id());

drop policy if exists "organization reads own license" on public.organization_licenses;
create policy "organization reads own license" on public.organization_licenses
for select using (organization_id = public.current_profile_org_id());

drop policy if exists "authenticated reads active plans" on public.saas_plans;
create policy "authenticated reads active plans" on public.saas_plans
for select to authenticated using (active = true);

revoke all on function public.current_profile_org_id() from public, anon;
grant execute on function public.current_profile_org_id() to authenticated, service_role;
revoke all on function public.organization_license_status(uuid) from public, anon;
grant execute on function public.organization_license_status(uuid) to authenticated, service_role;
revoke all on function public.organization_has_active_license(uuid) from public, anon;
grant execute on function public.organization_has_active_license(uuid) to authenticated, service_role;

insert into public.organization_licenses(
  organization_id, plan_id, status, starts_at, expires_at, plan_snapshot
)
select
  o.id,
  p.id,
  'active',
  now(),
  now() + interval '30 days',
  jsonb_build_object(
    'code', p.code,
    'name', p.name,
    'duration_days', p.duration_days,
    'price_cents', p.price_cents
  )
from public.organizations o
cross join lateral (
  select * from public.saas_plans where code = 'monthly' limit 1
) p
on conflict (organization_id) do nothing;

insert into public.license_events(organization_id, action, new_state, reason)
select
  l.organization_id,
  'license.migration_grant',
  to_jsonb(l),
  'Licença inicial de 30 dias criada durante a migração 009.'
from public.organization_licenses l
where not exists (
  select 1 from public.license_events e
  where e.organization_id = l.organization_id
    and e.action = 'license.migration_grant'
);

create or replace function public.provision_organization_with_license_atomic(
  p_owner_user_id uuid,
  p_organization_name text,
  p_slug text,
  p_owner_name text,
  p_plan_id uuid,
  p_actor_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org jsonb;
  v_org_id uuid;
  v_plan public.saas_plans%rowtype;
  v_license public.organization_licenses%rowtype;
begin
  select * into v_plan
  from public.saas_plans
  where id = p_plan_id and active = true
  for share;

  if not found then
    raise exception 'plan_not_found';
  end if;

  v_org := public.provision_organization_atomic(
    p_owner_user_id,
    p_organization_name,
    p_slug,
    p_owner_name
  );
  v_org_id := (v_org->>'id')::uuid;

  insert into public.organization_licenses(
    organization_id, plan_id, status, starts_at, expires_at,
    plan_snapshot, created_by, updated_by
  )
  values (
    v_org_id, v_plan.id, 'active', now(),
    now() + make_interval(days => v_plan.duration_days),
    jsonb_build_object(
      'code', v_plan.code,
      'name', v_plan.name,
      'duration_days', v_plan.duration_days,
      'price_cents', v_plan.price_cents
    ),
    p_actor_user_id, p_actor_user_id
  )
  returning * into v_license;

  insert into public.license_events(
    organization_id, actor_user_id, action, new_state, reason
  )
  values (
    v_org_id, p_actor_user_id, 'license.activated',
    to_jsonb(v_license), 'Licença inicial criada com o estacionamento.'
  );

  insert into public.platform_audit_logs(
    actor_user_id, action, entity, entity_id, metadata
  )
  values (
    p_actor_user_id, 'organization.created', 'organization', v_org_id::text,
    jsonb_build_object('organization', v_org, 'license', to_jsonb(v_license))
  );

  return jsonb_build_object('organization', v_org, 'license', to_jsonb(v_license));
end;
$$;

revoke all on function public.provision_organization_with_license_atomic(uuid,text,text,text,uuid,uuid)
  from public, anon, authenticated;
grant execute on function public.provision_organization_with_license_atomic(uuid,text,text,text,uuid,uuid)
  to service_role;

create or replace function public.manage_organization_license_atomic(
  p_organization_id uuid,
  p_action text,
  p_plan_id uuid,
  p_reason text,
  p_actor_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_license public.organization_licenses%rowtype;
  v_previous jsonb;
  v_plan public.saas_plans%rowtype;
  v_base timestamptz;
begin
  select * into v_license
  from public.organization_licenses
  where organization_id = p_organization_id
  for update;

  if not found then
    raise exception 'license_not_found';
  end if;

  v_previous := to_jsonb(v_license);

  if p_action in ('activate', 'renew', 'change_plan') then
    select * into v_plan
    from public.saas_plans
    where id = coalesce(p_plan_id, v_license.plan_id) and active = true
    for share;
    if not found then raise exception 'plan_not_found'; end if;
  end if;

  case p_action
    when 'block' then
      if coalesce(length(trim(p_reason)), 0) < 3 then raise exception 'reason_required'; end if;
      update public.organization_licenses set
        status = 'blocked',
        blocked_at = now(),
        blocked_by = p_actor_user_id,
        block_reason = trim(p_reason),
        updated_by = p_actor_user_id,
        updated_at = now()
      where organization_id = p_organization_id
      returning * into v_license;
    when 'unblock' then
      if v_license.expires_at is null or v_license.expires_at <= now() then
        raise exception 'expired_license_requires_renewal';
      end if;
      update public.organization_licenses set
        status = 'active',
        blocked_at = null,
        blocked_by = null,
        block_reason = null,
        updated_by = p_actor_user_id,
        updated_at = now()
      where organization_id = p_organization_id
      returning * into v_license;
    when 'activate' then
      update public.organization_licenses set
        plan_id = v_plan.id,
        status = 'active',
        starts_at = now(),
        expires_at = now() + make_interval(days => v_plan.duration_days),
        blocked_at = null,
        blocked_by = null,
        block_reason = null,
        plan_snapshot = jsonb_build_object(
          'code', v_plan.code, 'name', v_plan.name,
          'duration_days', v_plan.duration_days, 'price_cents', v_plan.price_cents
        ),
        updated_by = p_actor_user_id,
        updated_at = now()
      where organization_id = p_organization_id
      returning * into v_license;
    when 'renew' then
      v_base := greatest(now(), coalesce(v_license.expires_at, now()));
      update public.organization_licenses set
        plan_id = v_plan.id,
        status = 'active',
        starts_at = coalesce(starts_at, now()),
        expires_at = v_base + make_interval(days => v_plan.duration_days),
        blocked_at = null,
        blocked_by = null,
        block_reason = null,
        plan_snapshot = jsonb_build_object(
          'code', v_plan.code, 'name', v_plan.name,
          'duration_days', v_plan.duration_days, 'price_cents', v_plan.price_cents
        ),
        updated_by = p_actor_user_id,
        updated_at = now()
      where organization_id = p_organization_id
      returning * into v_license;
    when 'change_plan' then
      update public.organization_licenses set
        plan_id = v_plan.id,
        plan_snapshot = jsonb_build_object(
          'code', v_plan.code, 'name', v_plan.name,
          'duration_days', v_plan.duration_days, 'price_cents', v_plan.price_cents
        ),
        updated_by = p_actor_user_id,
        updated_at = now()
      where organization_id = p_organization_id
      returning * into v_license;
    when 'cancel' then
      if coalesce(length(trim(p_reason)), 0) < 3 then raise exception 'reason_required'; end if;
      update public.organization_licenses set
        status = 'cancelled',
        blocked_at = now(),
        blocked_by = p_actor_user_id,
        block_reason = trim(p_reason),
        updated_by = p_actor_user_id,
        updated_at = now()
      where organization_id = p_organization_id
      returning * into v_license;
    else
      raise exception 'invalid_license_action';
  end case;

  insert into public.license_events(
    organization_id, actor_user_id, action, previous_state, new_state, reason
  )
  values (
    p_organization_id, p_actor_user_id, 'license.' || p_action,
    v_previous, to_jsonb(v_license), nullif(trim(p_reason), '')
  );

  insert into public.platform_audit_logs(
    actor_user_id, action, entity, entity_id, metadata
  )
  values (
    p_actor_user_id, 'license.' || p_action, 'organization_license',
    p_organization_id::text,
    jsonb_build_object('previous', v_previous, 'current', to_jsonb(v_license), 'reason', p_reason)
  );

  return to_jsonb(v_license) || jsonb_build_object(
    'effective_status', public.organization_license_status(p_organization_id)
  );
end;
$$;

revoke all on function public.manage_organization_license_atomic(uuid,text,uuid,text,uuid)
  from public, anon, authenticated;
grant execute on function public.manage_organization_license_atomic(uuid,text,uuid,text,uuid)
  to service_role;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'organization_licenses'
     ) then
    alter publication supabase_realtime add table public.organization_licenses;
  end if;
end;
$$;
