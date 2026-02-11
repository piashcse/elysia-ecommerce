import { z, ZodSchema, ZodTypeAny } from 'zod';
import { ValidationError, ErrorCodes } from '../core/errors';
import { errorHandler } from '../utils/errors';

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
      const errorInfo = errorHandler.handleValidationError(error.errors);
      throw new ValidationError(errorInfo.message, errorInfo.code, errorInfo.details);
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
      const errorInfo = errorHandler.handleValidationError(error.errors);
      throw new ValidationError(errorInfo.message, errorInfo.code, errorInfo.details);
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

// Email schema
export const emailSchema = z.string().email('Invalid email format');

// Password schema
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number');

// UUID schema
export const uuidSchema = z.string().uuid('Invalid UUID format');

// String with length constraints
export const stringWithLength = (min: number, max: number) => 
  z.string()
    .min(min, `Minimum length is ${min}`)
    .max(max, `Maximum length is ${max}`);

// Positive number schema
export const positiveNumberSchema = z.number().positive('Value must be positive');

// Non-negative number schema
export const nonNegativeNumberSchema = z.number().nonnegative('Value must be non-negative');

// Boolean schema with coercion
export const booleanSchema = z.coerce.boolean();

// Date schema
export const dateSchema = z.coerce.date();

// Price schema (positive decimal)
export const priceSchema = z.coerce.number().positive('Price must be positive').min(0.01, 'Price must be at least 0.01');

// Phone number schema (basic format)
export const phoneSchema = z.string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');

// URL schema
export const urlSchema = z.string().url('Invalid URL format');

// Image URL schema (with common image extensions)
export const imageUrlSchema = z.string()
  .url('Invalid image URL format')
  .refine(url => /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url), {
    message: 'URL must point to a valid image file (jpg, jpeg, png, gif, webp, bmp)'
  });

// Slug schema (URL-friendly string)
export const slugSchema = z.string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format (alphanumeric and hyphens only, lowercase)');

// Name schema (for person names)
export const nameSchema = z.string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be at most 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

// Address schema components
export const addressLineSchema = z.string().min(5, 'Address must be at least 5 characters').max(200);
export const citySchema = z.string().min(2, 'City must be at least 2 characters').max(100);
export const stateSchema = z.string().min(2, 'State must be at least 2 characters').max(100);
export const zipCodeSchema = z.string().min(3, 'Zip code must be at least 3 characters').max(20);
export const countrySchema = z.string().min(2, 'Country must be at least 2 characters').max(100);

// Common reusable object schemas
export const baseEntitySchema = z.object({
  id: uuidSchema.optional(),
  createdAt: dateSchema.optional(),
  updatedAt: dateSchema.optional(),
});

export const auditEntitySchema = baseEntitySchema.extend({
  createdBy: uuidSchema.optional(),
  updatedBy: uuidSchema.optional(),
});

// User-related schemas
export const userCredentialsSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const userProfileSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  phone: phoneSchema.optional(),
});

// Product-related schemas
export const productBasicSchema = z.object({
  name: stringWithLength(3, 200),
  description: z.string().max(2000).optional(),
  price: priceSchema,
  stockQuantity: nonNegativeNumberSchema,
  sku: stringWithLength(3, 50),
  isActive: booleanSchema.optional().default(true),
});

// Category-related schemas
export const categorySchema = z.object({
  name: stringWithLength(2, 100),
  description: z.string().max(500).optional(),
  slug: slugSchema.optional(),
  isActive: booleanSchema.optional().default(true),
});

// Order-related schemas
export const orderItemSchema = z.object({
  productId: uuidSchema,
  quantity: positiveNumberSchema,
  price: priceSchema,
});

export const shippingAddressSchema = z.object({
  street: addressLineSchema,
  city: citySchema,
  state: stateSchema,
  zipCode: zipCodeSchema,
  country: countrySchema,
});

// Validation utility functions
export const validateEmail = (email: string) => validate(emailSchema, email);
export const validatePassword = (password: string) => validate(passwordSchema, password);
export const validateUUID = (id: string) => validate(uuidSchema, id);
export const validatePagination = (data: any) => validate(paginationSchema, data);

// Validation middleware for common use cases
export const validateRequestBody = <T extends ZodSchema>(schema: T) => {
  return {
    body: schema,
    onResponse: (ctx: any) => {
      if (ctx.error) {
        const errorInfo = errorHandler.handle(ctx.error, 'request-body-validation');
        ctx.set.status = 400;
        return {
          success: false,
          statusCode: 400,
          message: errorInfo.message,
          error: { code: errorInfo.code, details: errorInfo.details }
        };
      }
    }
  };
};

// Validation result type
export type ValidationResult<T> = {
  success: boolean;
  data?: T;
  errors?: z.ZodIssue[];
  message?: string;
};

// Safe validation that returns result instead of throwing
export const safeValidate = <T extends ZodSchema>(schema: T, data: unknown): ValidationResult<z.infer<T>> => {
  try {
    const parsedData = schema.parse(data);
    return {
      success: true,
      data: parsedData
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors,
        message: error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
      };
    }
    return {
      success: false,
      message: 'Validation failed'
    };
  }
};
