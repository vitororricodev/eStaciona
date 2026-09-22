import { describe, expect, it } from 'vitest';
import { stayTotals } from '@/lib/stayTotals';

describe('stay totals', () => {
  it('prioriza o snapshot e ignora alteração posterior da tarifa relacionada', () => {
    const stay = {
      started_at: '2026-01-01T10:00:00Z',
      tariff_snapshot: {
        tolerance_minutes: 0,
        first_period_minutes: 60,
        first_hour_price: 10,
        additional_hour_price: 8,
        fraction_minutes: 30,
        additional_fraction_price: 4,
        daily_max: 45,
      },
      tariff_plans: {
        tolerance_minutes: 0,
        first_period_minutes: 60,
        first_hour_price: 999,
        additional_hour_price: 999,
        fraction_minutes: 30,
        additional_fraction_price: 999,
        daily_max: null,
      },
      stay_services: [],
    };
    expect(stayTotals(stay, new Date('2026-01-01T11:00:00Z')).amount).toBe(10);
  });
});
