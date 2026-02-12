import { db } from '../../../config/database';
import { orderItems as orderItemsTable, orders as ordersTable, products, users } from '../../../database/schema';
import { and, desc, eq, gte, lte } from 'drizzle-orm';
import { CreateOrderDto, UpdateOrderDto } from '../dto/OrderDto';
import { ConflictError, NotFoundError } from '../../../core/errors';
import { BaseService } from '../../../core/base.service';

export class OrderService extends BaseService<typeof ordersTable> {
  constructor() {
    super(ordersTable);
  }

  async createOrder(userId: string, createOrderDto: CreateOrderDto): Promise<any> {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new NotFoundError('User not found');

    let totalAmount = 0;
    const productsData: Array<{
      product: any;
      quantity: number;
      price: number;
    }> = [];

    for (const item of createOrderDto.items) {
      const [product] = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
      if (!product) throw new NotFoundError(`Product with ID ${item.productId} not found`);

      if (Number(product.stockQuantity) < item.quantity) {
        throw new Error(`Insufficient stock for product ${product.name}`);
      }

      productsData.push({
        product,
        quantity: item.quantity,
        price: Number(product.price)
      });

      totalAmount += item.quantity * Number(product.price);
    }

    const newOrderId = await db.transaction(async (tx) => {
      const [newOrder] = await tx.insert(ordersTable).values({
        userId: userId,
        totalAmount: totalAmount.toString(),
        subtotal: totalAmount.toString(),
        status: 'pending',
        shippingAddress: JSON.stringify(createOrderDto.shippingAddress),
        billingAddress: JSON.stringify(createOrderDto.billingAddress || createOrderDto.shippingAddress),
      } as any).returning();

      if (!newOrder) throw new Error('Failed to create order');

      const orderItemsToInsert = productsData.map(item => ({
        orderId: newOrder.id,
        productId: item.product.id,
        quantity: item.quantity,
        price: item.price.toString(),
      }));

      await tx.insert(orderItemsTable).values(orderItemsToInsert);

      for (const item of productsData) {
        await tx.update(products)
          .set({ stockQuantity: Number(item.product.stockQuantity) - item.quantity })
          .where(eq(products.id, item.product.id));
      }

      return newOrder.id;
    });

    return this.getOrderById(newOrderId);
  }

  async getOrderById(orderId: string): Promise<any | null> {
    const orderWithItems = await db
      .select({
        order: ordersTable,
        orderItem: orderItemsTable,
        product: products,
        user: users,
      })
      .from(ordersTable)
      .leftJoin(orderItemsTable, eq(ordersTable.id, orderItemsTable.orderId))
      .leftJoin(products, eq(orderItemsTable.productId, products.id))
      .leftJoin(users, eq(ordersTable.userId, users.id))
      .where(eq(ordersTable.id, orderId));

    if (orderWithItems.length === 0) return null;

    const firstResult = orderWithItems[0]!;
    const order = firstResult.order;
    const items = orderWithItems
      .filter(result => result.orderItem !== null)
      .map(result => ({
        ...result.orderItem!,
        product: result.product
      }));

    return {
      ...order,
      items,
      user: firstResult.user,
      shippingAddress: typeof order.shippingAddress === 'string' ? JSON.parse(order.shippingAddress) : order.shippingAddress,
      billingAddress: typeof order.billingAddress === 'string' ? JSON.parse(order.billingAddress) : order.billingAddress,
    };
  }

  async getOrders(
    page: number = 1,
    limit: number = 10,
    filters: {
      status?: string;
      dateFrom?: string;
      dateTo?: string;
      userId?: string;
    } = {}
  ): Promise<{ items: any[]; total: number }> {
    const conditions = [];

    if (filters.status) conditions.push(eq(ordersTable.status, filters.status as any));
    if (filters.dateFrom) conditions.push(gte(ordersTable.createdAt, new Date(filters.dateFrom)));
    if (filters.dateTo) conditions.push(lte(ordersTable.createdAt, new Date(filters.dateTo)));
    if (filters.userId) conditions.push(eq(ordersTable.userId, filters.userId));

    const { items, total } = await this.findAll(page, limit, conditions);

    const formattedItems = items.map(order => ({
      ...order,
      shippingAddress: typeof order.shippingAddress === 'string' ? JSON.parse(order.shippingAddress) : order.shippingAddress,
      billingAddress: typeof order.billingAddress === 'string' ? JSON.parse(order.billingAddress) : order.billingAddress,
    }));

    return { items: formattedItems, total };
  }

  async updateOrder(orderId: string, updateOrderDto: UpdateOrderDto): Promise<any> {
    await this.findByIdOrFail(orderId, 'Order');

    const updateData: any = {};
    if (updateOrderDto.status) updateData.status = updateOrderDto.status;
    if (updateOrderDto.notes !== undefined) updateData.notes = updateOrderDto.notes;

    await this.update(orderId, updateData);
    return this.getOrderById(orderId);
  }

  async cancelOrder(orderId: string): Promise<any> {
    const order = await this.findByIdOrFail(orderId, 'Order');

    if (order.status !== 'pending' && order.status !== 'processing') {
      throw new ConflictError('Cannot cancel an order that is already shipped or delivered');
    }

    return this.update(orderId, { status: 'cancelled' });
  }

  async getOrderStats(userId?: string) {
    let whereClause = userId ? eq(ordersTable.userId, userId) : undefined;
    const ordersResult = await db.select().from(ordersTable).where(whereClause);

    const totalOrders = ordersResult.length;
    const totalRevenue = ordersResult.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      totalOrders,
      totalRevenue,
      avgOrderValue,
    };
  }
}