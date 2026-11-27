import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { db } from '../../../config/database';
import { orderItems, orders, payments, productVariants, products } from '../../../database/schema';
import { CreatePaymentDto, ProcessPaymentDto } from '../dto/PaymentDto';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  PaymentRequiredError,
  ValidationError,
} from '../../../core/errors';
import { BaseService } from '../../../core/base.service';
import { UserRole } from '../../../core/roles';
import { PAGINATION } from '../../../core/constants';
import { NotificationService } from '../../notification/service/NotificationService';
import { CouponService } from '../../coupon/service/CouponService';
import { SavedPaymentMethodService } from './SavedPaymentMethodService';
import { OrderEventService } from '../../order/service/OrderEventService';
import { emailService } from '../../notification/service/EmailService';
import { emailTemplates } from '../../notification/email.templates';
import { paymentProvider } from '../providers/simulated';
import { fromCents, toCents } from '../../../core/money';
import { sha256Hash } from '../../../utils/auth';

interface Actor {
  sub?: string;
  role?: UserRole;
}

const assertOrderAccess = (actor: Actor | null, order: any, guestToken?: string) => {
  if (actor?.role === UserRole.ADMIN) return;
  if (order.userId && actor?.sub === order.userId) return;
  if (!order.userId && guestToken && order.guestTokenHash === sha256Hash(guestToken)) return;
  throw new ForbiddenError('You can only access payments for your own orders');
};

export class PaymentService extends BaseService {
  private notificationService = new NotificationService();
  private couponService = new CouponService();
  private eventService = new OrderEventService();
  private savedMethods = new SavedPaymentMethodService();

  constructor() {
    super(payments);
  }

  async createPayment(actor: Actor | null, createPaymentDto: CreatePaymentDto, guestToken?: string): Promise<any> {
    const [order] = await db.select().from(orders).where(eq(orders.id, createPaymentDto.orderId)).limit(1);
    if (!order) throw new NotFoundError('Order not found');
    assertOrderAccess(actor, order, guestToken);

    if (order.status !== 'pending') {
      throw new ConflictError(`Cannot create a payment for an order in "${order.status}" status`, 'ORDER_NOT_PAYABLE');
    }

    const [existingPayment] = await db.select().from(payments).where(eq(payments.orderId, order.id)).limit(1);
    if (existingPayment) throw new ConflictError('Payment already exists for this order', 'PAYMENT_ALREADY_EXISTS');

    if (toCents(createPaymentDto.amount) !== toCents(order.totalAmount)) {
      throw new ValidationError('Payment amount does not match order total', 'PAYMENT_AMOUNT_MISMATCH');
    }

    return this.create({
      orderId: order.id,
      amount: fromCents(toCents(order.totalAmount)),
      status: 'pending',
      method: createPaymentDto.method,
      metadata: createPaymentDto.metadata,
    });
  }

