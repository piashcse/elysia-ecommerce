import { AppDataSource } from '../../../config/database';
import { VerificationCode, VerificationCodeType } from '../entity/VerificationCode';
import { User } from '../../user/entity/User';
import { UserStatus } from '../../user/entity/User';
import { NotFoundError, BadRequestError, ConflictError } from '../../../core/errors';

export class VerificationService {
  private verificationCodeRepository = AppDataSource.getRepository(VerificationCode);
  private userRepository = AppDataSource.getRepository(User);

  async createEmailVerificationCode(email: string): Promise<VerificationCode> {
    // Check if user exists
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if email is already verified
    if (user.emailVerifiedAt) {
      throw new ConflictError('Email is already verified');
    }

    // Remove any existing unused codes for this email
    await this.verificationCodeRepository.delete({
      email,
      type: VerificationCodeType.EMAIL,
      isUsed: false
    });

    // Generate a 6-digit numeric verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit random code
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // Code expires in 10 minutes

    const verificationCode = new VerificationCode();
    verificationCode.code = code;
    verificationCode.type = VerificationCodeType.EMAIL;
    verificationCode.email = email;
    verificationCode.userId = user.id;
    verificationCode.expiresAt = expiresAt;

    return this.verificationCodeRepository.save(verificationCode);
  }

  async createSMSVerificationCode(phone: string): Promise<VerificationCode> {
    // Check if user exists
    const user = await this.userRepository.findOne({ where: { phone } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if phone is already verified
    if (user.phoneVerifiedAt) {
      throw new ConflictError('Phone is already verified');
    }

    // Remove any existing unused codes for this phone
    await this.verificationCodeRepository.delete({
      phone,
      type: VerificationCodeType.SMS,
      isUsed: false
    });

    // Generate a 6-digit numeric verification code (same format as email)
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit random code
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // Code expires in 10 minutes

    const verificationCode = new VerificationCode();
    verificationCode.code = code;
    verificationCode.type = VerificationCodeType.SMS;
    verificationCode.phone = phone;
    verificationCode.userId = user.id;
    verificationCode.expiresAt = expiresAt;

    return this.verificationCodeRepository.save(verificationCode);
  }

  async verifyCode(code: string, type: VerificationCodeType): Promise<VerificationCode> {
    const verificationCode = await this.verificationCodeRepository.findOne({
      where: {
        code,
        type,
        isUsed: false,
        expiresAt: AppDataSource.createQueryBuilder()
          .where('expiresAt > :now', { now: new Date() })
      }
    });

    if (!verificationCode) {
      throw new NotFoundError('Invalid or expired verification code');
    }

    return verificationCode;
  }

  async verifyEmail(code: string): Promise<User> {
    const verificationCode = await this.verifyCode(code, VerificationCodeType.EMAIL);

    if (!verificationCode.email) {
      throw new BadRequestError('Invalid verification code');
    }

    const user = await this.userRepository.findOne({ where: { email: verificationCode.email } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Update user to verified status
    user.status = UserStatus.VERIFIED;
    user.emailVerifiedAt = new Date();
    user.isActive = true; // Activate the account after verification

    // Mark the code as used
    verificationCode.isUsed = true;
    await this.verificationCodeRepository.save(verificationCode);

    return this.userRepository.save(user);
  }

  async verifySMS(code: string): Promise<User> {
    const verificationCode = await this.verifyCode(code, VerificationCodeType.SMS);

    if (!verificationCode.phone) {
      throw new BadRequestError('Invalid verification code');
    }

    const user = await this.userRepository.findOne({ where: { phone: verificationCode.phone } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Update user phone verification status
    user.phoneVerifiedAt = new Date();
    user.status = UserStatus.VERIFIED;
    user.isActive = true; // Activate the account after verification

    // Mark the code as used
    verificationCode.isUsed = true;
    await this.verificationCodeRepository.save(verificationCode);

    return this.userRepository.save(user);
  }

  async createPasswordResetCode(email: string): Promise<VerificationCode> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Remove any existing unused password reset codes for this email
    await this.verificationCodeRepository.delete({
      email,
      type: VerificationCodeType.PASSWORD_RESET,
      isUsed: false
    });

    // Generate a 6-digit numeric verification code (same format as email/SMS)
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit random code
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // Code expires in 10 minutes

    const verificationCode = new VerificationCode();
    verificationCode.code = code;
    verificationCode.type = VerificationCodeType.PASSWORD_RESET;
    verificationCode.email = email;
    verificationCode.userId = user.id;
    verificationCode.expiresAt = expiresAt;

    return this.verificationCodeRepository.save(verificationCode);
  }

  async validatePasswordResetCode(code: string): Promise<VerificationCode> {
    return this.verifyCode(code, VerificationCodeType.PASSWORD_RESET);
  }

  async sendVerificationEmail(email: string): Promise<VerificationCode> {
    const code = await this.createEmailVerificationCode(email);

    // In a real application, you would send an email using a service like SendGrid, Mailgun, etc.
    console.log(`Verification email sent to ${email} with code: ${code.code}`);
    // TODO: Implement actual email sending service (e.g., nodemailer, SendGrid, etc.)

    return code;
  }

  async sendVerificationSMS(phone: string): Promise<VerificationCode> {
    const code = await this.createSMSVerificationCode(phone);

    // In a real application, you would send an SMS using a service like Twilio, etc.
    console.log(`Verification SMS sent to ${phone} with code: ${code.code}`);
    // TODO: Implement actual SMS sending service (e.g., Twilio, etc.)

    return code;
  }
}
