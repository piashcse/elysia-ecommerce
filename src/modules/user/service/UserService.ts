import { db } from '../../../config/database';
import { users } from '../../../database/schema';
import { eq, sql } from 'drizzle-orm';
import { CreateUserDto, UpdateUserDto } from '../dto/UserDto';
import { hashPassword, comparePassword } from '../../../utils/auth';
import { NotFoundError, ConflictError } from '../../../core/errors';

export class UserService {
  async createUser(createUserDto: CreateUserDto): Promise<any> {
    const existingUser = await db.select().from(users).where(eq(users.email, createUserDto.email)).limit(1);

    if (existingUser.length > 0) {
      throw new ConflictError('User with this email already exists');
    }

    const hashedPassword = await hashPassword(createUserDto.password);

    const [newUser] = await db.insert(users).values({
      email: createUserDto.email,
      password: hashedPassword,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      role: (createUserDto.role as any) || 'customer',
    }).returning();

    return newUser;
  }

  async findUserById(id: string): Promise<any | null> {
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    }).from(users).where(eq(users.id, id)).limit(1);

    return user || null;
  }

  async findUserByEmail(email: string): Promise<any | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user || null;
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<any> {
    const user = await this.findUserById(id);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUsers = await db.select().from(users).where(eq(users.email, updateUserDto.email)).limit(1);
      if (existingUsers.length > 0) {
        throw new ConflictError('User with this email already exists');
      }
    }

    const [updatedUser] = await db.update(users)
      .set(updateUserDto as any)
      .where(eq(users.id, id))
      .returning();

    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.findUserById(id);

    if (!user) throw new NotFoundError('User not found');

    await db.delete(users).where(eq(users.id, id));
  }

  async getAllUsers(page: number = 1, limit: number = 10): Promise<{ users: any[]; total: number }> {
    const offset = (page - 1) * limit;

    const usersResult = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    }).from(users)
      .orderBy(users.createdAt)
      .limit(limit)
      .offset(offset);

    const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const total = countResult ? Number(countResult.count) : 0;

    return { users: usersResult, total };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<any> {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) throw new NotFoundError('User not found');

    const isPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    const [updatedUser] = await db.update(users)
      .set({ password: await hashPassword(newPassword) })
      .where(eq(users.id, userId))
      .returning();

    return updatedUser;
  }

  async updateRole(userId: string, role: string): Promise<any> {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) throw new NotFoundError('User not found');

    const [updatedUser] = await db.update(users)
      .set({ role: role as any })
      .where(eq(users.id, userId))
      .returning();

    return updatedUser;
  }
}