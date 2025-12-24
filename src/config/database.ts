import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import envConfig from '../config/env';
import * as schema from '../database/schema';

let pool: Pool;
let db: ReturnType<typeof drizzle<typeof schema>>;

export const connectDB = async (): Promise<void> => {
  try {
    console.log(`Attempting to connect to database: ${envConfig.DB_NAME}`);
    console.log(`Environment: ${envConfig.NODE_ENV}`);
    console.log(`Host: ${envConfig.DB_HOST}`);
    console.log(`User: ${envConfig.DB_USER}`);

    pool = new Pool({
      host: envConfig.DB_HOST,
      port: envConfig.DB_PORT,
      user: envConfig.DB_USER,
      password: envConfig.DB_PASSWORD,
      database: envConfig.DB_NAME,
      ssl: envConfig.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    await pool.connect();

    db = drizzle(pool, { schema });

    console.log(`Connected to PostgreSQL database: ${envConfig.DB_NAME}`);
  } catch (error) {
    console.error('Error connecting to database:', error);
    process.exit(1);
  }
};

export { db };