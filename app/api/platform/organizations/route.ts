import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePlatformAdmin } from '@/lib/platformAuth';
import { createAdminClient } from '@/lib/supabase/admin';

const schema = z.object({
  organizationName: z.string().min(2).max(120),
  ownerName: z.string().min(2).max(80),
  email: z.string().email(),
  temporaryPassword: z.string().min(8).max(72),
});

function slugify(value: string) {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 45) || 'estacionamento'
  );
}

async function listAuthEmails(admin: ReturnType<typeof createAdminClient>) {
  const emails = new Map<string, string | null>();
  const perPage = 1000;

  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    for (const user of data.users) emails.set(user.id, user.email || null);
    if (data.users.length < perPage) break;
  }

  return emails;
}

export async function GET() {
  const context = await requirePlatformAdmin();
  if (!context) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const admin = createAdminClient();
  const { data: organizations, error } = await admin
    .from('organizations')
    .select(
      'id,name,slug,created_at,organization_licenses(plan_id,status,starts_at,expires_at,blocked_at,block_reason,plan_snapshot)',
    )
    .order('created_at', { ascending: false });

  if (error)
    return NextResponse.json({ error: 'Não foi possível carregar os estacionamentos.' }, { status: 500 });

  const { data: profiles, error: profilesError } = await admin
    .from('profiles')
    .select('id,organization_id,name,role,active,must_change_password,created_at')
    .order('created_at', { ascending: true });

  if (profilesError)
    return NextResponse.json({ error: 'Não foi possível carregar os usuários.' }, { status: 500 });

  let authEmails: Map<string, string | null>;
  try {
    authEmails = await listAuthEmails(admin);
  } catch {
    return NextResponse.json(
      { error: 'Não foi possível carregar os e-mails dos usuários.' },
      { status: 500 },
    );
  }
  const usersWithEmail = (profiles || []).map((profile) => ({
    ...profile,
    email: authEmails.get(profile.id) || null,
  }));

  const rows = (organizations || []).map((organization) => ({
    ...organization,
    profiles: usersWithEmail.filter((profile) => profile.organization_id === organization.id),
  }));

  return NextResponse.json({ organizations: rows });
}

export async function POST(req: NextRequest) {
  const context = await requirePlatformAdmin();
  if (!context)
    return NextResponse.json({ error: 'Sem permissão para cadastrar estacionamentos.' }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Preencha todos os campos. A senha provisória precisa ter pelo menos 8 caracteres.' },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const slug = `${slugify(parsed.data.organizationName)}-${randomUUID().slice(0, 6)}`;

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.temporaryPassword,
    email_confirm: true,
    user_metadata: { name: parsed.data.ownerName },
  });

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: 'Não foi possível criar o usuário proprietário. Verifique se o e-mail já está cadastrado.' },
      { status: 500 },
    );
  }

  const { data: organization, error: provisionError } = await admin.rpc('provision_organization_atomic', {
    p_owner_user_id: authData.user.id,
    p_organization_name: parsed.data.organizationName,
    p_slug: slug,
    p_owner_name: parsed.data.ownerName,
  });

  if (provisionError || !organization) {
    const { error: compensationError } = await admin.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json(
      {
        error: compensationError
          ? 'Falha ao cadastrar e ao desfazer o usuário. Contate o suporte.'
          : 'Não foi possível criar o estacionamento. Nenhum cadastro parcial foi mantido.',
      },
      { status: 500 },
    );
  }

  await admin.from('platform_audit_logs').insert({
    actor_user_id: context.user.id,
    action: 'organization.created',
    entity: 'organization',
    entity_id: organization.id,
    metadata: {
      organization_name: organization.name,
      owner_user_id: authData.user.id,
      owner_email: parsed.data.email,
      license_created: false,
    },
  });

  return NextResponse.json(
    {
      ok: true,
      organization,
      owner: { id: authData.user.id, email: parsed.data.email, mustChangePassword: true },
    },
    { status: 201 },
  );
}
