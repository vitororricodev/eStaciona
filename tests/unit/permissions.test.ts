import { describe, expect, it } from 'vitest';
import { hasPermission } from '@/lib/permissions';

describe('RBAC', () => {
  it('impede operator de acessar gestão', () =>
    expect(hasPermission('operator', 'access:admin')).toBe(false));
  it('permite manager acessar gestão sem alterar papéis', () => {
    expect(hasPermission('manager', 'access:admin')).toBe(true);
    expect(hasPermission('manager', 'manage:staff-role')).toBe(false);
  });
  it('mantém controle completo da organização para owner', () =>
    expect(hasPermission('owner', 'manage:staff-role')).toBe(true));
});
