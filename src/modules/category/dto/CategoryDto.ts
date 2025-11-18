import { Category } from '../entity/Category';

// Category DTOs (Data Transfer Objects)
export interface CreateCategoryDto {
  name: string;
  description?: string;
  image?: string;
  isActive?: boolean;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  image?: string;
  isActive?: boolean;
}

export interface CategoryResponseDto {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryListResponseDto {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}