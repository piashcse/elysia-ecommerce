import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Category } from '../../category/entity/Category';
import { CartItem } from '../../cart/entity/CartItem';
import { OrderItem } from '../../order/entity/OrderItem';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: true })
  image: string;

  @Column({ default: 0 })
  stock: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true }) // Using JSONB for additional attributes
  attributes: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Category, category => category.products)
  category: Category;

  @OneToMany(() => 'CartItem', (cartItem: any) => cartItem.product)
  cartItems: any[];

  @OneToMany(() => 'OrderItem', (orderItem: any) => orderItem.product)
  orderItems: any[];
}