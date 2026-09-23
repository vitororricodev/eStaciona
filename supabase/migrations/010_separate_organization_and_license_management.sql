-- eStaciona 1.1.0 — separa o cadastro da organização da ativação comercial.
-- Uma organização pode existir sem licença; a primeira ativação cria a licença atomicamente.

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
  if not exists (
    select 1 from public.organizations where id = p_organization_id
  ) then
    raise exception 'organization_not_found';
  end if;

  select * into v_license
  from public.organization_licenses
  where organization_id = p_organization_id
  for update;

  if not found then
    if p_action <> 'activate' then
      raise exception 'license_not_found';
    end if;

    select * into v_plan
    from public.saas_plans
    where id = p_plan_id and active = true
    for share;

    if not found then
      raise exception 'plan_not_found';
    end if;

    v_previous := null;

    insert into public.organization_licenses(
      organization_id, plan_id, status, starts_at, expires_at,
      blocked_at, blocked_by, block_reason, plan_snapshot,
      created_by, updated_by, created_at, updated_at
    ) values (
      p_organization_id, v_plan.id, 'active', now(),
      now() + make_interval(days => v_plan.duration_days),
      null, null, null,
      jsonb_build_object(
        'code', v_plan.code,
        'name', v_plan.name,
        'duration_days', v_plan.duration_days,
        'price_cents', v_plan.price_cents
      ),
      p_actor_user_id, p_actor_user_id, now(), now()
    )
    returning * into v_license;
  else
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
  end if;

  insert into public.license_events(
    organization_id, actor_user_id, action, previous_state, new_state, reason
  ) values (
    p_organization_id, p_actor_user_id, 'license.' || p_action,
    v_previous, to_jsonb(v_license), nullif(trim(p_reason), '')
  );

  insert into public.platform_audit_logs(
    actor_user_id, action, entity, entity_id, metadata
  ) values (
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
