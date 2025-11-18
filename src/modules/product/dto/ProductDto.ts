import { Product } from '../entity/Product';

// Product DTOs (Data Transfer Objects)
export interface CreateProductDto {
  name: string;
  description?: string;
  price: number;
  image?: string;
  stock: number;
  isActive?: boolean;
  attributes?: Record<string, any>;
  categoryId: string;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  image?: string;
  stock?: number;
  isActive?: boolean;
  attributes?: Record<string, any>;
  categoryId?: string;
}

export interface ProductResponseDto {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  stock: number;
  isActive: boolean;
  attributes: Record<string, any> | null;
  category: {
    id: string;
    name: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductListResponseDto {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  stock: number;
  isActive: boolean;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
}