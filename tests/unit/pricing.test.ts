import { describe, expect, it } from 'vitest';
import { calculatePrice, createTariffSnapshot } from '@/domain/pricing';

const tariff = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Padrão',
  category: 'standard',
  tolerance_minutes: 10,
  first_period_minutes: 60,
  first_hour_price: 10,
  additional_hour_price: 8,
  fraction_minutes: 30,
  additional_fraction_price: 4,
  daily_max: 45,
  description: null,
};

describe('pricing', () => {
  it('aplica tolerância e frações com arredondamento para cima', () => {
    expect(calculatePrice('2026-01-01T10:00:00Z', tariff, new Date('2026-01-01T10:10:00Z')).amount).toBe(0);
    expect(calculatePrice('2026-01-01T10:00:00Z', tariff, new Date('2026-01-01T11:01:00Z')).amount).toBe(14);
  });

  it('aplica teto por ciclo de 24 horas', () => {
    expect(calculatePrice('2026-01-01T10:00:00Z', tariff, new Date('2026-01-02T11:00:00Z')).amount).toBe(55);
  });

  it('cria snapshot completo e numérico', () => {
    const snapshot = createTariffSnapshot(tariff, '2026-01-01T10:00:00Z');
    expect(snapshot).toMatchObject({
      id: tariff.id,
      name: 'Padrão',
      pricing_version: 1,
      captured_at: '2026-01-01T10:00:00Z',
    });
  });
});
