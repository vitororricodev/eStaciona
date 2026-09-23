import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePlatformAdmin } from '@/lib/platformAuth';
import { createAdminClient } from '@/lib/supabase/admin';

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  temporaryPassword: z.string().min(8).max(72),
  role: z.enum(['owner', 'manager', 'operator']),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  const context = await requirePlatformAdmin();
  if (!context) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const { organizationId } = await params;
  const admin = createAdminClient();
  const { data: profiles, error } = await admin
    .from('profiles')
    .select('id,name,role,active,must_change_password,created_at')
    .eq('organization_id', organizationId)
    .order('created_at');

  if (error) return NextResponse.json({ error: 'Não foi possível carregar os usuários.' }, { status: 500 });

  const users = await Promise.all(
    (profiles || []).map(async (profile) => {
      const { data } = await admin.auth.admin.getUserById(profile.id);
      return { ...profile, email: data.user?.email || null };
    }),
  );

  return NextResponse.json({ users });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  const context = await requirePlatformAdmin();
  if (!context) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Preencha nome, e-mail, papel e uma senha provisória de pelo menos 8 caracteres.' },
      { status: 400 },
    );
  }

  const { organizationId } = await params;
  const admin = createAdminClient();
  const { data: organization } = await admin
    .from('organizations')
    .select('id,name')
    .eq('id', organizationId)
    .maybeSingle();

  if (!organization) return NextResponse.json({ error: 'Estacionamento não encontrado.' }, { status: 404 });

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.temporaryPassword,
    email_confirm: true,
    user_metadata: { name: parsed.data.name },
  });

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: 'Não foi possível criar o usuário. Verifique se o e-mail já está cadastrado.' },
      { status: 409 },
    );
  }

  const { error: profileError } = await admin.from('profiles').insert({
    id: authData.user.id,
    organization_id: organizationId,
    name: parsed.data.name,
    role: parsed.data.role,
    active: true,
    must_change_password: true,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json(
      { error: 'Não foi possível vincular o usuário ao estacionamento.' },
      { status: 500 },
    );
  }

  await admin.from('platform_audit_logs').insert({
    actor_user_id: context.user.id,
    action: 'organization_user.created',
    entity: 'profile',
    entity_id: authData.user.id,
    metadata: {
      organization_id: organizationId,
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
    },
  });

  return NextResponse.json(
    {
      user: {
        id: authData.user.id,
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role,
        active: true,
        must_change_password: true,
      },
    },
    { status: 201 },
  );
}
