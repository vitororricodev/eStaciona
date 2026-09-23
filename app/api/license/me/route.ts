import { NextResponse } from 'next/server';
import { getSessionContext } from '@/lib/authz';
import { isPlatformAdminUser } from '@/lib/platformAdmin';
import { licenseError } from '@/lib/license';

export async function GET() {
  const context = await getSessionContext();
  if (!context.user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  if (await isPlatformAdminUser(context.user.id)) {
    return NextResponse.json({ exempt: true, active: true, status: 'active' });
  }

  if (!context.profile || !context.license)
    return NextResponse.json({ error: 'Perfil não configurado.' }, { status: 403 });

  const detail = licenseError(context.license.status);
  return NextResponse.json({
    exempt: false,
    ...context.license,
    error: detail.error || null,
    code: detail.code,
  });
}
