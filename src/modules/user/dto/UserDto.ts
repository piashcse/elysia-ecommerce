import { UserRole } from '../../../core/roles';

// User DTOs (Data Transfer Objects)
export interface CreateUserDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface LoginUserDto {
  email: string;
  password: string;
}

export interface UserResponseDto {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponseDto {
  user: Omit<UserResponseDto, 'createdAt' | 'updatedAt'>;
  token: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}
