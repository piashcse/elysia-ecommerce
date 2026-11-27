import { and, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { db } from '../../../config/database';
import { categories, couponUsage, orderItems, orders, products, returns } from '../../../database/schema';

export class ReportService {
  async sales(from?: string, to?: string) {
    const conditions = [inArray(orders.status, ['processing', 'shipped', 'delivered'])];
    if (from) conditions.push(gte(orders.createdAt, new Date(from)));
    if (to) conditions.push(lte(orders.createdAt, new Date(to)));
    const where = and(...conditions);

    const [summary] = await db.select({
      orders: sql<number>`count(*)`,
      revenue: sql<string>`coalesce(sum(${orders.totalAmount} / ${orders.exchangeRate}), 0)`,
      tax: sql<string>`coalesce(sum(${orders.taxAmount} / ${orders.exchangeRate}), 0)`,
      shipping: sql<string>`coalesce(sum(${orders.shippingCost} / ${orders.exchangeRate}), 0)`,
      discounts: sql<string>`coalesce(sum(${orders.discountAmount} / ${orders.exchangeRate}), 0)`,
    }).from(orders).where(where);

    const topProducts = await db.select({
      productId: orderItems.productId,
      name: orderItems.productName,
      quantity: sql<number>`sum(${orderItems.quantity})`,
      revenue: sql<string>`sum((${orderItems.price} * ${orderItems.quantity}) / ${orders.exchangeRate})`,
    }).from(orderItems).innerJoin(orders, eq(orderItems.orderId, orders.id)).where(where)
      .groupBy(orderItems.productId, orderItems.productName)
      .orderBy(sql`sum((${orderItems.price} * ${orderItems.quantity}) / ${orders.exchangeRate}) desc`)
      .limit(10);

    const topCategories = await db.select({
      categoryId: products.categoryId,
      name: categories.name,
      quantity: sql<number>`sum(${orderItems.quantity})`,
      revenue: sql<string>`sum((${orderItems.price} * ${orderItems.quantity}) / ${orders.exchangeRate})`,
    }).from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(where)
      .groupBy(products.categoryId, categories.name)
      .orderBy(sql`sum((${orderItems.price} * ${orderItems.quantity}) / ${orders.exchangeRate}) desc`)
      .limit(10);

    const [returnCount] = await db.select({ count: sql<number>`count(*)` }).from(returns);
    const [couponCount] = await db.select({ count: sql<number>`count(*)` }).from(couponUsage);

    return {
      currency: 'USD',
      summary: {
        orders: summary ? Number(summary.orders) : 0,
        revenue: summary?.revenue ?? '0',
        tax: summary?.tax ?? '0',
        shipping: summary?.shipping ?? '0',
        discounts: summary?.discounts ?? '0',
      },
      topProducts: topProducts.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
      })),
      topCategories: topCategories.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
      })),
      returns: returnCount ? Number(returnCount.count) : 0,
      couponRedemptions: couponCount ? Number(couponCount.count) : 0,
    };
  }
}
