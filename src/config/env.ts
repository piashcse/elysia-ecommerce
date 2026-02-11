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
  DB_MAX_CONNECTIONS: number;
  DB_MIN_CONNECTIONS: number;
  DB_IDLE_TIMEOUT: number;
  DB_CONNECTION_TIMEOUT: number;
  DB_STATEMENT_TIMEOUT: number;
  DB_QUERY_TIMEOUT: number;
  JWT_SECRET: string;
  LOG_LEVEL: string;
  LOG_TO_FILE: string;
  LOG_FILE_PATH: string;
  CACHE_ENABLED: string;
  REDIS_URL?: string;
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
  DB_MAX_CONNECTIONS: 20,
  DB_MIN_CONNECTIONS: 5,
  DB_IDLE_TIMEOUT: 30000,
  DB_CONNECTION_TIMEOUT: 10000,
  DB_STATEMENT_TIMEOUT: 30000,
  DB_QUERY_TIMEOUT: 60000,
  JWT_SECRET: 'super-secret-key',
  LOG_LEVEL: 'info',
  LOG_TO_FILE: 'false',
  LOG_FILE_PATH: './logs/app.log',
  CACHE_ENABLED: 'true',
  REDIS_URL: undefined,
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
  DB_MAX_CONNECTIONS: parseInt(process.env.DB_MAX_CONNECTIONS || defaults.DB_MAX_CONNECTIONS.toString(), 10),
  DB_MIN_CONNECTIONS: parseInt(process.env.DB_MIN_CONNECTIONS || defaults.DB_MIN_CONNECTIONS.toString(), 10),
  DB_IDLE_TIMEOUT: parseInt(process.env.DB_IDLE_TIMEOUT || defaults.DB_IDLE_TIMEOUT.toString(), 10),
  DB_CONNECTION_TIMEOUT: parseInt(process.env.DB_CONNECTION_TIMEOUT || defaults.DB_CONNECTION_TIMEOUT.toString(), 10),
  DB_STATEMENT_TIMEOUT: parseInt(process.env.DB_STATEMENT_TIMEOUT || defaults.DB_STATEMENT_TIMEOUT.toString(), 10),
  DB_QUERY_TIMEOUT: parseInt(process.env.DB_QUERY_TIMEOUT || defaults.DB_QUERY_TIMEOUT.toString(), 10),
  JWT_SECRET: process.env.JWT_SECRET || defaults.JWT_SECRET,
  LOG_LEVEL: process.env.LOG_LEVEL || defaults.LOG_LEVEL,
  LOG_TO_FILE: process.env.LOG_TO_FILE || defaults.LOG_TO_FILE,
  LOG_FILE_PATH: process.env.LOG_FILE_PATH || defaults.LOG_FILE_PATH,
  CACHE_ENABLED: process.env.CACHE_ENABLED || defaults.CACHE_ENABLED,
  REDIS_URL: process.env.REDIS_URL || defaults.REDIS_URL,
};

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

export default envConfig;