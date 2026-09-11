import { createClient } from '@/lib/supabase/server';

export async function getContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null };
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, organization_id, name, role, active, must_change_password')
    .eq('id', user.id)
    .maybeSingle();
  return { supabase, user, profile };
}

export function canManage(role?: string | null) { return role === 'owner' || role === 'manager'; }
export function isOwner(role?: string | null) { return role === 'owner'; }
