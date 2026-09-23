import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePlatformAdmin } from '@/lib/platformAuth';
import { createAdminClient } from '@/lib/supabase/admin';

const createSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9_-]+$/),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(240).nullable().optional(),
  durationDays: z.coerce.number().int().min(1).max(3650),
  priceCents: z.coerce.number().int().min(0).max(999999999),
});

export async function GET() {
  const context = await requirePlatformAdmin();
  if (!context) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const admin = createAdminClient();
  const { data, error } = await admin.from('saas_plans').select('*').order('duration_days');
  if (error) return NextResponse.json({ error: 'Não foi possível carregar os planos.' }, { status: 500 });
  return NextResponse.json({ plans: data || [] });
}

export async function POST(req: NextRequest) {
  const context = await requirePlatformAdmin();
  if (!context) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'Dados do plano inválidos.' }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('saas_plans')
    .insert({
      code: parsed.data.code,
      name: parsed.data.name,
      description: parsed.data.description || null,
      duration_days: parsed.data.durationDays,
      price_cents: parsed.data.priceCents,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Não foi possível criar o plano.' }, { status: 409 });

  await admin.from('platform_audit_logs').insert({
    actor_user_id: context.user.id,
    action: 'plan.created',
    entity: 'saas_plan',
    entity_id: data.id,
    metadata: data,
  });

  return NextResponse.json({ plan: data }, { status: 201 });
}
