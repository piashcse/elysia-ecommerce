import { AppError, ConflictError, ValidationError } from './errors';

/**
 * Maps PostgreSQL/`pg` errors to safe application errors so raw SQL and query
 * parameters are never returned to clients.
 */
export const mapDatabaseError = (error: unknown): AppError | null => {
  if (!error || typeof error !== 'object') return null;

  const code = (error as { code?: string }).code;

  switch (code) {
    case '23505':
      return new ConflictError('A record with this value already exists', 'DUPLICATE_VALUE');
    case '23503':
      return new ConflictError('Related record was not found or is still in use', 'RELATED_RECORD_CONFLICT');
    case '23502':
      return new ValidationError('A required field is missing', 'REQUIRED_FIELD_MISSING');
    case '23514':
      return new ValidationError('Input violates a data constraint', 'CONSTRAINT_VIOLATION');
    case '22P02':
    case '22007':
    case '22008':
      return new ValidationError('Invalid input format', 'INVALID_INPUT_FORMAT');
    case '22001':
      return new ValidationError('Input exceeds the maximum allowed length', 'VALUE_TOO_LONG');
    case '22003':
      return new ValidationError('Numeric value is out of range', 'NUMERIC_OUT_OF_RANGE');
    case '40001':
    case '40P01':
      return new ConflictError('The request conflicted with another operation; please retry', 'RETRYABLE_CONFLICT');
    default:
      return null;
  }
};
