// Payment DTOs (Data Transfer Objects)
export type PaymentMethod = 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer' | 'cash_on_delivery';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface CreatePaymentDto {
  orderId: string;
  method: PaymentMethod;
  amount: number;
  transactionId?: string;
  paymentGateway?: string;
  metadata?: Record<string, any>;
}

export interface ProcessPaymentDto {
  orderId: string;
  method: PaymentMethod;
  amount: number;
  paymentDetails: {
    cardNumber?: string;
    cardExpiry?: string;
    cardCvv?: string;
    cardHolderName?: string;
    paypalEmail?: string;
  };
}

export interface UpdatePaymentDto {
  status: PaymentStatus;
  transactionId?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponseDto {
  id: string;
  orderId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  transactionId: string | null;
  paymentGateway: string | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}