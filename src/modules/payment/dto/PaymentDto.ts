export type PaymentMethod =
  | 'credit_card'
  | 'debit_card'
  | 'paypal'
  | 'bank_transfer'
  | 'cash_on_delivery';

export interface PaymentDetails {
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
  cardHolderName?: string;
  paypalEmail?: string;
}

export interface CreatePaymentDto {
  orderId: string;
  method: PaymentMethod;
  amount: number;
  transactionId?: string;
  paymentGateway?: string;
  metadata?: Record<string, unknown>;
}

export interface ProcessPaymentDto {
  orderId: string;
  method: PaymentMethod;
  amount: number;
  paymentDetails: PaymentDetails;
}
