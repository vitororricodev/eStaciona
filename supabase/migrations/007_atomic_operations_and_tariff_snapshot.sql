-- eStaciona 1.0.12 — snapshot de tarifa e operações financeiras/entrada atômicas.

alter table public.stays
  add column if not exists tariff_snapshot jsonb;

alter table public.stays drop constraint if exists stays_tariff_snapshot_shape_check;
alter table public.stays add constraint stays_tariff_snapshot_shape_check check (
  tariff_snapshot is null or (
    tariff_snapshot ?& array[
      'id','name','category','tolerance_minutes','first_period_minutes',
      'first_hour_price','additional_hour_price','fraction_minutes',
      'additional_fraction_price','daily_max','captured_at','pricing_version'
    ]
    and jsonb_typeof(tariff_snapshot->'pricing_version') = 'number'
  )
);

create or replace function public.protect_tariff_snapshot()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if old.tariff_snapshot is not null
     and new.tariff_snapshot is distinct from old.tariff_snapshot then
    raise exception 'tariff_snapshot_immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists stays_tariff_snapshot_immutable on public.stays;
create trigger stays_tariff_snapshot_immutable
before update of tariff_snapshot on public.stays
for each row execute function public.protect_tariff_snapshot();

create or replace function public.calculate_tariff_amount(
  p_started_at timestamptz,
  p_ended_at timestamptz,
  p_tariff jsonb
) returns numeric
language plpgsql
immutable
set search_path = pg_catalog, public
as $$
declare
  v_minutes integer := greatest(0, ceil(extract(epoch from (p_ended_at - p_started_at)) / 60.0)::integer);
  v_tolerance integer := greatest(0, coalesce((p_tariff->>'tolerance_minutes')::integer, 0));
  v_first_period integer := greatest(1, coalesce((p_tariff->>'first_period_minutes')::integer, 60));
  v_fraction integer := greatest(1, coalesce((p_tariff->>'fraction_minutes')::integer, 60));
  v_first_price numeric := greatest(0, coalesce((p_tariff->>'first_hour_price')::numeric, 0));
  v_fraction_price numeric := greatest(0, coalesce(
    (p_tariff->>'additional_fraction_price')::numeric,
    coalesce((p_tariff->>'additional_hour_price')::numeric, 0) * v_fraction / 60.0
  ));
  v_daily_max numeric := nullif(p_tariff->>'daily_max', '')::numeric;
  v_remaining integer;
  v_cycle integer;
  v_cycle_amount numeric;
  v_amount numeric := 0;
begin
  if v_minutes <= v_tolerance then return 0; end if;
  v_remaining := v_minutes;
  while v_remaining > 0 loop
    v_cycle := least(v_remaining, 1440);
    v_cycle_amount := v_first_price;
    if v_cycle > v_first_period then
      v_cycle_amount := v_cycle_amount + ceil((v_cycle - v_first_period)::numeric / v_fraction) * v_fraction_price;
    end if;
    if v_daily_max is not null then v_cycle_amount := least(v_cycle_amount, v_daily_max); end if;
    v_amount := v_amount + v_cycle_amount;
    v_remaining := v_remaining - v_cycle;
  end loop;
  return round(v_amount, 2);
end;
$$;

