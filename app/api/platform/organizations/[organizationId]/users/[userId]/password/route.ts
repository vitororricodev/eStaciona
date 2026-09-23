import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePlatformAdmin } from '@/lib/platformAuth';
import { createAdminClient } from '@/lib/supabase/admin';

const schema = z.object({
  password: z.string().min(8).max(72),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string; userId: string }> },
) {
  const context = await requirePlatformAdmin();
  if (!context) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'A senha provisória deve ter entre 8 e 72 caracteres.' },
      { status: 400 },
    );
  }

  const { organizationId, userId } = await params;
  const admin = createAdminClient();
  const { data: target } = await admin
    .from('profiles')
    .select('id,name,role,must_change_password')
    .eq('id', userId)
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (!target) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });

  const { error: profileError } = await admin
    .from('profiles')
    .update({ must_change_password: true })
    .eq('id', userId)
    .eq('organization_id', organizationId);

  if (profileError) {
    return NextResponse.json({ error: 'Não foi possível preparar a troca obrigatória.' }, { status: 500 });
  }

  const { error: authError } = await admin.auth.admin.updateUserById(userId, {
    password: parsed.data.password,
    email_confirm: true,
  });

  if (authError) {
    await admin
      .from('profiles')
      .update({ must_change_password: target.must_change_password })
      .eq('id', userId)
      .eq('organization_id', organizationId);
    return NextResponse.json({ error: 'Não foi possível redefinir a senha.' }, { status: 500 });
  }

  await admin.from('platform_audit_logs').insert({
    actor_user_id: context.user.id,
    action: 'organization_user.password_reset',
    entity: 'profile',
    entity_id: userId,
    metadata: {
      organization_id: organizationId,
      target_name: target.name,
      target_role: target.role,
      force_change: true,
    },
  });

  return NextResponse.json({
    ok: true,
    mustChangePassword: true,
    message: 'Senha provisória definida. O usuário deverá criar uma nova senha no próximo acesso.',
  });
}
