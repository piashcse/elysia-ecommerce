import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, PoolConfig } from 'pg';
import envConfig from './env';
import * as schema from '../database/schema';

let pool: Pool;
let db: ReturnType<typeof drizzle<typeof schema>>;
let isConnected = false;

/**
 * Creates a PostgreSQL connection pool with optimized configuration
 */
const createPool = (): Pool => {
  const poolConfig: PoolConfig = {
    host: envConfig.DB_HOST,
    port: envConfig.DB_PORT,
    user: envConfig.DB_USER,
    password: envConfig.DB_PASSWORD,
    database: envConfig.DB_NAME,
    ssl: envConfig.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    // Connection pool configuration
    max: envConfig.DB_MAX_CONNECTIONS || 20,
    min: envConfig.DB_MIN_CONNECTIONS || 5,
    idleTimeoutMillis: envConfig.DB_IDLE_TIMEOUT || 30000,
    connectionTimeoutMillis: envConfig.DB_CONNECTION_TIMEOUT || 10000,
    // Query timeout configuration
    statement_timeout: envConfig.DB_STATEMENT_TIMEOUT || 30000,
    query_timeout: envConfig.DB_QUERY_TIMEOUT || 60000,
  };

  const newPool = new Pool(poolConfig);

  // Handle pool errors
  newPool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    // Attempt to reconnect
    setTimeout(() => {
      console.log('Attempting to recreate database pool...');
      pool = createPool();
    }, 30000); // Retry after 30 seconds
  });

  return newPool;
};

export const connectDB = async (): Promise<void> => {
  if (isConnected) {
    console.log('Database already connected, skipping initialization');
    return;
  }

  try {
    console.log(`Attempting to connect to database: ${envConfig.DB_NAME}`);
    console.log(`Environment: ${envConfig.NODE_ENV}`);
    console.log(`Host: ${envConfig.DB_HOST}`);
    console.log(`User: ${envConfig.DB_USER}`);

    pool = createPool();

    // Test the connection
    const client = await pool.connect();
    client.release(); // Release the test connection back to the pool

    db = drizzle(pool, { 
      schema
    });

    isConnected = true;

    console.log(`Successfully connected to PostgreSQL database: ${envConfig.DB_NAME}`);
    
    // Log pool statistics periodically in development
    if (envConfig.NODE_ENV === 'development') {
      setInterval(() => {
        console.log(`DB Pool Status - Total: ${pool.totalCount}, Idle: ${pool.idleCount}, Waiting: ${pool.waitingCount}`);
      }, 30000); // Log every 30 seconds
    }
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw new Error(`Database connection failed: ${(error as Error).message}`);
  }
};

/**
 * Closes the database connection gracefully
 */
export const closeDB = async (): Promise<void> => {
  if (pool) {
    console.log('Closing database connections...');
    await pool.end();
    isConnected = false;
    console.log('Database connections closed');
  }
};

/**
 * Gets the current database instance
 */
export const getDB = () => {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB() first.');
  }
  return db;
};

export { db };