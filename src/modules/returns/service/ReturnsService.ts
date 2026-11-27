import { and, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../../../config/database';
import { orderItems, orders, productVariants, products, returnItems, returns } from '../../../database/schema';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../../core/errors';
import { UserRole } from '../../../core/roles';
import { PAGINATION } from '../../../core/constants';
import { fromCents, toCents } from '../../../core/money';
import { OrderEventService } from '../../order/service/OrderEventService';
import { PaymentService } from '../../payment/service/PaymentService';
import { payments } from '../../../database/schema';

interface Actor {
  sub: string;
  role: UserRole;
}

type ReturnStatus = 'requested' | 'approved' | 'rejected' | 'received' | 'refunded' | 'cancelled';

const TRANSITIONS: Record<ReturnStatus, ReturnStatus[]> = {
  requested: ['approved', 'rejected', 'cancelled'],
  approved: ['received', 'cancelled'],
  received: ['refunded'],
  rejected: [],
  refunded: [],
  cancelled: [],
};

export class ReturnsService {
  private events = new OrderEventService();
  private payments = new PaymentService();

  private assertActor(actor: Actor, orderUserId: string | null) {
    if (actor.role !== UserRole.ADMIN && orderUserId !== actor.sub) {
      throw new ForbiddenError('You can only access your own returns');
    }
  }

  async create(actor: Actor, orderId: string, input: { items: Array<{ orderItemId: string; quantity: number }>; reason: string; notes?: string }) {
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) throw new NotFoundError('Order not found');
    this.assertActor(actor, order.userId);

    if (!['processing', 'shipped', 'delivered'].includes(order.status)) {
      throw new ConflictError('Returns are only available after fulfillment starts', 'ORDER_NOT_RETURNABLE');
    }

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    const itemMap = new Map(items.map((item) => [item.id, item]));

    for (const requested of input.items) {
      const orderItem = itemMap.get(requested.orderItemId);
      if (!orderItem) throw new ValidationError('Return item does not belong to this order');
      if (requested.quantity < 1 || requested.quantity > orderItem.quantity) {
        throw new ValidationError('Invalid return quantity');
      }
    }

    return db.transaction(async (tx) => {
      const [record] = await tx.insert(returns).values({
        orderId,
        userId: order.userId,
        reason: input.reason,
        notes: input.notes,
      }).returning();

      if (!record) throw new Error('Failed to create return');

      await tx.insert(returnItems).values(
        input.items.map((item) => ({
          returnId: record.id,
          orderItemId: item.orderItemId,
          quantity: item.quantity,
        }))
      );

      return record;
    });
  }

  async list(actor: Actor, page: number = 1, limit: number = PAGINATION.DEFAULT_LIMIT, orderId?: string) {
    const conditions = [];
    if (actor.role !== UserRole.ADMIN) conditions.push(eq(returns.userId, actor.sub));
    if (orderId) conditions.push(eq(returns.orderId, orderId));
    const whereClause = conditions.length ? and(...conditions) : undefined;

    const safeLimit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1, limit));
    const safePage = Math.max(1, page);

    const [items, [count]] = await Promise.all([
      db.select().from(returns).where(whereClause).orderBy(returns.createdAt).limit(safeLimit).offset((safePage - 1) * safeLimit),
      db.select({ count: sql<number>`count(*)` }).from(returns).where(whereClause),
    ]);

    return { items, total: count ? Number(count.count) : 0 };
  }

  async get(actor: Actor, returnId: string) {
    const [record] = await db.select().from(returns).where(eq(returns.id, returnId)).limit(1);
    if (!record) throw new NotFoundError('Return not found');
    this.assertActor(actor, record.userId);
    const items = await db.select().from(returnItems).where(eq(returnItems.returnId, returnId));
    return { ...record, items };
  }

  async updateStatus(returnId: string, next: ReturnStatus) {
    return db.transaction(async (tx) => {
      const [record] = await tx.select().from(returns).where(eq(returns.id, returnId)).limit(1).for('update');
      if (!record) throw new NotFoundError('Return not found');
      if (!TRANSITIONS[record.status].includes(next)) {
        throw new ConflictError(`Cannot change return status from "${record.status}" to "${next}"`, 'INVALID_RETURN_TRANSITION');
      }

      if (next === 'received') {
        const items = await tx.select().from(returnItems).where(eq(returnItems.returnId, returnId));
        const orderItemIds = items.map((item) => item.orderItemId);
        const orderItemRows = orderItemIds.length
          ? await tx.select().from(orderItems).where(inArray(orderItems.id, orderItemIds))
          : [];
        const orderItemMap = new Map(orderItemRows.map((item) => [item.id, item]));

        for (const item of items) {
          const orderItem = orderItemMap.get(item.orderItemId);
          if (!orderItem) continue;
          if (orderItem.variantId) {
            await tx.update(productVariants)
              .set({ stockQuantity: sql`${productVariants.stockQuantity} + ${item.quantity}`, updatedAt: new Date() })
              .where(eq(productVariants.id, orderItem.variantId));
          } else if (orderItem.productId) {
            await tx.update(products)
              .set({ stockQuantity: sql`${products.stockQuantity} + ${item.quantity}` })
              .where(eq(products.id, orderItem.productId));
          }
        }
      }

      let refundAmount: string | undefined;
      if (next === 'refunded') {
        const items = await tx.select().from(returnItems).where(eq(returnItems.returnId, returnId));
        const orderItemIds = items.map((item) => item.orderItemId);
        const orderItemRows = orderItemIds.length
          ? await tx.select().from(orderItems).where(inArray(orderItems.id, orderItemIds))
          : [];
        const orderItemMap = new Map(orderItemRows.map((item) => [item.id, item]));
        const amountCents = items.reduce((sum, item) => {
          const orderItem = orderItemMap.get(item.orderItemId);
          return sum + (orderItem ? toCents(orderItem.price) * item.quantity : 0);
        }, 0);
        refundAmount = fromCents(amountCents);
      }

      const [updated] = await tx.update(returns)
        .set({ status: next, ...(refundAmount ? { refundAmount } : {}), updatedAt: new Date() })
        .where(eq(returns.id, returnId))
        .returning();

      return updated;
    });
  }

  private async calculateRefundCents(returnId: string): Promise<number> {
    const items = await db.select().from(returnItems).where(eq(returnItems.returnId, returnId));
    if (!items.length) return 0;
    const orderItemRows = await db
      .select()
      .from(orderItems)
      .where(inArray(orderItems.id, items.map((item) => item.orderItemId)));
    const itemMap = new Map(orderItemRows.map((item) => [item.id, item]));
    return items.reduce((sum, item) => {
      const orderItem = itemMap.get(item.orderItemId);
      return sum + (orderItem ? toCents(orderItem.price) * item.quantity : 0);
    }, 0);
  }

  async refund(returnId: string) {
    const record = await this.get({ sub: '', role: UserRole.ADMIN }, returnId);
    if (record.status !== 'received') {
      throw new ConflictError('Return must be received before refunding', 'RETURN_NOT_RECEIVED');
    }

    const refundCents = await this.calculateRefundCents(returnId);
    const [payment] = await db.select().from(payments).where(eq(payments.orderId, record.orderId)).limit(1);
    if (payment?.status === 'completed') {
      await this.payments.refundPayment(payment.id, refundCents / 100, false);
    }

    const updated = await this.updateStatus(returnId, 'refunded');
    await this.events.add(record.orderId, 'return_refunded', `Return refunded: ${record.refundAmount}`);
    return updated;
  }
}
