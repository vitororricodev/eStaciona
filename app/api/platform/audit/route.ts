import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/platformAuth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const context = await requirePlatformAdmin();
  if (!context) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('platform_audit_logs')
    .select('id,actor_user_id,action,entity,entity_id,metadata,created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: 'Não foi possível carregar a auditoria.' }, { status: 500 });
  return NextResponse.json({ events: data || [] });
}
