export const toCents = (value: number | string): number => Math.round(Number(value) * 100);

export const fromCents = (cents: number): string => (cents / 100).toFixed(2);
