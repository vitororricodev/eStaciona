import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function migration(name: string) {
  return readFileSync(resolve(process.cwd(), 'supabase/migrations', name), 'utf8');
}

describe('security migration contracts', () => {
  it('mantém entrada e fechamento em funções transacionais com lock', () => {
    const sql = migration('007_atomic_operations_and_tariff_snapshot.sql');
    expect(sql).toContain('start_stay_atomic');
    expect(sql).toContain('close_cash_session_atomic');
    expect(sql.match(/for update/gi)?.length).toBeGreaterThanOrEqual(3);
    expect(sql).toContain('tariff_snapshot_immutable');
  });

  it('revoga RPCs críticas do cliente e limita por papel/tenant', () => {
    const sql = migration('008_security_rls_rate_limit_and_provisioning.sql');
    expect(sql).toContain('consume_rate_limit');
    expect(sql).toContain('grant execute on function public.consume_rate_limit');
    expect(sql).toContain('to service_role');
    expect(sql).toContain('organization_id = public.current_org_id()');
  });

  it('mantém licenças, planos e auditoria separados dos perfis de usuário', () => {
    const sql = migration('009_saas_licensing_and_master_panel.sql');
    expect(sql).toContain('create table if not exists public.saas_plans');
    expect(sql).toContain('create table if not exists public.organization_licenses');
    expect(sql).toContain('create table if not exists public.license_events');
    expect(sql).toContain('create table if not exists public.platform_audit_logs');
  });

  it('bloqueia o tenant no banco e altera licenças atomicamente', () => {
    const sql = migration('009_saas_licensing_and_master_panel.sql');
    expect(sql).toContain('organization_has_active_license');
    expect(sql).toContain('manage_organization_license_atomic');
    expect(sql).toContain("when 'block' then");
    expect(sql).toContain('for update');
    expect(sql).toContain('supabase_realtime');
    expect(sql).toContain('to service_role');
  });
});
