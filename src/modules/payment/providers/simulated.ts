import { PaymentRequiredError } from '../../../core/errors';
import envConfig from '../../../config/env';
import { ChargeInput, ChargeResult, PaymentProvider } from './types';
import { createHmac, timingSafeEqual } from 'crypto';

export class SimulatedPaymentProvider implements PaymentProvider {
  readonly name = 'simulated';

  async charge(input: ChargeInput): Promise<ChargeResult> {
    if (input.method === 'bank_transfer' || input.method === 'cash_on_delivery') {
      return { status: 'pending', gateway: this.name };
    }

    if (Math.random() < envConfig.PAYMENT_SIMULATE_FAILURE_RATE) {
      throw new PaymentRequiredError('Payment processing failed', 'PAYMENT_FAILED');
    }

    return {
      status: 'completed',
      transactionId: `txn_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
      gateway: this.name,
    };
  }

  async refund(_input: { transactionId?: string | null; amountCents: number }) {
    return {
      status: 'refunded' as const,
      transactionId: `refund_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
    };
  }

  verifyWebhook(rawBody: string, signature: string | undefined): boolean {
    if (!signature) return false;
    const expected = createHmac('sha256', envConfig.PAYMENT_WEBHOOK_SECRET).update(rawBody).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    return a.length === b.length && timingSafeEqual(a, b);
  }
}

export const paymentProvider: PaymentProvider = new SimulatedPaymentProvider();
