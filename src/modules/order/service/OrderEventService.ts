import { desc, eq } from 'drizzle-orm';
import { db } from '../../../config/database';
import { orderEvents } from '../../../database/schema';

export class OrderEventService {
  async add(orderId: string, type: string, message: string, metadata?: Record<string, unknown>) {
    await db.insert(orderEvents).values({ orderId, type, message, metadata });
  }

  async list(orderId: string) {
    return db
      .select()
      .from(orderEvents)
      .where(eq(orderEvents.orderId, orderId))
      .orderBy(desc(orderEvents.createdAt));
  }
}
