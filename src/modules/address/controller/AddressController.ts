import { Elysia, t } from 'elysia';
import { AddressService } from '../service/AddressService';
import { successResponse, successSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { idParams } from '../../../core/schemas';
import { NotFoundError } from '../../../core/errors';

const addressService = new AddressService();

const addressTypeSchema = t.Union([
  t.Literal('shipping'),
  t.Literal('billing'),
  t.Literal('both'),
]);

export const addressController = new Elysia({ prefix: '/addresses', tags: ['Address'] })
  .use(authPlugin)
  .guard({
    isAuth: true
  })
  .get('/', {
    query: t.Object({
      type: t.Optional(addressTypeSchema),
    }),
    response: { 200: successSchema() },
    detail: { summary: 'Get all user addresses' }
  }, async ({ query, user }) => {
    const addresses = await addressService.getUserAddresses(user!.sub, query.type as any);
    return successResponse(addresses, 'Addresses retrieved successfully');
  })

  .get('/:id', {
    params: idParams,
    response: { 200: successSchema(), 404: errorSchema },
    detail: { summary: 'Get address by ID' }
  }, async ({ params, user }) => {
    const address = await addressService.getAddressById(params.id, user!.sub);
    if (!address) throw new NotFoundError('Address not found');
    return successResponse(address, 'Address retrieved successfully');
  })

  .post('/', {
    body: t.Object({
      type: addressTypeSchema,
      fullName: t.String({ minLength: 1, maxLength: 200 }),
      phoneNumber: t.String({ minLength: 1, maxLength: 20 }),
      addressLine1: t.String({ minLength: 1, maxLength: 255 }),
      addressLine2: t.Optional(t.String({ maxLength: 255 })),
      city: t.String({ minLength: 1, maxLength: 100 }),
      state: t.String({ minLength: 1, maxLength: 100 }),
      postalCode: t.String({ minLength: 1, maxLength: 20 }),
      country: t.String({ minLength: 1, maxLength: 100 }),
      isDefault: t.Optional(t.Boolean()),
    }),
    response: { 201: successSchema(), 400: errorSchema, 422: errorSchema },
    detail: { summary: 'Create new address' }
  }, async ({ body, user, set }) => {
    const address = await addressService.createAddress(user!.sub, body as any);
    set.status = 201;
    return successResponse(address, 'Address created successfully', 201);
  })

  .put('/:id', {
    params: idParams,
    body: t.Object({
      type: t.Optional(addressTypeSchema),
      fullName: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
      phoneNumber: t.Optional(t.String({ minLength: 1, maxLength: 20 })),
      addressLine1: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
      addressLine2: t.Optional(t.String({ maxLength: 255 })),
      city: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
      state: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
      postalCode: t.Optional(t.String({ minLength: 1, maxLength: 20 })),
      country: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
      isDefault: t.Optional(t.Boolean()),
    }),
    response: { 200: successSchema(), 400: errorSchema, 404: errorSchema },
    detail: { summary: 'Update address' }
  }, async ({ params, body, user }) => {
    const address = await addressService.updateAddress(params.id, user!.sub, body as any);
    return successResponse(address, 'Address updated successfully');
  })

  .delete('/:id', {
    params: idParams,
    response: { 200: successSchema(t.Null()), 404: errorSchema },
    detail: { summary: 'Delete address' }
  }, async ({ params, user }) => {
    await addressService.deleteAddress(params.id, user!.sub);
    return successResponse(null, 'Address deleted successfully');
  })

  .post('/:id/set-default', {
    params: idParams,
    response: { 200: successSchema(), 404: errorSchema },
    detail: { summary: 'Set address as default' }
  }, async ({ params, user }) => {
    const address = await addressService.setDefaultAddress(params.id, user!.sub);
    return successResponse(address, 'Default address set successfully');
  });
