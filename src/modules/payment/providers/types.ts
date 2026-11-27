export interface ChargeInput {
  orderId: string;
  amountCents: number;
  method: string;
  paymentMethodToken?: string;
  metadata?: Record<string, unknown>;
}

export interface ChargeResult {
  status: 'completed' | 'failed' | 'pending';
  transactionId?: string;
  gateway: string;
}

export interface PaymentProvider {
  readonly name: string;
  charge(input: ChargeInput): Promise<ChargeResult>;
  refund(input: { transactionId?: string | null; amountCents: number }): Promise<{ status: 'refunded' | 'failed'; transactionId?: string }>;
  verifyWebhook(rawBody: string, signature: string | undefined): boolean;
}
