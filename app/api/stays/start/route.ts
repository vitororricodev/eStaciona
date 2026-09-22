import { NextRequest, NextResponse } from 'next/server';
import { getContext } from '@/lib/authz';
import { z } from 'zod';
import { isValidBrazilianPlate, normalizePlate } from '@/lib/plate';

const schema = z.object({
  plate: z.string().min(6).max(8),
  name: z.string().trim().optional().default(''),
  phone: z.string().trim().optional().default(''),
  make: z.string().trim().optional().default(''),
  model: z.string().trim().optional().default(''),
  color: z.string().trim().optional().default(''),
  tariffPlanId: z.string().uuid().optional().nullable(),
  hasParkingTag: z.boolean().optional().default(false),
  isMonthly: z.boolean().optional().default(false),
});

function localParts(timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value || '';
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
    weekday: weekdayMap[get('weekday')] ?? new Date().getDay(),
  };
}

function isApplicable(tariff: Record<string, any>, parts: ReturnType<typeof localParts>) {
  if (!tariff.active) return false;
  if (
    Array.isArray(tariff.valid_weekdays) &&
    tariff.valid_weekdays.length &&
    !tariff.valid_weekdays.includes(parts.weekday)
  )
    return false;
  if (tariff.valid_from && parts.date < tariff.valid_from) return false;
  if (tariff.valid_until && parts.date > tariff.valid_until) return false;
  if (tariff.starts_at_time && tariff.ends_at_time) {
    const start = String(tariff.starts_at_time).slice(0, 5);
    const end = String(tariff.ends_at_time).slice(0, 5);
    if (start <= end && (parts.time < start || parts.time > end)) return false;
    if (start > end && parts.time > end && parts.time < start) return false;
  }
  return true;
}

function domainError(message: string) {
  if (message.includes('stay_already_open')) return ['Este veículo já está no pátio.', 409] as const;
  if (message.includes('tariff_unavailable'))
    return ['Tarifa selecionada não está disponível.', 400] as const;
  if (message.includes('customer_required'))
    return ['Para um veículo novo, informe nome e WhatsApp do cliente.', 400] as const;
  if (message.includes('invalid_plate'))
    return ['Placa inválida. Use o padrão ABC1234 ou ABC1D23.', 400] as const;
  if (message.includes('not_authorized')) return ['Sem permissão.', 403] as const;
  return ['Não foi possível registrar a entrada.', 500] as const;
}

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
  const input = { ...parsed.data, plate: normalizePlate(parsed.data.plate) };
  if (!isValidBrazilianPlate(input.plate))
    return NextResponse.json({ error: 'Placa inválida. Use o padrão ABC1234 ou ABC1D23.' }, { status: 400 });

  const { supabase, profile } = await getContext();
  if (!profile) return NextResponse.json({ error: 'Perfil inativo ou não configurado' }, { status: 403 });

  let tariff: Record<string, any> | null = null;
  const automaticTariff = !input.tariffPlanId;
  if (input.tariffPlanId) {
    const result = await supabase
      .from('tariff_plans')
      .select('*')
      .eq('id', input.tariffPlanId)
      .eq('organization_id', profile.organization_id)
      .eq('active', true)
      .maybeSingle();
    tariff = result.data;
  } else {
    const [{ data: organization }, { data: tariffs }] = await Promise.all([
      supabase.from('organizations').select('timezone').eq('id', profile.organization_id).single(),
      supabase
        .from('tariff_plans')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('active', true)
        .order('priority', { ascending: false })
        .order('is_default', { ascending: false }),
    ]);
    const parts = localParts(organization?.timezone || 'America/Sao_Paulo');
    tariff =
      (tariffs || []).find((item) => isApplicable(item, parts)) ||
      (tariffs || []).find((item) => item.is_default) ||
      null;
  }
  if (!tariff)
    return NextResponse.json({ error: 'Cadastre uma tarifa ativa antes de iniciar.' }, { status: 400 });

  const { data: result, error } = await supabase.rpc('start_stay_atomic', {
    p_plate: input.plate,
    p_name: input.name,
    p_phone: input.phone,
    p_make: input.make,
    p_model: input.model,
    p_color: input.color,
    p_tariff_plan_id: tariff.id,
    p_has_parking_tag: input.hasParkingTag,
    p_is_monthly: input.isMonthly,
    p_automatic_tariff: automaticTariff,
  });
  if (error) {
    const [message, status] = domainError(error.message || '');
    return NextResponse.json({ error: message }, { status });
  }

  const stayId = (result as { stay_id: string }).stay_id;
  const { data: stay, error: readError } = await supabase
    .from('stays')
    .select('*,vehicles(*,customers(*)),tariff_plans(*)')
    .eq('id', stayId)
    .eq('organization_id', profile.organization_id)
    .single();
  if (readError || !stay)
    return NextResponse.json(
      { error: 'Entrada registrada, mas não foi possível recarregá-la.' },
      { status: 500 },
    );

  return NextResponse.json({
    stay,
    recurring: Boolean((result as { recurring: boolean }).recurring),
    tariff: stay.tariff_snapshot || tariff,
    automaticTariff,
  });
}
