import NodeCache from 'node-cache';
import { logger } from '../logging';
import envConfig from '../../config/env';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  staleTtl?: number; // Stale TTL in seconds (for advanced cache strategies)
}

export interface CacheBackend {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean>;
  del(key: string): Promise<boolean>;
  has(key: string): Promise<boolean>;
  flush(): Promise<void>;
  keys(): Promise<string[]>;
}

export class MemoryCacheBackend implements CacheBackend {
  private cache: NodeCache;

  constructor() {
    // Initialize with default TTL of 1 hour and check period of 10 minutes
    this.cache = new NodeCache({ 
      stdTTL: 3600, // 1 hour default
      checkperiod: 600, // 10 minutes
      useClones: false // Don't clone objects to improve performance
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = this.cache.get<T>(key);
      return value || null;
    } catch (error) {
      logger.error('Error getting value from memory cache', error, { key });
      return null;
    }
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean> {
    try {
      const ttl = options?.ttl || 3600; // Default to 1 hour
      return this.cache.set(key, value, ttl);
    } catch (error) {
      logger.error('Error setting value in memory cache', error, { key });
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      const deleted = this.cache.del(key);
      return deleted > 0;
    } catch (error) {
      logger.error('Error deleting value from memory cache', error, { key });
      return false;
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      return this.cache.has(key);
    } catch (error) {
      logger.error('Error checking key existence in memory cache', error, { key });
      return false;
    }
  }

  async flush(): Promise<void> {
    try {
      this.cache.flushAll();
    } catch (error) {
      logger.error('Error flushing memory cache', error);
    }
  }

  async keys(): Promise<string[]> {
    try {
      return this.cache.keys();
    } catch (error) {
      logger.error('Error getting memory cache keys', error);
      return [];
    }
  }
}

// Placeholder for Redis cache backend (would require redis setup)
export class RedisCacheBackend implements CacheBackend {
  async get<T>(key: string): Promise<T | null> {
    logger.warn('Redis cache not implemented - using fallback', { key });
    return null;
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean> {
    logger.warn('Redis cache not implemented - using fallback', { key });
    return false;
  }

  async del(key: string): Promise<boolean> {
    logger.warn('Redis cache not implemented - using fallback', { key });
    return false;
  }

  async has(key: string): Promise<boolean> {
    logger.warn('Redis cache not implemented - using fallback', { key });
    return false;
  }

  async flush(): Promise<void> {
    logger.warn('Redis cache not implemented - using fallback');
  }

  async keys(): Promise<string[]> {
    logger.warn('Redis cache not implemented - using fallback');
    return [];
  }
}

export class CacheManager {
  private static instance: CacheManager;
  private backend: CacheBackend;
  private isEnabled: boolean;

  private constructor() {
    // Determine cache backend based on environment
    if (envConfig.NODE_ENV === 'production' && process.env.REDIS_URL) {
      this.backend = new RedisCacheBackend();
      logger.info('Using Redis cache backend');
    } else {
      this.backend = new MemoryCacheBackend();
      logger.info('Using memory cache backend');
    }
    
    this.isEnabled = envConfig.CACHE_ENABLED !== 'false';
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isEnabled) return null;
    
    try {
      const value = await this.backend.get<T>(key);
      if (value !== null) {
        logger.debug('Cache hit', { key });
      } else {
        logger.debug('Cache miss', { key });
      }
      return value;
    } catch (error) {
      logger.error('Cache get error', error, { key });
      return null;
    }
  }

  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean> {
    if (!this.isEnabled) return false;
    
    try {
      const result = await this.backend.set<T>(key, value, options);
      if (result) {
        logger.debug('Cache set', { key, ttl: options?.ttl });
      }
      return result;
    } catch (error) {
      logger.error('Cache set error', error, { key });
      return false;
    }
  }

  /**
   * Delete a value from cache
   */
  async del(key: string): Promise<boolean> {
    if (!this.isEnabled) return false;
    
    try {
      const result = await this.backend.del(key);
      if (result) {
        logger.debug('Cache deleted', { key });
      }
      return result;
    } catch (error) {
      logger.error('Cache delete error', error, { key });
      return false;
    }
  }

  /**
   * Check if a key exists in cache
   */
  async has(key: string): Promise<boolean> {
    if (!this.isEnabled) return false;
    
    try {
      return await this.backend.has(key);
    } catch (error) {
      logger.error('Cache has error', error, { key });
      return false;
    }
  }

  /**
   * Flush all cache
   */
  async flush(): Promise<void> {
    if (!this.isEnabled) return;
    
    try {
      await this.backend.flush();
      logger.info('Cache flushed');
    } catch (error) {
      logger.error('Cache flush error', error);
    }
  }

  /**
   * Get all cache keys
   */
  async keys(): Promise<string[]> {
    if (!this.isEnabled) return [];
    
    try {
      return await this.backend.keys();
    } catch (error) {
      logger.error('Cache keys error', error);
      return [];
    }
  }

  /**
   * Wrap a function with caching
   */
  async wrap<T>(
    key: string, 
    fn: () => Promise<T>, 
    options?: CacheOptions
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // If not in cache, execute the function
    const result = await fn();
    
    // Store in cache for future requests
    await this.set(key, result, options);
    
    return result;
  }

  /**
   * Get frequently accessed data with automatic caching
   */
  async getFrequentlyAccessedData<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = 300 // 5 minutes default for frequently accessed data
  ): Promise<T> {
    const cacheKey = `frequent:${key}`;
    return this.wrap(cacheKey, fetchFn, { ttl });
  }

  /**
   * Cache user data
   */
  async cacheUser(userId: string, userData: any): Promise<boolean> {
    return this.set(`user:${userId}`, userData, { ttl: 900 }); // 15 minutes
  }

  /**
   * Get cached user data
   */
  async getCachedUser(userId: string): Promise<any | null> {
    return this.get(`user:${userId}`);
  }

  /**
   * Cache product data
   */
  async cacheProduct(productId: string, productData: any): Promise<boolean> {
    return this.set(`product:${productId}`, productData, { ttl: 600 }); // 10 minutes
  }

  /**
   * Get cached product data
   */
  async getCachedProduct(productId: string): Promise<any | null> {
    return this.get(`product:${productId}`);
  }

  /**
   * Cache category data
   */
  async cacheCategory(categoryId: string, categoryData: any): Promise<boolean> {
    return this.set(`category:${categoryId}`, categoryData, { ttl: 1800 }); // 30 minutes
  }

  /**
   * Get cached category data
   */
  async getCachedCategory(categoryId: string): Promise<any | null> {
    return this.get(`category:${categoryId}`);
  }

  /**
   * Cache configuration data
   */
  async cacheConfig(configKey: string, configData: any): Promise<boolean> {
    return this.set(`config:${configKey}`, configData, { ttl: 3600 }); // 1 hour
  }

  /**
   * Get cached configuration data
   */
  async getCachedConfig(configKey: string): Promise<any | null> {
    return this.get(`config:${configKey}`);
  }
}

// Export a singleton instance
export const cacheManager = CacheManager.getInstance();