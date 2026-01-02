import { Elysia, t } from 'elysia';
import { AddressService } from '../service/AddressService';
import { addressIdSchema, createAddressSchema, updateAddressSchema } from '../validators/AddressValidator';
import { validate } from '../../../utils/validation';
import { errorResponse, successResponse } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';

const addressService = new AddressService();

export const addressController = new Elysia({ prefix: '/addresses', tags: ['Address'] })
    .use(authPlugin)
    .guard({
        isAuth: true
    })

    // Get all user addresses
    .get(
        '/',
        async ({ query, user }) => {
            const type = query.type as string | undefined;
            const addresses = await addressService.getUserAddresses(user!.sub, type);
            return successResponse(addresses, 'Addresses retrieved successfully');
        },
        {
            query: t.Object({
                type: t.Optional(t.String()),
            }),
            response: { 200: t.Any() },
            detail: { summary: 'Get all user addresses' }
        }
    )

    // Get address by ID
    .get(
        '/:id',
        async ({ params, user, set }) => {
            const { id } = params;
            validate(addressIdSchema, { id });
            const address = await addressService.getAddressById(id, user!.sub);

            if (!address) {
                set.status = 404;
                return errorResponse('Address not found', 'NOT_FOUND', 404);
            }

            return successResponse(address, 'Address retrieved successfully');
        },
        {
            params: t.Object({ id: t.String() }),
            response: { 200: t.Any(), 404: t.Any() },
            detail: { summary: 'Get address by ID' }
        }
    )

    // Create new address
    .post(
        '/',
        async ({ body, user, set }) => {
            const validatedData = validate(createAddressSchema, body);
            const address = await addressService.createAddress(user!.sub, validatedData);

            set.status = 201;
            return successResponse(address, 'Address created successfully', 201);
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
            response: { 201: t.Any(), 400: t.Any(), 422: t.Any() },
            detail: { summary: 'Create new address' }
        }
    )

    // Update address
    .put(
        '/:id',
        async ({ params, body, user }) => {
            const { id } = params;
            validate(addressIdSchema, { id });
            const validatedData = validate(updateAddressSchema, body);
            const address = await addressService.updateAddress(id, user!.sub, validatedData);

            return successResponse(address, 'Address updated successfully');
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
            response: { 200: t.Any(), 400: t.Any(), 404: t.Any() },
            detail: { summary: 'Update address' }
        }
    )

    // Delete address
    .delete(
        '/:id',
        async ({ params, user }) => {
            const { id } = params;
            validate(addressIdSchema, { id });
            await addressService.deleteAddress(id, user!.sub);

            return successResponse(null, 'Address deleted successfully');
        },
        {
            params: t.Object({ id: t.String() }),
            response: { 200: t.Any(), 404: t.Any() },
            detail: { summary: 'Delete address' }
        }
    )

    // Set default address
    .post(
        '/:id/set-default',
        async ({ params, user }) => {
            const { id } = params;
            validate(addressIdSchema, { id });
            const address = await addressService.setDefaultAddress(id, user!.sub);

            return successResponse(address, 'Default address set successfully');
        },
        {
            params: t.Object({ id: t.String() }),
            response: { 200: t.Any(), 404: t.Any() },
            detail: { summary: 'Set address as default' }
        }
    );
