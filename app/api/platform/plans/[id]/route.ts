import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePlatformAdmin } from '@/lib/platformAuth';
import { createAdminClient } from '@/lib/supabase/admin';

const schema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(240).nullable().optional(),
  durationDays: z.coerce.number().int().min(1).max(3650).optional(),
  priceCents: z.coerce.number().int().min(0).max(999999999).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = await requirePlatformAdmin();
  if (!context) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'Dados do plano inválidos.' }, { status: 400 });

  const input = {
    ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
    ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
    ...(parsed.data.durationDays !== undefined ? { duration_days: parsed.data.durationDays } : {}),
    ...(parsed.data.priceCents !== undefined ? { price_cents: parsed.data.priceCents } : {}),
    ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {}),
    updated_at: new Date().toISOString(),
  };

  const admin = createAdminClient();
  const { data, error } = await admin.from('saas_plans').update(input).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: 'Não foi possível atualizar o plano.' }, { status: 500 });

  await admin.from('platform_audit_logs').insert({
    actor_user_id: context.user.id,
    action: 'plan.updated',
    entity: 'saas_plan',
    entity_id: id,
    metadata: { fields: Object.keys(parsed.data), plan: data },
  });

  return NextResponse.json({ plan: data });
}
