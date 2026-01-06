import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedNotificationSettings() {
  console.log('🌱 Seeding notification settings...');

  // Firebase FCM Settings
  const fcmSettings = [
    { key: 'notification_fcm_enabled', value_ar: 'false', value_en: 'false', type: 'boolean', group: 'notifications', description: 'Enable Firebase Cloud Messaging', is_public: false },
    { key: 'notification_fcm_server_key', value_ar: '', value_en: '', type: 'text', group: 'notifications', description: 'FCM Server Key', is_public: false },
    { key: 'notification_fcm_sender_id', value_ar: '', value_en: '', type: 'text', group: 'notifications', description: 'FCM Sender ID', is_public: false },
    { key: 'notification_fcm_project_id', value_ar: '', value_en: '', type: 'text', group: 'notifications', description: 'FCM Project ID', is_public: false },
  ];

  // SMTP Settings
  const smtpSettings = [
    { key: 'notification_smtp_enabled', value_ar: 'false', value_en: 'false', type: 'boolean', group: 'notifications', description: 'Enable SMTP Email Notifications', is_public: false },
    { key: 'notification_smtp_host', value_ar: 'smtp.gmail.com', value_en: 'smtp.gmail.com', type: 'text', group: 'notifications', description: 'SMTP Host', is_public: false },
    { key: 'notification_smtp_port', value_ar: '587', value_en: '587', type: 'text', group: 'notifications', description: 'SMTP Port', is_public: false },
    { key: 'notification_smtp_user', value_ar: '', value_en: '', type: 'text', group: 'notifications', description: 'SMTP Username', is_public: false },
    { key: 'notification_smtp_password', value_ar: '', value_en: '', type: 'text', group: 'notifications', description: 'SMTP Password', is_public: false },
    { key: 'notification_smtp_from_email', value_ar: 'noreply@greenpages.com', value_en: 'noreply@greenpages.com', type: 'text', group: 'notifications', description: 'From Email Address', is_public: false },
    { key: 'notification_smtp_from_name', value_ar: 'الصفحات الخضراء', value_en: 'Green Pages', type: 'text', group: 'notifications', description: 'From Name', is_public: false },
    { key: 'notification_smtp_secure', value_ar: 'true', value_en: 'true', type: 'boolean', group: 'notifications', description: 'Use Secure Connection (TLS)', is_public: false },
  ];

  // SMS Settings
  const smsSettings = [
    { key: 'notification_sms_enabled', value_ar: 'false', value_en: 'false', type: 'boolean', group: 'notifications', description: 'Enable SMS Notifications', is_public: false },
    { key: 'notification_sms_provider', value_ar: 'twilio', value_en: 'twilio', type: 'text', group: 'notifications', description: 'SMS Provider (twilio/nexmo/custom)', is_public: false },
    { key: 'notification_sms_api_key', value_ar: '', value_en: '', type: 'text', group: 'notifications', description: 'SMS API Key', is_public: false },
    { key: 'notification_sms_api_secret', value_ar: '', value_en: '', type: 'text', group: 'notifications', description: 'SMS API Secret', is_public: false },
    { key: 'notification_sms_from_number', value_ar: '', value_en: '', type: 'text', group: 'notifications', description: 'SMS From Number', is_public: false },
    { key: 'notification_sms_account_sid', value_ar: '', value_en: '', type: 'text', group: 'notifications', description: 'Twilio Account SID', is_public: false },
  ];

  // Create settings
  for (const setting of [...fcmSettings, ...smtpSettings, ...smsSettings]) {
    await prisma.$executeRaw`
      INSERT INTO settings (key, value_ar, value_en, type, "group", description, is_public)
      VALUES (${setting.key}, ${setting.value_ar}, ${setting.value_en}, ${setting.type}, ${setting.group}, ${setting.description}, ${setting.is_public})
      ON CONFLICT (key) DO UPDATE SET
        value_ar = ${setting.value_ar},
        value_en = ${setting.value_en},
        type = ${setting.type},
        "group" = ${setting.group},
        description = ${setting.description},
        is_public = ${setting.is_public}
    `;
  }

  console.log('✅ Notification settings created');

  // Notification Templates
  const templates = [
    {
      code: 'SUBSCRIPTION_EXPIRING_30',
      name: 'تذكير انتهاء الاشتراك - 30 يوم',
      description: 'يُرسل قبل 30 يوم من انتهاء الاشتراك',
      type: 'SUBSCRIPTION_EXPIRING',
      priority: 'MEDIUM',
      title_ar: 'اشتراكك ينتهي قريباً',
      title_en: 'Your subscription is expiring soon',
      message_ar: 'مرحباً {{businessName}}، اشتراكك في باقة {{packageName}} سينتهي خلال 30 يوماً. جدد الآن لمواصلة الظهور.',
      message_en: 'Hello {{businessName}}, your subscription to {{packageName}} package will expire in 30 days. Renew now to continue appearing.',
      channels: ['IN_APP', 'EMAIL'],
      is_active: true,
    },
    {
      code: 'SUBSCRIPTION_EXPIRING_7',
      name: 'تذكير انتهاء الاشتراك - 7 أيام',
      description: 'يُرسل قبل 7 أيام من انتهاء الاشتراك',
      type: 'SUBSCRIPTION_EXPIRING',
      priority: 'HIGH',
      title_ar: 'اشتراكك ينتهي خلال أسبوع!',
      title_en: 'Your subscription expires in 1 week!',
      message_ar: 'تنبيه: اشتراك {{businessName}} في باقة {{packageName}} سينتهي خلال 7 أيام. جدد الآن.',
      message_en: 'Alert: {{businessName}} subscription to {{packageName}} will expire in 7 days. Renew now.',
      channels: ['IN_APP', 'EMAIL', 'SMS'],
      email_subject_ar: 'تذكير: اشتراكك ينتهي قريباً',
      email_subject_en: 'Reminder: Your subscription is expiring',
      email_body_ar: 'عزيزنا {{businessName}},<br><br>نود تذكيرك بأن اشتراكك في باقة {{packageName}} سينتهي خلال 7 أيام.<br><br>للتجديد والاستمرار في الظهور للعملاء، يرجى زيارة لوحة التحكم.',
      email_body_en: 'Dear {{businessName}},<br><br>We would like to remind you that your subscription to {{packageName}} will expire in 7 days.<br><br>To renew and continue appearing to customers, please visit your dashboard.',
      sms_template_ar: 'اشتراكك في {{packageName}} ينتهي خلال 7 أيام. جدد الآن.',
      sms_template_en: 'Your {{packageName}} subscription expires in 7 days. Renew now.',
      is_active: true,
    },
    {
      code: 'SUBSCRIPTION_EXPIRED',
      name: 'إشعار انتهاء الاشتراك',
      description: 'يُرسل عند انتهاء الاشتراك',
      type: 'SUBSCRIPTION_EXPIRED',
      priority: 'URGENT',
      title_ar: 'انتهى اشتراكك',
      title_en: 'Your subscription has expired',
      message_ar: 'اشتراك {{businessName}} في باقة {{packageName}} انتهى. نشاطك لن يظهر للعملاء حتى التجديد.',
      message_en: '{{businessName}} subscription to {{packageName}} has expired. Your business will not appear to customers until renewal.',
      channels: ['IN_APP', 'EMAIL', 'SMS'],
      is_active: true,
    },
    {
      code: 'BUSINESS_APPROVED',
      name: 'الموافقة على النشاط التجاري',
      description: 'يُرسل عند الموافقة على النشاط',
      type: 'BUSINESS_APPROVED',
      priority: 'HIGH',
      title_ar: 'تمت الموافقة على نشاطك!',
      title_en: 'Your business has been approved!',
      message_ar: 'مبروك! تمت الموافقة على نشاط {{businessName}}. الآن يمكن للعملاء مشاهدته والتواصل معك.',
      message_en: 'Congratulations! {{businessName}} has been approved. Customers can now view and contact you.',
      channels: ['IN_APP', 'EMAIL', 'PUSH'],
      is_active: true,
    },
    {
      code: 'BUSINESS_REJECTED',
      name: 'رفض النشاط التجاري',
      description: 'يُرسل عند رفض النشاط',
      type: 'BUSINESS_REJECTED',
      priority: 'HIGH',
      title_ar: 'تم رفض نشاطك',
      title_en: 'Your business was rejected',
      message_ar: 'للأسف، تم رفض نشاط {{businessName}}. السبب: {{reason}}. يمكنك التواصل معنا لمزيد من المعلومات.',
      message_en: 'Unfortunately, {{businessName}} was rejected. Reason: {{reason}}. Contact us for more information.',
      channels: ['IN_APP', 'EMAIL'],
      is_active: true,
    },
    {
      code: 'REVIEW_NEW',
      name: 'تقييم جديد',
      description: 'يُرسل عند إضافة تقييم جديد للنشاط',
      type: 'REVIEW_NEW',
      priority: 'MEDIUM',
      title_ar: 'تقييم جديد على نشاطك',
      title_en: 'New review on your business',
      message_ar: '{{userName}} أضاف تقييم {{rating}} نجوم على {{businessName}}. شاهد التقييم والرد عليه الآن.',
      message_en: '{{userName}} added a {{rating}} star review on {{businessName}}. View and respond now.',
      channels: ['IN_APP', 'PUSH'],
      is_active: true,
    },
    {
      code: 'BUSINESS_UPDATE_REMINDER',
      name: 'تذكير تحديث بيانات النشاط',
      description: 'يُرسل كل 6 أشهر لتذكير بتحديث البيانات',
      type: 'BUSINESS_UPDATE_REMINDER',
      priority: 'LOW',
      title_ar: 'حدّث بيانات نشاطك',
      title_en: 'Update your business information',
      message_ar: 'مرحباً {{businessName}}، لم يتم تحديث بيانات نشاطك منذ 6 أشهر. تأكد من صحة المعلومات لتحسين ظهورك.',
      message_en: 'Hello {{businessName}}, your business information has not been updated for 6 months. Update to improve visibility.',
      channels: ['IN_APP', 'EMAIL'],
      is_active: true,
    },
    {
      code: 'AGENT_REMINDER',
      name: 'تذكير بمهام التجديد',
      description: 'يُرسل للمندوبين عن المهام المعلقة',
      type: 'AGENT_REMINDER',
      priority: 'MEDIUM',
      title_ar: 'لديك {{count}} مهمة معلقة',
      title_en: 'You have {{count}} pending tasks',
      message_ar: 'مرحباً {{agentName}}، لديك {{count}} مهمة تجديد معلقة. تابع مع العملاء اليوم.',
      message_en: 'Hello {{agentName}}, you have {{count}} pending renewal tasks. Follow up with customers today.',
      channels: ['IN_APP', 'PUSH'],
      is_active: true,
    },
    {
      code: 'WELCOME_USER',
      name: 'الترحيب بالعضو الجديد',
      description: 'يُرسل عند تسجيل عضو جديد',
      type: 'WELCOME',
      priority: 'MEDIUM',
      title_ar: 'مرحباً بك في الصفحات الخضراء',
      title_en: 'Welcome to Green Pages',
      message_ar: 'مرحباً {{userName}}! شكراً لانضمامك إلى الصفحات الخضراء. استكشف آلاف الأنشطة التجارية في اليمن.',
      message_en: 'Hello {{userName}}! Thank you for joining Green Pages. Explore thousands of businesses in Yemen.',
      channels: ['IN_APP', 'EMAIL'],
      email_subject_ar: 'مرحباً بك في الصفحات الخضراء',
      email_subject_en: 'Welcome to Green Pages',
      email_body_ar: 'عزيزنا {{userName}},<br><br>مرحباً بك في الصفحات الخضراء - دليلك الشامل للأنشطة التجارية في اليمن.<br><br>نتمنى لك تجربة ممتعة ومفيدة.',
      email_body_en: 'Dear {{userName}},<br><br>Welcome to Green Pages - your comprehensive guide to businesses in Yemen.<br><br>We wish you an enjoyable and useful experience.',
      is_active: true,
    },
  ];

  for (const template of templates) {
    await (prisma as any).notificationTemplate.upsert({
      where: { code: template.code },
      update: template as any,
      create: template as any,
    });
  }

  console.log('✅ Notification templates created');
}

async function main() {
  try {
    await seedNotificationSettings();
    console.log('🎉 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
