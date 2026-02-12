import { Elysia, t } from 'elysia';
import { AddressService } from '../service/AddressService';
import { errorResponse, successResponse, successSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { NotFoundError } from '../../../core/errors';

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
            const addresses = await addressService.getUserAddresses(user!.sub, query.type);
            return successResponse(addresses, 'Addresses retrieved successfully');
        },
        {
            query: t.Object({
                type: t.Optional(t.String()),
            }),
            response: { 200: successSchema() },
            detail: { summary: 'Get all user addresses' }
        }
    )

    // Get address by ID
    .get(
        '/:id',
        async ({ params, user }) => {
            const address = await addressService.getAddressById(params.id, user!.sub);
            if (!address) throw new NotFoundError('Address not found');
            return successResponse(address, 'Address retrieved successfully');
        },
        {
            params: t.Object({ id: t.String() }),
            response: { 200: successSchema(), 404: errorSchema },
            detail: { summary: 'Get address by ID' }
        }
    )

    // Create new address
    .post(
        '/',
        async ({ body, user, set }) => {
            const address = await addressService.createAddress(user!.sub, body);
            set.status = 201;
            return successResponse(address, 'Address created successfully', 201);
        },
        {
            body: t.Object({
                type: t.Union([t.Literal('shipping'), t.Literal('billing'), t.Literal('both')]),
                fullName: t.String({ minLength: 1 }),
                phoneNumber: t.String({ minLength: 1 }),
                addressLine1: t.String({ minLength: 1 }),
                addressLine2: t.Optional(t.String()),
                city: t.String({ minLength: 1 }),
                state: t.String({ minLength: 1 }),
                postalCode: t.String({ minLength: 1 }),
                country: t.String({ minLength: 1 }),
                isDefault: t.Optional(t.Boolean()),
            }),
            response: { 201: successSchema(), 400: errorSchema, 422: errorSchema },
            detail: { summary: 'Create new address' }
        }
    )

    // Update address
    .put(
        '/:id',
        async ({ params, body, user }) => {
            const address = await addressService.updateAddress(params.id, user!.sub, body);
            return successResponse(address, 'Address updated successfully');
        },
        {
            params: t.Object({ id: t.String() }),
            body: t.Object({
                type: t.Optional(t.Union([t.Literal('shipping'), t.Literal('billing'), t.Literal('both')])),
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
            response: { 200: successSchema(), 400: errorSchema, 404: errorSchema },
            detail: { summary: 'Update address' }
        }
    )

    // Delete address
    .delete(
        '/:id',
        async ({ params, user }) => {
            await addressService.deleteAddress(params.id, user!.sub);
            return successResponse(null, 'Address deleted successfully');
        },
        {
            params: t.Object({ id: t.String() }),
            response: { 200: successSchema(t.Null()), 404: errorSchema },
            detail: { summary: 'Delete address' }
        }
    )

    // Set default address
    .post(
        '/:id/set-default',
        async ({ params, user }) => {
            const address = await addressService.setDefaultAddress(params.id, user!.sub);
            return successResponse(address, 'Default address set successfully');
        },
        {
            params: t.Object({ id: t.String() }),
            response: { 200: successSchema(), 404: errorSchema },
            detail: { summary: 'Set address as default' }
        }
    );
