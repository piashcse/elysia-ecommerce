import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import envConfig from '../config/env';
import * as schema from '../database/schema';

let pool: Pool | undefined;
let db: ReturnType<typeof drizzle<typeof schema>>;

export const connectDB = async (): Promise<void> => {
  try {
    console.log(`Connecting to PostgreSQL database: ${envConfig.DB_NAME} (${envConfig.DB_HOST}:${envConfig.DB_PORT})`);

    pool = new Pool({
      host: envConfig.DB_HOST,
      port: envConfig.DB_PORT,
      user: envConfig.DB_USER,
      password: envConfig.DB_PASSWORD,
      database: envConfig.DB_NAME,
      ssl: envConfig.DB_SSL ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (error) => {
      console.error('Unexpected PostgreSQL pool error:', error.message);
    });

    // Verify connectivity without leaking a pooled client.
    await pool.query('SELECT 1');

    db = drizzle(pool, { schema });

    console.log(`Connected to PostgreSQL database: ${envConfig.DB_NAME}`);
  } catch (error) {
    console.error('Error connecting to database:', (error as Error).message);
    process.exit(1);
  }
};

export const closeDB = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
};

export { db };
