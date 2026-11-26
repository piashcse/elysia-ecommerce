import { and, desc, eq, gte, inArray, lte, notInArray, sql } from 'drizzle-orm';
import { db } from '../../../config/database';
import {
  orderItems as orderItemsTable,
  orders as ordersTable,
  payments,
  products,
  shippingMethods,
  users,
  type OrderAddress,
} from '../../../database/schema';
import { CreateOrderDto, UpdateOrderDto } from '../dto/OrderDto';
import { ConflictError, NotFoundError, ValidationError } from '../../../core/errors';
import { BaseService } from '../../../core/base.service';
import { OrderStatus, orderStatuses } from '../validators/OrderValidator';
import envConfig from '../../../config/env';
import { PAGINATION } from '../../../core/constants';
import { CouponService } from '../../coupon/service/CouponService';
import { calculateShippingCostCents } from '../../shipping/shipping.calculator';
import { NotificationService } from '../../notification/service/NotificationService';

const toCents = (value: number | string): number => Math.round(Number(value) * 100);
const fromCents = (cents: number): string => (cents / 100).toFixed(2);

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['processing', 'cancelled', 'refunded'],
  processing: ['shipped', 'cancelled', 'refunded'],
  shipped: ['delivered', 'refunded'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
};

const parseAddress = (value: unknown): OrderAddress | null => {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as OrderAddress;
    } catch {
      return null;
    }
  }
  return value as OrderAddress;
};

export class OrderService extends BaseService<typeof ordersTable> {
  private couponService = new CouponService();
  private notificationService = new NotificationService();

  constructor() {
    super(ordersTable);
  }

  async createOrder(userId: string, createOrderDto: CreateOrderDto): Promise<any> {
    const [user] = await db
      .select({ id: users.id, email: users.email, isActive: users.isActive })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.isActive) throw new NotFoundError('User not found');

    // Merge duplicate product lines. Otherwise a request with the same product
    // twice can decrement stock using a stale value for each line.
    const requested = new Map<string, number>();
    for (const item of createOrderDto.items) {
      requested.set(item.productId, (requested.get(item.productId) ?? 0) + item.quantity);
    }

    const productIds = [...requested.keys()];
    if (productIds.length === 0) {
      throw new ValidationError('At least one order item is required');
    }

    const productRows = await db.select().from(products).where(inArray(products.id, productIds));
    const productMap = new Map(productRows.map((product) => [product.id, product]));

    const lineItems: Array<{
      product: typeof productRows[number];
      quantity: number;
      unitPriceCents: number;
      lineTotalCents: number;
    }> = [];

    for (const productId of productIds) {
      const product = productMap.get(productId);
      const quantity = requested.get(productId)!;

      if (!product) throw new NotFoundError(`Product ${productId} not found`);
      if (!product.isActive) throw new ConflictError(`Product "${product.name}" is not available`, 'PRODUCT_INACTIVE');
      if (quantity < 1) throw new ValidationError('Quantity must be at least 1');
      if (product.stockQuantity < quantity) {
        throw new ConflictError(`Insufficient stock for product "${product.name}"`, 'INSUFFICIENT_STOCK');
      }

      const unitPriceCents = toCents(product.price);
      lineItems.push({
        product,
        quantity,
        unitPriceCents,
        lineTotalCents: unitPriceCents * quantity,
      });
    }

    let shippingCostCents = 0;
    let shippingMethodId: string | null = null;
    const totalWeightGrams = lineItems.reduce(
      (sum, item) => sum + (item.product.weightGrams ?? 0) * item.quantity,
      0
    );

    if (createOrderDto.shippingMethodId) {
      const [method] = await db
        .select()
        .from(shippingMethods)
        .where(and(eq(shippingMethods.id, createOrderDto.shippingMethodId), eq(shippingMethods.isActive, true)))
        .limit(1);

      if (!method) throw new NotFoundError('Shipping method not found');

      shippingCostCents = calculateShippingCostCents(method, totalWeightGrams);
      shippingMethodId = method.id;
    }

    const subtotalCents = lineItems.reduce((sum, item) => sum + item.lineTotalCents, 0);
    let discountCents = 0;
    let coupon: any = null;

