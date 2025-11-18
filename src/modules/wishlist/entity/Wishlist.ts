import { Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../user/entity/User';
import { Product } from '../../product/entity/Product';

@Entity('wishlists')
export class Wishlist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => 'User', (user: any) => user.wishlists, { onDelete: 'CASCADE' })
  user: any;

  @ManyToOne(() => 'Product', (product: any) => product.id, { onDelete: 'CASCADE' })
  product: any;
}