import { AppDataSource } from '../../../config/database';
import { VerificationCode, VerificationCodeType } from '../entity/VerificationCode';
import { User, UserStatus } from '../../user/entity/User';
import { NotFoundError, ConflictError } from '../../../core/errors';

export class SMSService {
  private verificationCodeRepository = AppDataSource.getRepository(VerificationCode);
  private userRepository = AppDataSource.getRepository(User);

  async sendVerificationSMS(phone: string): Promise<VerificationCode> {
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

    const savedCode = await this.verificationCodeRepository.save(verificationCode);

    // In a real application, you would send an SMS using a service like Twilio, etc.
    console.log(`Verification SMS sent to ${phone} with code: ${code}`);
    // TODO: Implement actual SMS sending service (e.g., Twilio, AWS SNS, etc.)

    return savedCode;
  }

  async verifySMSCode(phone: string, code: string): Promise<User> {
    const verificationCode = await this.verificationCodeRepository.findOne({
      where: {
        phone,
        code,
        type: VerificationCodeType.SMS,
        isUsed: false,
        expiresAt: AppDataSource.createQueryBuilder()
          .where('expiresAt > :now', { now: new Date() })
      }
    });

    if (!verificationCode) {
      throw new NotFoundError('Invalid or expired SMS verification code');
    }

    const user = await this.userRepository.findOne({ where: { phone } });
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

  async requestPhoneVerification(userId: string): Promise<VerificationCode> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.phone) {
      throw new NotFoundError('User not found or phone not set');
    }

    if (user.phoneVerifiedAt) {
      throw new ConflictError('Phone number is already verified');
    }

    return this.sendVerificationSMS(user.phone);
  }
}
