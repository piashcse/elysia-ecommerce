import { comparePassword, hashPassword } from '../../../utils/auth';
import { ConflictError, UnauthorizedError } from '../../../core/errors';
import { CreateUserType, LoginUserType } from '../../user/validators/UserValidator';
import { UserRole } from '../../../core/roles';
import { UserService } from '../../../core/services/UserService';

export class AuthService {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    async register(data: CreateUserType) {
        return await this.userService.register(data);
    }

    async login(data: LoginUserType) {
        const loginResult = await this.userService.login(data);
        return loginResult.user; // Return only the user object, not the token
    }
}
