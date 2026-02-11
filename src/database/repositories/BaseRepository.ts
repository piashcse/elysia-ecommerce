import { and, eq, ilike, desc, asc, SQL, AnyPgColumn } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';
import { getDB } from '../../config/database';

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface SortOptions {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterOptions {
  search?: string;
  searchFields?: string[];
  isActive?: boolean;
}

export interface FindOptions extends PaginationOptions, SortOptions, FilterOptions {}

export interface BaseRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(options?: FindOptions): Promise<{ data: T[]; total: number; totalPages: number; currentPage: number }>;
  create(entity: Partial<T>): Promise<T>;
  update(id: string, entity: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  softDelete(id: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
}

export abstract class BaseRepositoryImpl<T, TTable extends PgTable> implements BaseRepository<T> {
  protected table: TTable;

  constructor(table: TTable) {
    this.table = table;
  }

  protected get db() {
    return getDB();
  }

  async findById(id: string): Promise<T | null> {
    const [result] = await this.db.select().from(this.table).where(eq(this.table['id'], id)).limit(1);
    return result as T | null;
  }

  async findAll(options: FindOptions = {}): Promise<{ data: T[]; total: number; totalPages: number; currentPage: number }> {
    const { page = 1, limit = 10, search, searchFields = [], isActive, sortBy = 'createdAt', sortOrder = 'desc' } = options;

    // Build query with filters
    let query = this.db.select().from(this.table);

    // Apply active filter if specified
    if (isActive !== undefined && 'isActive' in this.table) {
      query = query.where(eq(this.table['isActive'], isActive));
    }

    // Apply search filter if specified
    if (search && searchFields.length > 0) {
      const searchConditions = searchFields.map(field => 
        ilike(this.table[field] as AnyPgColumn, `%${search}%`)
      );
      
      if (searchConditions.length > 0) {
        query = query.where(and(...searchConditions));
      }
    }

    // Apply sorting
    const sortField = this.table[sortBy] as AnyPgColumn;
    if (sortOrder === 'asc') {
      query = query.orderBy(asc(sortField));
    } else {
      query = query.orderBy(desc(sortField));
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Get total count
    const countQuery = this.db.select({ count: this.db.$count() }).from(query.as('subquery'));
    const [countResult] = await countQuery;
    const total = countResult?.count || 0;
    const totalPages = Math.ceil(total / limit);

    // Apply pagination
    const paginatedQuery = query.limit(limit).offset(offset);
    const data = await paginatedQuery;

    return {
      data: data as T[],
      total,
      totalPages,
      currentPage: page
    };
  }

  async create(entity: Partial<T>): Promise<T> {
    const [result] = await this.db.insert(this.table).values(entity).returning();
    return result as T;
  }

  async update(id: string, entity: Partial<T>): Promise<T | null> {
    const [result] = await this.db.update(this.table).set({ ...entity, updatedAt: new Date() }).where(eq(this.table['id'], id)).returning();
    return result as T | null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(this.table).where(eq(this.table['id'], id));
    return result.rowCount !== undefined && result.rowCount > 0;
  }

  async softDelete(id: string): Promise<boolean> {
    if (!('isActive' in this.table)) {
      throw new Error('Soft delete is not supported for this table - no isActive column found');
    }
    
    const [result] = await this.db.update(this.table).set({ isActive: false, updatedAt: new Date() }).where(eq(this.table['id'], id)).returning();
    return !!result;
  }

  async exists(id: string): Promise<boolean> {
    const [result] = await this.db.select({ id: this.table['id'] }).from(this.table).where(eq(this.table['id'], id)).limit(1);
    return !!result;
  }
}