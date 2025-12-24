import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

// For debugging - log environment variables
console.log('Raw process.env.DB_NAME:', process.env.DB_NAME);

// Environment configuration loader
interface EnvironmentConfig {
  NODE_ENV: string;
  PORT: number;
  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_USERNAME?: string; // Optional - for compatibility with common env var name
  DB_PASSWORD: string;
  DB_NAME: string;
  DB_SSL: string;
  JWT_SECRET: string;
  LOG_LEVEL: string;
}

// Default values
const defaults = {
  NODE_ENV: 'development',
  PORT: 3000,
  DB_HOST: 'localhost',
  DB_PORT: 5432,
  DB_USER: 'postgres',
  DB_PASSWORD: 'postgres',
  DB_NAME: 'ecommerce_db',
  DB_SSL: 'false',
  JWT_SECRET: 'super-secret-key',
  LOG_LEVEL: 'info',
};

// Load environment variables with defaults
export const envConfig: EnvironmentConfig = {
  NODE_ENV: process.env.NODE_ENV || defaults.NODE_ENV,
  PORT: parseInt(process.env.PORT || defaults.PORT.toString(), 10),
  DB_HOST: process.env.DB_HOST || defaults.DB_HOST,
  DB_PORT: parseInt(process.env.DB_PORT || defaults.DB_PORT.toString(), 10),
  DB_USER: process.env.DB_USER || process.env.DB_USERNAME || defaults.DB_USER, // Support both DB_USER and DB_USERNAME
  DB_PASSWORD: process.env.DB_PASSWORD || defaults.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME || defaults.DB_NAME,
  DB_SSL: process.env.DB_SSL || defaults.DB_SSL,
  JWT_SECRET: process.env.JWT_SECRET || defaults.JWT_SECRET,
  LOG_LEVEL: process.env.LOG_LEVEL || defaults.LOG_LEVEL,
};

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

export default envConfig;