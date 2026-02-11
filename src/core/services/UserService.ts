import { BaseService } from './BaseService';
import { UserRepository } from '../../database/repositories/UserRepository';
import { comparePassword, hashPassword } from '../../utils/auth';
import { ConflictError, UnauthorizedError } from '../../core/errors';
import { CreateUserType, LoginUserType } from '../../modules/user/validators/UserValidator';
import { UserRole } from '../../core/roles';
import { cacheManager } from '../../utils/cache';

export interface LoginResponse {
  user: any;
  token: string;
}

export class UserService extends BaseService<typeof UserRepository.prototype.table.$inferSelect> {
  private userRepository: UserRepository;

  constructor() {
    const userRepository = new UserRepository();
    super(userRepository);
    this.userRepository = userRepository;
  }

  async register(data: CreateUserType): Promise<any> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    const hashedPassword = await hashPassword(data.password);

    const newUser = await this.userRepository.create({
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      role: (data.role as any) || UserRole.CUSTOMER,
    });

    if (!newUser) {
      throw new Error('Failed to create user');
    }

    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  async login(data: LoginUserType): Promise<LoginResponse> {
    // Try to get user from cache first
    let user = await cacheManager.getCachedUser(data.email);
    if (!user) {
      // If not in cache, fetch from database
      user = await this.userRepository.findByEmail(data.email);
      if (user) {
        // Cache the user for future requests
        await cacheManager.cacheUser(user.id, user);
      }
    }

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isPasswordValid = await comparePassword(data.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('User account is deactivated');
    }

    // In a real implementation, you would generate a JWT token here
    // For now, returning a mock token
    const token = 'mock-jwt-token'; // This would be replaced with actual JWT generation

    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async findById(id: string) {
    // Try to get from cache first
    const cachedUser = await cacheManager.getCachedUser(id);
    if (cachedUser) {
      return cachedUser;
    }

    // If not in cache, fetch from repository and cache it
    const user = await super.findById(id);
    if (user.success && user.data) {
      await cacheManager.cacheUser(id, user.data);
    }

    return user;
  }

  async findByEmail(email: string) {
    // Try to get user from cache first
    const cachedUser = await cacheManager.getCachedUser(email);
    if (cachedUser) {
      return cachedUser;
    }

    const user = await this.userRepository.findByEmail(email);
    if (user) {
      // Cache the user for future requests
      await cacheManager.cacheUser(user.id, user);
    }

    return user;
  }

  async findByRole(role: string) {
    return await this.userRepository.findByRole(role);
  }

  async activateUser(id: string) {
    const result = await this.userRepository.activateUser(id);
    
    // Invalidate the cached user
    await cacheManager.del(`user:${id}`);
    
    return result;
  }

  async deactivateUser(id: string) {
    const result = await this.userRepository.deactivateUser(id);
    
    // Invalidate the cached user
    await cacheManager.del(`user:${id}`);
    
    return result;
  }
}