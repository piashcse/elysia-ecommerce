import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../../../config/database';
import { products, shippingMethods } from '../../../database/schema';
import { CreateShippingMethodDto, UpdateShippingMethodDto } from '../dto/ShippingDto';
import { ConflictError, NotFoundError, ValidationError } from '../../../core/errors';
import { PAGINATION } from '../../../core/constants';
import { calculateShippingCostCents } from '../shipping.calculator';
import { fromCents, toCents } from '../../../core/money';

export class ShippingService {
  private validate(data: {
    baseCost?: number;
    costPerKg?: number;
    estimatedDaysMin?: number;
    estimatedDaysMax?: number;
  }) {
    if (data.baseCost !== undefined && data.baseCost < 0) {
      throw new ValidationError('Base cost cannot be negative');
    }
    if (data.costPerKg !== undefined && data.costPerKg < 0) {
      throw new ValidationError('Cost per kg cannot be negative');
    }
    if (data.estimatedDaysMin !== undefined && data.estimatedDaysMin < 0) {
      throw new ValidationError('Minimum estimated days cannot be negative');
    }
    if (data.estimatedDaysMax !== undefined && data.estimatedDaysMax < 0) {
      throw new ValidationError('Maximum estimated days cannot be negative');
    }
    if (
      data.estimatedDaysMin !== undefined &&
      data.estimatedDaysMax !== undefined &&
      data.estimatedDaysMin > data.estimatedDaysMax
    ) {
      throw new ValidationError('Minimum estimated days cannot exceed maximum estimated days');
    }
  }

  async createShippingMethod(createShippingMethodDto: CreateShippingMethodDto): Promise<any> {
    this.validate(createShippingMethodDto);

    const [existing] = await db
      .select({ id: shippingMethods.id })
      .from(shippingMethods)
      .where(eq(shippingMethods.name, createShippingMethodDto.name))
      .limit(1);
    if (existing) throw new ConflictError('A shipping method with this name already exists');

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
    if (!shippingMethod) throw new NotFoundError('Shipping method not found');

    this.validate({
      baseCost: updateShippingMethodDto.baseCost,
      costPerKg: updateShippingMethodDto.costPerKg,
      estimatedDaysMin: updateShippingMethodDto.estimatedDaysMin ?? shippingMethod.estimatedDaysMin,
      estimatedDaysMax: updateShippingMethodDto.estimatedDaysMax ?? shippingMethod.estimatedDaysMax,
    });

    if (updateShippingMethodDto.name && updateShippingMethodDto.name !== shippingMethod.name) {
      const [existing] = await db
        .select({ id: shippingMethods.id })
        .from(shippingMethods)
        .where(eq(shippingMethods.name, updateShippingMethodDto.name))
        .limit(1);
      if (existing) throw new ConflictError('A shipping method with this name already exists');
    }

    const updateData: any = { ...updateShippingMethodDto };
    if (updateShippingMethodDto.baseCost !== undefined) updateData.baseCost = updateShippingMethodDto.baseCost.toString();
    if (updateShippingMethodDto.costPerKg !== undefined) updateData.costPerKg = updateShippingMethodDto.costPerKg.toString();

    const [updatedShippingMethod] = await db
      .update(shippingMethods)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(shippingMethods.id, id))
      .returning();

    return updatedShippingMethod;
  }

  async deleteShippingMethod(id: string): Promise<void> {
    const deleted = await db
      .delete(shippingMethods)
      .where(eq(shippingMethods.id, id))
      .returning({ id: shippingMethods.id });

    if (!deleted.length) throw new NotFoundError('Shipping method not found');
  }

  async getAllShippingMethods(
    page: number = 1,
    limit: number = PAGINATION.DEFAULT_LIMIT,
    filters: { isActive?: boolean } = {}
  ): Promise<{ shippingMethods: any[]; total: number }> {
    const safePage = Number.isFinite(page) ? Math.max(1, Math.trunc(page)) : 1;
    const safeLimit = Number.isFinite(limit) ? Math.min(PAGINATION.MAX_LIMIT, Math.max(1, Math.trunc(limit))) : PAGINATION.DEFAULT_LIMIT;
    const offset = (safePage - 1) * safeLimit;

    const conditions = [];
    if (filters.isActive !== undefined) conditions.push(eq(shippingMethods.isActive, filters.isActive));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [shippingMethodsResult, [countResult]] = await Promise.all([
      db
        .select()
        .from(shippingMethods)
        .where(whereClause)
        .orderBy(desc(shippingMethods.createdAt))
        .limit(safeLimit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(shippingMethods)
        .where(whereClause),
    ]);

    return {
      shippingMethods: shippingMethodsResult,
      total: countResult ? Number(countResult.count) : 0,
    };
  }

  async quote(items: Array<{ productId: string; quantity: number }>): Promise<any> {
    if (!items.length) throw new ValidationError('At least one item is required');

    const productIds = [...new Set(items.map((item) => item.productId))];
    const rows = await db.select().from(products).where(inArray(products.id, productIds));
    const productMap = new Map(rows.map((product) => [product.id, product]));

    let subtotalCents = 0;
    let weightGrams = 0;

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) throw new NotFoundError(`Product ${item.productId} not found`);
      if (!product.isActive) throw new ConflictError(`Product "${product.name}" is not available`, 'PRODUCT_INACTIVE');
      if (product.stockQuantity < item.quantity) {
        throw new ConflictError(`Insufficient stock for product "${product.name}"`, 'INSUFFICIENT_STOCK');
      }
      subtotalCents += toCents(product.price) * item.quantity;
      weightGrams += (product.weightGrams ?? 0) * item.quantity;
    }

    const methods = await db.select().from(shippingMethods).where(eq(shippingMethods.isActive, true));

    return {
      subtotal: fromCents(subtotalCents),
      weightGrams,
      options: methods.map((method) => ({
        id: method.id,
        name: method.name,
        description: method.description,
        baseCost: method.baseCost,
        costPerKg: method.costPerKg,
        estimatedDaysMin: method.estimatedDaysMin,
        estimatedDaysMax: method.estimatedDaysMax,
        shippingCost: fromCents(calculateShippingCostCents(method, weightGrams)),
      })),
    };
  }
}
