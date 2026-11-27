import { and, eq, sql } from 'drizzle-orm';
import { db } from '../../../config/database';
import { orderItems, orders, sellerPayouts, users } from '../../../database/schema';
import { NotFoundError } from '../../../core/errors';
import { fromCents, toCents } from '../../../core/money';

export class PayoutService {
  async summary(sellerId: string) {
    const [seller] = await db.select({ commissionRate: users.commissionRate }).from(users).where(eq(users.id, sellerId)).limit(1);
    if (!seller) throw new NotFoundError('Seller not found');

    const [revenueRow] = await db.select({
      revenue: sql<string>`coalesce(sum((${orderItems.price} * ${orderItems.quantity}) / ${orders.exchangeRate}), 0)`,
    }).from(orderItems).innerJoin(orders, eq(orderItems.orderId, orders.id)).where(and(
      eq(orderItems.sellerId, sellerId),
      eq(orders.status, 'delivered')
    ));

    const [paidRow] = await db.select({
      paid: sql<string>`coalesce(sum(${sellerPayouts.amount}), 0)`,
    }).from(sellerPayouts).where(and(eq(sellerPayouts.sellerId, sellerId), eq(sellerPayouts.status, 'paid')));

    const revenueCents = toCents(revenueRow?.revenue ?? 0);
    const commissionCents = Math.round(revenueCents * Number(seller.commissionRate));
    const paidCents = toCents(paidRow?.paid ?? 0);
    const payouts = await db.select().from(sellerPayouts).where(eq(sellerPayouts.sellerId, sellerId)).orderBy(sellerPayouts.createdAt);

    return {
      currency: 'USD',
      revenue: fromCents(revenueCents),
      commission: fromCents(commissionCents),
      paid: fromCents(paidCents),
      balance: fromCents(Math.max(0, revenueCents - commissionCents - paidCents)),
      payouts,
    };
  }

  async create(input: { sellerId: string; amount: number; reference?: string; notes?: string; periodStart?: string; periodEnd?: string }) {
    const [record] = await db.insert(sellerPayouts).values({
      sellerId: input.sellerId,
      amount: fromCents(toCents(input.amount)),
      reference: input.reference,
      notes: input.notes,
      periodStart: input.periodStart ? new Date(input.periodStart) : null,
      periodEnd: input.periodEnd ? new Date(input.periodEnd) : null,
    }).returning();
    return record;
  }

  async updateStatus(id: string, status: 'pending' | 'paid' | 'cancelled') {
    const [record] = await db.update(sellerPayouts).set({ status, updatedAt: new Date() }).where(eq(sellerPayouts.id, id)).returning();
    if (!record) throw new NotFoundError('Payout not found');
    return record;
  }

  async list() {
    return db.select().from(sellerPayouts).orderBy(sellerPayouts.createdAt);
  }
}
