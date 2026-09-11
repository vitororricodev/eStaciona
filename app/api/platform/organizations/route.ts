import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getContext } from '@/lib/authz';
import { isPlatformAdmin } from '@/lib/platformAdmin';
import { createAdminClient } from '@/lib/supabase/admin';

const schema = z.object({
  organizationName: z.string().min(2).max(120),
  ownerName: z.string().min(2).max(80),
  email: z.string().email(),
  temporaryPassword: z.string().min(8).max(72),
});

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 45) || 'estacionamento';
}

async function requirePlatformAdmin() {
  const context = await getContext();
  if (!context.user || !isPlatformAdmin(context.user.id)) return null;
  return context;
}

export async function GET() {
  const context = await requirePlatformAdmin();
  if (!context) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const admin = createAdminClient();
  const { data: organizations, error } = await admin
    .from('organizations')
    .select('id,name,slug,created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: owners, error: ownersError } = await admin
    .from('profiles')
    .select('organization_id,name,role,active')
    .eq('role', 'owner');

  if (ownersError) return NextResponse.json({ error: ownersError.message }, { status: 500 });

  const rows = (organizations || []).map((organization) => ({
    ...organization,
    profiles: (owners || []).filter((owner) => owner.organization_id === organization.id),
  }));

  return NextResponse.json({ organizations: rows });
}

export async function POST(req: NextRequest) {
  const context = await requirePlatformAdmin();
  if (!context) return NextResponse.json({ error: 'Sem permissão para cadastrar estacionamentos.' }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Preencha todos os campos. A senha provisória precisa ter pelo menos 8 caracteres.' }, { status: 400 });
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
    return NextResponse.json({ error: authError?.message || 'Não foi possível criar o usuário proprietário.' }, { status: 500 });
  }

  const { data: organization, error: orgError } = await admin
    .from('organizations')
    .insert({ name: parsed.data.organizationName, slug })
    .select('id,name,slug')
    .single();

  if (orgError || !organization) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: orgError?.message || 'Não foi possível criar o estacionamento.' }, { status: 500 });
  }

  const { error: profileError } = await admin.from('profiles').insert({
    id: authData.user.id,
    organization_id: organization.id,
    name: parsed.data.ownerName,
    role: 'owner',
    active: true,
    must_change_password: true,
  });

  if (profileError) {
    await admin.from('organizations').delete().eq('id', organization.id);
    await admin.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const { error: tariffError } = await admin.from('tariff_plans').insert({
    organization_id: organization.id,
    name: 'Padrão',
    tolerance_minutes: 10,
    first_hour_price: 10,
    additional_hour_price: 7,
    fraction_minutes: 30,
    daily_max: 45,
    is_default: true,
    active: true,
  });

  if (tariffError) {
    await admin.from('organizations').delete().eq('id', organization.id);
    await admin.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: tariffError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    organization,
    owner: { id: authData.user.id, email: parsed.data.email, mustChangePassword: true },
  }, { status: 201 });
}
