import { NextResponse } from 'next/server';
import { getContext } from '@/lib/authz';

export async function GET() {
  const { supabase, profile } = await getContext();
  if (!profile) return NextResponse.json({ error: 'Perfil não configurado' }, { status: 403 });

  const org = profile.organization_id;
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const [openRes, entriesRes, finishedRes, paymentsRes] = await Promise.all([
    supabase
      .from('stays')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org)
      .eq('status', 'open'),
    supabase
      .from('stays')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org)
      .gte('started_at', start.toISOString()),
    supabase
      .from('stays')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org)
      .eq('status', 'finished')
      .gte('ended_at', start.toISOString()),
    supabase
      .from('payments')
      .select('amount,method')
      .eq('organization_id', org)
      .eq('status', 'paid')
      .gte('paid_at', start.toISOString()),
  ]);

  const error = openRes.error || entriesRes.error || finishedRes.error || paymentsRes.error;
  if (error) return NextResponse.json({ error: 'Não foi possível carregar o dashboard.' }, { status: 500 });

  const revenue = (paymentsRes.data || []).reduce(
    (sum: number, payment: any) => sum + Number(payment.amount),
    0,
  );
  const finished = finishedRes.count || 0;

  return NextResponse.json({
    open: openRes.count || 0,
    entries: entriesRes.count || 0,
    exits: finished,
    revenue,
    ticketAverage: finished ? revenue / finished : 0,
  });
}
