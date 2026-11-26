export const toCents = (value: number | string): number => Math.round(Number(value) * 100);
export const fromCents = (cents: number): string => (cents / 100).toFixed(2);

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
