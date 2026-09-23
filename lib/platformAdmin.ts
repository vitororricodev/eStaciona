import { createAdminClient } from '@/lib/supabase/admin';

function configuredPlatformAdminIds() {
  const multiple = process.env.PLATFORM_ADMIN_USER_IDS?.split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (multiple && multiple.length > 0) return multiple;

  const legacySingle = process.env.PLATFORM_ADMIN_USER_ID?.trim();
  return legacySingle ? [legacySingle] : [];
}

export function isPlatformAdmin(userId?: string | null) {
  if (!userId) return false;
  return configuredPlatformAdminIds().includes(userId);
}

export async function isPlatformAdminUser(userId?: string | null) {
  if (!userId) return false;
  if (isPlatformAdmin(userId)) return true;

  const admin = createAdminClient();
  const { data } = await admin
    .from('platform_users')
    .select('user_id')
    .eq('user_id', userId)
    .eq('role', 'master')
    .eq('active', true)
    .maybeSingle();

  return Boolean(data);
}

export async function ensureConfiguredPlatformAdmin(userId?: string | null) {
  if (!userId || !isPlatformAdmin(userId)) return;

  const admin = createAdminClient();
  await admin.from('platform_users').upsert(
    {
      user_id: userId,
      role: 'master',
      active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
}
