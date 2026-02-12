import { db } from '../../../config/database';
import { orders, payments } from '../../../database/schema';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { CreatePaymentDto, ProcessPaymentDto, UpdatePaymentDto } from '../dto/PaymentDto';
import { ConflictError, NotFoundError, ValidationError } from '../../../core/errors';
import { BaseService } from '../../../core/base.service';

export class PaymentService extends BaseService<typeof payments> {
  constructor() {
    super(payments);
  }

  async createPayment(createPaymentDto: CreatePaymentDto): Promise<any> {
    const [order] = await db.select().from(orders).where(eq(orders.id, createPaymentDto.orderId)).limit(1);
    if (!order) throw new NotFoundError('Order not found');

    const [existingPayment] = await db.select().from(payments).where(eq(payments.orderId, createPaymentDto.orderId)).limit(1);
    if (existingPayment) throw new ConflictError('Payment already exists for this order');

    if (Number(createPaymentDto.amount) !== Number(order.totalAmount)) {
      throw new ValidationError('Payment amount does not match order total');
    }

    return this.create({
      ...createPaymentDto,
      status: 'pending',
    });
  }

  async processPayment(processPaymentDto: ProcessPaymentDto): Promise<any> {
    const [order] = await db.select().from(orders).where(eq(orders.id, processPaymentDto.orderId)).limit(1);
    if (!order) throw new NotFoundError('Order not found');

    let [payment] = await db.select().from(payments).where(eq(payments.orderId, processPaymentDto.orderId)).limit(1);

    if (!payment) {
      payment = await this.create({
        orderId: processPaymentDto.orderId,
        amount: processPaymentDto.amount.toString(),
        status: 'pending',
        method: processPaymentDto.method,
      });
    } else {
      payment = await this.update(payment.id, { method: processPaymentDto.method });
    }

    this.validatePaymentDetails(processPaymentDto.method, processPaymentDto.paymentDetails);

    try {
      const paymentResult = await this.simulatePayment(processPaymentDto);

      const updatedPayment = await this.update(payment.id, {
        status: paymentResult.status as any,
        transactionId: paymentResult.transactionId,
      });

      if (paymentResult.status === 'completed') {
        await db.update(orders)
          .set({ status: 'processing' })
          .where(eq(orders.id, processPaymentDto.orderId));
      }

      return updatedPayment;
    } catch (error) {
      await this.update(payment.id, { status: 'failed' });
      throw error;
    }
  }

  private validatePaymentDetails(method: string, details: any): void {
    if (method === 'credit_card' || method === 'debit_card') {
      if (!details.cardNumber || !details.cardExpiry || !details.cardCvv) {
        throw new ValidationError('Credit/debit card details are incomplete');
      }
    } else if (method === 'paypal') {
      if (!details.paypalEmail) {
        throw new ValidationError('PayPal email is required');
      }
    }
  }

  private async simulatePayment(processPaymentDto: ProcessPaymentDto): Promise<{ status: string; transactionId: string }> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const success = Math.random() > 0.1;
        if (success) {
          resolve({
            status: 'completed',
            transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          });
        } else {
          reject(new Error('Payment processing failed'));
        }
      }, 500);
    });
  }

  async getPaymentById(paymentId: string): Promise<any | null> {
    const [result] = await db
      .select({
        payment: payments,
        order: orders,
      })
      .from(payments)
      .leftJoin(orders, eq(payments.orderId, orders.id))
      .where(eq(payments.id, paymentId))
      .limit(1);

    if (!result) return null;
    return { ...result.payment, order: result.order };
  }

  async getPayments(
    page: number = 1,
    limit: number = 10,
    filters: {
      status?: string;
      method?: string;
      dateFrom?: string;
      dateTo?: string;
      orderId?: string;
      userId?: string;
    } = {}
  ): Promise<{ items: any[]; total: number }> {
    const offset = (page - 1) * limit;

    const conditions = [];
    if (filters.status) conditions.push(eq(payments.status, filters.status as any));
    if (filters.method) conditions.push(eq(payments.method, filters.method as any));
    if (filters.dateFrom) conditions.push(gte(payments.createdAt, new Date(filters.dateFrom)));
    if (filters.dateTo) conditions.push(lte(payments.createdAt, new Date(filters.dateTo)));
    if (filters.orderId) conditions.push(eq(payments.orderId, filters.orderId));

    // If we need to filter by userId, we HAVE to join with orders
    let query = db
      .select({ payment: payments, order: orders })
      .from(payments)
      .leftJoin(orders, eq(payments.orderId, orders.id));

    if (filters.userId) {
      conditions.push(eq(orders.userId, filters.userId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const items = await query
      .where(whereClause)
      .orderBy(desc(payments.createdAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(payments)
      .leftJoin(orders, eq(payments.orderId, orders.id))
      .where(whereClause);

    const total = countResult ? Number(countResult.count) : 0;

    return {
      items: items.map(r => ({ ...r.payment, order: r.order })),
      total
    };
  }

  async refundPayment(paymentId: string): Promise<any> {
    const payment = await this.findByIdOrFail(paymentId, 'Payment');
    if (payment.status !== 'completed') {
      throw new ConflictError('Cannot refund a payment that is not completed');
    }

    return this.update(paymentId, { status: 'refunded' });
  }
}