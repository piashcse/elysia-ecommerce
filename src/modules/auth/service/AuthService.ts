import { and, eq, gt, isNull, sql } from 'drizzle-orm';
import { db } from '../../../config/database';
import { twoFactorRecoveryCodes, users } from '../../../database/schema';
import {
  comparePassword,
  generateRandomString,
  hashPassword,
  normalizeEmail,
  passwordNeedsRehash,
  sha256Hash,
} from '../../../utils/auth';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../../core/errors';
import { UserRole } from '../../../core/roles';
import envConfig from '../../../config/env';
import { mailService } from '../../../services/mail.service';
import { generateTotpSecret, otpauthUrl, verifyTotp } from '../../../utils/totp';

interface RegisterInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

interface LoginInput {
  email: string;
  password: string;
  twoFactorCode?: string;
}

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;

const safeUser = (user: any) => {
  const {
    password,
    emailVerificationToken,
    emailVerificationExpires,
    passwordResetToken,
    passwordResetExpires,
    ...safe
  } = user;
  return safe;
};

export class AuthService {
  private async sendVerificationEmail(user: { id: string; email: string }, token: string) {
    const link = `${envConfig.APP_URL}/verify-email?token=${encodeURIComponent(token)}`;
    await mailService
      .send({
        to: user.email,
        subject: 'Verify your email address',
        text: `Hi,\n\nPlease verify your email address by opening this link:\n${link}\n\nThis link expires in 24 hours.`,
        html: `<p>Hi,</p><p>Please verify your email address:</p><p><a href="${link}">Verify email</a></p><p>This link expires in 24 hours.</p>`,
      })
      .catch((error) => {
        console.error('Failed to send verification email:', (error as Error).message);
      });
  }

  private async sendPasswordResetEmail(user: { email: string }, token: string) {
    const link = `${envConfig.APP_URL}/reset-password?token=${encodeURIComponent(token)}`;
    await mailService
      .send({
        to: user.email,
        subject: 'Reset your password',
        text: `Hi,\n\nReset your password by opening this link:\n${link}\n\nThis link expires in 1 hour. If you did not request this, ignore this email.`,
        html: `<p>Hi,</p><p>Reset your password:</p><p><a href="${link}">Reset password</a></p><p>This link expires in 1 hour. If you did not request this, ignore this email.</p>`,
      })
      .catch((error) => {
        console.error('Failed to send password reset email:', (error as Error).message);
      });
  }

