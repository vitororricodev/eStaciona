import { NextRequest, NextResponse } from 'next/server';
import { getContext, canManage } from '@/lib/authz';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

export async function GET() {
  const { supabase, profile } = await getContext();
  if (!profile || !canManage(profile.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id,name,role,active,created_at')
    .eq('organization_id', profile.organization_id)
    .order('name');

  return error
    ? NextResponse.json({ error: error.message }, { status: 500 })
    : NextResponse.json({ staff: data || [], viewerRole: profile.role });
}

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  name: z.string().min(2).max(80),
  role: z.enum(['manager', 'operator']).default('operator'),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Preencha nome, e-mail e uma senha com pelo menos 8 caracteres.' }, { status: 400 });
  }

  const { profile, user } = await getContext();
  if (!profile || !canManage(profile.role)) {
    return NextResponse.json({ error: 'Apenas gestores podem cadastrar funcionários.' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { name: parsed.data.name },
  });

  if (error || !data.user) {
    return NextResponse.json({ error: error?.message || 'Falha ao criar usuário.' }, { status: 500 });
  }

  const { error: profileError } = await admin.from('profiles').insert({
    id: data.user.id,
    organization_id: profile.organization_id,
    name: parsed.data.name,
    role: parsed.data.role,
    active: true,
    must_change_password: false,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  await admin.from('audit_logs').insert({
    organization_id: profile.organization_id,
    actor_user_id: user?.id,
    action: 'staff.created',
    entity: 'profile',
    entity_id: data.user.id,
    metadata: { name: parsed.data.name, role: parsed.data.role, email: parsed.data.email },
  });

  return NextResponse.json({ ok: true, userId: data.user.id }, { status: 201 });
}
