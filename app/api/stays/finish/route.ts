import { NextRequest, NextResponse } from 'next/server';
import { getContext } from '@/lib/authz';
import { stayTotals } from '@/lib/stayTotals';
import { z } from 'zod';

const schema = z.object({
  stayId: z.string().uuid(),
  paymentMethod: z.enum(['pix', 'card', 'cash', 'other']),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });

  const { supabase, user, profile } = await getContext();
  if (!user || !profile) return NextResponse.json({ error: 'Sem sessão' }, { status: 401 });

  const { data: stay, error } = await supabase
    .from('stays')
    .select('*,tariff_plans(*),stay_services(id,service_name,unit_price,quantity)')
    .eq('id', parsed.data.stayId)
    .eq('organization_id', profile.organization_id)
    .single();

  if (error || !stay) return NextResponse.json({ error: 'Permanência não encontrada' }, { status: 404 });
  if (stay.status !== 'open')
    return NextResponse.json({ error: 'Permanência já finalizada' }, { status: 409 });

  const totals = stayTotals(stay);

  const { data: cashSession } = await supabase
    .from('cash_sessions')
    .select('id')
    .eq('organization_id', profile.organization_id)
    .eq('user_id', user.id)
    .eq('status', 'open')
    .maybeSingle();

  if (parsed.data.paymentMethod === 'cash' && !cashSession) {
    return NextResponse.json(
      { error: 'Abra o caixa antes de receber pagamento em dinheiro.' },
      { status: 409 },
    );
  }

  const metadata = {
    amount: totals.amount,
    parkingAmount: totals.parkingAmount,
    servicesAmount: totals.servicesAmount,
    paymentMethod: parsed.data.paymentMethod,
    totalMinutes: totals.totalMinutes,
  };

  const { data: result, error: finishError } = await supabase.rpc('finish_stay_atomic', {
    p_stay_id: stay.id,
    p_amount: totals.amount,
    p_method: parsed.data.paymentMethod,
    p_cash_session_id: cashSession?.id || null,
    p_metadata: metadata,
  });

  if (finishError) {
    const message = finishError.message || '';
    if (message.includes('stay_not_open'))
      return NextResponse.json({ error: 'Permanência já finalizada' }, { status: 409 });
    if (message.includes('cash_session_required'))
      return NextResponse.json(
        { error: 'Abra o caixa antes de receber pagamento em dinheiro.' },
        { status: 409 },
      );
    return NextResponse.json({ error: 'Não foi possível finalizar a permanência.' }, { status: 500 });
  }

  const serverAmount = Number((result as { amount?: number } | null)?.amount ?? totals.amount);
  return NextResponse.json({ ok: true, result, ...totals, amount: serverAmount });
}
