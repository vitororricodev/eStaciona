import type { SupabaseClient } from '@supabase/supabase-js';

export type LicenseStatus = 'pending' | 'active' | 'blocked' | 'expired' | 'cancelled';

export type LicenseAccess = {
  organizationId: string;
  status: LicenseStatus;
  active: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  blockedAt: string | null;
  blockReason: string | null;
  plan: {
    id: string;
    code: string;
    name: string;
    durationDays: number;
    priceCents: number;
  } | null;
};

type LicenseRow = {
  organization_id: string;
  status: 'pending' | 'active' | 'blocked' | 'cancelled';
  starts_at: string | null;
  expires_at: string | null;
  blocked_at: string | null;
  block_reason: string | null;
  plan_id: string;
  plan_snapshot: Record<string, unknown> | null;
};

export function effectiveLicenseStatus(
  status: LicenseRow['status'],
  expiresAt: string | null,
  now = new Date(),
): LicenseStatus {
  if (status !== 'active') return status;
  if (!expiresAt || new Date(expiresAt).getTime() <= now.getTime()) return 'expired';
  return 'active';
}

export async function getOrganizationLicense(
  client: SupabaseClient,
  organizationId: string,
): Promise<LicenseAccess> {
  const { data, error } = await client
    .from('organization_licenses')
    .select('organization_id,status,starts_at,expires_at,blocked_at,block_reason,plan_id,plan_snapshot')
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    return {
      organizationId,
      status: 'pending',
      active: false,
      startsAt: null,
      expiresAt: null,
      blockedAt: null,
      blockReason: null,
      plan: null,
    };
  }

  const row = data as LicenseRow;
  const status = effectiveLicenseStatus(row.status, row.expires_at);
  const snapshot = row.plan_snapshot || {};

  return {
    organizationId,
    status,
    active: status === 'active',
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    blockedAt: row.blocked_at,
    blockReason: row.block_reason,
    plan: {
      id: row.plan_id,
      code: String(snapshot.code || ''),
      name: String(snapshot.name || 'Plano'),
      durationDays: Number(snapshot.duration_days || 0),
      priceCents: Number(snapshot.price_cents || 0),
    },
  };
}

export function licenseError(status: LicenseStatus) {
  const messages: Record<Exclude<LicenseStatus, 'active'>, string> = {
    pending: 'A licença deste estacionamento ainda não foi liberada.',
    blocked: 'O acesso deste estacionamento foi bloqueado pelo administrador da plataforma.',
    expired: 'A licença deste estacionamento expirou.',
    cancelled: 'A licença deste estacionamento foi cancelada.',
  };

  return {
    error: status === 'active' ? '' : messages[status],
    code: status === 'active' ? null : `LICENSE_${status.toUpperCase()}`,
  };
}
