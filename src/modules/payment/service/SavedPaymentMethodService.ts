import { and, eq } from 'drizzle-orm';
import { db } from '../../../config/database';
import { savedPaymentMethods } from '../../../database/schema';
import { NotFoundError, ValidationError } from '../../../core/errors';

export interface SavedPaymentMethodInput {
  provider: string;
  token: string;
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  isDefault?: boolean;
}

export class SavedPaymentMethodService {
  async list(userId: string) {
    return db.select().from(savedPaymentMethods).where(eq(savedPaymentMethods.userId, userId)).orderBy(savedPaymentMethods.createdAt);
  }

  async create(userId: string, input: SavedPaymentMethodInput) {
    if (!input.provider?.trim() || !input.token?.trim()) {
      throw new ValidationError('Provider and payment token are required');
    }
    if (input.last4 && !/^\d{4}$/.test(input.last4)) throw new ValidationError('last4 must be four digits');

    return db.transaction(async (tx) => {
      if (input.isDefault) {
        await tx.update(savedPaymentMethods).set({ isDefault: false }).where(eq(savedPaymentMethods.userId, userId));
      }
      const [record] = await tx.insert(savedPaymentMethods).values({ ...input, userId }).returning();
      return record;
    });
  }

  async remove(userId: string, id: string) {
    const deleted = await db
      .delete(savedPaymentMethods)
      .where(and(eq(savedPaymentMethods.id, id), eq(savedPaymentMethods.userId, userId)))
      .returning({ id: savedPaymentMethods.id });
    if (!deleted.length) throw new NotFoundError('Payment method not found');
  }

  async findForUser(userId: string, id: string) {
    const [record] = await db
      .select()
      .from(savedPaymentMethods)
      .where(and(eq(savedPaymentMethods.id, id), eq(savedPaymentMethods.userId, userId)))
      .limit(1);
    if (!record) throw new NotFoundError('Payment method not found');
    return record;
  }
}
