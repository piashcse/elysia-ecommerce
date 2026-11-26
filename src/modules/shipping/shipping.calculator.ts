import { toCents } from '../../core/money';

export const calculateShippingCostCents = (
  method: { baseCost: string | number; costPerKg: string | number | null },
  weightGrams: number
): number => {
  let cost = toCents(method.baseCost);
  if (method.costPerKg !== null && method.costPerKg !== undefined && weightGrams > 0) {
    cost += Math.round(toCents(method.costPerKg) * (weightGrams / 1000));
  }
  return cost;
};
