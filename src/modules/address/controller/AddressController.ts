import { Elysia, t } from 'elysia';
import { AddressService } from '../service/AddressService';
import { createAddressSchema, updateAddressSchema, addressIdSchema } from '../validators/AddressValidator';
import { validate } from '../../../utils/validation';
import { successResponse, errorResponse } from '../../../core/responses';
import { jwt } from '@elysiajs/jwt';
import envConfig from '../../../config/env';
import { JwtPayload } from '../../../utils/jwt';

const addressService = new AddressService();

export const addressController = new Elysia({ prefix: '/addresses', tags: ['Address'] })
    .use(jwt({ name: 'jwt', secret: envConfig.JWT_SECRET }))
    .derive(async ({ jwt, headers }) => {
        const authHeader = headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { user: null };
        }
        const token = authHeader.split(' ')[1];
        const payload = await jwt.verify(token);
        if (!payload) return { user: null };
        return { user: payload as unknown as JwtPayload };
    })
    .onBeforeHandle(({ user, set }) => {
        if (!user) {
            set.status = 401;
            return errorResponse('Authentication required', 'UNAUTHORIZED', 401);
        }
        return;
    })

    // Get all user addresses
    .get(
        '/',
        async ({ query, user, set }) => {
            try {
                const type = query.type as string | undefined;
                const addresses = await addressService.getUserAddresses(user!.sub, type);
                return successResponse(addresses, 'Addresses retrieved successfully');
            } catch (error: any) {
                set.status = error.statusCode || 500;
                return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
            }
        },
        {
            query: t.Object({
                type: t.Optional(t.String()),
            }),
            detail: { summary: 'Get all user addresses' }
        }
    )

    // Get address by ID
    .get(
        '/:id',
        async ({ params, user, set }) => {
            try {
                const { id } = params;
                validate(addressIdSchema, { id });
                const address = await addressService.getAddressById(id, user!.sub);

                if (!address) {
                    set.status = 404;
                    return errorResponse('Address not found', 'NOT_FOUND', 404);
                }

                return successResponse(address, 'Address retrieved successfully');
            } catch (error: any) {
                set.status = error.statusCode || 500;
                return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
            }
        },
        {
            params: t.Object({ id: t.String() }),
            detail: { summary: 'Get address by ID' }
        }
    )

    // Create new address
    .post(
        '/',
        async ({ body, user, set }) => {
            try {
                const validatedData = validate(createAddressSchema, body);
                const address = await addressService.createAddress(user!.sub, validatedData);

                set.status = 201;
                return successResponse(address, 'Address created successfully', 201);
            } catch (error: any) {
                set.status = error.statusCode || 500;
                return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
            }
        },
        {
            body: t.Object({
                type: t.String(),
                fullName: t.String(),
                phoneNumber: t.String(),
                addressLine1: t.String(),
                addressLine2: t.Optional(t.String()),
                city: t.String(),
                state: t.String(),
                postalCode: t.String(),
                country: t.String(),
                isDefault: t.Optional(t.Boolean()),
            }),
            detail: { summary: 'Create new address' }
        }
    )

    // Update address
    .put(
        '/:id',
        async ({ params, body, user, set }) => {
            try {
                const { id } = params;
                validate(addressIdSchema, { id });
                const validatedData = validate(updateAddressSchema, body);
                const address = await addressService.updateAddress(id, user!.sub, validatedData);

                return successResponse(address, 'Address updated successfully');
            } catch (error: any) {
                set.status = error.statusCode || 500;
                return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
            }
        },
        {
            params: t.Object({ id: t.String() }),
            body: t.Object({
                type: t.Optional(t.String()),
                fullName: t.Optional(t.String()),
                phoneNumber: t.Optional(t.String()),
                addressLine1: t.Optional(t.String()),
                addressLine2: t.Optional(t.String()),
                city: t.Optional(t.String()),
                state: t.Optional(t.String()),
                postalCode: t.Optional(t.String()),
                country: t.Optional(t.String()),
                isDefault: t.Optional(t.Boolean()),
            }),
            detail: { summary: 'Update address' }
        }
    )

    // Delete address
    .delete(
        '/:id',
        async ({ params, user, set }) => {
            try {
                const { id } = params;
                validate(addressIdSchema, { id });
                await addressService.deleteAddress(id, user!.sub);

                return successResponse(null, 'Address deleted successfully');
            } catch (error: any) {
                set.status = error.statusCode || 500;
                return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
            }
        },
        {
            params: t.Object({ id: t.String() }),
            detail: { summary: 'Delete address' }
        }
    )

    // Set default address
    .post(
        '/:id/set-default',
        async ({ params, user, set }) => {
            try {
                const { id } = params;
                validate(addressIdSchema, { id });
                const address = await addressService.setDefaultAddress(id, user!.sub);

                return successResponse(address, 'Default address set successfully');
            } catch (error: any) {
                set.status = error.statusCode || 500;
                return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
            }
        },
        {
            params: t.Object({ id: t.String() }),
            detail: { summary: 'Set address as default' }
        }
    );
