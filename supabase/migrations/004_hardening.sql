-- eStaciona 1.0.4 — hardening de RLS e auditoria

-- Operações autenticadas da própria organização precisam registrar auditoria.
drop policy if exists "org insert audits" on public.audit_logs;
create policy "org insert audits" on public.audit_logs
for insert
with check (
  organization_id = public.current_org_id()
  and actor_user_id = auth.uid()
);

-- Índices auxiliares para consultas frequentes do MVP.
create index if not exists profiles_org_active_idx on public.profiles(organization_id, active, role);
create index if not exists payments_cash_session_idx on public.payments(cash_session_id) where cash_session_id is not null;
create index if not exists stays_public_token_idx on public.stays(public_token);

-- Finalização e pagamento devem ocorrer na mesma transação.
create or replace function public.finish_stay_atomic(
  p_stay_id uuid,
  p_amount numeric,
  p_method public.payment_method,
  p_cash_session_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid := public.current_org_id();
  v_user uuid := auth.uid();
  v_stay public.stays%rowtype;
  v_payment_id uuid;
  v_ended_at timestamptz := now();
begin
  if v_org is null or v_user is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_stay
  from public.stays
  where id = p_stay_id and organization_id = v_org
  for update;

  if not found then
    raise exception 'stay_not_found';
  end if;

  if v_stay.status <> 'open' then
    raise exception 'stay_not_open';
  end if;

  if p_amount < 0 then
    raise exception 'invalid_amount';
  end if;

  if p_method = 'cash' then
    if p_cash_session_id is null or not exists (
      select 1 from public.cash_sessions
      where id = p_cash_session_id
        and organization_id = v_org
        and user_id = v_user
        and status = 'open'
    ) then
      raise exception 'cash_session_required';
    end if;
  end if;

  update public.stays
  set status = 'finished',
      ended_at = v_ended_at,
      final_amount = p_amount,
      paid_at = v_ended_at,
      paid_amount = p_amount
  where id = p_stay_id;

  insert into public.payments(
    organization_id, stay_id, amount, method, status, paid_at,
    cashier_user_id, cash_session_id, source, metadata
  ) values (
    v_org, p_stay_id, p_amount, p_method, 'paid', v_ended_at,
    v_user, p_cash_session_id, 'counter', coalesce(p_metadata, '{}'::jsonb)
  ) returning id into v_payment_id;

  insert into public.audit_logs(
    organization_id, actor_user_id, action, entity, entity_id, metadata
  ) values (
    v_org, v_user, 'stay.finished', 'stay', p_stay_id::text, coalesce(p_metadata, '{}'::jsonb)
  );

  return jsonb_build_object(
    'ok', true,
    'payment_id', v_payment_id,
    'ended_at', v_ended_at
  );
end;
$$;

revoke all on function public.finish_stay_atomic(uuid,numeric,public.payment_method,uuid,jsonb) from public;
grant execute on function public.finish_stay_atomic(uuid,numeric,public.payment_method,uuid,jsonb) to authenticated;
