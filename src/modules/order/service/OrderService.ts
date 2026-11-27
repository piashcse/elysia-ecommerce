import { and, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { db } from '../../../config/database';
import {
  giftCardTransactions,
  giftCards,
  orderItems as orderItemsTable,
  orders as ordersTable,
  payments,
  productVariants,
  products,
  shippingMethods,
  users,
  type OrderAddress,
} from '../../../database/schema';
import { CreateOrderDto, UpdateOrderDto } from '../dto/OrderDto';
import { ConflictError, NotFoundError, ValidationError } from '../../../core/errors';
import { BaseService } from '../../../core/base.service';
import envConfig from '../../../config/env';
import { PAGINATION, ORDER_STATUSES, type OrderStatus } from '../../../core/constants';
import { CouponService } from '../../coupon/service/CouponService';
import { calculateShippingCostCents } from '../../shipping/shipping.calculator';
import { fromCents, toCents } from '../../../core/money';
import { NotificationService } from '../../notification/service/NotificationService';
import { OrderEventService } from './OrderEventService';
import { taxService } from '../../tax/service/TaxService';
import { GiftCardService } from '../../gift-card/service/GiftCardService';
import { generateRandomString, sha256Hash } from '../../../utils/auth';
import { emailService } from '../../notification/service/EmailService';
import { emailTemplates } from '../../notification/email.templates';

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['processing', 'cancelled', 'refunded'],
  processing: ['shipped', 'cancelled', 'refunded'],
  shipped: ['delivered', 'refunded'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
};

const PAYMENT_WINDOW_MS = 30 * 60 * 1000;

export interface PriceableItem {
  productId: string;
  variantId?: string;
  quantity: number;
}

interface PricedLine {
  product: typeof products.$inferSelect;
  variant?: typeof productVariants.$inferSelect;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
}

export interface OrderPricing {
  lineItems: PricedLine[];
  subtotalCents: number;
  shippingCostCents: number;
  taxCents: number;
  taxRate: number;
  discountCents: number;
  giftCardCents: number;
  giftCard: any;
  totalCents: number;
  weightGrams: number;
  coupon: any;
  shippingMethodId: string | null;
}

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

const generateOrderNumber = () =>
  `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

export class OrderService extends BaseService {
  private couponService = new CouponService();
  private notificationService = new NotificationService();
  private eventService = new OrderEventService();
  private giftCards = new GiftCardService();

  constructor() {
    super(ordersTable);
  }

  async priceOrder(
    items: PriceableItem[],
    options: { userId?: string; couponCode?: string; giftCardCode?: string; shippingMethodId?: string; country?: string } = {}
  ): Promise<OrderPricing> {
    if (!items.length) throw new ValidationError('At least one order item is required');

    const requested = new Map<string, { productId: string; variantId?: string; quantity: number }>();
    for (const item of items) {
      const key = `${item.productId}:${item.variantId ?? ''}`;
      const current = requested.get(key);
      requested.set(key, {
        productId: item.productId,
        variantId: item.variantId,
        quantity: (current?.quantity ?? 0) + item.quantity,
      });
    }

    const productIds = [...new Set([...requested.values()].map((item) => item.productId))];
    const variantIds = [...new Set([...requested.values()].map((item) => item.variantId).filter(Boolean) as string[])];

    const [productRows, variantRows] = await Promise.all([
      db.select().from(products).where(inArray(products.id, productIds)),
      variantIds.length ? db.select().from(productVariants).where(inArray(productVariants.id, variantIds)) : Promise.resolve([]),
    ]);

    const productMap = new Map(productRows.map((product) => [product.id, product]));
    const variantMap = new Map(variantRows.map((variant) => [variant.id, variant]));
    const lineItems: PricedLine[] = [];

    for (const requestedItem of requested.values()) {
      const product = productMap.get(requestedItem.productId);
      if (!product) throw new NotFoundError(`Product ${requestedItem.productId} not found`);
      if (!product.isActive) throw new ConflictError(`Product "${product.name}" is not available`, 'PRODUCT_INACTIVE');

      let variant: typeof productVariants.$inferSelect | undefined;
      if (requestedItem.variantId) {
        variant = variantMap.get(requestedItem.variantId);
        if (!variant || variant.productId !== product.id || !variant.isActive) {
          throw new NotFoundError('Product variant not found');
        }
      }

      if (requestedItem.quantity < 1) throw new ValidationError('Quantity must be at least 1');
      const available = variant?.stockQuantity ?? product.stockQuantity;
      if (available < requestedItem.quantity) {
        throw new ConflictError(`Insufficient stock for product "${product.name}"`, 'INSUFFICIENT_STOCK');
      }

      const unitPriceCents = toCents(variant?.price ?? product.price);
      lineItems.push({
        product,
        variant,
        quantity: requestedItem.quantity,
        unitPriceCents,
        lineTotalCents: unitPriceCents * requestedItem.quantity,
      });
    }

    const subtotalCents = lineItems.reduce((sum, item) => sum + item.lineTotalCents, 0);
    const weightGrams = lineItems.reduce(
      (sum, item) => sum + (item.product.weightGrams ?? 0) * item.quantity,
      0
    );

    let shippingCostCents = 0;
    let shippingMethodId: string | null = null;

    if (options.shippingMethodId) {
      const [method] = await db
        .select()
        .from(shippingMethods)
        .where(and(eq(shippingMethods.id, options.shippingMethodId), eq(shippingMethods.isActive, true)))
        .limit(1);

      if (!method) throw new NotFoundError('Shipping method not found');
      if (options.country && method.countries.length && !method.countries.some((item) => item.toLowerCase() === options.country!.toLowerCase())) {
        throw new NotFoundError('Shipping method is not available for this country');
      }
      shippingCostCents = calculateShippingCostCents(method, weightGrams, subtotalCents);
      shippingMethodId = method.id;
    }

    let discountCents = 0;
    let coupon: any = null;

    if (options.couponCode) {
      if (!options.userId) throw new ValidationError('Coupons require an authenticated account');
      const validation = await this.couponService.validateCoupon(
        options.couponCode,
        subtotalCents / 100,
        options.userId,
        {
          productIds: lineItems.map((item) => item.product.id),
          categoryIds: lineItems.map((item) => item.product.categoryId).filter(Boolean) as string[],
        }
      );
      discountCents = validation.discountCents;
      coupon = validation.coupon;
    }

    const taxableCents = Math.max(0, subtotalCents - discountCents);
    const tax = await taxService.calculate(taxableCents, options.country);
    const taxRate = tax.rate || envConfig.TAX_RATE;
    const taxCents = tax.rate ? tax.taxCents : Math.round(taxableCents * envConfig.TAX_RATE);
    const grossCents = Math.max(0, taxableCents + shippingCostCents + taxCents);
    let giftCardCents = 0;
    let giftCard: any = null;
    if (options.giftCardCode) {
      const gift = await this.giftCards.calculate(options.giftCardCode, grossCents);
      giftCard = gift.card;
      giftCardCents = gift.amountCents;
    }

    return {
      lineItems,
      subtotalCents,
      shippingCostCents,
      taxCents,
      taxRate,
      discountCents,
      giftCardCents,
      giftCard,
      totalCents: Math.max(0, grossCents - giftCardCents),
      weightGrams,
      coupon,
      shippingMethodId,
    };
  }

  async quote(
    userId: string | undefined,
    customerEmail: string,
    items: PriceableItem[],
    options: { couponCode?: string; giftCardCode?: string; shippingMethodId?: string; country?: string } = {}
  ) {
    void customerEmail;
    const pricing = await this.priceOrder(items, { userId, ...options });
    return {
      items: pricing.lineItems.map((item) => ({
        productId: item.product.id,
        variantId: item.variant?.id ?? null,
        name: item.product.name,
        variantName: item.variant?.name ?? null,
        quantity: item.quantity,
        unitPrice: fromCents(item.unitPriceCents),
        subtotal: fromCents(item.lineTotalCents),
      })),
      subtotal: fromCents(pricing.subtotalCents),
      discount: fromCents(pricing.discountCents),
      shippingCost: fromCents(pricing.shippingCostCents),
      tax: fromCents(pricing.taxCents),
      total: fromCents(pricing.totalCents),
      weightGrams: pricing.weightGrams,
      couponCode: pricing.coupon?.code ?? null,
      giftCardCode: pricing.giftCard?.code ?? null,
      giftCardAmount: fromCents(pricing.giftCardCents),
      shippingMethodId: pricing.shippingMethodId,
    };
  }

  async createOrder(userId: string | null, customerEmail: string, createOrderDto: CreateOrderDto): Promise<any> {
    if (userId) {
      const [user] = await db
        .select({ id: users.id, isActive: users.isActive })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      if (!user || !user.isActive) throw new NotFoundError('User not found');
    } else if (!customerEmail) {
      throw new ValidationError('Email is required for guest checkout');
    }

    const pricing = await this.priceOrder(createOrderDto.items, {
      userId: userId ?? undefined,
      couponCode: createOrderDto.couponCode,
      giftCardCode: createOrderDto.giftCardCode,
      shippingMethodId: createOrderDto.shippingMethodId,
      country: createOrderDto.shippingAddress.country,
    });

    const guestToken = userId ? null : generateRandomString(32);
    const orderNumber = generateOrderNumber();

    const newOrderId = await db.transaction(async (tx) => {
      const [newOrder] = await tx
        .insert(ordersTable)
        .values({
          orderNumber,
          userId,
          customerEmail,
          guestTokenHash: guestToken ? sha256Hash(guestToken) : null,
          paymentExpiresAt: new Date(Date.now() + PAYMENT_WINDOW_MS),
          totalAmount: fromCents(pricing.totalCents),
          subtotal: fromCents(pricing.subtotalCents),
          shippingCost: fromCents(pricing.shippingCostCents),
          taxAmount: fromCents(pricing.taxCents),
          taxRate: pricing.taxRate.toString(),
          discountAmount: fromCents(pricing.discountCents),
          couponCode: pricing.coupon?.code ?? null,
      giftCardCode: pricing.giftCard?.code ?? null,
      giftCardAmount: fromCents(pricing.giftCardCents),
          shippingMethodId: pricing.shippingMethodId,
          status: 'pending',
          shippingAddress: createOrderDto.shippingAddress,
          billingAddress: createOrderDto.billingAddress || createOrderDto.shippingAddress,
        })
        .returning();

      if (!newOrder) throw new Error('Failed to create order');

      await tx.insert(orderItemsTable).values(
        pricing.lineItems.map((item) => ({
          orderId: newOrder.id,
          productId: item.product.id,
          variantId: item.variant?.id ?? null,
          sellerId: item.product.sellerId,
          productName: item.product.name,
          variantName: item.variant?.name ?? null,
          productSku: item.variant?.sku ?? item.product.sku,
          productImageUrl: item.variant?.imageUrl ?? item.product.imageUrl,
          quantity: item.quantity,
          price: fromCents(item.unitPriceCents),
        }))
      );

      for (const item of pricing.lineItems) {
        const updated = item.variant
          ? await tx
              .update(productVariants)
              .set({ stockQuantity: sql`${productVariants.stockQuantity} - ${item.quantity}`, updatedAt: new Date() })
              .where(and(
                eq(productVariants.id, item.variant.id),
                gte(productVariants.stockQuantity, item.quantity)
              ))
              .returning({ id: productVariants.id })
          : await tx
              .update(products)
              .set({ stockQuantity: sql`${products.stockQuantity} - ${item.quantity}` })
              .where(and(
                eq(products.id, item.product.id),
                eq(products.isActive, true),
                gte(products.stockQuantity, item.quantity)
              ))
              .returning({ id: products.id });

        if (!updated.length) {
          throw new ConflictError(`Insufficient stock for product "${item.product.name}"`, 'INSUFFICIENT_STOCK');
        }
      }

      if (pricing.coupon && userId) {
        await this.couponService.recordUsage(tx, pricing.coupon.id, userId, newOrder.id);
      }

      if (pricing.giftCard && pricing.giftCardCents > 0) {
        await this.giftCards.redeemInTransaction(tx, pricing.giftCard.id, userId, newOrder.id, pricing.giftCardCents);
      }

      return newOrder.id;
    });

    await this.eventService.add(newOrderId, 'created', 'Order created');
    if (userId) await this.notificationService.notifyOrderCreated(userId, newOrderId);

    const order = await this.getOrderById(newOrderId);
    if (customerEmail) {
      const template = emailTemplates.orderConfirmation(order);
      await emailService.enqueue({ to: customerEmail, ...template }).catch(() => undefined);
    }
    return guestToken ? { ...order, guestToken } : order;
  }

  async getOrderById(orderId: string): Promise<any | null> {
    const rows = await db
      .select({
        order: ordersTable,
        orderItem: orderItemsTable,
        product: products,
        variant: productVariants,
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
      .leftJoin(productVariants, eq(orderItemsTable.variantId, productVariants.id))
      .leftJoin(users, eq(ordersTable.userId, users.id))
      .where(eq(ordersTable.id, orderId));

    if (rows.length === 0) return null;

    const first = rows[0]!;
    const items = rows
      .filter((row) => row.orderItem !== null)
      .map((row) => ({
        ...row.orderItem!,
        product: row.product,
        variant: row.variant,
      }));

    return {
      ...first.order,
      items,
      user: first.user,
      shippingAddress: parseAddress(first.order.shippingAddress),
      billingAddress: parseAddress(first.order.billingAddress),
    };
  }

  async getOrderEvents(orderId: string) {
    return this.eventService.list(orderId);
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
      if (!ORDER_STATUSES.includes(filters.status as OrderStatus)) {
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
      if (!ORDER_STATUSES.includes(updateOrderDto.status)) {
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
      await db.update(ordersTable).set(updateData).where(eq(ordersTable.id, orderId));
      if (updateOrderDto.status) {
        await this.eventService.add(orderId, 'status_changed', `Status changed to ${updateOrderDto.status}`);
      }
      if (updateOrderDto.status && order.userId) {
        await this.notificationService.notifyOrderStatus(order.userId, orderId, updateOrderDto.status);
      }
      if (updateOrderDto.status && order.customerEmail) {
        const template = emailTemplates.orderStatus(order, updateOrderDto.status);
        await emailService.enqueue({ to: order.customerEmail, ...template }).catch(() => undefined);
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

      const [payment] = await tx.select().from(payments).where(eq(payments.orderId, orderId)).limit(1);
      if (payment?.status === 'completed') {
        await tx
          .update(payments)
          .set({ status: 'refunded', refundedAmount: payment.amount, updatedAt: new Date() })
          .where(eq(payments.id, payment.id));
      }

      await this.couponService.releaseUsage(tx, orderId);

      if (order.giftCardCode && Number(order.giftCardAmount) > 0) {
        const [card] = await tx.select().from(giftCards).where(eq(giftCards.code, order.giftCardCode)).limit(1).for('update');
        if (card) {
          await tx.update(giftCards)
            .set({ balance: sql`${giftCards.balance} + ${order.giftCardAmount}` })
            .where(eq(giftCards.id, card.id));
          await tx.insert(giftCardTransactions).values({
            giftCardId: card.id,
            userId: order.userId,
            orderId,
            amount: order.giftCardAmount,
          });
        }
      }

      const nextStatus = finalStatus === 'refunded' || payment?.status === 'completed' ? 'refunded' : 'cancelled';
      const [updated] = await tx
        .update(ordersTable)
        .set({ status: nextStatus, updatedAt: new Date() })
        .where(eq(ordersTable.id, orderId))
        .returning();

      return updated;
    });

    await this.eventService.add(orderId, 'status_changed', `Order ${result?.status}`);
    if (result?.userId) {
      await this.notificationService.notifyOrderStatus(result.userId, orderId, result.status);
    }
    if (result?.customerEmail) {
      const template = emailTemplates.orderStatus(result, result.status);
      await emailService.enqueue({ to: result.customerEmail, ...template }).catch(() => undefined);
    }

    return result;
  }

  async releaseExpiredOrders(limit = 100): Promise<number> {
    const expired = await db
      .select({ id: ordersTable.id })
      .from(ordersTable)
      .where(and(eq(ordersTable.status, 'pending'), lte(ordersTable.paymentExpiresAt, new Date())))
      .limit(limit);

    let released = 0;
    for (const order of expired) {
      try {
        await this.cancelOrder(order.id);
        released += 1;
      } catch {
        // Another process may have changed the order; continue.
      }
    }
    return released;
  }

  async getOrderStats(userId?: string) {
    const conditions = [inArray(ordersTable.status, ['processing', 'shipped', 'delivered'])];
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
