-- eStaciona 1.0.12 — hardening multi-tenant, rate limit persistente e provisionamento.

create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select organization_id from public.profiles
  where id = auth.uid() and active = true
  limit 1;
$$;

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select role from public.profiles
  where id = auth.uid() and active = true
  limit 1;
$$;

create or replace function public.can_manage_current_org()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce(public.current_user_role() in ('owner', 'manager'), false);
$$;

revoke all on function public.current_org_id() from public;
revoke all on function public.current_user_role() from public;
revoke all on function public.can_manage_current_org() from public;
grant execute on function public.current_org_id() to authenticated, service_role;
grant execute on function public.current_user_role() to authenticated, service_role;
grant execute on function public.can_manage_current_org() to authenticated, service_role;

-- Remove políticas amplas anteriores e substitui por regras explícitas por operação.
drop policy if exists "org members read org" on public.organizations;
drop policy if exists "org members read profiles" on public.profiles;
drop policy if exists "managers update profiles" on public.profiles;
drop policy if exists "org data customers" on public.customers;
drop policy if exists "org data vehicles" on public.vehicles;
drop policy if exists "org data tariffs" on public.tariff_plans;
drop policy if exists "org data stays" on public.stays;
drop policy if exists "org data payments" on public.payments;
drop policy if exists "org data services" on public.services;
drop policy if exists "org read audits" on public.audit_logs;
drop policy if exists "org insert audits" on public.audit_logs;
drop policy if exists "org data stay services" on public.stay_services;
drop policy if exists "org data cash sessions" on public.cash_sessions;
drop policy if exists "org data cash movements" on public.cash_movements;
drop policy if exists "org read integration events" on public.integration_events;

create policy "active member reads organization" on public.organizations
for select using (id = public.current_org_id());

create policy "active members read profiles" on public.profiles
for select using (organization_id = public.current_org_id());
create policy "owner updates profiles" on public.profiles
for update using (organization_id = public.current_org_id() and public.current_user_role() = 'owner')
with check (organization_id = public.current_org_id());

create policy "active members read customers" on public.customers
for select using (organization_id = public.current_org_id());
create policy "active members read vehicles" on public.vehicles
for select using (organization_id = public.current_org_id());

create policy "active members read tariffs" on public.tariff_plans
for select using (organization_id = public.current_org_id());
create policy "managers insert tariffs" on public.tariff_plans
for insert with check (organization_id = public.current_org_id() and public.can_manage_current_org());
create policy "managers update tariffs" on public.tariff_plans
for update using (organization_id = public.current_org_id() and public.can_manage_current_org())
with check (organization_id = public.current_org_id() and public.can_manage_current_org());

create policy "active members read stays" on public.stays
for select using (organization_id = public.current_org_id());
create policy "managers update stays" on public.stays
for update using (organization_id = public.current_org_id() and public.can_manage_current_org())
with check (organization_id = public.current_org_id() and public.can_manage_current_org());

create policy "active members read payments" on public.payments
for select using (organization_id = public.current_org_id());

create policy "active members read services" on public.services
for select using (organization_id = public.current_org_id());
create policy "managers insert services" on public.services
for insert with check (organization_id = public.current_org_id() and public.can_manage_current_org());
create policy "managers update services" on public.services
for update using (organization_id = public.current_org_id() and public.can_manage_current_org())
with check (organization_id = public.current_org_id() and public.can_manage_current_org());

create policy "managers read audits" on public.audit_logs
for select using (organization_id = public.current_org_id() and public.can_manage_current_org());
create policy "members insert own audits" on public.audit_logs
for insert with check (
  organization_id = public.current_org_id()
  and actor_user_id = auth.uid()
  and public.current_org_id() is not null
);

create policy "active members read stay services" on public.stay_services
for select using (organization_id = public.current_org_id());
create policy "active members insert stay services" on public.stay_services
for insert with check (
  organization_id = public.current_org_id() and created_by = auth.uid()
  and exists (
    select 1 from public.stays s
    where s.id = stay_id and s.organization_id = public.current_org_id() and s.status = 'open'
  )
);
create policy "active members delete stay services" on public.stay_services
for delete using (
  organization_id = public.current_org_id()
  and exists (
    select 1 from public.stays s
    where s.id = stay_id and s.organization_id = public.current_org_id() and s.status = 'open'
  )
);

create policy "users read own cash sessions" on public.cash_sessions
for select using (organization_id = public.current_org_id() and user_id = auth.uid());
create policy "users open own cash sessions" on public.cash_sessions
for insert with check (organization_id = public.current_org_id() and user_id = auth.uid());

