import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePlatformAdmin } from '@/lib/platformAuth';
import { createAdminClient } from '@/lib/supabase/admin';

const schema = z.object({
  name: z.string().trim().min(2).max(120),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  const context = await requirePlatformAdmin();
  if (!context) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Informe um nome válido para o estacionamento.' }, { status: 400 });
  }

  const { organizationId } = await params;
  const admin = createAdminClient();
  const { data: previous } = await admin
    .from('organizations')
    .select('id,name,slug')
    .eq('id', organizationId)
    .maybeSingle();

  if (!previous) return NextResponse.json({ error: 'Estacionamento não encontrado.' }, { status: 404 });

  const { data: organization, error } = await admin
    .from('organizations')
    .update({ name: parsed.data.name })
    .eq('id', organizationId)
    .select('id,name,slug,created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Não foi possível editar o estacionamento.' }, { status: 500 });
  }

  await admin.from('platform_audit_logs').insert({
    actor_user_id: context.user.id,
    action: 'organization.updated',
    entity: 'organization',
    entity_id: organizationId,
    metadata: { previous_name: previous.name, current_name: organization.name },
  });

  return NextResponse.json({ organization });
}
