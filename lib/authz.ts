import { createClient } from '@/lib/supabase/server';
import { hasPermission, type Permission, type UserRole } from '@/lib/permissions';
import { getOrganizationLicense, type LicenseAccess } from '@/lib/license';

export type AuthProfile = {
  id: string;
  organization_id: string;
  name: string;
  role: UserRole;
  active: boolean;
  must_change_password: boolean;
};

export async function getSessionContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null, license: null };
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, organization_id, name, role, active, must_change_password')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile?.active) return { supabase, user, profile: null, license: null };

  const typedProfile = profile as AuthProfile;
  let license: LicenseAccess;
  try {
    license = await getOrganizationLicense(supabase, typedProfile.organization_id);
  } catch {
    license = {
      organizationId: typedProfile.organization_id,
      status: 'pending',
      active: false,
      startsAt: null,
      expiresAt: null,
      blockedAt: null,
      blockReason: null,
      plan: null,
    };
  }

  return { supabase, user, profile: typedProfile, license };
}

export async function getContext() {
  const context = await getSessionContext();
  if (context.profile && context.license && !context.license.active) {
    return { ...context, profile: null };
  }
  return context;
}

export function can(role: string | null | undefined, permission: Permission) {
  return hasPermission(role, permission);
}

export function canManage(role?: string | null) {
  return hasPermission(role, 'manage:organization');
}
export function isOwner(role?: string | null) {
  return role === 'owner';
}
