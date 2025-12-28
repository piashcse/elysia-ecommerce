import {db} from '../../../config/database';
import {shippingMethods} from '../../../database/schema';
import {desc, eq, sql} from 'drizzle-orm';
import {CreateShippingMethodDto, UpdateShippingMethodDto} from '../dto/ShippingDto';
import {NotFoundError} from '../../../core/errors';

export class ShippingService {
  async createShippingMethod(createShippingMethodDto: CreateShippingMethodDto): Promise<any> {
    const [newShippingMethod] = await db.insert(shippingMethods).values({
        ...createShippingMethodDto,
        baseCost: createShippingMethodDto.baseCost.toString(),
        costPerKg: createShippingMethodDto.costPerKg?.toString(),
    }).returning();

    return newShippingMethod;
  }

  async findShippingMethodById(id: string): Promise<any | null> {
    const [shippingMethod] = await db.select().from(shippingMethods).where(eq(shippingMethods.id, id)).limit(1);
    return shippingMethod || null;
  }

  async updateShippingMethod(id: string, updateShippingMethodDto: UpdateShippingMethodDto): Promise<any> {
    const shippingMethod = await this.findShippingMethodById(id);

    if (!shippingMethod) {
      throw new NotFoundError('Shipping method not found');
    }

    const updateData: any = { ...updateShippingMethodDto };
    if (updateShippingMethodDto.baseCost !== undefined) {
        updateData.baseCost = updateShippingMethodDto.baseCost.toString();
    }
    if (updateShippingMethodDto.costPerKg !== undefined) {
        updateData.costPerKg = updateShippingMethodDto.costPerKg.toString();
    }

    const [updatedShippingMethod] = await db.update(shippingMethods)
      .set(updateData)
      .where(eq(shippingMethods.id, id))
      .returning();

    return updatedShippingMethod;
  }

  async deleteShippingMethod(id: string): Promise<void> {
    const shippingMethod = await this.findShippingMethodById(id);

    if (!shippingMethod) {
      throw new NotFoundError('Shipping method not found');
    }

    await db.delete(shippingMethods).where(eq(shippingMethods.id, id));
  }

  async getAllShippingMethods(
    page: number = 1,
    limit: number = 10
  ): Promise<{ shippingMethods: any[]; total: number }> {
    const offset = (page - 1) * limit;

    const shippingMethodsResult = await db
      .select()
      .from(shippingMethods)
      .orderBy(desc(shippingMethods.createdAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(shippingMethods);

    const total = countResult ? Number(countResult.count) : 0;

    return { shippingMethods: shippingMethodsResult, total };
  }
}
