import { NextResponse } from 'next/server';
import { getContext } from '@/lib/authz';
import { ensureConfiguredPlatformAdmin, isPlatformAdminUser } from '@/lib/platformAdmin';

export async function GET() {
  const { user } = await getContext();
  await ensureConfiguredPlatformAdmin(user?.id);
  const platformAdmin = await isPlatformAdminUser(user?.id);

  return NextResponse.json({
    platformAdmin,
    platformRole: platformAdmin ? 'master' : null,
    platformRoleLabel: platformAdmin ? 'Admin Master da Plataforma' : null,
  });
}
