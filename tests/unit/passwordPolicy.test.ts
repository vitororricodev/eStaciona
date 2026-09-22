import { describe, expect, it } from 'vitest';
import { isValidNewPassword } from '@/lib/passwordPolicy';

describe('temporary password policy', () => {
  it('não aceita liberação sem uma nova senha válida', () => {
    expect(isValidNewPassword(undefined)).toBe(false);
    expect(isValidNewPassword('curta')).toBe(false);
  });
  it('aceita senha dentro do limite', () => expect(isValidNewPassword('senha-segura-2026')).toBe(true));
});
