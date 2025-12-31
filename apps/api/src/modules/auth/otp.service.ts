import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@greenpages/database';

// تعريف OtpPurpose محلياً حتى يتم توليد Prisma Client
type OtpPurpose = 'VERIFY_PHONE' | 'RESET_PASSWORD' | 'LOGIN';

const prisma = new PrismaClient();

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly otpExpiryMinutes: number;
  private readonly maxAttempts: number;
  private readonly resendCooldownSeconds: number;

  constructor(private readonly configService: ConfigService) {
    this.otpExpiryMinutes = this.configService.get<number>('OTP_EXPIRY_MINUTES', 5);
    this.maxAttempts = this.configService.get<number>('OTP_MAX_ATTEMPTS', 5);
    this.resendCooldownSeconds = this.configService.get<number>('OTP_RESEND_COOLDOWN', 60);
  }

  /**
   * إنشاء رمز OTP عشوائي من 6 أرقام
   */
  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * إرسال رمز OTP للهاتف
   */
  async sendOtp(phone: string, purpose: OtpPurpose = 'VERIFY_PHONE') {
    // التحقق من وجود OTP غير منتهي الصلاحية
    const recentOtp = await (prisma as any).phoneOtp.findFirst({
      where: {
        phone,
        purpose,
        verified: false,
        expiresAt: { gt: new Date() },
        createdAt: {
          gt: new Date(Date.now() - this.resendCooldownSeconds * 1000),
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recentOtp) {
      const waitTime = Math.ceil(
        (new Date(recentOtp.createdAt).getTime() + this.resendCooldownSeconds * 1000 - Date.now()) / 1000
      );
      throw new BadRequestException(`يرجى الانتظار ${waitTime} ثانية قبل طلب رمز جديد`);
    }

    // إلغاء أي OTPs سابقة غير مستخدمة
    await (prisma as any).phoneOtp.updateMany({
      where: {
        phone,
        purpose,
        verified: false,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    // إنشاء رمز جديد
    const code = this.generateOtpCode();
    const expiresAt = new Date(Date.now() + this.otpExpiryMinutes * 60 * 1000);

    await (prisma as any).phoneOtp.create({
      data: {
        phone,
        code,
        purpose,
        expiresAt,
      },
    });

    // إرسال SMS (سيتم تنفيذها لاحقاً مع مزود SMS)
    await this.sendSms(phone, code);

    this.logger.log(`OTP sent to ${phone.substring(0, 4)}****${phone.slice(-3)}`);

    return {
      message: 'تم إرسال رمز التحقق إلى هاتفك',
      expiresInSeconds: this.otpExpiryMinutes * 60,
    };
  }

  /**
   * التحقق من رمز OTP
   */
  async verifyOtp(phone: string, code: string, purpose: OtpPurpose = 'VERIFY_PHONE') {
    const otp = await (prisma as any).phoneOtp.findFirst({
      where: {
        phone,
        purpose,
        verified: false,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new BadRequestException('لا يوجد رمز تحقق صالح. يرجى طلب رمز جديد');
    }

    // التحقق من عدد المحاولات
    if (otp.attempts >= this.maxAttempts) {
      await (prisma as any).phoneOtp.update({
        where: { id: otp.id },
        data: { usedAt: new Date() },
      });
      throw new BadRequestException('تم تجاوز الحد الأقصى للمحاولات. يرجى طلب رمز جديد');
    }

    // التحقق من الرمز
    if (otp.code !== code) {
      await (prisma as any).phoneOtp.update({
        where: { id: otp.id },
        data: { attempts: otp.attempts + 1 },
      });
      const remainingAttempts = this.maxAttempts - otp.attempts - 1;
      throw new BadRequestException(`رمز التحقق غير صحيح. متبقي ${remainingAttempts} محاولات`);
    }

    // تحديث OTP كمستخدم
    await (prisma as any).phoneOtp.update({
      where: { id: otp.id },
      data: {
        verified: true,
        usedAt: new Date(),
      },
    });

    return {
      verified: true,
      message: 'تم التحقق من رقم الهاتف بنجاح',
    };
  }

  /**
   * إرسال رسالة SMS
   * ملاحظة: هذه الدالة تستخدم console.log للتطوير
   * يجب استبدالها بمزود SMS حقيقي في الإنتاج
   */
  private async sendSms(phone: string, code: string): Promise<void> {
    const smsProvider = this.configService.get<string>('SMS_PROVIDER', 'console');

    if (smsProvider === 'console' || process.env.NODE_ENV === 'development') {
      // في وضع التطوير، نطبع الرمز في الكونسول
      this.logger.warn(`
╔══════════════════════════════════════════════════════════════╗
║                    📱 OTP CODE (Development)                   ║
╠══════════════════════════════════════════════════════════════╣
║  Phone: ${phone}                                    ║
║  Code:  ${code}                                              ║
║  Expires in: ${this.otpExpiryMinutes} minutes                                    ║
╚══════════════════════════════════════════════════════════════╝
      `);
      return;
    }

    // TODO: Integration with SMS Provider (e.g., Twilio, Nexmo, or local Egyptian providers)
    // Example for Twilio:
    // const twilioClient = new Twilio(accountSid, authToken);
    // await twilioClient.messages.create({
    //   body: `رمز التحقق الخاص بك في الصفحات الخضراء: ${code}`,
    //   from: '+1234567890',
    //   to: `+2${phone}`,
    // });

    throw new Error('SMS provider not configured');
  }
}
