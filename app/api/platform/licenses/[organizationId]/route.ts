import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePlatformAdmin } from '@/lib/platformAuth';
import { createAdminClient } from '@/lib/supabase/admin';

const schema = z.object({
  action: z.enum(['activate', 'renew', 'block', 'unblock', 'change_plan', 'cancel']),
  planId: z.string().uuid().nullable().optional(),
  reason: z.string().trim().max(500).optional().default(''),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ organizationId: string }> }) {
  const context = await requirePlatformAdmin();
  if (!context) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'Ação de licença inválida.' }, { status: 400 });

  const { organizationId } = await params;
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('manage_organization_license_atomic', {
    p_organization_id: organizationId,
    p_action: parsed.data.action,
    p_plan_id: parsed.data.planId || null,
    p_reason: parsed.data.reason,
    p_actor_user_id: context.user.id,
  });

  if (error) {
    const message = error.message || '';
    if (message.includes('reason_required'))
      return NextResponse.json({ error: 'Informe o motivo do bloqueio ou cancelamento.' }, { status: 400 });
    if (message.includes('expired_license_requires_renewal'))
      return NextResponse.json(
        { error: 'A licença expirou. Use Renovar para liberar o acesso.' },
        { status: 409 },
      );
    return NextResponse.json({ error: 'Não foi possível alterar a licença.' }, { status: 500 });
  }

  return NextResponse.json({ license: data });
}
