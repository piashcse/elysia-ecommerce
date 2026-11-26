import { z, ZodError, ZodSchema } from 'zod';
import { ValidationError } from '../core/errors';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isUuid = (value: unknown): value is string => typeof value === 'string' && UUID_REGEX.test(value);

/**
 * Validates data against a Zod schema.
 * @throws ValidationError if validation fails
 */
export const validate = <T extends ZodSchema>(schema: T, data: unknown): z.infer<T> => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
      throw new ValidationError(message);
    }
    throw new ValidationError('Validation failed');
  }
};

/**
 * Validates data asynchronously against a Zod schema.
 * @throws ValidationError if validation fails
 */
export const validateAsync = async <T extends ZodSchema>(schema: T, data: unknown): Promise<z.infer<T>> => {
  try {
    return await schema.parseAsync(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
      throw new ValidationError(message);
    }
    throw new ValidationError('Validation failed');
  }
};

/**
 * Creates an Elysia-compatible validator from a Zod schema.
 */
export const createValidator = <T extends ZodSchema>(schema: T) => {
  return {
    validate: (data: unknown) => validate(schema, data),
    schema,
  };
};

/**
 * Elysia local hook to validate body, query, or params with a Zod schema.
 */
export const zodValidate = (schema: ZodSchema, part: 'body' | 'query' | 'params' = 'body') => {
  return {
    beforeHandle: ({ [part]: data }: any) => {
      validate(schema, data);
    },
  };
};

// Common Zod schemas that can be reused across the application

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

// Sort schema
export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// Base filters schema
export const baseFiltersSchema = z.object({
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

export const getPagination = (query: { page?: unknown; limit?: unknown }) => {
  const rawPage = Number(query.page ?? 1);
  const rawLimit = Number(query.limit ?? 10);
  const page = Number.isFinite(rawPage) ? Math.max(1, Math.trunc(rawPage)) : 1;
  const limit = Number.isFinite(rawLimit) ? Math.min(100, Math.max(1, Math.trunc(rawLimit))) : 10;
  return { page, limit, offset: (page - 1) * limit };
};
