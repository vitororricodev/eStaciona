import { createClient } from '@/lib/supabase/server';
import { hasPermission, type Permission, type UserRole } from '@/lib/permissions';

export type AuthProfile = {
  id: string;
  organization_id: string;
  name: string;
  role: UserRole;
  active: boolean;
  must_change_password: boolean;
};

export async function getContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null };
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, organization_id, name, role, active, must_change_password')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile?.active) return { supabase, user, profile: null };
  return { supabase, user, profile: profile as AuthProfile };
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
