import { Payment, PaymentMethod, PaymentStatus } from '../entity/Payment';

// Payment DTOs (Data Transfer Objects)
export interface CreatePaymentDto {
  orderId: string;
  method: PaymentMethod;
  amount: number;
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
  order: {
    id: string;
    totalAmount: number;
    status: string;
  };
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  transactionId: string | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentListResponseDto {
  id: string;
  orderId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  transactionId: string | null;
  createdAt: Date;
}