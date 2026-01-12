import {z, ZodSchema} from 'zod';
import {ValidationError} from '../core/errors';

/**
 * Validates data against a Zod schema
 * @param schema The Zod schema to validate against
 * @param data The data to validate
 * @returns The validated and parsed data
 * @throws ValidationError if validation fails
 */
export const validate = <T extends ZodSchema>(schema: T, data: unknown): z.infer<T> => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      throw new ValidationError(message);
    }
    throw new ValidationError('Validation failed');
  }
};

/**
 * Validates data asynchronously against a Zod schema
 * @param schema The Zod schema to validate against
 * @param data The data to validate
 * @returns The validated and parsed data
 * @throws ValidationError if validation fails
 */
export const validateAsync = async <T extends ZodSchema>(schema: T, data: unknown): Promise<z.infer<T>> => {
  try {
    return await schema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      throw new ValidationError(message);
    }
    throw new ValidationError('Validation failed');
  }
};

/**
 * Creates an Elysia-compatible validator from a Zod schema
 * @param schema The Zod schema to use for validation
 * @returns An object that can be used in Elysia validation
 */
export const createValidator = <T extends ZodSchema>(schema: T) => {
  return {
    validate: (data: unknown) => validate(schema, data),
    schema,
  };
};

/**
 * Elysia hook to validate body, query, or params with a Zod schema
 */
export const zodValidate = (schema: ZodSchema, part: 'body' | 'query' | 'params' = 'body') => {
    return {
        onBeforeHandle: ({ [part]: data }: any) => {
            validate(schema, data);
        }
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
