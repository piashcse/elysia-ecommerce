/**
 * Password hashing utilities.
 *
 * New passwords use Argon2id via Bun.password. Legacy bcrypt hashes (created by
 * older versions of this project) are still verified so existing accounts keep
 * working; they are upgraded to Argon2id on the next successful login.
 */
const isBcryptHash = (hash: string): boolean => /^\$2[aby]\$\d{2}\$/.test(hash);

export const hashPassword = async (password: string): Promise<string> => {
  return Bun.password.hash(password, {
    algorithm: 'argon2id',
    memoryCost: 19456,
    timeCost: 2,
  });
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  if (isBcryptHash(hashedPassword)) {
    const bcrypt = await import('bcryptjs');
    return bcrypt.compare(password, hashedPassword);
  }

  return Bun.password.verify(password, hashedPassword);
};

export const passwordNeedsRehash = (hashedPassword: string): boolean => isBcryptHash(hashedPassword);

/**
 * Generate a cryptographically secure random token.
 */
export const generateRandomString = (length = 32): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Buffer.from(bytes).toString('base64url');
};

/**
 * Generate a hash from a string using SHA-256.
 */
export const sha256Hash = (input: string): string => {
  const hasher = new Bun.CryptoHasher('sha256');
  hasher.update(input);
  return hasher.digest('hex');
};

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();
