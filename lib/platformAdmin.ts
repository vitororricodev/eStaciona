function configuredPlatformAdminIds() {
  const multiple = process.env.PLATFORM_ADMIN_USER_IDS
    ?.split(',')
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
