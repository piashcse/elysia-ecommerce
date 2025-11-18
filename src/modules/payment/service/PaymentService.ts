import { AppDataSource } from '../../../config/database';
import { Payment } from '../entity/Payment';
import { Order } from '../../order/entity/Order';
import { CreatePaymentDto, UpdatePaymentDto, ProcessPaymentDto } from '../dto/PaymentDto';
import { NotFoundError, ConflictError, ValidationError } from '../../../core/errors';
import { PaymentStatus } from '../entity/Payment';

export class PaymentService {
  private paymentRepository = AppDataSource.getRepository(Payment);
  private orderRepository = AppDataSource.getRepository(Order);

  async createPayment(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    // Check if order exists
    const order = await this.orderRepository.findOne({ where: { id: createPaymentDto.orderId } });
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Check if payment already exists for this order
    const existingPayment = await this.paymentRepository.findOne({ 
      where: { order: { id: createPaymentDto.orderId } } 
    });
    
    if (existingPayment) {
      throw new ConflictError('Payment already exists for this order');
    }

    // Verify amount matches order total
    if (createPaymentDto.amount !== order.totalAmount) {
      throw new ValidationError('Payment amount does not match order total');
    }

    const payment = new Payment();
    payment.order = order;
    payment.method = createPaymentDto.method;
    payment.amount = createPaymentDto.amount;
    payment.status = PaymentStatus.PENDING;
    payment.metadata = createPaymentDto.metadata;

    return this.paymentRepository.save(payment);
  }

  async processPayment(processPaymentDto: ProcessPaymentDto): Promise<Payment> {
    // Check if order exists
    const order = await this.orderRepository.findOne({ where: { id: processPaymentDto.orderId } });
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Check if payment already exists for this order
    let payment = await this.paymentRepository.findOne({ 
      where: { order: { id: processPaymentDto.orderId } } 
    });

    if (!payment) {
      // Create payment if it doesn't exist
      payment = new Payment();
      payment.order = order;
      payment.method = processPaymentDto.method;
      payment.amount = processPaymentDto.amount;
      payment.metadata = { paymentDetails: processPaymentDto.paymentDetails };
      payment.status = PaymentStatus.PENDING;
    } else {
      // Update payment details if payment exists
      payment.metadata = {
        ...payment.metadata,
        paymentDetails: processPaymentDto.paymentDetails
      };
      payment.method = processPaymentDto.method;
    }

    // Validate payment details based on method
    this.validatePaymentDetails(processPaymentDto.method, processPaymentDto.paymentDetails);

    // Simulate payment processing (in a real app, this would call a payment gateway)
    try {
      const paymentResult = await this.simulatePayment(processPaymentDto);
      
      payment.status = paymentResult.status;
      payment.transactionId = paymentResult.transactionId;
      payment.metadata = {
        ...payment.metadata,
        ...paymentResult.metadata
      };
      
      // Update order status based on payment result
      if (payment.status === PaymentStatus.COMPLETED) {
        order.status = 'confirmed'; // Update when we have proper order status enum
        await this.orderRepository.save(order);
      }
      
      return this.paymentRepository.save(payment);
    } catch (error) {
      payment.status = PaymentStatus.FAILED;
      await this.paymentRepository.save(payment);
      throw error;
    }
  }

  private validatePaymentDetails(method: string, details: any): void {
    if (method === 'credit_card' || method === 'debit_card') {
      if (!details.cardNumber || !details.cardExpiry || !details.cardCvv) {
        throw new ValidationError('Credit/debit card details are incomplete');
      }
    } else if (method === 'paypal') {
      if (!details.paypalEmail) {
        throw new ValidationError('PayPal email is required');
      }
    }
  }

  private async simulatePayment(processPaymentDto: ProcessPaymentDto): Promise<{
    status: PaymentStatus;
    transactionId: string;
    metadata?: any;
  }> {
    // In a real application, this would be replaced with an actual payment gateway integration
    return new Promise((resolve, reject) => {
      // Simulate processing time
      setTimeout(() => {
        // Randomly determine if payment succeeds (90% success rate for simulation)
        const success = Math.random() > 0.1;
        
        if (success) {
          resolve({
            status: PaymentStatus.COMPLETED,
            transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            metadata: {
              processedAt: new Date().toISOString(),
              method: processPaymentDto.method
            }
          });
        } else {
          reject(new Error('Payment processing failed'));
        }
      }, 1000); // Simulate 1 second processing time
    });
  }

