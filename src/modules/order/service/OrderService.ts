import { AppDataSource } from '../../../config/database';
import { Order } from '../entity/Order';
import { OrderItem } from '../entity/OrderItem';
import { User } from '../../user/entity/User';
import { Product } from '../../product/entity/Product';
import { CartService } from '../../../cart/service/CartService';
import { CreateOrderDto, UpdateOrderDto } from '../dto/OrderDto';
import { NotFoundError, ConflictError, ValidationError } from '../../../core/errors';
import { OrderStatus } from '../entity/Order';

export class OrderService {
  private orderRepository = AppDataSource.getRepository(Order);
  private orderItemRepository = AppDataSource.getRepository(OrderItem);
  private userRepository = AppDataSource.getRepository(User);
  private productRepository = AppDataSource.getRepository(Product);

  async createOrder(userId: string, createOrderDto: CreateOrderDto): Promise<Order> {
    // Check if user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Validate products and check stock
    let totalAmount = 0;
    const products: Array<{
      product: Product;
      quantity: number;
      price: number;
    }> = [];

    for (const item of createOrderDto.items) {
      const product = await this.productRepository.findOne({ where: { id: item.productId } });
      if (!product) {
        throw new NotFoundError(`Product with ID ${item.productId} not found`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for product ${product.name}`);
      }

      products.push({
        product,
        quantity: item.quantity,
        price: parseFloat(product.price.toString())
      });

      totalAmount += item.quantity * parseFloat(product.price.toString());
    }

    // Create order
    const order = new Order();
    order.user = user;
    order.totalAmount = totalAmount;
    order.status = OrderStatus.PENDING;
    order.shippingAddress = createOrderDto.shippingAddress;
    order.billingAddress = createOrderDto.billingAddress || createOrderDto.shippingAddress;
    order.notes = createOrderDto.notes;

    const savedOrder = await this.orderRepository.save(order);

    // Create order items
    const orderItems: OrderItem[] = [];
    for (const item of products) {
      const orderItem = new OrderItem();
      orderItem.order = savedOrder;
      orderItem.product = item.product;
      orderItem.quantity = item.quantity;
      orderItem.price = item.price;
      orderItems.push(orderItem);
    }

    await this.orderItemRepository.save(orderItems);

    // Update product stock
    for (const item of products) {
      item.product.stock -= item.quantity;
      await this.productRepository.save(item.product);
    }

    // Reload order with populated relations
    return this.orderRepository.findOne({
      where: { id: savedOrder.id },
      relations: ['items', 'items.product', 'user']
    });
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    return this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.product', 'user']
    });
  }

  async getOrdersByUser(userId: string, page: number = 1, limit: number = 10): Promise<{ orders: Order[]; total: number }> {
    const [orders, total] = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .where('order.user.id = :userId', { userId })
      .orderBy('order.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { orders, total };
  }

  async updateOrder(orderId: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.product']
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (updateOrderDto.status) {
      order.status = updateOrderDto.status;
    }

    if (updateOrderDto.notes !== undefined) {
      order.notes = updateOrderDto.notes;
    }

    return this.orderRepository.save(order);
  }

  async cancelOrder(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CONFIRMED) {
      throw new ConflictError('Cannot cancel an order that is already shipped or delivered');
    }

    order.status = OrderStatus.CANCELLED;
    return this.orderRepository.save(order);
  }

  async getOrders(
    page: number = 1,
    limit: number = 10,
    filters: {
      status?: OrderStatus;
      dateFrom?: string;
      dateTo?: string;
      userId?: string;
    } = {}
  ): Promise<{ orders: Order[]; total: number }> {
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('order.user', 'user')
      .orderBy('order.createdAt', 'DESC');

    // Apply filters
    if (filters.status) {
      queryBuilder.andWhere('order.status = :status', { status: filters.status });
    }

    if (filters.dateFrom) {
      queryBuilder.andWhere('order.createdAt >= :dateFrom', { dateFrom: new Date(filters.dateFrom) });
    }

    if (filters.dateTo) {
      queryBuilder.andWhere('order.createdAt <= :dateTo', { dateTo: new Date(filters.dateTo) });
    }

    if (filters.userId) {
      queryBuilder.andWhere('order.user.id = :userId', { userId: filters.userId });
    }

    const [orders, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { orders, total };
  }

  async getOrderStats(userId?: string) {
    const queryBuilder = this.orderRepository.createQueryBuilder('order');
    
    if (userId) {
      queryBuilder.where('order.user.id = :userId', { userId });
    }

    const [totalOrders, totalRevenue, avgOrderValue] = await Promise.all([
      // Total orders
      queryBuilder.getCount(),
      
      // Total revenue
      queryBuilder
        .select('SUM(order.totalAmount)', 'total')
        .getRawOne()
        .then(result => result.total || 0),
        
      // Average order value
      queryBuilder
        .select('AVG(order.totalAmount)', 'avg')
        .getRawOne()
        .then(result => result.avg || 0)
    ]);

    return {
      totalOrders,
      totalRevenue: parseFloat(totalRevenue),
      avgOrderValue: parseFloat(avgOrderValue),
    };
  }
}