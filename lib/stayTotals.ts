import { calculatePrice } from '@/domain/pricing';

export function serviceTotal(lines: any[] | null | undefined) {
  return (lines || []).reduce((sum, x) => sum + Number(x.unit_price || 0) * Number(x.quantity || 1), 0);
}

export function stayTotals(stay: any, now = new Date()) {
  const tariff = Array.isArray(stay.tariff_plans) ? stay.tariff_plans[0] : stay.tariff_plans;
  const pricing = tariff ? calculatePrice(stay.started_at, tariff, now) : { amount: 0, totalMinutes: 0, billableMinutes: 0, days: 0, description: '' };
  const servicesAmount = serviceTotal(stay.stay_services);
  return { ...pricing, parkingAmount: Number(pricing.amount || 0), servicesAmount, amount: Math.round((Number(pricing.amount || 0) + servicesAmount) * 100) / 100, tariff };
}
