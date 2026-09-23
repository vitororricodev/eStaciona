import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stayTotals } from '@/lib/stayTotals';
import { tariffSummary } from '@/domain/pricing';
import { enforceRateLimit } from '@/lib/rateLimit';
import { getOrganizationLicense } from '@/lib/license';

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    const limited = await enforceRateLimit(request, { route: 'public_stay', limit: 60, windowSeconds: 60 }, token);
    if (limited) return limited;
  } catch {
    return NextResponse.json({ error: 'Consulta temporariamente indisponível.' }, { status: 503 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.from('stays')
    .select('organization_id,public_token,started_at,ended_at,status,final_amount,paid_at,paid_amount,payment_grace_until,tariff_snapshot,vehicles(plate,make,model,color,customers(name)),tariff_plans(*),stay_services(service_name,unit_price,quantity)')
    .eq('public_token', token).single();
  if (error || !data) return NextResponse.json({ error: 'Permanência não encontrada' }, { status: 404 });

  const license = await getOrganizationLicense(supabase, data.organization_id);
  if (!license.active)
    return NextResponse.json({ error: 'Portal temporariamente indisponível.' }, { status: 403 });

  const totals = data.status === 'open' ? stayTotals(data) : {
    totalMinutes: Math.max(0, Math.ceil((new Date(data.ended_at || data.started_at).getTime() - new Date(data.started_at).getTime()) / 60000)),
    parkingAmount: Number(data.final_amount || 0), servicesAmount: 0,
    amount: Number(data.final_amount || 0),
    tariff: data.tariff_snapshot || (Array.isArray(data.tariff_plans) ? data.tariff_plans[0] : data.tariff_plans),
  };
  return NextResponse.json({ stay: { ...data, tariff_plans: totals.tariff }, ...totals, tariffSummary: totals.tariff ? tariffSummary(totals.tariff) : '' });
}
