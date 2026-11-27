import { toCents } from '../../core/money';

export const calculateShippingCostCents = (
  method: {
    baseCost: string | number;
    costPerKg: string | number | null;
    freeShippingThreshold?: string | number | null;
  },
  weightGrams: number,
  subtotalCents = 0
): number => {
  if (
    method.freeShippingThreshold !== null &&
    method.freeShippingThreshold !== undefined &&
    subtotalCents >= toCents(method.freeShippingThreshold)
  ) {
    return 0;
  }

  let cost = toCents(method.baseCost);
  if (method.costPerKg !== null && method.costPerKg !== undefined && weightGrams > 0) {
    cost += Math.round(toCents(method.costPerKg) * (weightGrams / 1000));
  }
  return cost;
};
