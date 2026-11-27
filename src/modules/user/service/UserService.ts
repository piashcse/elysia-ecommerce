import { and, eq, ilike, isNull, ne, or, sql } from 'drizzle-orm';
import { db } from '../../../config/database';
import { addresses, carts, orders, reviews, users, wishlists } from '../../../database/schema';
import { CreateUserDto, UpdateUserDto } from '../dto/UserDto';
import { comparePassword, hashPassword, normalizeEmail } from '../../../utils/auth';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../../core/errors';
import { UserRole } from '../../../core/roles';
import { BaseService } from '../../../core/base.service';
import { PAGINATION } from '../../../core/constants';
import { AuthService } from '../../auth/service/AuthService';

export class UserService extends BaseService {
  private authService = new AuthService();

  constructor() {
    super(users);
  }

  async createUser(createUserDto: CreateUserDto): Promise<any> {
    const email = normalizeEmail(createUserDto.email);
    const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    const hashedPassword = await hashPassword(createUserDto.password);

    return this.create({
      email,
      password: hashedPassword,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      role: (createUserDto.role as any) || UserRole.CUSTOMER,
      emailVerified: true,
    });
  }

  async findUserByEmail(email: string): Promise<any | null> {
    const [user] = await db.select().from(users).where(eq(users.email, normalizeEmail(email))).limit(1);
    return user || null;
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<any> {
    const user = await this.findByIdOrFail(id, 'User');

    if (updateUserDto.email) {
      const email = normalizeEmail(updateUserDto.email);
      if (email !== user.email) {
        const existingUser = await this.findUserByEmail(email);
        if (existingUser) {
          throw new ConflictError('User with this email already exists');
        }
      }
    }

    const updateData: any = { ...updateUserDto };
    if (updateUserDto.email) updateData.email = normalizeEmail(updateUserDto.email);

    const roleChanged = updateUserDto.role !== undefined && updateUserDto.role !== user.role;
    const statusChanged = updateUserDto.isActive !== undefined && updateUserDto.isActive !== user.isActive;

    if ((roleChanged || statusChanged) && user.role === UserRole.ADMIN) {
      const otherAdmins = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(eq(users.role, UserRole.ADMIN), eq(users.isActive, true), ne(users.id, id)));
      const count = otherAdmins[0] ? Number(otherAdmins[0].count) : 0;

      if (count === 0) {
        throw new ConflictError('Cannot remove or deactivate the last active admin', 'LAST_ADMIN');
      }
    }

    if (roleChanged || statusChanged) {
      updateData.tokenVersion = sql`${users.tokenVersion} + 1`;
    }

    const [updated] = await db
      .update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (updateData.email && updateData.email !== user.email) {
      await this.authService.issueEmailVerification(id, updateData.email);
      return this.findByIdOrFail(id, 'User');
    }

    return updated;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.findByIdOrFail(userId, 'User');

    const isPasswordValid = await comparePassword(currentPassword, (user as any).password);
    if (!isPasswordValid) {
      throw new ForbiddenError('Current password is incorrect', 'INVALID_CURRENT_PASSWORD');
    }

    if (currentPassword === newPassword) {
      throw new ValidationError('New password must be different from the current password', 'PASSWORD_UNCHANGED');
    }

    await db
      .update(users)
      .set({
        password: await hashPassword(newPassword),
        tokenVersion: sql`${users.tokenVersion} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.findByIdOrFail(id, 'User');

    if (user.role === UserRole.ADMIN) {
      const otherAdmins = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(eq(users.role, UserRole.ADMIN), eq(users.isActive, true), ne(users.id, id)));
      if (!otherAdmins[0] || Number(otherAdmins[0].count) === 0) {
        throw new ConflictError('Cannot delete the last active admin', 'LAST_ADMIN');
      }
    }

    await this.deleteAccount(id);
  }

  async deleteAccount(userId: string): Promise<void> {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new NotFoundError('User not found');

    if (user.role === UserRole.ADMIN) {
      const otherAdmins = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(eq(users.role, UserRole.ADMIN), eq(users.isActive, true), isNull(users.deletedAt), ne(users.id, userId)));
      if (!otherAdmins[0] || Number(otherAdmins[0].count) === 0) {
        throw new ConflictError('Cannot delete the last active admin', 'LAST_ADMIN');
      }
    }

    await db.transaction(async (tx) => {
      await tx.update(users).set({
        email: `deleted-${userId}@deleted.local`,
        password: await hashPassword(crypto.randomUUID()),
        firstName: null,
        lastName: null,
        isActive: false,
        emailVerified: false,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        deletedAt: new Date(),
        tokenVersion: sql`${users.tokenVersion} + 1`,
        updatedAt: new Date(),
      }).where(eq(users.id, userId));

      await tx.delete(addresses).where(eq(addresses.userId, userId));
      await tx.delete(carts).where(eq(carts.userId, userId));
      await tx.delete(wishlists).where(eq(wishlists.userId, userId));
      await tx.delete(reviews).where(eq(reviews.userId, userId));
    });
  }

  async exportData(userId: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new NotFoundError('User not found');
    const [addressRows, orderRows, reviewRows, wishlistRows] = await Promise.all([
      db.select().from(addresses).where(eq(addresses.userId, userId)),
      db.select().from(orders).where(eq(orders.userId, userId)),
      db.select().from(reviews).where(eq(reviews.userId, userId)),
      db.select().from(wishlists).where(eq(wishlists.userId, userId)),
    ]);
    const { password, emailVerificationToken, passwordResetToken, ...profile } = user;
    return { profile, addresses: addressRows, orders: orderRows, reviews: reviewRows, wishlist: wishlistRows };
  }

  async getUsers(
    page: number = 1,
    limit: number = PAGINATION.DEFAULT_LIMIT,
    filters: { role?: UserRole; search?: string } = {}
  ): Promise<{ items: any[]; total: number }> {
    const conditions = [];
    conditions.push(isNull(users.deletedAt));
    if (filters.role) conditions.push(eq(users.role, filters.role));
    if (filters.search) {
      const term = `%${filters.search}%`;
      conditions.push(or(ilike(users.email, term), ilike(users.firstName, term), ilike(users.lastName, term)));
    }

    return this.findAll(page, limit, conditions);
  }
}
