import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/platformAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { effectiveLicenseStatus } from '@/lib/license';

export async function GET() {
  const context = await requirePlatformAdmin();
  if (!context) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const admin = createAdminClient();
  const [{ data: organizations, error }, { data: plans }] = await Promise.all([
    admin
      .from('organizations')
      .select('id,created_at,organization_licenses(status,expires_at,plan_snapshot)'),
    admin.from('saas_plans').select('id,name,price_cents,active'),
  ]);

  if (error) return NextResponse.json({ error: 'Não foi possível carregar o painel.' }, { status: 500 });

  const stats = {
    total: organizations?.length || 0,
    active: 0,
    blocked: 0,
    expired: 0,
    pending: 0,
    expiringSoon: 0,
    projectedRevenueCents: 0,
  };

  const now = new Date();
  const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  for (const organization of organizations || []) {
    const raw = Array.isArray(organization.organization_licenses)
      ? organization.organization_licenses[0]
      : organization.organization_licenses;
    const status = raw ? effectiveLicenseStatus(raw.status, raw.expires_at, now) : 'pending';
    if (status === 'active') {
      stats.active += 1;
      stats.projectedRevenueCents += Number(raw?.plan_snapshot?.price_cents || 0);
      if (raw?.expires_at && new Date(raw.expires_at) <= soon) stats.expiringSoon += 1;
    } else if (status === 'blocked' || status === 'cancelled') stats.blocked += 1;
    else if (status === 'expired') stats.expired += 1;
    else stats.pending += 1;
  }

  return NextResponse.json({ stats, plans: plans || [] });
}
