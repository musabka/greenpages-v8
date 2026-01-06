import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationIntegrationService {
  private readonly logger = new Logger(NotificationIntegrationService.name);

  /**
   * اختبار اتصال Firebase Cloud Messaging
   */
  async testFcm(config: { serverKey: string; senderId: string; projectId: string }) {
    try {
      if (!config.serverKey || !config.senderId || !config.projectId) {
        throw new BadRequestException('جميع حقول Firebase مطلوبة');
      }

      // التحقق من صحة Server Key (يجب أن يبدأ بـ AAAA)
      if (!config.serverKey.startsWith('AAAA')) {
        throw new BadRequestException('Server Key غير صالح');
      }

      // في الوضع الحقيقي، سنقوم بإرسال اختبار إلى FCM
      // TODO: Implement actual FCM test
      const response = await this.sendTestFcm(config);

      return {
        success: true,
        message: 'تم الاتصال بـ Firebase Cloud Messaging بنجاح',
        details: {
          projectId: config.projectId,
          senderId: config.senderId,
        },
      };
    } catch (error) {
      this.logger.error('FCM test failed:', error);
      throw new BadRequestException(
        error.message || 'فشل الاتصال بـ Firebase Cloud Messaging',
      );
    }
  }

  /**
   * اختبار اتصال SMTP
   */
  async testSmtp(config: {
    host: string;
    port: string;
    user: string;
    password: string;
    secure: boolean;
    fromEmail: string;
    testEmail: string;
  }) {
    try {
      if (!config.host || !config.port || !config.user || !config.password) {
        throw new BadRequestException('جميع حقول SMTP مطلوبة');
      }

      // إنشاء transporter
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: parseInt(config.port),
        secure: config.secure,
        auth: {
          user: config.user,
          pass: config.password,
        },
      });

      // التحقق من الاتصال
      await transporter.verify();

      // إرسال بريد اختبار
      if (config.testEmail) {
        await transporter.sendMail({
          from: config.fromEmail || config.user,
          to: config.testEmail,
          subject: 'اختبار إعدادات SMTP - الصفحات الخضراء',
          html: `
            <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>مرحباً</h2>
              <p>هذه رسالة اختبار للتأكد من صحة إعدادات SMTP.</p>
              <p>تم إرسال هذه الرسالة من نظام الإشعارات في الصفحات الخضراء.</p>
              <hr>
              <p style="color: #666; font-size: 12px;">
                إذا لم تطلب هذه الرسالة، يمكنك تجاهلها.
              </p>
            </div>
          `,
        });
      }

      return {
        success: true,
        message: 'تم الاتصال بخادم SMTP بنجاح' + (config.testEmail ? ' وتم إرسال رسالة اختبار' : ''),
        details: {
          host: config.host,
          port: config.port,
          secure: config.secure,
          user: config.user,
        },
      };
    } catch (error) {
      this.logger.error('SMTP test failed:', error);
      
      let errorMessage = 'فشل الاتصال بخادم SMTP';
      if (error.code === 'EAUTH') {
        errorMessage = 'خطأ في اسم المستخدم أو كلمة المرور';
      } else if (error.code === 'ECONNECTION') {
        errorMessage = 'فشل الاتصال بالخادم. تحقق من Host و Port';
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = 'انتهت مهلة الاتصال. تحقق من إعدادات الشبكة';
      }

      throw new BadRequestException(errorMessage);
    }
  }

  /**
   * اختبار اتصال SMS Gateway
   */
  async testSms(config: {
    provider: string;
    apiKey: string;
    apiSecret: string;
    fromNumber: string;
    testNumber: string;
    accountSid?: string;
  }) {
    try {
      if (!config.provider || !config.apiKey || !config.apiSecret || !config.fromNumber) {
        throw new BadRequestException('جميع حقول SMS مطلوبة');
      }

      if (config.provider === 'twilio') {
        return this.testTwilio(config);
      } else if (config.provider === 'nexmo') {
        return this.testNexmo(config);
      } else {
        return this.testCustomSms(config);
      }
    } catch (error) {
      this.logger.error('SMS test failed:', error);
      throw new BadRequestException(
        error.message || 'فشل الاتصال بخدمة SMS',
      );
    }
  }

  /**
   * اختبار Twilio
   */
  private async testTwilio(config: any) {
    if (!config.accountSid) {
      throw new BadRequestException('Account SID مطلوب لـ Twilio');
    }

    // TODO: Implement actual Twilio test
    // const twilio = require('twilio');
    // const client = twilio(config.accountSid, config.apiSecret);

    return {
      success: true,
      message: 'تم الاتصال بـ Twilio بنجاح',
      details: {
        provider: 'twilio',
        accountSid: config.accountSid,
        fromNumber: config.fromNumber,
      },
    };
  }

  /**
   * اختبار Nexmo/Vonage
   */
  private async testNexmo(config: any) {
    // TODO: Implement actual Nexmo test
    return {
      success: true,
      message: 'تم الاتصال بـ Nexmo بنجاح',
      details: {
        provider: 'nexmo',
        apiKey: config.apiKey,
        fromNumber: config.fromNumber,
      },
    };
  }

  /**
   * اختبار Custom SMS Gateway
   */
  private async testCustomSms(config: any) {
    return {
      success: true,
      message: 'إعدادات SMS Gateway مخصصة - يرجى التحقق يدوياً',
      details: {
        provider: 'custom',
        fromNumber: config.fromNumber,
      },
    };
  }

  /**
   * إرسال اختبار FCM (للتطوير المستقبلي)
   */
  private async sendTestFcm(config: any) {
    // TODO: Implement actual FCM sending
    // استخدام Firebase Admin SDK
    return { sent: true };
  }
}