  async register(data: RegisterInput) {
    const email = normalizeEmail(data.email);

    const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    const hashedPassword = await hashPassword(data.password);
    const verificationToken = generateRandomString(32);
    const verificationHash = sha256Hash(verificationToken);

    const [newUser] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        // Public registration must never assign a privileged role.
        role: UserRole.CUSTOMER,
        emailVerified: false,
        emailVerificationToken: verificationHash,
        emailVerificationExpires: new Date(Date.now() + VERIFICATION_TTL_MS),
      })
      .returning();

    if (!newUser) {
      throw new Error('Failed to create user');
    }

    await this.sendVerificationEmail(newUser, verificationToken);
    return safeUser(newUser);
  }

  async login(data: LoginInput) {
    const email = normalizeEmail(data.email);
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isPasswordValid = await comparePassword(data.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive || user.deletedAt) {
      throw new UnauthorizedError('User account is deactivated');
    }

    if (envConfig.REQUIRE_EMAIL_VERIFICATION && !user.emailVerified) {
      throw new ForbiddenError('Email address has not been verified', 'EMAIL_NOT_VERIFIED');
    }

    if (user.twoFactorEnabled) {
      if (!data.twoFactorCode) {
        throw new ForbiddenError('Two-factor authentication code required', 'TWO_FACTOR_REQUIRED');
      }
      const totpValid = Boolean(user.twoFactorSecret) && verifyTotp(user.twoFactorSecret!, data.twoFactorCode);
      if (!totpValid) {
        const recoveryValid = await this.consumeRecoveryCode(user.id, data.twoFactorCode);
        if (!recoveryValid) {
          throw new UnauthorizedError('Invalid two-factor authentication code', 'INVALID_TWO_FACTOR_CODE');
        }
      }
    }

    let password = user.password;
    if (passwordNeedsRehash(password)) {
      password = await hashPassword(data.password);
    }

    const [updatedUser] = await db
      .update(users)
      .set({ password, lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, user.id))
      .returning();

    return safeUser(updatedUser ?? user);
  }

  async getSessionUser(userId: string, tokenVersion: number) {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        tokenVersion: users.tokenVersion,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.isActive || user.tokenVersion !== tokenVersion) {
      throw new UnauthorizedError('Session is no longer valid');
    }

    return user;
  }

  async setupTwoFactor(userId: string) {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    const secret = generateTotpSecret();
    await db.update(users).set({ twoFactorSecret: secret, updatedAt: new Date() }).where(eq(users.id, userId));
    return {
      secret,
      otpauthUrl: otpauthUrl(secret, user.email),
    };
  }

  async enableTwoFactor(userId: string, code: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user?.twoFactorSecret) throw new NotFoundError('Two-factor setup not started');
    if (!verifyTotp(user.twoFactorSecret, code)) throw new UnauthorizedError('Invalid two-factor code', 'INVALID_TWO_FACTOR_CODE');
    await db.update(users).set({ twoFactorEnabled: true, tokenVersion: sql`${users.tokenVersion} + 1`, updatedAt: new Date() }).where(eq(users.id, userId));
    const recoveryCodes = await this.issueRecoveryCodes(userId);
    return { recoveryCodes };
  }

  private normalizeRecoveryCode(code: string) {
    return code.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  }

  private async issueRecoveryCodes(userId: string) {
    const codes = Array.from({ length: 10 }, () => {
      const raw = crypto.randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase();
      return `${raw.slice(0, 5)}-${raw.slice(5)}`;
    });

    await db.transaction(async (tx) => {
      await tx.delete(twoFactorRecoveryCodes).where(eq(twoFactorRecoveryCodes.userId, userId));
      await tx.insert(twoFactorRecoveryCodes).values(
        codes.map((code) => ({
          userId,
          codeHash: sha256Hash(this.normalizeRecoveryCode(code)),
        }))
      );
    });

    return codes;
  }

  private async consumeRecoveryCode(userId: string, code: string): Promise<boolean> {
    const hash = sha256Hash(this.normalizeRecoveryCode(code));
    const [record] = await db
      .select()
      .from(twoFactorRecoveryCodes)
      .where(and(
        eq(twoFactorRecoveryCodes.userId, userId),
        eq(twoFactorRecoveryCodes.codeHash, hash),
        isNull(twoFactorRecoveryCodes.usedAt)
      ))
      .limit(1);

    if (!record) return false;

    const [updated] = await db
      .update(twoFactorRecoveryCodes)
      .set({ usedAt: new Date() })
      .where(and(eq(twoFactorRecoveryCodes.id, record.id), isNull(twoFactorRecoveryCodes.usedAt)))
      .returning({ id: twoFactorRecoveryCodes.id });

    return Boolean(updated);
  }

  async regenerateRecoveryCodes(userId: string, password: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new NotFoundError('User not found');
    if (!(await comparePassword(password, user.password))) throw new UnauthorizedError('Invalid password');
    if (!user.twoFactorEnabled) throw new ValidationError('Two-factor authentication is not enabled');
    return this.issueRecoveryCodes(userId);
  }

  async disableTwoFactor(userId: string, password: string, code: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new NotFoundError('User not found');
    if (!(await comparePassword(password, user.password))) throw new UnauthorizedError('Invalid password');
    if (user.twoFactorEnabled && (!user.twoFactorSecret || !verifyTotp(user.twoFactorSecret, code))) {
      throw new UnauthorizedError('Invalid two-factor code', 'INVALID_TWO_FACTOR_CODE');
    }
    await db.update(users).set({ twoFactorEnabled: false, twoFactorSecret: null, tokenVersion: sql`${users.tokenVersion} + 1`, updatedAt: new Date() }).where(eq(users.id, userId));
    await db.delete(twoFactorRecoveryCodes).where(eq(twoFactorRecoveryCodes.userId, userId));
  }

  private async findById(userId: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return user ?? null;
  }

  async logout(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ tokenVersion: sql`${users.tokenVersion} + 1`, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async verifyEmail(token: string): Promise<void> {
    const hash = sha256Hash(token);
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.emailVerificationToken, hash), gt(users.emailVerificationExpires, new Date())))
      .limit(1);

    if (!user) {
      throw new ValidationError('Verification link is invalid or has expired', 'INVALID_VERIFICATION_TOKEN');
    }

    await db
      .update(users)
      .set({
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));
  }

  async issueEmailVerification(userId: string, email: string): Promise<void> {
    const token = generateRandomString(32);
    await db
      .update(users)
      .set({
        emailVerified: false,
        emailVerificationToken: sha256Hash(token),
        emailVerificationExpires: new Date(Date.now() + VERIFICATION_TTL_MS),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    await this.sendVerificationEmail({ id: userId, email }, token);
  }

  async resendVerification(userId: string): Promise<void> {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new NotFoundError('User not found');
    if (user.emailVerified) {
      throw new ConflictError('Email address is already verified', 'EMAIL_ALREADY_VERIFIED');
    }

    const token = generateRandomString(32);
    await db
      .update(users)
      .set({
        emailVerificationToken: sha256Hash(token),
        emailVerificationExpires: new Date(Date.now() + VERIFICATION_TTL_MS),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    await this.sendVerificationEmail(user, token);
  }

  async forgotPassword(emailInput: string): Promise<void> {
    const email = normalizeEmail(emailInput);
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    // Always return success to avoid account enumeration.
    if (!user || !user.isActive) return;

    const token = generateRandomString(32);
    await db
      .update(users)
      .set({
        passwordResetToken: sha256Hash(token),
        passwordResetExpires: new Date(Date.now() + RESET_TTL_MS),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    await this.sendPasswordResetEmail(user, token);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hash = sha256Hash(token);
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.passwordResetToken, hash), gt(users.passwordResetExpires, new Date())))
      .limit(1);

    if (!user) {
      throw new ValidationError('Password reset link is invalid or has expired', 'INVALID_RESET_TOKEN');
    }

    await db
      .update(users)
      .set({
        password: await hashPassword(newPassword),
        passwordResetToken: null,
        passwordResetExpires: null,
        tokenVersion: sql`${users.tokenVersion} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));
  }
}
