import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../../../config/database';
import { addresses } from '../../../database/schema';
import { CreateAddressDto, UpdateAddressDto } from '../dto/AddressDto';
import { NotFoundError } from '../../../core/errors';
import { BaseService } from '../../../core/base.service';

type AddressType = 'shipping' | 'billing' | 'both';

export class AddressService extends BaseService {
  constructor() {
    super(addresses);
  }

  private defaultTypesFor(type: AddressType): AddressType[] {
    return type === 'both' ? ['shipping', 'billing', 'both'] : [type, 'both'];
  }

  async createAddress(userId: string, createAddressDto: CreateAddressDto): Promise<any> {
    return db.transaction(async (tx) => {
      if (createAddressDto.isDefault) {
        const types = this.defaultTypesFor(createAddressDto.type);
        await tx
          .update(addresses)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(and(eq(addresses.userId, userId), inArray(addresses.type, types)));
      }

      const [address] = await tx
        .insert(addresses)
        .values({
          ...createAddressDto,
          userId,
        })
        .returning();

      return address;
    });
  }

  async getAddressById(addressId: string, userId: string): Promise<any | null> {
    const [address] = await db
      .select()
      .from(addresses)
      .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
      .limit(1);

    return address || null;
  }

  async getUserAddresses(userId: string, type?: AddressType): Promise<any[]> {
    const conditions = [eq(addresses.userId, userId)];
    if (type) conditions.push(eq(addresses.type, type));

    return db
      .select()
      .from(addresses)
      .where(and(...conditions))
      .orderBy(desc(addresses.isDefault), desc(addresses.createdAt));
  }

  async updateAddress(addressId: string, userId: string, updateAddressDto: UpdateAddressDto): Promise<any> {
    const address = await this.getAddressById(addressId, userId);
    if (!address) throw new NotFoundError('Address not found');

    const targetType = (updateAddressDto.type ?? address.type) as AddressType;
    const shouldBeDefault = updateAddressDto.isDefault === true ||
      (address.isDefault && updateAddressDto.isDefault !== false);

    return db.transaction(async (tx) => {
      if (shouldBeDefault) {
        const types = this.defaultTypesFor(targetType);
        await tx
          .update(addresses)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(and(
            eq(addresses.userId, userId),
            inArray(addresses.type, types),
            sql`${addresses.id} <> ${addressId}`
          ));
      }

      const [updated] = await tx
        .update(addresses)
        .set({
          ...updateAddressDto,
          ...(updateAddressDto.isDefault === undefined && address.isDefault ? { isDefault: true } : {}),
          updatedAt: new Date(),
        })
        .where(eq(addresses.id, addressId))
        .returning();

      return updated;
    });
  }

  async deleteAddress(addressId: string, userId: string): Promise<void> {
    const address = await this.getAddressById(addressId, userId);
    if (!address) throw new NotFoundError('Address not found');

    await db.transaction(async (tx) => {
      await tx.delete(addresses).where(eq(addresses.id, addressId));

      if (address.isDefault) {
        const [replacement] = await tx
          .select()
          .from(addresses)
          .where(and(eq(addresses.userId, userId), eq(addresses.type, address.type)))
          .orderBy(desc(addresses.createdAt))
          .limit(1);

        if (replacement) {
          await tx.update(addresses).set({ isDefault: true, updatedAt: new Date() }).where(eq(addresses.id, replacement.id));
        }
      }
    });
  }

  async setDefaultAddress(addressId: string, userId: string): Promise<any> {
    const address = await this.getAddressById(addressId, userId);
    if (!address) throw new NotFoundError('Address not found');

    return db.transaction(async (tx) => {
      const types = this.defaultTypesFor(address.type as AddressType);
      await tx
        .update(addresses)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(and(
          eq(addresses.userId, userId),
          inArray(addresses.type, types),
          sql`${addresses.id} <> ${addressId}`
        ));

      const [updated] = await tx
        .update(addresses)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(eq(addresses.id, addressId))
        .returning();

      return updated;
    });
  }
}
