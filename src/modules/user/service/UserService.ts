import { db } from '../../../config/database';
import { users } from '../../../database/schema';
import { eq } from 'drizzle-orm';
import { CreateUserDto, UpdateUserDto } from '../dto/UserDto';
import { comparePassword, hashPassword } from '../../../utils/auth';
import { ConflictError, NotFoundError } from '../../../core/errors';
import { UserRole } from '../../../core/roles';
import { BaseService } from '../../../core/base.service';

export class UserService extends BaseService<typeof users> {
  constructor() {
    super(users);
  }

  async createUser(createUserDto: CreateUserDto): Promise<any> {
    const [existingUser] = await db.select().from(users).where(eq(users.email, createUserDto.email)).limit(1);

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    const hashedPassword = await hashPassword(createUserDto.password);

    return this.create({
      ...createUserDto,
      password: hashedPassword,
      role: (createUserDto.role as any) || UserRole.CUSTOMER,
    });
  }

  async findUserByEmail(email: string): Promise<any | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user || null;
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<any> {
    const user = await this.findByIdOrFail(id, 'User');

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findUserByEmail(updateUserDto.email);
      if (existingUser) {
        throw new ConflictError('User with this email already exists');
      }
    }

    return this.update(id, updateUserDto);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<any> {
    const user = await this.findByIdOrFail(userId, 'User');

    const isPasswordValid = await comparePassword(currentPassword, (user as any).password);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    return this.update(userId, { password: await hashPassword(newPassword) });
  }

  async updateRole(userId: string, role: UserRole): Promise<any> {
    await this.findByIdOrFail(userId, 'User');
    return this.update(userId, { role: role as any });
  }
}
