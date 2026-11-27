import { Elysia } from 'elysia';
import { sql } from 'drizzle-orm';
import { db } from '../../../config/database';
import { orders, products, users } from '../../../database/schema';

export const metricsController = new Elysia({ tags: ['System'] })
  .get('/metrics', async () => {
    const [[userCount], [productCount], [orderCount]] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(users),
      db.select({ count: sql<number>`count(*)` }).from(products),
      db.select({ count: sql<number>`count(*)` }).from(orders),
    ]);

    const metrics = [
      '# HELP elysia_uptime_seconds Process uptime in seconds',
      '# TYPE elysia_uptime_seconds gauge',
      `elysia_uptime_seconds ${process.uptime()}`,
      '# HELP elysia_memory_bytes Process memory usage',
      '# TYPE elysia_memory_bytes gauge',
      ...Object.entries(process.memoryUsage()).map(([key, value]) => `elysia_memory_bytes{type="${key}"} ${value}`),
      '# HELP elysia_users_total Total users',
      '# TYPE elysia_users_total gauge',
      `elysia_users_total ${Number(userCount?.count ?? 0)}`,
      '# HELP elysia_products_total Total products',
      '# TYPE elysia_products_total gauge',
      `elysia_products_total ${Number(productCount?.count ?? 0)}`,
      '# HELP elysia_orders_total Total orders',
      '# TYPE elysia_orders_total gauge',
      `elysia_orders_total ${Number(orderCount?.count ?? 0)}`,
    ].join('\n');

    return new Response(metrics, { headers: { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' } });
  });
