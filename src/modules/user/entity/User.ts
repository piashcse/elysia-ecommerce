import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Cart } from '../../cart/entity/Cart';
import { Wishlist } from '../../wishlist/entity/Wishlist';
import { Order } from '../../order/entity/Order';

export enum UserRole {
  ADMIN = 'admin',
  CUSTOMER = 'customer',
}

export enum UserStatus {
  PENDING_VERIFICATION = 'pending_verification',
  VERIFIED = 'verified',
  SUSPENDED = 'suspended',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CUSTOMER })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING_VERIFICATION
  })
  status: UserStatus;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  emailVerifiedAt: Date;

  @Column({ nullable: true })
  phoneVerifiedAt: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => 'Cart', (cart: any) => cart.user)
  carts: any[];

  @OneToMany(() => 'Wishlist', (wishlist: any) => wishlist.user)
  wishlists: any[];

  @OneToMany(() => 'Order', (order: any) => order.user)
  orders: any[];
}