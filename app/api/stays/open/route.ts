import { NextResponse } from 'next/server';
import { getContext } from '@/lib/authz';
import { stayTotals } from '@/lib/stayTotals';

export async function GET() {
  const { supabase, profile } = await getContext();
  if (!profile) return NextResponse.json({ error: 'Perfil não configurado' }, { status: 403 });

  const { data, error } = await supabase
    .from('stays')
    .select(
      'id,public_token,started_at,status,paid_at,paid_amount,payment_grace_until,has_parking_tag,is_monthly,tariff_snapshot,vehicles(id,plate,make,model,color,customers(id,name,phone)),tariff_plans(*),stay_services(id,service_name,unit_price,quantity)',
    )
    .eq('organization_id', profile.organization_id)
    .eq('status', 'open')
    .order('started_at', { ascending: true })
    .limit(200);

  if (error) return NextResponse.json({ error: 'Não foi possível carregar o pátio.' }, { status: 500 });

  const rows = (data || [])
    .filter((stay: any) => stay.vehicles)
    .map((stay: any) => {
      const totals = stayTotals(stay);
      return { ...stay, tariff_plans: totals.tariff, ...totals };
    });

  return NextResponse.json({ stays: rows });
}