  async getPaymentById(paymentId: string): Promise<Payment | null> {
    return this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['order']
    });
  }

  async getPaymentsByOrder(orderId: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { order: { id: orderId } },
      order: { createdAt: 'DESC' }
    });
  }

  async getPaymentsByUser(userId: string, page: number = 1, limit: number = 10): Promise<{ payments: Payment[]; total: number }> {
    const [payments, total] = await this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.order', 'order')
      .where('order.user.id = :userId', { userId })
      .orderBy('payment.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { payments, total };
  }

  async updatePayment(paymentId: string, updatePaymentDto: UpdatePaymentDto): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({ where: { id: paymentId } });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    // Prevent updating completed or failed payments
    if (payment.status === PaymentStatus.COMPLETED || payment.status === PaymentStatus.FAILED) {
      throw new ConflictError('Cannot update a completed or failed payment');
    }

    payment.status = updatePaymentDto.status;
    
    if (updatePaymentDto.transactionId) {
      payment.transactionId = updatePaymentDto.transactionId;
    }
    
    if (updatePaymentDto.metadata) {
      payment.metadata = { ...payment.metadata, ...updatePaymentDto.metadata };
    }

    return this.paymentRepository.save(payment);
  }

  async refundPayment(paymentId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({ where: { id: paymentId } });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new ConflictError('Cannot refund a payment that is not completed');
    }

    // In a real app, this would call the payment gateway to process the refund
    payment.status = PaymentStatus.REFUNDED;
    payment.metadata = {
      ...payment.metadata,
      refundedAt: new Date().toISOString()
    };

    return this.paymentRepository.save(payment);
  }

  async getPayments(
    page: number = 1,
    limit: number = 10,
    filters: {
      status?: PaymentStatus;
      method?: string;
      dateFrom?: string;
      dateTo?: string;
      orderId?: string;
      userId?: string;
    } = {}
  ): Promise<{ payments: Payment[]; total: number }> {
    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.order', 'order')
      .leftJoinAndSelect('order.user', 'user')
      .orderBy('payment.createdAt', 'DESC');

    // Apply filters
    if (filters.status) {
      queryBuilder.andWhere('payment.status = :status', { status: filters.status });
    }

    if (filters.method) {
      queryBuilder.andWhere('payment.method = :method', { method: filters.method });
    }

    if (filters.dateFrom) {
      queryBuilder.andWhere('payment.createdAt >= :dateFrom', { dateFrom: new Date(filters.dateFrom) });
    }

    if (filters.dateTo) {
      queryBuilder.andWhere('payment.createdAt <= :dateTo', { dateTo: new Date(filters.dateTo) });
    }

    if (filters.orderId) {
      queryBuilder.andWhere('payment.order.id = :orderId', { orderId: filters.orderId });
    }

    if (filters.userId) {
      queryBuilder.andWhere('order.user.id = :userId', { userId: filters.userId });
    }

    const [payments, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { payments, total };
  }

  async getPaymentStats(userId?: string) {
    const queryBuilder = this.paymentRepository.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.order', 'order');
    
    if (userId) {
      queryBuilder.where('order.user.id = :userId', { userId });
    }

    const [totalPayments, successfulPayments, totalRevenue] = await Promise.all([
      // Total payments
      queryBuilder.getCount(),
      
      // Successful payments
      queryBuilder
        .andWhere('payment.status = :status', { status: PaymentStatus.COMPLETED })
        .getCount(),
        
      // Total revenue
      queryBuilder
        .select('SUM(payment.amount)', 'total')
        .andWhere('payment.status = :status', { status: PaymentStatus.COMPLETED })
        .getRawOne()
        .then(result => result.total || 0)
    ]);

    return {
      totalPayments,
      successfulPayments,
      totalRevenue: parseFloat(totalRevenue),
      successRate: totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0,
    };
  }
}