import { Elysia, t } from 'elysia';
import { eq } from 'drizzle-orm';
import { db } from '../../../config/database';
import { orders, payments } from '../../../database/schema';
import { successResponse, successSchema, errorSchema } from '../../../core/responses';
import { ForbiddenError, NotFoundError } from '../../../core/errors';
import { paymentProvider } from '../providers/simulated';
import { IdempotencyService } from '../../../core/idempotency.service';
import { OrderEventService } from '../../order/service/OrderEventService';

const idempotency = new IdempotencyService();
const events = new OrderEventService();

export const paymentWebhookController = new Elysia({ tags: ['Payment'] })
  .post('/payments/webhook', {
    body: t.Object({
      id: t.String({ minLength: 1, maxLength: 100 }),
      type: t.String({ minLength: 1, maxLength: 100 }),
      data: t.Object({
        orderId: t.Optional(t.String()),
        paymentId: t.Optional(t.String()),
        transactionId: t.Optional(t.String()),
        amount: t.Optional(t.Number()),
      }),
    }),
    response: { 200: successSchema(), 400: errorSchema, 403: errorSchema, 404: errorSchema },
    detail: { summary: 'Receive a payment provider webhook' }
  }, async ({ body, headers }) => {
    const signature = headers['x-payment-signature'];
    if (!paymentProvider.verifyWebhook(JSON.stringify(body), signature)) {
      throw new ForbiddenError('Invalid webhook signature');
    }

    const key = `webhook:${body.id}`;
    if (await idempotency.get(key, 'payment:webhook')) {
      return successResponse({ received: true }, 'Webhook already processed');
    }

    let [payment] = body.data.paymentId
      ? await db.select().from(payments).where(eq(payments.id, body.data.paymentId)).limit(1)
      : [];

    if (!payment && body.data.orderId) {
      [payment] = await db.select().from(payments).where(eq(payments.orderId, body.data.orderId)).limit(1);
    }
    if (!payment) throw new NotFoundError('Payment not found');

    if (body.type === 'payment.completed') {
      await db.update(payments).set({
        status: 'completed',
        transactionId: body.data.transactionId ?? payment.transactionId,
        paymentGateway: paymentProvider.name,
        updatedAt: new Date(),
      }).where(eq(payments.id, payment.id));

      if (payment.orderId) {
        await db.update(orders).set({ status: 'processing', paymentExpiresAt: null, updatedAt: new Date() }).where(eq(orders.id, payment.orderId));
        await events.add(payment.orderId, 'payment_completed', 'Payment completed via webhook');
      }
    } else if (body.type === 'payment.failed') {
      await db.update(payments).set({ status: 'failed', updatedAt: new Date() }).where(eq(payments.id, payment.id));
      if (payment.orderId) await events.add(payment.orderId, 'payment_failed', 'Payment failed via webhook');
    } else if (body.type === 'refund.completed') {
      await db.update(payments).set({
        status: 'refunded',
        refundedAmount: payment.amount,
        updatedAt: new Date(),
      }).where(eq(payments.id, payment.id));
      if (payment.orderId) {
        await db.update(orders).set({ status: 'refunded', updatedAt: new Date() }).where(eq(orders.id, payment.orderId));
        await events.add(payment.orderId, 'refunded', 'Refund completed via webhook');
      }
    } else {
      await idempotency.save(key, 'payment:webhook', 200, { received: true }, null);
      return successResponse({ received: true, ignored: body.type }, 'Webhook ignored');
    }

    const response = { received: true };
    await idempotency.save(key, 'payment:webhook', 200, response, null);
    return successResponse(response, 'Webhook processed successfully');
  });
