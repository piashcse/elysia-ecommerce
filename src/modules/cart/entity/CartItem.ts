import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Cart } from './Cart';
import { Product } from '../../product/entity/Product';

@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 1 })
  quantity: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => 'Cart', (cart: any) => cart.items, { onDelete: 'CASCADE' })
  cart: any;

  @ManyToOne(() => 'Product', (product: any) => product.cartItems, { onDelete: 'CASCADE' })
  product: any;
}