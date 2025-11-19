import { createHash, randomBytes } from 'crypto';

/**
 * Hash a password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, 12);
};

/**
 * Compare a plain text password with a hashed password
 */
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generate a cryptographically secure random token of specified length
 */
export const generateRandomToken = (length: number = 32): string => {
  // Generate random bytes and convert to hex string
  return randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};