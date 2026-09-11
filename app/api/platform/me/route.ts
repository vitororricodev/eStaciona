import { NextResponse } from 'next/server';
import { getContext } from '@/lib/authz';
import { isPlatformAdmin } from '@/lib/platformAdmin';

export async function GET() {
  const { user } = await getContext();
  const platformAdmin = isPlatformAdmin(user?.id);

  return NextResponse.json({
    platformAdmin,
    platformRole: platformAdmin ? 'master' : null,
    platformRoleLabel: platformAdmin ? 'Admin Master da Plataforma' : null,
  });
}
