import { eq, sql } from 'drizzle-orm';
import { db } from '../../../config/database';
import { giftCardTransactions, giftCards } from '../../../database/schema';
import { ConflictError, NotFoundError, ValidationError } from '../../../core/errors';
import { fromCents, toCents } from '../../../core/money';
import { PAGINATION } from '../../../core/constants';

export class GiftCardService {
  async create(input: { code?: string; balance: number; expiresAt?: string; currency?: string }) {
    if (input.balance <= 0) throw new ValidationError('Gift card balance must be positive');
    const code = (input.code ?? `GC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`).toUpperCase();
    const [existing] = await db.select({ id: giftCards.id }).from(giftCards).where(eq(giftCards.code, code)).limit(1);
    if (existing) throw new ConflictError('Gift card code already exists', 'GIFT_CARD_EXISTS');

    const [record] = await db.insert(giftCards).values({
      code,
      initialBalance: fromCents(toCents(input.balance)),
      balance: fromCents(toCents(input.balance)),
      currency: input.currency ?? 'USD',
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    }).returning();
    return record;
  }

  async list(page: number = 1, limit: number = PAGINATION.DEFAULT_LIMIT) {
    const safeLimit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1, limit));
    const [items, [count]] = await Promise.all([
      db.select().from(giftCards).orderBy(giftCards.createdAt).limit(safeLimit).offset((Math.max(1, page) - 1) * safeLimit),
      db.select({ count: sql<number>`count(*)` }).from(giftCards),
    ]);
    return { items, total: count ? Number(count.count) : 0 };
  }

  async getByCode(code: string) {
    const [record] = await db.select().from(giftCards).where(eq(giftCards.code, code.trim().toUpperCase())).limit(1);
    if (!record || !record.isActive) throw new NotFoundError('Gift card not found');
    if (record.expiresAt && record.expiresAt < new Date()) throw new ConflictError('Gift card has expired', 'GIFT_CARD_EXPIRED');
    return record;
  }

  async calculate(code: string, totalCents: number, currency = 'USD') {
    const card = await this.getByCode(code);
    if (card.currency.toUpperCase() !== currency.toUpperCase()) {
      throw new ConflictError('Gift card currency does not match the order currency', 'GIFT_CARD_CURRENCY');
    }
    const balanceCents = toCents(card.balance);
    return {
      card,
      amountCents: Math.min(balanceCents, totalCents),
    };
  }

  async redeemInTransaction(tx: any, cardId: string, userId: string | null, orderId: string, amountCents: number) {
    const [card] = await tx.select().from(giftCards).where(eq(giftCards.id, cardId)).limit(1).for('update');
    if (!card) throw new NotFoundError('Gift card not found');
    if (toCents(card.balance) < amountCents) throw new ConflictError('Insufficient gift card balance', 'GIFT_CARD_BALANCE');

    await tx.update(giftCards)
      .set({ balance: sql`${giftCards.balance} - ${fromCents(amountCents)}` })
      .where(eq(giftCards.id, cardId));

    await tx.insert(giftCardTransactions).values({
      giftCardId: cardId,
      userId,
      orderId,
      amount: fromCents(amountCents),
    });
  }

  async deactivate(id: string) {
    const [record] = await db.update(giftCards).set({ isActive: false }).where(eq(giftCards.id, id)).returning();
    if (!record) throw new NotFoundError('Gift card not found');
    return record;
  }
}