    if (createOrderDto.couponCode) {
      const validation = await this.couponService.validateCoupon(
        createOrderDto.couponCode,
        subtotalCents / 100,
        userId
      );
      discountCents = validation.discountCents;
      coupon = validation.coupon;
    }

    const taxableCents = Math.max(0, subtotalCents - discountCents);
    const taxCents = Math.round(taxableCents * envConfig.TAX_RATE);
    const totalCents = Math.max(0, taxableCents + shippingCostCents + taxCents);

    const newOrderId = await db.transaction(async (tx) => {
      const [newOrder] = await tx
        .insert(ordersTable)
        .values({
          userId,
          customerEmail: user.email,
          totalAmount: fromCents(totalCents),
          subtotal: fromCents(subtotalCents),
          shippingCost: fromCents(shippingCostCents),
          taxAmount: fromCents(taxCents),
          discountAmount: fromCents(discountCents),
          couponCode: coupon?.code ?? null,
          shippingMethodId,
          status: 'pending',
          shippingAddress: createOrderDto.shippingAddress,
          billingAddress: createOrderDto.billingAddress || createOrderDto.shippingAddress,
        })
        .returning();

      if (!newOrder) throw new Error('Failed to create order');

      await tx.insert(orderItemsTable).values(
        lineItems.map((item) => ({
          orderId: newOrder.id,
          productId: item.product.id,
          productName: item.product.name,
          productSku: item.product.sku,
          productImageUrl: item.product.imageUrl,
          quantity: item.quantity,
          price: fromCents(item.unitPriceCents),
        }))
      );

      for (const item of lineItems) {
        // Atomic conditional decrement prevents overselling under concurrency.
        const updated = await tx
          .update(products)
          .set({ stockQuantity: sql`${products.stockQuantity} - ${item.quantity}` })
          .where(
            and(
              eq(products.id, item.product.id),
              eq(products.isActive, true),
              gte(products.stockQuantity, item.quantity)
            )
          )
          .returning({ id: products.id });

        if (updated.length === 0) {
          throw new ConflictError(`Insufficient stock for product "${item.product.name}"`, 'INSUFFICIENT_STOCK');
        }
      }

      if (coupon) {
        await this.couponService.recordUsage(tx, coupon.id, userId, newOrder.id);
      }

      return newOrder.id;
    });