create policy "users read own cash movements" on public.cash_movements
for select using (
  organization_id = public.current_org_id()
  and exists (select 1 from public.cash_sessions cs where cs.id = cash_session_id and cs.user_id = auth.uid())
);
create policy "users create authorized cash movements" on public.cash_movements
for insert with check (
  organization_id = public.current_org_id() and created_by = auth.uid()
  and exists (
    select 1 from public.cash_sessions cs
    where cs.id = cash_session_id and cs.organization_id = public.current_org_id()
      and cs.user_id = auth.uid() and cs.status = 'open'
  )
  and (type = 'supply' or (type = 'withdrawal' and public.can_manage_current_org()))
);

create policy "managers read integration events" on public.integration_events
for select using (organization_id = public.current_org_id() and public.can_manage_current_org());

-- O endpoint altera a senha no Auth primeiro; somente o service role pode concluir flag + auditoria.
create or replace function public.complete_password_change(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_profile public.profiles%rowtype;
begin
  select * into v_profile from public.profiles where id = p_user_id for update;
  if not found or not v_profile.active then raise exception 'profile_not_active'; end if;
  if not v_profile.must_change_password then raise exception 'password_change_not_required'; end if;

  update public.profiles set must_change_password = false where id = p_user_id;
  insert into public.audit_logs(organization_id, actor_user_id, action, entity, entity_id, metadata)
  values (v_profile.organization_id, p_user_id, 'account.password_changed', 'profile', p_user_id::text, '{}'::jsonb);
  return true;
end;
$$;
revoke all on function public.complete_password_change(uuid) from public, anon, authenticated;
grant execute on function public.complete_password_change(uuid) to service_role;

-- Provisionamento dos registros PostgreSQL em uma única transação; Auth é compensado pela API em caso de falha.
create or replace function public.provision_organization_atomic(
  p_owner_user_id uuid,
  p_organization_name text,
  p_slug text,
  p_owner_name text
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_org public.organizations%rowtype;
begin
  if p_owner_user_id is null or length(trim(p_organization_name)) < 2
     or length(trim(p_owner_name)) < 2 or length(trim(p_slug)) < 2 then
    raise exception 'invalid_provisioning_data';
  end if;

  insert into public.organizations(name, slug)
  values (trim(p_organization_name), trim(p_slug)) returning * into v_org;

  insert into public.profiles(id, organization_id, name, role, active, must_change_password)
  values (p_owner_user_id, v_org.id, trim(p_owner_name), 'owner', true, true);

  insert into public.tariff_plans(
    organization_id, name, tolerance_minutes, first_hour_price,
    additional_hour_price, fraction_minutes, additional_fraction_price,
    daily_max, is_default, active
  ) values (v_org.id, 'Padrão', 10, 10, 7, 30, 3.50, 45, true, true);

  return jsonb_build_object('id', v_org.id, 'name', v_org.name, 'slug', v_org.slug);
end;
$$;
revoke all on function public.provision_organization_atomic(uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.provision_organization_atomic(uuid,text,text,text) to service_role;

create table if not exists public.api_rate_limits (
  route text not null,
  key_hash text not null check (key_hash ~ '^[a-f0-9]{64}$'),
  window_start timestamptz not null,
  hits integer not null default 1 check (hits > 0),
  primary key (route, key_hash, window_start)
);
alter table public.api_rate_limits enable row level security;

create or replace function public.consume_rate_limit(
  p_route text,
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_window timestamptz;
  v_hits integer;
  v_retry integer;
begin
  if p_route not in ('public_lookup', 'public_stay', 'health')
     or p_key_hash !~ '^[a-f0-9]{64}$'
     or p_limit < 1 or p_limit > 10000
     or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'invalid_rate_limit';
  end if;

  v_window := to_timestamp(floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds);
  insert into public.api_rate_limits(route, key_hash, window_start, hits)
  values (p_route, p_key_hash, v_window, 1)
  on conflict (route, key_hash, window_start)
  do update set hits = public.api_rate_limits.hits + 1
  returning hits into v_hits;

  v_retry := greatest(1, ceil(extract(epoch from (v_window + make_interval(secs => p_window_seconds) - v_now)))::integer);
  return jsonb_build_object(
    'allowed', v_hits <= p_limit,
    'remaining', greatest(0, p_limit - v_hits),
    'retry_after', v_retry
  );
end;
$$;
revoke all on function public.consume_rate_limit(text,text,integer,integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text,text,integer,integer) to service_role;
