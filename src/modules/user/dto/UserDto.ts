import { User } from '../entity/User';

// User DTOs (Data Transfer Objects)
export interface CreateUserDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface LoginUserDto {
  email: string;
  password: string;
}

export interface AuthResponseDto {
  user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'role'>;
  token: string;
}

export interface UserResponseDto {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}