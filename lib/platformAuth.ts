import { getSessionContext } from '@/lib/authz';
import { ensureConfiguredPlatformAdmin, isPlatformAdminUser } from '@/lib/platformAdmin';

export async function requirePlatformAdmin() {
  const context = await getSessionContext();
  if (!context.user) return null;

  await ensureConfiguredPlatformAdmin(context.user.id);
  if (!(await isPlatformAdminUser(context.user.id))) return null;

  return context;
}
