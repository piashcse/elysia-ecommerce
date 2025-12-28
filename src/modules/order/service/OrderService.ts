import {db} from '../../../config/database';
import {orderItems as orderItemsTable, orders as ordersTable, products, users} from '../../../database/schema';
import {and, desc, eq, gte, lte, sql} from 'drizzle-orm';
import {CreateOrderDto, UpdateOrderDto} from '../dto/OrderDto';
import {ConflictError, NotFoundError} from '../../../core/errors';

export class OrderService {
  async createOrder(userId: string, createOrderDto: CreateOrderDto): Promise<any> {
    // Check if user exists
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Validate products and check stock
    let totalAmount = 0;
    const productsData: Array<{
      product: any;
      quantity: number;
      price: number;
    }> = [];

    for (const item of createOrderDto.items) {
      const [product] = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
      if (!product) {
        throw new NotFoundError(`Product with ID ${item.productId} not found`);
      }

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

    // Create order
    const [newOrder] = await db.insert(ordersTable).values({
      userId: userId,
      totalAmount: totalAmount.toString(),
      status: 'pending',
      shippingAddress: JSON.stringify(createOrderDto.shippingAddress),
      billingAddress: JSON.stringify(createOrderDto.billingAddress || createOrderDto.shippingAddress),
    }).returning();

    if (!newOrder) {
      throw new Error('Failed to create order');
    }

    // Create order items
    const orderItemsToInsert = productsData.map(item => ({
      orderId: newOrder.id,
      productId: item.product.id,
      quantity: item.quantity,
      price: item.price.toString(),
    }));

    await db.insert(orderItemsTable).values(orderItemsToInsert);

    // Update product stock
    for (const item of productsData) {
      const newStock = Number(item.product.stockQuantity) - item.quantity;
      await db.update(products)
        .set({ stockQuantity: newStock })
        .where(eq(products.id, item.product.id));
    }

    // Return order with items
    return this.getOrderById(newOrder.id);
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

    if (orderWithItems.length === 0) {
      return null;
    }

    const order = orderWithItems[0].order;
    const items = orderWithItems
      .filter(result => result.orderItem !== null)
      .map(result => ({
        ...result.orderItem,
        product: result.product
      }));

    return {
      ...order,
      items,
      user: orderWithItems[0].user,
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
  ): Promise<{ orders: any[]; total: number }> {
    const offset = (page - 1) * limit;

    let whereClause = undefined;
    const conditions = [];

    if (filters.status) {
      conditions.push(eq(ordersTable.status, filters.status as any));
    }
    if (filters.dateFrom) {
      conditions.push(gte(ordersTable.createdAt, new Date(filters.dateFrom)));
    }
    if (filters.dateTo) {
      conditions.push(lte(ordersTable.createdAt, new Date(filters.dateTo)));
    }
    if (filters.userId) {
      conditions.push(eq(ordersTable.userId, filters.userId));
    }

    if (conditions.length > 0) {
      whereClause = and(...conditions);
    }

    const ordersResult = await db
      .select()
      .from(ordersTable)
      .where(whereClause)
      .orderBy(desc(ordersTable.createdAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(ordersTable)
      .where(whereClause);

    const total = countResult ? Number(countResult.count) : 0;

    // Process orders to parse addresses
    const formattedOrders = ordersResult.map(order => ({
      ...order,
      shippingAddress: typeof order.shippingAddress === 'string' ? JSON.parse(order.shippingAddress) : order.shippingAddress,
      billingAddress: typeof order.billingAddress === 'string' ? JSON.parse(order.billingAddress) : order.billingAddress,
    }));

    return { orders: formattedOrders, total };
  }

  async updateOrder(orderId: string, updateOrderDto: UpdateOrderDto): Promise<any> {
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    const updateData: any = {};
    if (updateOrderDto.status) {
      updateData.status = updateOrderDto.status;
    }

    if (updateOrderDto.notes !== undefined) {
      updateData.notes = updateOrderDto.notes;
    }

    await db.update(ordersTable)
      .set(updateData)
      .where(eq(ordersTable.id, orderId));

    return this.getOrderById(orderId);
  }

  async cancelOrder(orderId: string): Promise<any> {
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.status !== 'pending' && order.status !== 'processing') {
      throw new ConflictError('Cannot cancel an order that is already shipped or delivered');
    }

    const [updatedOrder] = await db.update(ordersTable)
      .set({ status: 'cancelled' })
      .where(eq(ordersTable.id, orderId))
      .returning();

    return updatedOrder;
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