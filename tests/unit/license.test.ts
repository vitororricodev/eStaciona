import { describe, expect, it } from 'vitest';
import { effectiveLicenseStatus, licenseError } from '@/lib/license';

const now = new Date('2026-09-23T12:00:00.000Z');

describe('licenciamento SaaS', () => {
  it('libera licença ativa ainda válida', () => {
    expect(effectiveLicenseStatus('active', '2026-10-23T12:00:00.000Z', now)).toBe('active');
  });

  it('expira pelo horário do servidor sem depender de cron', () => {
    expect(effectiveLicenseStatus('active', '2026-09-23T11:59:59.000Z', now)).toBe('expired');
  });

  it('não permite licença ativa sem vencimento', () => {
    expect(effectiveLicenseStatus('active', null, now)).toBe('expired');
  });

  it('prioriza o bloqueio manual sobre a data futura', () => {
    expect(effectiveLicenseStatus('blocked', '2027-09-23T12:00:00.000Z', now)).toBe('blocked');
  });

  it('retorna código estável para a interface e APIs', () => {
    expect(licenseError('blocked')).toMatchObject({ code: 'LICENSE_BLOCKED' });
    expect(licenseError('expired')).toMatchObject({ code: 'LICENSE_EXPIRED' });
  });
});
