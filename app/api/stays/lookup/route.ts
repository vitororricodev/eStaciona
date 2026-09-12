import { NextRequest, NextResponse } from 'next/server';
import { getContext } from '@/lib/authz';
import { stayTotals } from '@/lib/stayTotals';

export async function GET(req: NextRequest) {
  const plate = (req.nextUrl.searchParams.get('plate') || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const token = (req.nextUrl.searchParams.get('token') || '').trim();
  if (!plate && !token) return NextResponse.json({ error: 'Informe a placa ou QR Code' }, { status: 400 });

  const { supabase, profile } = await getContext();
  if (!profile) return NextResponse.json({ error: 'Perfil não configurado' }, { status: 403 });

  let query = supabase
    .from('stays')
    .select('id,public_token,started_at,status,paid_at,paid_amount,payment_grace_until,has_parking_tag,is_monthly,vehicles!inner(id,plate,make,model,color,customers(id,name,phone)),tariff_plans(*),stay_services(id,service_name,unit_price,quantity)')
    .eq('organization_id', profile.organization_id)
    .eq('status', 'open');

  query = token ? query.eq('public_token', token) : query.eq('vehicles.plate', plate);
  const { data, error } = await query.limit(1).maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ found: false });

  const totals = stayTotals(data);
  return NextResponse.json({ found: true, stay: { ...data, tariff_plans: totals.tariff }, ...totals });
}
