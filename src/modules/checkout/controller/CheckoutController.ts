import { Elysia, t } from 'elysia';
import { OrderService } from '../../order/service/OrderService';
import { successResponse, successSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { uuid } from '../../../core/schemas';
import { ValidationError } from '../../../core/errors';

const orderService = new OrderService();

export const checkoutController = new Elysia({ prefix: '/checkout', tags: ['Checkout'] })
  .use(authPlugin)
  .post('/quote', {
    body: t.Object({
      items: t.Array(
        t.Object({
          productId: uuid,
          variantId: t.Optional(uuid),
          quantity: t.Integer({ minimum: 1, maximum: 100 }),
        }),
        { minItems: 1, maxItems: 50 }
      ),
      couponCode: t.Optional(t.String({ maxLength: 50 })),
      couponCodes: t.Optional(t.Array(t.String({ maxLength: 50 }), { maxItems: 5 })),
      currency: t.Optional(t.String({ minLength: 3, maxLength: 3 })),
      giftCardCode: t.Optional(t.String({ maxLength: 50 })),
      shippingMethodId: t.Optional(uuid),
      email: t.Optional(t.String({ format: 'email', maxLength: 255 })),
      country: t.Optional(t.String({ maxLength: 100 })),
    }),
    response: { 200: successSchema(), 409: errorSchema, 422: errorSchema },
    detail: { summary: 'Calculate order totals without creating an order' }
  }, async ({ body, user }) => {
    if (!user && !body.email) throw new ValidationError('Email is required for guest checkout');
    const quote = await orderService.quote(user?.sub, body.email ?? '', body.items, {
      couponCode: body.couponCode,
      couponCodes: body.couponCodes,
      currency: body.currency,
      giftCardCode: body.giftCardCode,
      shippingMethodId: body.shippingMethodId,
      country: body.country,
    });
    return successResponse(quote, 'Checkout quote calculated successfully');
  });
