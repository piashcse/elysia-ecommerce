import {db} from '../../../config/database';
import {addresses} from '../../../database/schema';
import {and, eq} from 'drizzle-orm';
import {CreateAddressDto, UpdateAddressDto} from '../dto/AddressDto';
import {NotFoundError} from '../../../core/errors';

export class AddressService {
    async createAddress(userId: string, createAddressDto: CreateAddressDto): Promise<any> {
        // If setting as default, unset other default addresses of the same type
        if (createAddressDto.isDefault) {
            await db
                .update(addresses)
                .set({ isDefault: false })
                .where(and(
                    eq(addresses.userId, userId),
                    eq(addresses.type, createAddressDto.type as any)
                ));
        }

        const [newAddress] = await db.insert(addresses).values({
            userId,
            type: createAddressDto.type as any,
            fullName: createAddressDto.fullName,
            phoneNumber: createAddressDto.phoneNumber,
            addressLine1: createAddressDto.addressLine1,
            addressLine2: createAddressDto.addressLine2,
            city: createAddressDto.city,
            state: createAddressDto.state,
            postalCode: createAddressDto.postalCode,
            country: createAddressDto.country,
            isDefault: createAddressDto.isDefault ?? false,
        }).returning();

        return newAddress;
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

        if (type) {
            conditions.push(eq(addresses.type, type as any));
        }

        const userAddresses = await db
            .select()
            .from(addresses)
            .where(and(...conditions))
            .orderBy(addresses.isDefault);

        return userAddresses;
    }

    async updateAddress(addressId: string, userId: string, updateAddressDto: UpdateAddressDto): Promise<any> {
        const address = await this.getAddressById(addressId, userId);

        if (!address) {
            throw new NotFoundError('Address not found');
        }

        // If setting as default, unset other default addresses of the same type
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

        const [updatedAddress] = await db
            .update(addresses)
            .set(updateAddressDto as any)
            .where(eq(addresses.id, addressId))
            .returning();

        return updatedAddress;
    }

    async deleteAddress(addressId: string, userId: string): Promise<void> {
        const address = await this.getAddressById(addressId, userId);

        if (!address) {
            throw new NotFoundError('Address not found');
        }

        await db.delete(addresses).where(eq(addresses.id, addressId));
    }

    async setDefaultAddress(addressId: string, userId: string): Promise<any> {
        const address = await this.getAddressById(addressId, userId);

        if (!address) {
            throw new NotFoundError('Address not found');
        }

        // Unset other default addresses of the same type
        await db
            .update(addresses)
            .set({ isDefault: false })
            .where(and(
                eq(addresses.userId, userId),
                eq(addresses.type, address.type)
            ));

        // Set this address as default
        const [updatedAddress] = await db
            .update(addresses)
            .set({ isDefault: true })
            .where(eq(addresses.id, addressId))
            .returning();

        return updatedAddress;
    }

    async getDefaultAddress(userId: string, type: string): Promise<any | null> {
        const [address] = await db
            .select()
            .from(addresses)
            .where(and(
                eq(addresses.userId, userId),
                eq(addresses.type, type as any),
                eq(addresses.isDefault, true)
            ))
            .limit(1);

        return address || null;
    }
}