create or replace function public.start_stay_atomic(
  p_plate text,
  p_name text,
  p_phone text,
  p_make text,
  p_model text,
  p_color text,
  p_tariff_plan_id uuid,
  p_has_parking_tag boolean default false,
  p_is_monthly boolean default false,
  p_automatic_tariff boolean default false
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_org uuid := public.current_org_id();
  v_user uuid := auth.uid();
  v_plate text := upper(regexp_replace(coalesce(p_plate, ''), '[^A-Za-z0-9]', '', 'g'));
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  v_customer public.customers%rowtype;
  v_vehicle public.vehicles%rowtype;
  v_tariff public.tariff_plans%rowtype;
  v_stay public.stays%rowtype;
  v_snapshot jsonb;
  v_recurring boolean := true;
begin
  if v_user is null or v_org is null or not exists (
    select 1 from public.profiles
    where id = v_user and organization_id = v_org and active = true
  ) then raise exception 'not_authorized'; end if;

  if v_plate !~ '^[A-Z]{3}([0-9]{4}|[0-9][A-Z][0-9]{2})$' then
    raise exception 'invalid_plate';
  end if;

  select * into v_vehicle from public.vehicles
  where organization_id = v_org and plate = v_plate
  for update;

  if not found then
    v_recurring := false;
    if length(trim(coalesce(p_name, ''))) < 2 or length(v_phone) < 8 then
      raise exception 'customer_required';
    end if;

    insert into public.customers(organization_id, name, phone)
    values (v_org, trim(p_name), v_phone)
    on conflict (organization_id, phone) do update set name = public.customers.name
    returning * into v_customer;

    insert into public.vehicles(organization_id, customer_id, plate, make, model, color)
    values (v_org, v_customer.id, v_plate, nullif(trim(p_make), ''), nullif(trim(p_model), ''), nullif(trim(p_color), ''))
    on conflict (organization_id, plate) do nothing;

    select * into v_vehicle from public.vehicles
    where organization_id = v_org and plate = v_plate
    for update;
  end if;

  if exists (
    select 1 from public.stays
    where organization_id = v_org and vehicle_id = v_vehicle.id and status = 'open'
  ) then raise exception 'stay_already_open'; end if;

  select * into v_tariff from public.tariff_plans
  where id = p_tariff_plan_id and organization_id = v_org and active = true
  for share;
  if not found then raise exception 'tariff_unavailable'; end if;

  v_snapshot := jsonb_build_object(
    'id', v_tariff.id,
    'name', v_tariff.name,
    'description', v_tariff.description,
    'category', v_tariff.category,
    'tolerance_minutes', v_tariff.tolerance_minutes,
    'first_period_minutes', v_tariff.first_period_minutes,
    'first_hour_price', v_tariff.first_hour_price,
    'additional_hour_price', v_tariff.additional_hour_price,
    'fraction_minutes', v_tariff.fraction_minutes,
    'additional_fraction_price', coalesce(
      v_tariff.additional_fraction_price,
      round(v_tariff.additional_hour_price * v_tariff.fraction_minutes / 60.0, 2)
    ),
    'daily_max', v_tariff.daily_max,
    'valid_weekdays', v_tariff.valid_weekdays,
    'valid_from', v_tariff.valid_from,
    'valid_until', v_tariff.valid_until,
    'starts_at_time', v_tariff.starts_at_time,
    'ends_at_time', v_tariff.ends_at_time,
    'priority', v_tariff.priority,
    'captured_at', now(),
    'pricing_version', 1
  );

  insert into public.stays(
    organization_id, vehicle_id, tariff_plan_id, tariff_snapshot,
    status, has_parking_tag, is_monthly
  ) values (
    v_org, v_vehicle.id, v_tariff.id, v_snapshot,
    'open', coalesce(p_has_parking_tag, false), coalesce(p_is_monthly, false)
  ) returning * into v_stay;

  insert into public.audit_logs(organization_id, actor_user_id, action, entity, entity_id, metadata)
  values (
    v_org, v_user, 'stay.started', 'stay', v_stay.id::text,
    jsonb_build_object(
      'tariffPlanId', v_tariff.id,
      'tariffName', v_tariff.name,
      'automaticTariff', coalesce(p_automatic_tariff, false),
      'hasParkingTag', coalesce(p_has_parking_tag, false),
      'isMonthly', coalesce(p_is_monthly, false)
    )
  );

  return jsonb_build_object(
    'stay_id', v_stay.id,
    'recurring', v_recurring,
    'tariff_snapshot', v_snapshot
  );
end;
$$;

revoke all on function public.start_stay_atomic(text,text,text,text,text,text,uuid,boolean,boolean,boolean) from public;
grant execute on function public.start_stay_atomic(text,text,text,text,text,text,uuid,boolean,boolean,boolean) to authenticated;

create or replace function public.finish_stay_atomic(
  p_stay_id uuid,
  p_amount numeric,
  p_method public.payment_method,
  p_cash_session_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_org uuid := public.current_org_id();
  v_user uuid := auth.uid();
  v_stay public.stays%rowtype;
  v_tariff public.tariff_plans%rowtype;
  v_snapshot jsonb;
  v_payment_id uuid;
  v_ended_at timestamptz := now();
  v_parking numeric;
  v_services numeric;
  v_amount numeric;
begin
  if v_org is null or v_user is null then raise exception 'not_authenticated'; end if;

  select * into v_stay from public.stays
  where id = p_stay_id and organization_id = v_org for update;
  if not found then raise exception 'stay_not_found'; end if;
  if v_stay.status <> 'open' then raise exception 'stay_not_open'; end if;

  v_snapshot := v_stay.tariff_snapshot;
  if v_snapshot is null then
    select * into v_tariff from public.tariff_plans
    where id = v_stay.tariff_plan_id and organization_id = v_org;
    if not found then raise exception 'tariff_unavailable'; end if;
    v_snapshot := jsonb_build_object(
      'id', v_tariff.id, 'name', v_tariff.name, 'description', v_tariff.description,
      'category', v_tariff.category, 'tolerance_minutes', v_tariff.tolerance_minutes,
      'first_period_minutes', v_tariff.first_period_minutes, 'first_hour_price', v_tariff.first_hour_price,
      'additional_hour_price', v_tariff.additional_hour_price, 'fraction_minutes', v_tariff.fraction_minutes,
      'additional_fraction_price', coalesce(v_tariff.additional_fraction_price, round(v_tariff.additional_hour_price * v_tariff.fraction_minutes / 60.0, 2)),
      'daily_max', v_tariff.daily_max, 'captured_at', v_stay.started_at, 'pricing_version', 1
    );
  end if;

  v_parking := public.calculate_tariff_amount(v_stay.started_at, v_ended_at, v_snapshot);
  select coalesce(sum(unit_price * quantity), 0) into v_services
  from public.stay_services where stay_id = v_stay.id and organization_id = v_org;
  v_amount := round(v_parking + v_services, 2);

  if p_method = 'cash' then
    if p_cash_session_id is null then raise exception 'cash_session_required'; end if;
    perform 1 from public.cash_sessions
    where id = p_cash_session_id and organization_id = v_org
      and user_id = v_user and status = 'open' for update;
    if not found then raise exception 'cash_session_required'; end if;
  end if;

  update public.stays set
    status = 'finished', ended_at = v_ended_at, final_amount = v_amount,
    paid_at = v_ended_at, paid_amount = v_amount,
    tariff_snapshot = coalesce(v_stay.tariff_snapshot, v_snapshot)
  where id = p_stay_id;

  insert into public.payments(
    organization_id, stay_id, amount, method, status, paid_at,
    cashier_user_id, cash_session_id, source, metadata
  ) values (
    v_org, p_stay_id, v_amount, p_method, 'paid', v_ended_at,
    v_user, p_cash_session_id, 'counter',
    coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object('serverCalculated', true, 'parkingAmount', v_parking, 'servicesAmount', v_services)
  ) returning id into v_payment_id;

  insert into public.audit_logs(organization_id, actor_user_id, action, entity, entity_id, metadata)
  values (
    v_org, v_user, 'stay.finished', 'stay', p_stay_id::text,
    jsonb_build_object('amount', v_amount, 'parkingAmount', v_parking, 'servicesAmount', v_services, 'paymentMethod', p_method)
  );

  return jsonb_build_object('ok', true, 'payment_id', v_payment_id, 'ended_at', v_ended_at, 'amount', v_amount);
end;
$$;

revoke all on function public.finish_stay_atomic(uuid,numeric,public.payment_method,uuid,jsonb) from public;
grant execute on function public.finish_stay_atomic(uuid,numeric,public.payment_method,uuid,jsonb) to authenticated;

create or replace function public.close_cash_session_atomic(
  p_closing_amount numeric,
  p_notes text default null
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_org uuid := public.current_org_id();
  v_user uuid := auth.uid();
  v_session public.cash_sessions%rowtype;
  v_cash numeric;
  v_supply numeric;
  v_withdrawal numeric;
  v_expected numeric;
  v_difference numeric;
begin
  if v_org is null or v_user is null or p_closing_amount < 0 then raise exception 'invalid_close'; end if;

  select * into v_session from public.cash_sessions
  where organization_id = v_org and user_id = v_user and status = 'open'
  for update;
  if not found then raise exception 'cash_session_not_open'; end if;

  select coalesce(sum(amount), 0) into v_cash from public.payments
  where organization_id = v_org and cash_session_id = v_session.id and status = 'paid' and method = 'cash';
  select
    coalesce(sum(amount) filter (where type = 'supply'), 0),
    coalesce(sum(amount) filter (where type = 'withdrawal'), 0)
  into v_supply, v_withdrawal
  from public.cash_movements where organization_id = v_org and cash_session_id = v_session.id;

  v_expected := round(v_session.opening_amount + v_cash + v_supply - v_withdrawal, 2);
  v_difference := round(p_closing_amount - v_expected, 2);

  update public.cash_sessions set
    status = 'closed', closed_at = now(), closing_amount = p_closing_amount,
    expected_cash = v_expected, difference = v_difference, notes = nullif(trim(p_notes), '')
  where id = v_session.id;

  insert into public.audit_logs(organization_id, actor_user_id, action, entity, entity_id, metadata)
  values (v_org, v_user, 'cash.closed', 'cash_session', v_session.id::text,
    jsonb_build_object('expected', v_expected, 'closing', p_closing_amount, 'difference', v_difference));

  return jsonb_build_object(
    'id', v_session.id, 'status', 'closed', 'expected_cash', v_expected,
    'closing_amount', p_closing_amount, 'difference', v_difference
  );
end;
$$;

revoke all on function public.close_cash_session_atomic(numeric,text) from public;
grant execute on function public.close_cash_session_atomic(numeric,text) to authenticated;