  async processPayment(actor: Actor | null, processPaymentDto: ProcessPaymentDto, guestToken?: string): Promise<any> {
    const [order] = await db.select().from(orders).where(eq(orders.id, processPaymentDto.orderId)).limit(1);
    if (!order) throw new NotFoundError('Order not found');
    assertOrderAccess(actor, order, guestToken);

    if (order.status !== 'pending' && order.status !== 'processing') {
      throw new ConflictError(`Order is not payable in "${order.status}" status`, 'ORDER_NOT_PAYABLE');
    }

    if (toCents(processPaymentDto.amount) !== toCents(order.totalAmount)) {
      throw new ValidationError('Payment amount does not match order total', 'PAYMENT_AMOUNT_MISMATCH');
    }

    let paymentMethodToken: string | undefined;
    if (processPaymentDto.paymentMethodId) {
      if (!actor?.sub) throw new ForbiddenError('Saved payment methods require an account');
      const saved = await this.savedMethods.findForUser(actor.sub, processPaymentDto.paymentMethodId);
      paymentMethodToken = saved.token;
    }

    this.validatePaymentDetails(processPaymentDto.method, processPaymentDto.paymentDetails, Boolean(paymentMethodToken));

    let [payment] = await db.select().from(payments).where(eq(payments.orderId, order.id)).limit(1);

    if (payment?.status === 'completed') {
      throw new ConflictError('This order has already been paid', 'ORDER_ALREADY_PAID');
    }

    if (payment?.status === 'refunded') {
      throw new ConflictError('This payment has already been refunded', 'PAYMENT_REFUNDED');
    }

    if (!payment) {
      payment = await this.create({
        orderId: order.id,
        amount: fromCents(toCents(order.totalAmount)),
        status: 'pending',
        method: processPaymentDto.method,
      });
    } else {
      payment = await this.update(payment.id, { method: processPaymentDto.method });
    }

    if (!payment) throw new NotFoundError('Payment not found');

    const isOffline = processPaymentDto.method === 'cash_on_delivery' || processPaymentDto.method === 'bank_transfer';

    if (isOffline) {
      const [updated] = await db
        .update(payments)
        .set({
          status: 'pending',
          metadata: payment.metadata ?? undefined,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id))
        .returning();

      await db
        .update(orders)
        .set({ status: 'processing', paymentExpiresAt: null, updatedAt: new Date() })
        .where(eq(orders.id, order.id));
      await this.eventService.add(order.id, 'payment_pending', `Offline payment initiated via ${processPaymentDto.method}`);

      if (order.userId) {
        await this.notificationService.notifyOrderStatus(order.userId, order.id, 'processing');
      }

      return updated;
    }

    try {
      const paymentResult = await paymentProvider.charge({
        orderId: order.id,
        amountCents: toCents(order.totalAmount),
        method: processPaymentDto.method,
        paymentMethodToken,
      });

      if (paymentResult.status === 'failed') {
        throw new PaymentRequiredError('Payment processing failed', 'PAYMENT_FAILED');
      }

      const [updatedPayment] = await db
        .update(payments)
        .set({
          status: paymentResult.status,
          transactionId: paymentResult.transactionId,
          paymentGateway: paymentResult.gateway,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id))
        .returning();

      if (paymentResult.status === 'completed') {
        await db
          .update(orders)
          .set({ status: 'processing', paymentExpiresAt: null, updatedAt: new Date() })
          .where(eq(orders.id, order.id));
        await this.eventService.add(order.id, 'payment_completed', 'Payment completed');

        if (order.userId) {
          await this.notificationService.notifyPaymentCompleted(order.userId, order.id);
        }
        if (order.customerEmail) {
          const template = emailTemplates.paymentCompleted(order);
          await emailService.enqueue({ to: order.customerEmail, ...template }).catch(() => undefined);
        }
      }

      return updatedPayment;
    } catch (error) {
      await this.update(payment.id, { status: 'failed' });
      await this.eventService.add(order.id, 'payment_failed', 'Payment failed');
      if (order.userId) {
        await this.notificationService.notifyPaymentFailed(order.userId, order.id);
      }
      if (order.customerEmail) {
        const template = emailTemplates.paymentFailed(order);
        await emailService.enqueue({ to: order.customerEmail, ...template }).catch(() => undefined);
      }
      throw error;
    }
  }

  private validatePaymentDetails(method: string, details: any, hasToken = false): void {
    if (hasToken) return;
    if (method === 'credit_card' || method === 'debit_card') {
      if (!details?.cardNumber || !details?.cardExpiry || !details?.cardCvv) {
        throw new ValidationError('Credit/debit card details are incomplete');
      }
    } else if (method === 'paypal') {
      if (!details?.paypalEmail) {
        throw new ValidationError('PayPal email is required');
      }
    }
  }


  async getPaymentById(actor: Actor | null, paymentId: string, guestToken?: string): Promise<any> {
    const [result] = await db
      .select({
        payment: payments,
        order: orders,
      })
      .from(payments)
      .leftJoin(orders, eq(payments.orderId, orders.id))
      .where(eq(payments.id, paymentId))
      .limit(1);

    if (!result) throw new NotFoundError('Payment not found');
    if (!result.order) {
      if (actor?.role !== UserRole.ADMIN) throw new ForbiddenError('You cannot access this payment');
    } else {
      assertOrderAccess(actor, result.order, guestToken);
    }

    return { ...result.payment, order: result.order };
  }

  async getPayments(
    page: number = 1,
    limit: number = PAGINATION.DEFAULT_LIMIT,
    filters: {
      status?: string;
      method?: string;
      dateFrom?: string;
      dateTo?: string;
      orderId?: string;
      userId?: string;
    } = {}
  ): Promise<{ items: any[]; total: number }> {
    const { page: safePage, limit: safeLimit } = {
      page: Number.isFinite(page) ? Math.max(1, Math.trunc(page)) : 1,
      limit: Number.isFinite(limit) ? Math.min(PAGINATION.MAX_LIMIT, Math.max(1, Math.trunc(limit))) : PAGINATION.DEFAULT_LIMIT,
    };
    const offset = (safePage - 1) * safeLimit;

    const conditions = [];
    if (filters.status) conditions.push(eq(payments.status, filters.status as any));
    if (filters.method) conditions.push(eq(payments.method, filters.method as any));
    if (filters.dateFrom) {
      const date = new Date(filters.dateFrom);
      if (Number.isNaN(date.getTime())) throw new ValidationError('Invalid dateFrom value');
      conditions.push(gte(payments.createdAt, date));
    }
    if (filters.dateTo) {
      const date = new Date(filters.dateTo);
      if (Number.isNaN(date.getTime())) throw new ValidationError('Invalid dateTo value');
      conditions.push(lte(payments.createdAt, date));
    }
    if (filters.orderId) conditions.push(eq(payments.orderId, filters.orderId));
    if (filters.userId) conditions.push(eq(orders.userId, filters.userId));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, [countResult]] = await Promise.all([
      db
        .select({ payment: payments, order: orders })
        .from(payments)
        .leftJoin(orders, eq(payments.orderId, orders.id))
        .where(whereClause)
        .orderBy(desc(payments.createdAt))
        .limit(safeLimit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(payments)
        .leftJoin(orders, eq(payments.orderId, orders.id))
        .where(whereClause),
    ]);

    return {
      items: items.map((row) => ({ ...row.payment, order: row.order })),
      total: countResult ? Number(countResult.count) : 0,
    };
  }

