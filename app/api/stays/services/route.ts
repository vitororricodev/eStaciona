import { NextRequest, NextResponse } from 'next/server';
import { getContext } from '@/lib/authz';
import { z } from 'zod';
const schema = z.object({
  stayId: z.string().uuid(),
  serviceId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
});
export async function POST(req: NextRequest) {
  const p = schema.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
  const { supabase, user, profile } = await getContext();
  if (!profile) return NextResponse.json({ error: 'Perfil inválido' }, { status: 403 });
  const [{ data: stay }, { data: service }] = await Promise.all([
    supabase
      .from('stays')
      .select('id,status')
      .eq('id', p.data.stayId)
      .eq('organization_id', profile.organization_id)
      .single(),
    supabase
      .from('services')
      .select('*')
      .eq('id', p.data.serviceId)
      .eq('organization_id', profile.organization_id)
      .eq('active', true)
      .single(),
  ]);
  if (!stay || stay.status !== 'open')
    return NextResponse.json({ error: 'Permanência não está aberta' }, { status: 409 });
  if (!service) return NextResponse.json({ error: 'Serviço inválido' }, { status: 404 });
  const { data, error } = await supabase
    .from('stay_services')
    .insert({
      organization_id: profile.organization_id,
      stay_id: stay.id,
      service_id: service.id,
      service_name: service.name,
      unit_price: service.price,
      quantity: p.data.quantity,
      created_by: user?.id,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: 'Não foi possível adicionar o serviço.' }, { status: 500 });
  await supabase.from('audit_logs').insert({
    organization_id: profile.organization_id,
    actor_user_id: user?.id,
    action: 'stay.service_added',
    entity: 'stay',
    entity_id: stay.id,
    metadata: { serviceId: service.id, serviceName: service.name, quantity: p.data.quantity },
  });
  return NextResponse.json({ line: data }, { status: 201 });
}
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
  const { supabase, user, profile } = await getContext();
  if (!profile) return NextResponse.json({ error: 'Perfil inválido' }, { status: 403 });
  const { data: line } = await supabase
    .from('stay_services')
    .select('id,stay_id')
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .single();
  if (!line) return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 });
  const { error } = await supabase
    .from('stay_services')
    .delete()
    .eq('id', id)
    .eq('organization_id', profile.organization_id);
  if (error) return NextResponse.json({ error: 'Não foi possível remover o serviço.' }, { status: 500 });
  await supabase.from('audit_logs').insert({
    organization_id: profile.organization_id,
    actor_user_id: user?.id,
    action: 'stay.service_removed',
    entity: 'stay',
    entity_id: line.stay_id,
    metadata: { lineId: id },
  });
  return NextResponse.json({ ok: true });
}
