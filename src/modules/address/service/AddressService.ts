import { db } from '../../../config/database';
import { addresses } from '../../../database/schema';
import { and, eq } from 'drizzle-orm';
import { CreateAddressDto, UpdateAddressDto } from '../dto/AddressDto';
import { NotFoundError } from '../../../core/errors';
import { BaseService } from '../../../core/base.service';

export class AddressService extends BaseService<typeof addresses> {
    constructor() {
        super(addresses);
    }

    async createAddress(userId: string, createAddressDto: CreateAddressDto): Promise<any> {
        if (createAddressDto.isDefault) {
            await db
                .update(addresses)
                .set({ isDefault: false })
                .where(and(
                    eq(addresses.userId, userId),
                    eq(addresses.type, createAddressDto.type as any)
                ));
        }

        return this.create({
            ...createAddressDto,
            userId,
            isActive: true
        });
    }

    async getAddressById(addressId: string, userId: string): Promise<any | null> {
        const [address] = await db
            .select()
            .from(addresses)
            .where(and(
                eq(addresses.id, addressId),
                eq(addresses.userId, userId)
            ))
            .limit(1);

        return address || null;
    }

    async getUserAddresses(userId: string, type?: string): Promise<any[]> {
        const conditions = [eq(addresses.userId, userId)];
        if (type) conditions.push(eq(addresses.type, type as any));

        return db
            .select()
            .from(addresses)
            .where(and(...conditions))
            .orderBy(addresses.isDefault);
    }

    async updateAddress(addressId: string, userId: string, updateAddressDto: UpdateAddressDto): Promise<any> {
        const address = await this.getAddressById(addressId, userId);
        if (!address) throw new NotFoundError('Address not found');

        if (updateAddressDto.isDefault) {
            const targetType = updateAddressDto.type || address.type;
            await db
                .update(addresses)
                .set({ isDefault: false })
                .where(and(
                    eq(addresses.userId, userId),
                    eq(addresses.type, targetType as any)
                ));
        }

        return this.update(addressId, updateAddressDto);
    }

    async deleteAddress(addressId: string, userId: string): Promise<void> {
        const address = await this.getAddressById(addressId, userId);
        if (!address) throw new NotFoundError('Address not found');

        return this.delete(addressId);
    }

    async setDefaultAddress(addressId: string, userId: string): Promise<any> {
        const address = await this.getAddressById(addressId, userId);
        if (!address) throw new NotFoundError('Address not found');

        await db
            .update(addresses)
            .set({ isDefault: false })
            .where(and(
                eq(addresses.userId, userId),
                eq(addresses.type, address.type)
            ));

        return this.update(addressId, { isDefault: true });
    }
}
