import { describe, expect, it } from 'vitest';
import { isValidBrazilianPlate, normalizePlate } from '@/lib/plate';

describe('plate', () => {
  it('normaliza placa antiga e Mercosul', () => {
    expect(normalizePlate('abc-1234')).toBe('ABC1234');
    expect(isValidBrazilianPlate('ABC-1234')).toBe(true);
    expect(isValidBrazilianPlate('ABC1D23')).toBe(true);
  });

  it('rejeita formatos inválidos', () => {
    expect(isValidBrazilianPlate('AB12345')).toBe(false);
    expect(isValidBrazilianPlate('ABC123')).toBe(false);
  });
});
