import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../user/entity/User';

export enum VerificationCodeType {
  EMAIL = 'email',
  SMS = 'sms',
  PASSWORD_RESET = 'password_reset'
}

@Entity('verification_codes')
export class VerificationCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column({ type: 'enum', enum: VerificationCodeType })
  type: VerificationCodeType;

  @Column({ unique: true, nullable: true }) // Unique email if verification is for email
  email: string;

  @Column({ unique: true, nullable: true }) // Unique phone if verification is for SMS
  phone: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ type: 'timestamp' }) // Code expires after 10 minutes
  expiresAt: Date;

  @Column({ default: false })
  isUsed: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.id)
  user: User;
}