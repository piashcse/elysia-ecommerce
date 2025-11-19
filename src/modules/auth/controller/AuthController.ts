import { Elysia, t } from 'elysia';
import { VerificationService } from '../service/VerificationService';
import { UserService } from '../../user/service/UserService';
import { successResponse, errorResponse } from '../../../core/responses';
import { validate } from '../../../utils/validation';
import { VerificationCodeType } from '../entity/VerificationCode';
import { CreateUserDto } from '../../user/dto/UserDto';
import { comparePassword } from '../../../utils/auth';
import { BadRequestError } from '../../../core/errors';

const verificationService = new VerificationService();
const userService = new UserService();

export const authController = new Elysia({ prefix: '/auth', tags: ['Auth'] })
  // Register a new user with email or phone verification
  .post(
    '/register',
    async ({ body, set }) => {
      try {
        const { email, password, phone, firstName, lastName } = body;

        // Create the user
        const user = await userService.createUser({
          email,
          password,
          phone,
          firstName,
          lastName
        });

        let verificationCode;
        if (email) {
          // Send email verification code
          verificationCode = await verificationService.sendVerificationEmail(email);
        } else if (phone) {
          // Send SMS verification code
          verificationCode = await verificationService.sendVerificationSMS(phone);
        }

        // Don't return password in response
        const { password: _, ...userWithoutPassword } = user;

        set.status = 201;
        return successResponse(
          { user: userWithoutPassword },
          'User registered successfully. Please check your email or SMS for verification code.',
          201
        );
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      body: t.Object({
        email: t.Optional(t.String()),
        password: t.String(),
        phone: t.Optional(t.String()),
        firstName: t.Optional(t.String()),
        lastName: t.Optional(t.String()),
      }),
      detail: { tags: ['Auth'] }
    }
  )

  // Login user
  .post(
    '/login',
    async ({ body, set, jwt }) => {
      try {
        const { email, password } = body;

        const user = await userService.findUserByEmail(email);
        if (!user) {
          set.status = 401;
          return errorResponse('Invalid email or password');
        }

        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
          set.status = 401;
          return errorResponse('Invalid email or password');
        }

        // Check user verification status
        if (user.status === 'pending_verification') {
          set.status = 401;
          return errorResponse('Please verify your email address before logging in');
        }

        if (!user.isActive) {
          set.status = 401;
          return errorResponse('User account is deactivated');
        }

        // Generate JWT token
        const token = await jwt.sign({
          sub: user.id,
          email: user.email,
          role: user.role,
        });

        // Don't return password in response
        const { password: _, ...userWithoutPassword } = user;

        return successResponse(
          { user: userWithoutPassword, token },
          'Login successful'
        );
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
      detail: { tags: ['Auth'] }
    }
  )

  // Resend verification code (email or SMS)
  .post(
    '/resend-code',
    async ({ body, set }) => {
      try {
        const { email, phone } = body;

        if (email) {
          // Send new verification email code
          await verificationService.sendVerificationEmail(email);
          return successResponse(null, 'Verification email code sent successfully');
        } else if (phone) {
          // Send new verification SMS code
          await verificationService.sendVerificationSMS(phone);
          return successResponse(null, 'Verification SMS code sent successfully');
        } else {
          set.status = 400;
          return errorResponse('Either email or phone must be provided');
        }
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      body: t.Object({
        email: t.Optional(t.String()),
        phone: t.Optional(t.String()),
      }),
      detail: { tags: ['Auth'] }
    }
  )

  // Generic verification endpoint that works for both email and SMS
  .post(
    '/verify-code',
    async ({ body, set }) => {
      try {
        const { verificationCode, email, phone } = body;

        let user: any;
        if (email) {
          // Verify email with the code
          const verificationCodeEntity = await verificationService.verifyCode(verificationCode, VerificationCodeType.EMAIL);
          if (verificationCodeEntity.email !== email) {
            throw new BadRequestError('Verification code does not match the email provided');
          }
          user = await verificationService.verifyEmail(verificationCode);
        } else if (phone) {
          // Verify SMS with the code
          const verificationCodeEntity = await verificationService.verifyCode(verificationCode, VerificationCodeType.SMS);
          if (verificationCodeEntity.phone !== phone) {
            throw new BadRequestError('Verification code does not match the phone number provided');
          }
          user = await verificationService.verifySMS(verificationCode);
        } else {
          throw new BadRequestError('Either email or phone must be provided for verification');
        }

        // Don't return password in response
        const { password, ...userWithoutPassword } = user;

        return successResponse(
          { user: userWithoutPassword },
          'Verification successful.'
        );
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      body: t.Object({
        verificationCode: t.String(),
        email: t.Optional(t.String()),
        phone: t.Optional(t.String()),
      }),
      detail: { tags: ['Auth'] }
    }
  );