  async refundPayment(paymentId: string, amount?: number, restoreStock = true): Promise<any> {
    const refundedPayment = await db.transaction(async (tx) => {
      const [payment] = await tx.select().from(payments).where(eq(payments.id, paymentId)).limit(1).for('update');
      if (!payment) throw new NotFoundError('Payment not found');

      if (payment.status !== 'completed' && payment.status !== 'refunded') {
        throw new ConflictError('Cannot refund a payment that has not completed', 'PAYMENT_NOT_REFUNDABLE');
      }

      const totalCents = toCents(payment.amount);
      const alreadyRefunded = toCents(payment.refundedAmount);
      const remaining = totalCents - alreadyRefunded;
      if (remaining <= 0) {
        throw new ConflictError('Payment has already been fully refunded', 'PAYMENT_ALREADY_REFUNDED');
      }

      const refundCents = amount === undefined ? remaining : toCents(amount);
      if (refundCents <= 0 || refundCents > remaining) {
        throw new ValidationError('Refund amount exceeds the remaining refundable amount', 'INVALID_REFUND_AMOUNT');
      }

      const newRefundedTotal = alreadyRefunded + refundCents;
      const isFullRefund = newRefundedTotal >= totalCents;

      const [updatedPayment] = await tx
        .update(payments)
        .set({
          status: isFullRefund ? 'refunded' : 'completed',
          refundedAmount: fromCents(newRefundedTotal),
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id))
        .returning();

      if (isFullRefund && payment.orderId) {
        const [order] = await tx.select().from(orders).where(eq(orders.id, payment.orderId)).limit(1).for('update');

        if (order && order.status !== 'refunded' && order.status !== 'cancelled') {
          if (restoreStock) {
            const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id));

            for (const item of items) {
              if (item.variantId) {
                await tx
                  .update(productVariants)
                  .set({ stockQuantity: sql`${productVariants.stockQuantity} + ${item.quantity}`, updatedAt: new Date() })
                  .where(eq(productVariants.id, item.variantId));
              } else if (item.productId) {
                await tx
                  .update(products)
                  .set({ stockQuantity: sql`${products.stockQuantity} + ${item.quantity}` })
                  .where(eq(products.id, item.productId));
              }
            }
          }

          await tx
            .update(orders)
            .set({ status: 'refunded', updatedAt: new Date() })
            .where(eq(orders.id, order.id));

          await this.couponService.releaseUsage(tx, order.id);
        }
      }

      return updatedPayment;
    });

    if (refundedPayment?.orderId) {
      await this.eventService.add(refundedPayment.orderId, 'refunded', 'Payment refunded');
      const [order] = await db
        .select({ userId: orders.userId })
        .from(orders)
        .where(eq(orders.id, refundedPayment.orderId))
        .limit(1);
      if (order?.userId) {
        await this.notificationService.notifyPaymentRefunded(order.userId, refundedPayment.orderId);
      }
      const [emailOrder] = await db.select({ email: orders.customerEmail }).from(orders).where(eq(orders.id, refundedPayment.orderId)).limit(1);
      if (emailOrder?.email) {
        const template = emailTemplates.refunded({ orderNumber: refundedPayment.orderId }, refundedPayment.refundedAmount);
        await emailService.enqueue({ to: emailOrder.email, ...template }).catch(() => undefined);
      }
    }

    return refundedPayment;
  }

  async completeOfflinePayment(paymentId: string): Promise<any> {
    const payment = await this.findByIdOrFail(paymentId, 'Payment');
    if (payment.status === 'completed') return payment;
    if (payment.status !== 'pending') {
      throw new ConflictError('Only pending payments can be completed', 'PAYMENT_NOT_PENDING');
    }
    if (payment.method !== 'bank_transfer' && payment.method !== 'cash_on_delivery') {
      throw new ConflictError('Only offline payment methods can be completed manually', 'INVALID_PAYMENT_METHOD');
    }

    const [updated] = await db
      .update(payments)
      .set({
        status: 'completed',
        paymentGateway: 'manual',
        transactionId: `manual_${Date.now()}`,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentId))
      .returning();

    if (payment.orderId) {
      const [order] = await db
        .update(orders)
        .set({ status: 'processing', updatedAt: new Date() })
        .where(eq(orders.id, payment.orderId))
        .returning({ userId: orders.userId });

      if (order?.userId) {
        await this.notificationService.notifyPaymentCompleted(order.userId, payment.orderId);
      }
    }

    return updated;
  }
}
