export type Tariff = {
  tolerance_minutes: number;
  first_period_minutes?: number | null;
  first_hour_price: number;
  additional_hour_price: number;
  fraction_minutes: number;
  additional_fraction_price?: number | null;
  daily_max: number | null;
};

export type PricingBreakdown = {
  totalMinutes: number;
  billableMinutes: number;
  amount: number;
  days: number;
  description: string;
};

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function calculateCycle(minutes: number, tariff: Tariff) {
  if (minutes <= 0) return 0;
  const firstPeriod = Math.max(1, Number(tariff.first_period_minutes || 60));
  const fraction = Math.max(1, Number(tariff.fraction_minutes || 60));
  const fractionPrice = tariff.additional_fraction_price != null
    ? Number(tariff.additional_fraction_price)
    : Number(tariff.additional_hour_price || 0) * (fraction / 60);

  let amount = Number(tariff.first_hour_price || 0);
  const extra = Math.max(0, minutes - firstPeriod);
  if (extra > 0) amount += Math.ceil(extra / fraction) * fractionPrice;
  if (tariff.daily_max != null) amount = Math.min(amount, Number(tariff.daily_max));
  return roundMoney(amount);
}

/**
 * Motor tarifário determinístico do eStaciona.
 * - tolerância vale apenas no início da permanência;
 * - primeira faixa é configurável (por padrão 60 min);
 * - adicionais são cobrados por fração sempre arredondando para cima;
 * - teto diário é aplicado por ciclo de 24h, reiniciando a regra a cada ciclo.
 */
export function calculatePrice(startedAt: string | Date, tariff: Tariff, now = new Date()): PricingBreakdown {
  const start = new Date(startedAt);
  const totalMinutes = Math.max(0, Math.ceil((now.getTime() - start.getTime()) / 60000));
  const tolerance = Math.max(0, Number(tariff.tolerance_minutes || 0));
  if (totalMinutes <= tolerance) {
    return { totalMinutes, billableMinutes: 0, amount: 0, days: 0, description: `Dentro da tolerância de ${tolerance} min` };
  }

  const billableMinutes = totalMinutes;
  let remaining = billableMinutes;
  let amount = 0;
  let days = 0;
  while (remaining > 0) {
    const cycle = Math.min(remaining, 24 * 60);
    amount += calculateCycle(cycle, tariff);
    remaining -= cycle;
    days += 1;
  }

  return {
    totalMinutes,
    billableMinutes,
    amount: roundMoney(amount),
    days,
    description: tariff.daily_max != null && days > 1 ? `${days} ciclos de até 24h` : 'Tarifa calculada automaticamente',
  };
}

export function formatDuration(minutes: number) {
  const days = Math.floor(minutes / 1440);
  const rest = minutes % 1440;
  const h = Math.floor(rest / 60);
  const m = rest % 60;
  return `${days ? `${days}d ` : ''}${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}min`;
}

export function tariffSummary(tariff: Tariff) {
  const firstPeriod = Number(tariff.first_period_minutes || 60);
  const fraction = Number(tariff.fraction_minutes || 60);
  const fractionPrice = tariff.additional_fraction_price != null
    ? Number(tariff.additional_fraction_price)
    : Number(tariff.additional_hour_price || 0) * (fraction / 60);
  const parts = [
    `${firstPeriod} min: R$ ${Number(tariff.first_hour_price || 0).toFixed(2).replace('.', ',')}`,
    `+ ${fraction} min: R$ ${fractionPrice.toFixed(2).replace('.', ',')}`,
  ];
  if (tariff.tolerance_minutes > 0) parts.unshift(`Tolerância ${tariff.tolerance_minutes} min`);
  if (tariff.daily_max != null) parts.push(`Teto 24h: R$ ${Number(tariff.daily_max).toFixed(2).replace('.', ',')}`);
  return parts.join(' • ');
}
