import { BaseRepository, FindOptions } from '../../database/repositories';

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}

export abstract class BaseService<T> {
  protected repository: BaseRepository<T>;

  constructor(repository: BaseRepository<T>) {
    this.repository = repository;
  }

  async findById(id: string): Promise<ServiceResponse<T | null>> {
    try {
      const entity = await this.repository.findById(id);
      return {
        success: true,
        data: entity,
        message: entity ? 'Entity found' : 'Entity not found'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error retrieving entity',
        error: (error as Error).message
      };
    }
  }

  async findAll(options?: FindOptions): Promise<ServiceResponse<{ data: T[]; total: number; totalPages: number; currentPage: number }>> {
    try {
      const result = await this.repository.findAll(options);
      return {
        success: true,
        data: result,
        message: 'Entities retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error retrieving entities',
        error: (error as Error).message
      };
    }
  }

  async create(entity: Partial<T>): Promise<ServiceResponse<T>> {
    try {
      const newEntity = await this.repository.create(entity);
      return {
        success: true,
        data: newEntity,
        message: 'Entity created successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error creating entity',
        error: (error as Error).message
      };
    }
  }

  async update(id: string, entity: Partial<T>): Promise<ServiceResponse<T | null>> {
    try {
      const updatedEntity = await this.repository.update(id, entity);
      return {
        success: true,
        data: updatedEntity,
        message: updatedEntity ? 'Entity updated successfully' : 'Entity not found'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error updating entity',
        error: (error as Error).message
      };
    }
  }

  async delete(id: string): Promise<ServiceResponse<boolean>> {
    try {
      const result = await this.repository.delete(id);
      return {
        success: result,
        data: result,
        message: result ? 'Entity deleted successfully' : 'Entity not found'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error deleting entity',
        error: (error as Error).message
      };
    }
  }

  async exists(id: string): Promise<ServiceResponse<boolean>> {
    try {
      const result = await this.repository.exists(id);
      return {
        success: true,
        data: result,
        message: 'Existence check completed'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error checking entity existence',
        error: (error as Error).message
      };
    }
  }
}