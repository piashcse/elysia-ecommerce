import {db} from '../../../config/database';
import {users} from '../../../database/schema';
import {eq} from 'drizzle-orm';
import {comparePassword, hashPassword} from '../../../utils/auth';
import {ConflictError, UnauthorizedError} from '../../../core/errors';
import {CreateUserType, LoginUserType} from '../../user/validators/UserValidator';
import { UserRole } from '../../../core/roles';

export class AuthService {
    async register(data: CreateUserType) {
        // Check if user already exists
        const [existingUser] = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
        if (existingUser) {
            throw new ConflictError('User with this email already exists');
        }

        const hashedPassword = await hashPassword(data.password);

        const [newUser] = await db.insert(users).values({
            email: data.email,
            password: hashedPassword,
            firstName: data.firstName,
            lastName: data.lastName,
            role: (data.role as any) || UserRole.CUSTOMER,
        }).returning();

        if (!newUser) {
            throw new Error('Failed to create user');
        }

        const { password, ...userWithoutPassword } = newUser;
        return userWithoutPassword;
    }

    async login(data: LoginUserType) {
        const [user] = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
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

        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
}
