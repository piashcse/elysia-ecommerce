import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Order } from './Order';
import { Product } from '../../product/entity/Product';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => 'Order', (order: any) => order.items, { onDelete: 'CASCADE' })
  order: any;

  @ManyToOne(() => 'Product', (product: any) => product.orderItems, { onDelete: 'CASCADE' })
  product: any;
}