    await this.notificationService.notifyOrderCreated(userId, newOrderId);
    return this.getOrderById(newOrderId);
  }

  async getOrderById(orderId: string): Promise<any | null> {
    const rows = await db
      .select({
        order: ordersTable,
        orderItem: orderItemsTable,
        product: products,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(ordersTable)
      .leftJoin(orderItemsTable, eq(ordersTable.id, orderItemsTable.orderId))
      .leftJoin(products, eq(orderItemsTable.productId, products.id))
      .leftJoin(users, eq(ordersTable.userId, users.id))
      .where(eq(ordersTable.id, orderId));

    if (rows.length === 0) return null;

    const first = rows[0]!;
    const items = rows
      .filter((row) => row.orderItem !== null)
      .map((row) => ({
        ...row.orderItem!,
        product: row.product,
      }));

    return {
      ...first.order,
      items,
      user: first.user,
      shippingAddress: parseAddress(first.order.shippingAddress),
      billingAddress: parseAddress(first.order.billingAddress),
    };
  }

  async getOrders(
    page: number = 1,
    limit: number = PAGINATION.DEFAULT_LIMIT,
    filters: {
      status?: string;
      dateFrom?: string;
      dateTo?: string;
      userId?: string;
    } = {}
  ): Promise<{ items: any[]; total: number }> {
    const conditions = [];

    if (filters.status) {
      if (!orderStatuses.includes(filters.status as OrderStatus)) {
        throw new ValidationError('Invalid order status filter', 'INVALID_ORDER_STATUS');
      }
      conditions.push(eq(ordersTable.status, filters.status as OrderStatus));
    }

    if (filters.dateFrom) {
      const dateFrom = new Date(filters.dateFrom);
      if (Number.isNaN(dateFrom.getTime())) throw new ValidationError('Invalid dateFrom value');
      conditions.push(gte(ordersTable.createdAt, dateFrom));
    }

    if (filters.dateTo) {
      const dateTo = new Date(filters.dateTo);
      if (Number.isNaN(dateTo.getTime())) throw new ValidationError('Invalid dateTo value');
      conditions.push(lte(ordersTable.createdAt, dateTo));
    }

    if (filters.userId) conditions.push(eq(ordersTable.userId, filters.userId));

    return this.findAll(page, limit, conditions);
  }

  async updateOrder(orderId: string, updateOrderDto: UpdateOrderDto & { trackingNumber?: string }): Promise<any> {
    const order = await this.findByIdOrFail(orderId, 'Order');

    if (updateOrderDto.status && updateOrderDto.status !== order.status) {
      if (!orderStatuses.includes(updateOrderDto.status)) {
        throw new ValidationError('Invalid order status', 'INVALID_ORDER_STATUS');
      }

      if (!TRANSITIONS[order.status as OrderStatus]?.includes(updateOrderDto.status)) {
        throw new ConflictError(
          `Cannot change order status from "${order.status}" to "${updateOrderDto.status}"`,
          'INVALID_ORDER_TRANSITION'
        );
      }

      if (updateOrderDto.status === 'cancelled' || updateOrderDto.status === 'refunded') {
        await this.cancelOrder(orderId, updateOrderDto.status);
        if (updateOrderDto.notes !== undefined) {
          await this.update(orderId, { notes: updateOrderDto.notes });
        }
        return this.getOrderById(orderId);
      }
    }

    const updateData: any = {};
    if (updateOrderDto.status) updateData.status = updateOrderDto.status;
    if (updateOrderDto.notes !== undefined) updateData.notes = updateOrderDto.notes;
    if (updateOrderDto.trackingNumber !== undefined) updateData.trackingNumber = updateOrderDto.trackingNumber;

    if (Object.keys(updateData).length > 0) {
      await this.update(orderId, updateData);
      if (updateOrderDto.status && order.userId) {
        await this.notificationService.notifyOrderStatus(order.userId, orderId, updateOrderDto.status);
      }
    }

    return this.getOrderById(orderId);
  }

  async cancelOrder(orderId: string, finalStatus: 'cancelled' | 'refunded' = 'cancelled'): Promise<any> {
    const result = await db.transaction(async (tx) => {
      const [order] = await tx.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1).for('update');
      if (!order) throw new NotFoundError('Order not found');

      if (order.status !== 'pending' && order.status !== 'processing') {
        throw new ConflictError('Cannot cancel an order that has already shipped or been delivered');
      }

      const items = await tx.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId));

      for (const item of items) {
        if (!item.productId) continue;
        await tx
          .update(products)
          .set({ stockQuantity: sql`${products.stockQuantity} + ${item.quantity}` })
          .where(eq(products.id, item.productId));
      }

      const [payment] = await tx.select().from(payments).where(eq(payments.orderId, orderId)).limit(1);
      if (payment?.status === 'completed') {
        await tx
          .update(payments)
          .set({
            status: 'refunded',
            refundedAmount: payment.amount,
            updatedAt: new Date(),
          })
          .where(eq(payments.id, payment.id));
      }

      const nextStatus = finalStatus === 'refunded' || payment?.status === 'completed'
        ? 'refunded'
        : 'cancelled';

      const [updated] = await tx
        .update(ordersTable)
        .set({ status: nextStatus, updatedAt: new Date() })
        .where(eq(ordersTable.id, orderId))
        .returning();

      return updated;
    });

    if (result?.userId) {
      await this.notificationService.notifyOrderStatus(result.userId, orderId, result.status);
    }

    return result;
  }

  async getOrderStats(userId?: string) {
    const conditions = [notInArray(ordersTable.status, ['cancelled', 'refunded'])];
    if (userId) conditions.push(eq(ordersTable.userId, userId));
    const whereClause = and(...conditions);

    const [result] = await db
      .select({
        totalOrders: sql<number>`count(*)`,
        totalRevenue: sql<string>`coalesce(sum(${ordersTable.totalAmount}), 0)`,
      })
      .from(ordersTable)
      .where(whereClause);

    const totalOrders = result ? Number(result.totalOrders) : 0;
    const totalRevenue = result ? Number(result.totalRevenue) : 0;

    return {
      totalOrders,
      totalRevenue,
      avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    };
  }
}
