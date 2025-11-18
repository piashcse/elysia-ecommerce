import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../../user/entity/User';
import { CartItem } from './CartItem';

@Entity('carts')
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  sessionId: string; // For guest users

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.carts)
  user: User;

  @OneToMany(() => 'CartItem', (cartItem: any) => cartItem.cart)
  items: any[];
}