import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePlatformAdmin } from '@/lib/platformAuth';
import { createAdminClient } from '@/lib/supabase/admin';

const schema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    email: z.string().trim().email().optional(),
    role: z.enum(['owner', 'manager', 'operator']).optional(),
    active: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0);

async function activeOwnerCount(organizationId: string) {
  const admin = createAdminClient();
  const { count } = await admin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('role', 'owner')
    .eq('active', true);
  return count || 0;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string; userId: string }> },
) {
  const context = await requirePlatformAdmin();
  if (!context) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Dados do usuário inválidos.' }, { status: 400 });

  const { organizationId, userId } = await params;
  const admin = createAdminClient();
  const { data: previous } = await admin
    .from('profiles')
    .select('id,name,role,active,organization_id')
    .eq('id', userId)
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (!previous) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });

  const removesLastOwner =
    previous.role === 'owner' &&
    previous.active &&
    (parsed.data.active === false || (parsed.data.role && parsed.data.role !== 'owner'));
  if (removesLastOwner && (await activeOwnerCount(organizationId)) <= 1) {
    return NextResponse.json(
      { error: 'Cadastre ou promova outro proprietário antes de alterar o último proprietário ativo.' },
      { status: 409 },
    );
  }

  const { data: authData } = await admin.auth.admin.getUserById(userId);
  const previousEmail = authData.user?.email || null;

  if (parsed.data.email && parsed.data.email !== previousEmail) {
    const { error: emailError } = await admin.auth.admin.updateUserById(userId, {
      email: parsed.data.email,
      email_confirm: true,
    });
    if (emailError) {
      return NextResponse.json({ error: 'Não foi possível atualizar o e-mail.' }, { status: 409 });
    }
  }

  const profileInput = {
    ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
    ...(parsed.data.role !== undefined ? { role: parsed.data.role } : {}),
    ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {}),
  };

  let profile = previous;
  if (Object.keys(profileInput).length > 0) {
    const { data, error } = await admin
      .from('profiles')
      .update(profileInput)
      .eq('id', userId)
      .eq('organization_id', organizationId)
      .select('id,name,role,active,organization_id,must_change_password,created_at')
      .single();

    if (error) {
      if (parsed.data.email && previousEmail) {
        await admin.auth.admin.updateUserById(userId, { email: previousEmail, email_confirm: true });
      }
      return NextResponse.json({ error: 'Não foi possível atualizar o usuário.' }, { status: 500 });
    }
    profile = data;
  }

  await admin.from('platform_audit_logs').insert({
    actor_user_id: context.user.id,
    action: 'organization_user.updated',
    entity: 'profile',
    entity_id: userId,
    metadata: {
      organization_id: organizationId,
      previous,
      changes: { ...parsed.data, email_changed: parsed.data.email !== undefined },
    },
  });

  return NextResponse.json({
    user: { ...profile, email: parsed.data.email || previousEmail },
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ organizationId: string; userId: string }> },
) {
  const context = await requirePlatformAdmin();
  if (!context) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const { organizationId, userId } = await params;
  if (userId === context.user.id) {
    return NextResponse.json({ error: 'Você não pode excluir seu próprio usuário Master.' }, { status: 409 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('id,name,role,active,organization_id')
    .eq('id', userId)
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (!profile) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });

  if (profile.role === 'owner' && profile.active && (await activeOwnerCount(organizationId)) <= 1) {
    return NextResponse.json(
      { error: 'O último proprietário ativo do estacionamento não pode ser excluído.' },
      { status: 409 },
    );
  }

  const { data: authData } = await admin.auth.admin.getUserById(userId);
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return NextResponse.json({ error: 'Não foi possível excluir o usuário.' }, { status: 500 });

  await admin.from('platform_audit_logs').insert({
    actor_user_id: context.user.id,
    action: 'organization_user.deleted',
    entity: 'profile',
    entity_id: userId,
    metadata: {
      organization_id: organizationId,
      name: profile.name,
      email: authData.user?.email || null,
      role: profile.role,
    },
  });

  return NextResponse.json({ ok: true });
}
