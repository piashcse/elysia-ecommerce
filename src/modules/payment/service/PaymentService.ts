import { db } from '../../../config/database';
import { payments, orders } from '../../../database/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { CreatePaymentDto, UpdatePaymentDto, ProcessPaymentDto } from '../dto/PaymentDto';
import { NotFoundError, ConflictError, ValidationError } from '../../../core/errors';

export class PaymentService {
  async createPayment(createPaymentDto: CreatePaymentDto): Promise<any> {
    const [order] = await db.select().from(orders).where(eq(orders.id, createPaymentDto.orderId)).limit(1);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    const existingPayment = await db.select().from(payments).where(eq(payments.orderId, createPaymentDto.orderId)).limit(1);
    if (existingPayment.length > 0) {
      throw new ConflictError('Payment already exists for this order');
    }

    if (Number(createPaymentDto.amount) !== Number(order.totalAmount)) {
      throw new ValidationError('Payment amount does not match order total');
    }

    const [newPayment] = await db.insert(payments).values({
      orderId: createPaymentDto.orderId,
      amount: createPaymentDto.amount.toString(),
      status: 'pending',
      method: createPaymentDto.method,
      transactionId: createPaymentDto.transactionId,
      paymentGateway: createPaymentDto.paymentGateway,
    }).returning();

    return newPayment;
  }

  async processPayment(processPaymentDto: ProcessPaymentDto): Promise<any> {
    const [order] = await db.select().from(orders).where(eq(orders.id, processPaymentDto.orderId)).limit(1);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    let [payment] = await db.select().from(payments).where(eq(payments.orderId, processPaymentDto.orderId)).limit(1);

    if (!payment) {
      [payment] = await db.insert(payments).values({
        orderId: processPaymentDto.orderId,
        amount: processPaymentDto.amount.toString(),
        status: 'pending',
        method: processPaymentDto.method,
      }).returning();
    } else {
      [payment] = await db.update(payments)
        .set({ method: processPaymentDto.method })
        .where(eq(payments.id, payment.id))
        .returning();
    }

    if (!payment) {
      throw new Error('Failed to create or update payment');
    }

    this.validatePaymentDetails(processPaymentDto.method, processPaymentDto.paymentDetails);

    try {
      const paymentResult = await this.simulatePayment(processPaymentDto);

      const [updatedPayment] = await db.update(payments)
        .set({
          status: paymentResult.status as any,
          transactionId: paymentResult.transactionId,
        })
        .where(eq(payments.id, payment.id))
        .returning();

      if (paymentResult.status === 'completed') {
        await db.update(orders)
          .set({ status: 'processing' })
          .where(eq(orders.id, processPaymentDto.orderId));
      }

      return updatedPayment;
    } catch (error) {
      const [failedPayment] = await db.update(payments)
        .set({ status: 'failed' })
        .where(eq(payments.id, payment.id))
        .returning();
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
      }, 1000);
    });
  }

  async getPaymentById(paymentId: string): Promise<any | null> {
    const [payment] = await db
      .select({
        payment: payments,
        order: orders,
      })
      .from(payments)
      .leftJoin(orders, eq(payments.orderId, orders.id))
      .where(eq(payments.id, paymentId))
      .limit(1);

    return payment || null;
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
  ): Promise<{ payments: any[]; total: number }> {
    const offset = (page - 1) * limit;

    const conditions = [];
    if (filters.status) conditions.push(eq(payments.status, filters.status as any));
    if (filters.method) conditions.push(eq(payments.method, filters.method as any));
    if (filters.dateFrom) conditions.push(gte(payments.createdAt, new Date(filters.dateFrom)));
    if (filters.dateTo) conditions.push(lte(payments.createdAt, new Date(filters.dateTo)));
    if (filters.orderId) conditions.push(eq(payments.orderId, filters.orderId));
    if (filters.userId) conditions.push(eq(orders.userId, filters.userId));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const paymentsResult = await db
      .select({
        payment: payments,
        order: orders,
      })
      .from(payments)
      .leftJoin(orders, eq(payments.orderId, orders.id))
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
      payments: paymentsResult.map(result => ({
        ...result.payment,
        order: result.order
      })),
      total
    };
  }

  async updatePayment(paymentId: string, updatePaymentDto: UpdatePaymentDto): Promise<any> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
    if (!payment) throw new NotFoundError('Payment not found');
    if (payment.status === 'completed' || payment.status === 'failed') {
      throw new ConflictError('Cannot update a completed or failed payment');
    }

    const [updatedPayment] = await db.update(payments)
      .set(updatePaymentDto as any)
      .where(eq(payments.id, paymentId))
      .returning();

    return updatedPayment;
  }

  async refundPayment(paymentId: string): Promise<any> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
    if (!payment) throw new NotFoundError('Payment not found');
    if (payment.status !== 'completed') {
      throw new ConflictError('Cannot refund a payment that is not completed');
    }

    const [updatedPayment] = await db.update(payments)
      .set({ status: 'refunded' })
      .where(eq(payments.id, paymentId))
      .returning();

    return updatedPayment;
  }

  async getPaymentStats(userId?: string) {
    const conditions = userId ? [eq(orders.userId, userId)] : [];
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const paymentsResult = await db.select({ payment: payments }).from(payments)
      .leftJoin(orders, eq(payments.orderId, orders.id))
      .where(whereClause);

    const totalPayments = paymentsResult.length;
    const successfulPayments = paymentsResult.filter(p => p.payment.status === 'completed').length;
    const totalRevenue = paymentsResult
      .filter(p => p.payment.status === 'completed')
      .reduce((sum, p) => sum + Number(p.payment.amount), 0);

    return {
      totalPayments,
      successfulPayments,
      totalRevenue,
      successRate: totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0,
    };
  }
}