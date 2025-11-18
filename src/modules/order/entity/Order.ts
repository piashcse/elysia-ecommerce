import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../../user/entity/User';
import { OrderItem } from './OrderItem';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'jsonb', nullable: true }) // Store shipping address as JSON
  shippingAddress: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true }) // Store billing address as JSON
  billingAddress: Record<string, any>;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => 'User', (user: any) => user.orders)
  user: any;

  @OneToMany(() => OrderItem, orderItem => orderItem.order)
  items: OrderItem[];
}