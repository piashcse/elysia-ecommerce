import { eq } from 'drizzle-orm';
import { db } from '../../../config/database';
import { currencies } from '../../../database/schema';
import { ConflictError, NotFoundError, ValidationError } from '../../../core/errors';

export interface CurrencyRecord {
  code: string;
  name: string;
  symbol: string;
  rate: string;
  isActive: boolean;
}

const FALLBACK_USD: CurrencyRecord = {
  code: 'USD',
  name: 'US Dollar',
  symbol: '$',
  rate: '1',
  isActive: true,
};

const normalizeCode = (code: string) => code.trim().toUpperCase();

export class CurrencyService {
  async list(activeOnly = true) {
    const rows = activeOnly
      ? await db.select().from(currencies).where(eq(currencies.isActive, true))
      : await db.select().from(currencies);
    return rows;
  }

  async get(code: string, activeOnly = true): Promise<CurrencyRecord> {
    const normalized = normalizeCode(code || 'USD');
    const [record] = await db.select().from(currencies).where(eq(currencies.code, normalized)).limit(1);
    if (!record || (activeOnly && !record.isActive)) {
      if (normalized === 'USD') return FALLBACK_USD;
      throw new ValidationError(`Unsupported currency: ${normalized}`, 'UNSUPPORTED_CURRENCY');
    }
    return record;
  }

  async upsert(input: {
    code: string;
    name: string;
    symbol: string;
    rate: number;
    isActive?: boolean;
  }) {
    if (input.rate <= 0) throw new ValidationError('Currency rate must be greater than zero');
    const code = normalizeCode(input.code);
    if (code.length !== 3) throw new ValidationError('Currency code must be 3 characters');

    const [record] = await db
      .insert(currencies)
      .values({
        code,
        name: input.name,
        symbol: input.symbol,
        rate: input.rate.toString(),
        isActive: input.isActive ?? true,
      })
      .onConflictDoUpdate({
        target: currencies.code,
        set: {
          name: input.name,
          symbol: input.symbol,
          rate: input.rate.toString(),
          isActive: input.isActive ?? true,
          updatedAt: new Date(),
        },
      })
      .returning();

    return record;
  }

  async update(code: string, input: { name?: string; symbol?: string; rate?: number; isActive?: boolean }) {
    const normalized = normalizeCode(code);
    const [existing] = await db.select().from(currencies).where(eq(currencies.code, normalized)).limit(1);
    if (!existing) throw new NotFoundError('Currency not found');
    if (input.rate !== undefined && input.rate <= 0) {
      throw new ValidationError('Currency rate must be greater than zero');
    }

    const [record] = await db
      .update(currencies)
      .set({
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.symbol !== undefined ? { symbol: input.symbol } : {}),
        ...(input.rate !== undefined ? { rate: input.rate.toString() } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        updatedAt: new Date(),
      })
      .where(eq(currencies.code, normalized))
      .returning();

    return record;
  }

  async convert(amount: number, from: string, to: string) {
    if (!Number.isFinite(amount) || amount < 0) throw new ValidationError('Amount must be zero or positive');
    const source = await this.get(from);
    const target = await this.get(to);
    if (source.code === target.code) {
      return { amount, from: source.code, to: target.code, rate: 1, convertedAmount: amount };
    }

    // Convert through the base currency (USD).
    const baseAmount = amount / Number(source.rate);
    const rate = Number(target.rate);
    const convertedAmount = Math.round(baseAmount * rate * 100) / 100;
    return {
      amount,
      from: source.code,
      to: target.code,
      rate: Math.round(rate / Number(source.rate) * 1_000_000) / 1_000_000,
      convertedAmount,
    };
  }

  async remove(code: string) {
    const normalized = normalizeCode(code);
    if (normalized === 'USD') throw new ConflictError('The base currency cannot be removed', 'BASE_CURRENCY');
    const [record] = await db
      .update(currencies)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(currencies.code, normalized))
      .returning();
    if (!record) throw new NotFoundError('Currency not found');
    return record;
  }
}

export const currencyService = new CurrencyService();
