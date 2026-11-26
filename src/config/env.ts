import 'dotenv/config';
import { z } from 'zod';

const booleanString = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  APP_URL: z.string().url().default('http://localhost:3000'),

  DB_HOST: z.string().min(1).default('localhost'),
  DB_PORT: z.coerce.number().int().min(1).max(65535).default(5432),
  DB_USER: z.string().min(1).default('postgres'),
  DB_PASSWORD: z.string().default('postgres'),
  DB_NAME: z.string().min(1).default('ecommerce_db'),
  DB_SSL: booleanString,

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  ALLOWED_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3005'),
  TRUST_PROXY: booleanString,
  REQUIRE_EMAIL_VERIFICATION: booleanString,

  MAIL_FROM: z.string().default('no-reply@elysia-ecom.local'),
  MAIL_WEBHOOK_URL: z.string().url().optional(),

  TAX_RATE: z.coerce.number().min(0).max(1).default(0),
  PAYMENT_SIMULATE_FAILURE_RATE: z.coerce.number().min(0).max(1).default(0),
  REVIEW_AUTO_APPROVE: z.enum(['true', 'false']).default('true').transform((value) => value === 'true'),
});

const parsed = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  APP_URL: process.env.APP_URL,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_USER: process.env.DB_USER || process.env.DB_USERNAME,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  DB_SSL: process.env.DB_SSL,
  JWT_SECRET: process.env.JWT_SECRET,
  LOG_LEVEL: process.env.LOG_LEVEL,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  TRUST_PROXY: process.env.TRUST_PROXY,
  REQUIRE_EMAIL_VERIFICATION: process.env.REQUIRE_EMAIL_VERIFICATION,
  MAIL_FROM: process.env.MAIL_FROM,
  MAIL_WEBHOOK_URL: process.env.MAIL_WEBHOOK_URL,
  TAX_RATE: process.env.TAX_RATE,
  PAYMENT_SIMULATE_FAILURE_RATE: process.env.PAYMENT_SIMULATE_FAILURE_RATE,
  REVIEW_AUTO_APPROVE: process.env.REVIEW_AUTO_APPROVE,
});

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
  console.error(`Invalid environment configuration: ${issues}`);
  process.exit(1);
}

const env = parsed.data;

if (env.NODE_ENV === 'production' && env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be at least 32 characters in production');
  process.exit(1);
}

if (env.NODE_ENV === 'production' && env.JWT_SECRET === 'super-secret-key') {
  console.error('Refusing to start with the default JWT_SECRET in production');
  process.exit(1);
}

export const envConfig = {
  ...env,
  ALLOWED_ORIGINS: env.ALLOWED_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};

export type EnvConfig = typeof envConfig;

export default envConfig;
