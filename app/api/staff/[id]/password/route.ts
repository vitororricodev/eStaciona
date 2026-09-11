import { NextRequest, NextResponse } from 'next/server';
import { getContext, canManage } from '@/lib/authz';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const schema = z.object({
  password: z.string().min(8).max(72),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const parsed = schema.safeParse(await req.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'A senha provisória precisa ter entre 8 e 72 caracteres.' },
      { status: 400 },
    );
  }

  const { supabase, user, profile } = await getContext();

  if (!user || !profile || !canManage(profile.role)) {
    return NextResponse.json(
      { error: 'Apenas proprietários e gerentes podem redefinir senhas da equipe.' },
      { status: 403 },
    );
  }

  if (id === user.id) {
    return NextResponse.json(
      { error: 'Para alterar sua própria senha, use a opção de alteração de senha da conta.' },
      { status: 409 },
    );
  }

  const { data: target, error: targetError } = await supabase
    .from('profiles')
    .select('id,name,role,organization_id')
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .maybeSingle();

  if (targetError) {
    return NextResponse.json({ error: targetError.message }, { status: 500 });
  }

  if (!target) {
    return NextResponse.json({ error: 'Usuário não encontrado nesta empresa.' }, { status: 404 });
  }

  if (target.role === 'owner') {
    return NextResponse.json(
      { error: 'A senha do proprietário não pode ser redefinida pela tela de equipe.' },
      { status: 403 },
    );
  }

  if (profile.role === 'manager' && target.role !== 'operator') {
    return NextResponse.json(
      { error: 'Gerentes só podem redefinir a senha de operadores.' },
      { status: 403 },
    );
  }

  const admin = createAdminClient();

  const { error: authError } = await admin.auth.admin.updateUserById(id, {
    password: parsed.data.password,
    email_confirm: true,
  });

  if (authError) {
    return NextResponse.json(
      { error: authError.message || 'Não foi possível redefinir a senha.' },
      { status: 500 },
    );
  }

  const { error: profileError } = await admin
    .from('profiles')
    .update({ must_change_password: true })
    .eq('id', id)
    .eq('organization_id', profile.organization_id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  await admin.from('audit_logs').insert({
    organization_id: profile.organization_id,
    actor_user_id: user.id,
    action: 'staff.password_reset',
    entity: 'profile',
    entity_id: id,
    metadata: { target_name: target.name, target_role: target.role, force_change: true },
  });

  return NextResponse.json({
    ok: true,
    mustChangePassword: true,
    message: 'Senha provisória definida. O usuário deverá criar uma nova senha no próximo acesso.',
  });
}
