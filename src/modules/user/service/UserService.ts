import { AppDataSource } from '../../../config/database';
import { User } from '../entity/User';
import { CreateUserDto, UpdateUserDto } from '../dto/UserDto';
import { hashPassword, comparePassword } from '../../../utils/auth';
import { NotFoundError, ConflictError } from '../../../core/errors';

export class UserService {
  private userRepository = AppDataSource.getRepository(User);

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    const hashedPassword = await hashPassword(createUserDto.password);
    
    const user = new User();
    user.email = createUserDto.email;
    user.password = hashedPassword;
    user.firstName = createUserDto.firstName;
    user.lastName = createUserDto.lastName;

    return this.userRepository.save(user);
  }

  async findUserById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'createdAt', 'updatedAt']
    });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({ email });
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findUserById(id);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if email is being updated and if it's already taken by another user
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email }
      });
      
      if (existingUser) {
        throw new ConflictError('User with this email already exists');
      }
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.findUserById(id);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }

    await this.userRepository.remove(user);
  }

  async getAllUsers(page: number = 1, limit: number = 10): Promise<{ users: User[]; total: number }> {
    const [users, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' }
    });

    return { users, total };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    if (currentPassword === newPassword) {
      throw new Error('New password must be different from current password');
    }

    user.password = await hashPassword(newPassword);
    return this.userRepository.save(user);
  }

  async updateRole(userId: string, role: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundError('User not found');
    }

    user.role = role as any;
    return this.userRepository.save(user);
  }
}