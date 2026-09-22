import { NextRequest, NextResponse } from 'next/server';
import { getContext, canManage } from '@/lib/authz';
import { z } from 'zod';
const schema = z.object({
  type: z.enum(['supply', 'withdrawal']),
  amount: z.coerce.number().positive().max(999999),
  description: z.string().trim().min(3).max(200),
});
export async function POST(req: NextRequest) {
  const p = schema.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
  const { supabase, user, profile } = await getContext();
  if (!profile || !user) return NextResponse.json({ error: 'Sem sessão' }, { status: 401 });
  if (p.data.type === 'withdrawal' && !canManage(profile.role))
    return NextResponse.json({ error: 'Sangria exige gerente ou proprietário.' }, { status: 403 });
  const { data: session } = await supabase
    .from('cash_sessions')
    .select('id')
    .eq('user_id', user.id)
    .eq('organization_id', profile.organization_id)
    .eq('status', 'open')
    .single();
  if (!session) return NextResponse.json({ error: 'Abra o caixa primeiro.' }, { status: 409 });
  const { data, error } = await supabase
    .from('cash_movements')
    .insert({
      organization_id: profile.organization_id,
      cash_session_id: session.id,
      ...p.data,
      created_by: user.id,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: 'Não foi possível registrar o movimento.' }, { status: 500 });
  await supabase.from('audit_logs').insert({
    organization_id: profile.organization_id,
    actor_user_id: user.id,
    action: `cash.${p.data.type}`,
    entity: 'cash_session',
    entity_id: session.id,
    metadata: { amount: p.data.amount, description: p.data.description },
  });
  return NextResponse.json({ movement: data }, { status: 201 });
}
