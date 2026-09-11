import { NextRequest, NextResponse } from 'next/server';
import { getContext } from '@/lib/authz';
import { z } from 'zod';

const schema = z.object({
  plate: z.string().min(6).max(8),
  name: z.string().trim().optional().default(''),
  phone: z.string().trim().optional().default(''),
  make: z.string().trim().optional(), model: z.string().trim().optional(), color: z.string().trim().optional(),
  tariffPlanId: z.string().uuid().optional().nullable(),
});

function localParts(timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
  const get = (type: string) => parts.find(p => p.type === type)?.value || '';
  const weekdayMap: Record<string, number> = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}`, weekday: weekdayMap[get('weekday')] ?? new Date().getDay() };
}

function applicable(t: any, parts: ReturnType<typeof localParts>) {
  if (!t.active) return false;
  if (Array.isArray(t.valid_weekdays) && t.valid_weekdays.length && !t.valid_weekdays.includes(parts.weekday)) return false;
  if (t.valid_from && parts.date < t.valid_from) return false;
  if (t.valid_until && parts.date > t.valid_until) return false;
  if (t.starts_at_time && t.ends_at_time) {
    const start = String(t.starts_at_time).slice(0,5), end = String(t.ends_at_time).slice(0,5);
    if (start <= end) { if (parts.time < start || parts.time > end) return false; }
    else { if (parts.time > end && parts.time < start) return false; }
  }
  return true;
}

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
  const input = { ...parsed.data, plate: parsed.data.plate.replace(/[^A-Z0-9]/gi, '').toUpperCase() };
  const { supabase, user, profile } = await getContext();
  if (!profile) return NextResponse.json({ error: 'Perfil não configurado' }, { status: 403 });
  const org = profile.organization_id;

  let wasRecurring = true;
  let { data: vehicle } = await supabase.from('vehicles').select('*, customers(*)').eq('organization_id', org).eq('plate', input.plate).maybeSingle();
  let customer: any = vehicle ? (Array.isArray(vehicle.customers) ? vehicle.customers[0] : vehicle.customers) : null;

  if (!vehicle) {
    wasRecurring = false;
    if (input.name.length < 2 || input.phone.replace(/\D/g, '').length < 8) return NextResponse.json({ error: 'Para um veículo novo, informe nome e WhatsApp do cliente.' }, { status: 400 });
    const cleanPhone = input.phone.replace(/\D/g, '');
    const existingCustomer = await supabase.from('customers').select('*').eq('organization_id', org).eq('phone', cleanPhone).maybeSingle();
    customer = existingCustomer.data;
    if (!customer) {
      const res = await supabase.from('customers').insert({ organization_id: org, name: input.name, phone: cleanPhone }).select().single();
      if (res.error) return NextResponse.json({ error: res.error.message }, { status: 500 });
      customer = res.data;
    }
    const res = await supabase.from('vehicles').insert({ organization_id: org, customer_id: customer.id, plate: input.plate, make: input.make || null, model: input.model || null, color: input.color || null }).select('*, customers(*)').single();
    if (res.error) return NextResponse.json({ error: res.error.message }, { status: 500 });
    vehicle = res.data;
  }

  const open = await supabase.from('stays').select('id').eq('organization_id', org).eq('vehicle_id', vehicle.id).eq('status', 'open').maybeSingle();
  if (open.data) return NextResponse.json({ error: 'Este veículo já está no pátio.' }, { status: 409 });

  let tariff: any = null;
  let automaticTariff = false;
  if (input.tariffPlanId) {
    const res = await supabase.from('tariff_plans').select('*').eq('id', input.tariffPlanId).eq('organization_id', org).eq('active', true).maybeSingle();
    tariff = res.data;
    if (!tariff) return NextResponse.json({ error: 'Tarifa selecionada não está disponível.' }, { status: 400 });
  } else {
    const [{ data: organization }, { data: tariffs }] = await Promise.all([
      supabase.from('organizations').select('timezone').eq('id', org).single(),
      supabase.from('tariff_plans').select('*').eq('organization_id', org).eq('active', true).order('priority', { ascending: false }).order('is_default', { ascending: false }),
    ]);
    const parts = localParts(organization?.timezone || 'America/Sao_Paulo');
    tariff = (tariffs || []).find(t => applicable(t, parts)) || (tariffs || []).find(t => t.is_default) || null;
    automaticTariff = true;
  }
  if (!tariff) return NextResponse.json({ error: 'Cadastre uma tarifa ativa antes de iniciar.' }, { status: 400 });

  const { data: stay, error } = await supabase.from('stays').insert({ organization_id: org, vehicle_id: vehicle.id, tariff_plan_id: tariff.id, status: 'open' }).select('*, vehicles(*, customers(*)), tariff_plans(*)').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await supabase.from('audit_logs').insert({ organization_id: org, actor_user_id: user?.id || null, action: 'stay.started', entity: 'stay', entity_id: stay.id, metadata: { plate: input.plate, tariffPlanId: tariff.id, tariffName: tariff.name, automaticTariff } });
  return NextResponse.json({ stay, recurring: wasRecurring, tariff, automaticTariff });
}
