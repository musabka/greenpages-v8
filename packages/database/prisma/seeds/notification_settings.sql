-- ==========================================
-- Seeds لإعدادات الإشعارات
-- ==========================================

-- Firebase FCM Settings
INSERT INTO settings (key, value_ar, value_en, type, "group", description, is_public) VALUES
('notification_fcm_enabled', 'false', 'false', 'boolean', 'notifications', 'Enable Firebase Cloud Messaging', false),
('notification_fcm_server_key', '', '', 'text', 'notifications', 'FCM Server Key', false),
('notification_fcm_sender_id', '', '', 'text', 'notifications', 'FCM Sender ID', false),
('notification_fcm_project_id', '', '', 'text', 'notifications', 'FCM Project ID', false);

-- SMTP Email Settings
INSERT INTO settings (key, value_ar, value_en, type, "group", description, is_public) VALUES
('notification_smtp_enabled', 'false', 'false', 'boolean', 'notifications', 'Enable SMTP Email Notifications', false),
('notification_smtp_host', 'smtp.gmail.com', 'smtp.gmail.com', 'text', 'notifications', 'SMTP Host', false),
('notification_smtp_port', '587', '587', 'text', 'notifications', 'SMTP Port', false),
('notification_smtp_user', '', '', 'text', 'notifications', 'SMTP Username', false),
('notification_smtp_password', '', '', 'text', 'notifications', 'SMTP Password', false),
('notification_smtp_from_email', 'noreply@greenpages.com', 'noreply@greenpages.com', 'text', 'notifications', 'From Email Address', false),
('notification_smtp_from_name', 'الصفحات الخضراء', 'Green Pages', 'text', 'notifications', 'From Name', false),
('notification_smtp_secure', 'true', 'true', 'boolean', 'notifications', 'Use Secure Connection (TLS)', false);

-- SMS Gateway Settings
INSERT INTO settings (key, value_ar, value_en, type, "group", description, is_public) VALUES
('notification_sms_enabled', 'false', 'false', 'boolean', 'notifications', 'Enable SMS Notifications', false),
('notification_sms_provider', 'twilio', 'twilio', 'text', 'notifications', 'SMS Provider (twilio/nexmo/custom)', false),
('notification_sms_api_key', '', '', 'text', 'notifications', 'SMS API Key', false),
('notification_sms_api_secret', '', '', 'text', 'notifications', 'SMS API Secret', false),
('notification_sms_from_number', '', '', 'text', 'notifications', 'SMS From Number', false),
('notification_sms_account_sid', '', '', 'text', 'notifications', 'Twilio Account SID', false);

-- ==========================================
-- قوالب الإشعارات الافتراضية
-- ==========================================

-- قالب انتهاء الاشتراك خلال 30 يوم
INSERT INTO notification_templates (
    code, name, description, type, priority, 
    title_ar, title_en, message_ar, message_en,
    channels, is_active
) VALUES (
    'SUBSCRIPTION_EXPIRING_30',
    'تذكير انتهاء الاشتراك - 30 يوم',
    'يُرسل قبل 30 يوم من انتهاء الاشتراك',
    'SUBSCRIPTION_EXPIRING',
    'MEDIUM',
    'اشتراكك ينتهي قريباً',
    'Your subscription is expiring soon',
    'مرحباً {{businessName}}، اشتراكك في باقة {{packageName}} سينتهي خلال 30 يوماً. جدد الآن لمواصلة الظهور.',
    'Hello {{businessName}}, your subscription to {{packageName}} package will expire in 30 days. Renew now to continue appearing.',
    ARRAY['IN_APP', 'EMAIL']::notification_channel[],
    true
);

-- قالب انتهاء الاشتراك خلال 7 أيام
INSERT INTO notification_templates (
    code, name, description, type, priority,
    title_ar, title_en, message_ar, message_en,
    channels, email_subject_ar, email_subject_en,
    email_body_ar, email_body_en, sms_template_ar, sms_template_en,
    is_active
) VALUES (
    'SUBSCRIPTION_EXPIRING_7',
    'تذكير انتهاء الاشتراك - 7 أيام',
    'يُرسل قبل 7 أيام من انتهاء الاشتراك',
    'SUBSCRIPTION_EXPIRING',
    'HIGH',
    'اشتراكك ينتهي خلال أسبوع!',
    'Your subscription expires in 1 week!',
    'تنبيه: اشتراك {{businessName}} في باقة {{packageName}} سينتهي خلال 7 أيام. جدد الآن.',
    'Alert: {{businessName}} subscription to {{packageName}} will expire in 7 days. Renew now.',
    ARRAY['IN_APP', 'EMAIL', 'SMS']::notification_channel[],
    'تذكير: اشتراكك ينتهي قريباً',
    'Reminder: Your subscription is expiring',
    'عزيزنا {{businessName}},<br><br>نود تذكيرك بأن اشتراكك في باقة {{packageName}} سينتهي خلال 7 أيام.<br><br>للتجديد والاستمرار في الظهور للعملاء، يرجى زيارة لوحة التحكم.',
    'Dear {{businessName}},<br><br>We would like to remind you that your subscription to {{packageName}} will expire in 7 days.<br><br>To renew and continue appearing to customers, please visit your dashboard.',
    'اشتراكك في {{packageName}} ينتهي خلال 7 أيام. جدد الآن.',
    'Your {{packageName}} subscription expires in 7 days. Renew now.',
    true
);

-- قالب انتهاء الاشتراك
INSERT INTO notification_templates (
    code, name, description, type, priority,
    title_ar, title_en, message_ar, message_en,
    channels, is_active
) VALUES (
    'SUBSCRIPTION_EXPIRED',
    'إشعار انتهاء الاشتراك',
    'يُرسل عند انتهاء الاشتراك',
    'SUBSCRIPTION_EXPIRED',
    'URGENT',
    'انتهى اشتراكك',
    'Your subscription has expired',
    'اشتراك {{businessName}} في باقة {{packageName}} انتهى. نشاطك لن يظهر للعملاء حتى التجديد.',
    '{{businessName}} subscription to {{packageName}} has expired. Your business will not appear to customers until renewal.',
    ARRAY['IN_APP', 'EMAIL', 'SMS']::notification_channel[],
    true
);

-- قالب الموافقة على النشاط
INSERT INTO notification_templates (
    code, name, description, type, priority,
    title_ar, title_en, message_ar, message_en,
    channels, is_active
) VALUES (
    'BUSINESS_APPROVED',
    'الموافقة على النشاط التجاري',
    'يُرسل عند الموافقة على النشاط',
    'BUSINESS_APPROVED',
    'HIGH',
    'تمت الموافقة على نشاطك!',
    'Your business has been approved!',
    'مبروك! تمت الموافقة على نشاط {{businessName}}. الآن يمكن للعملاء مشاهدته والتواصل معك.',
    'Congratulations! {{businessName}} has been approved. Customers can now view and contact you.',
    ARRAY['IN_APP', 'EMAIL', 'PUSH']::notification_channel[],
    true
);

-- قالب رفض النشاط
INSERT INTO notification_templates (
    code, name, description, type, priority,
    title_ar, title_en, message_ar, message_en,
    channels, is_active
) VALUES (
    'BUSINESS_REJECTED',
    'رفض النشاط التجاري',
    'يُرسل عند رفض النشاط',
    'BUSINESS_REJECTED',
    'HIGH',
    'تم رفض نشاطك',
    'Your business was rejected',
    'للأسف، تم رفض نشاط {{businessName}}. السبب: {{reason}}. يمكنك التواصل معنا لمزيد من المعلومات.',
    'Unfortunately, {{businessName}} was rejected. Reason: {{reason}}. Contact us for more information.',
    ARRAY['IN_APP', 'EMAIL']::notification_channel[],
    true
);

-- قالب تقييم جديد
INSERT INTO notification_templates (
    code, name, description, type, priority,
    title_ar, title_en, message_ar, message_en,
    channels, is_active
) VALUES (
    'REVIEW_NEW',
    'تقييم جديد',
    'يُرسل عند إضافة تقييم جديد للنشاط',
    'REVIEW_NEW',
    'MEDIUM',
    'تقييم جديد على نشاطك',
    'New review on your business',
    '{{userName}} أضاف تقييم {{rating}} نجوم على {{businessName}}. شاهد التقييم والرد عليه الآن.',
    '{{userName}} added a {{rating}} star review on {{businessName}}. View and respond now.',
    ARRAY['IN_APP', 'PUSH']::notification_channel[],
    true
);

-- قالب تذكير تحديث البيانات
INSERT INTO notification_templates (
    code, name, description, type, priority,
    title_ar, title_en, message_ar, message_en,
    channels, is_active
) VALUES (
    'BUSINESS_UPDATE_REMINDER',
    'تذكير تحديث بيانات النشاط',
    'يُرسل كل 6 أشهر لتذكير بتحديث البيانات',
    'BUSINESS_UPDATE_REMINDER',
    'LOW',
    'حدّث بيانات نشاطك',
    'Update your business information',
    'مرحباً {{businessName}}، لم يتم تحديث بيانات نشاطك منذ 6 أشهر. تأكد من صحة المعلومات لتحسين ظهورك.',
    'Hello {{businessName}}, your business information has not been updated for 6 months. Update to improve visibility.',
    ARRAY['IN_APP', 'EMAIL']::notification_channel[],
    true
);

-- قالب تذكير مهام المندوب
INSERT INTO notification_templates (
    code, name, description, type, priority,
    title_ar, title_en, message_ar, message_en,
    channels, is_active
) VALUES (
    'AGENT_REMINDER',
    'تذكير بمهام التجديد',
    'يُرسل للمندوبين عن المهام المعلقة',
    'AGENT_REMINDER',
    'MEDIUM',
    'لديك {{count}} مهمة معلقة',
    'You have {{count}} pending tasks',
    'مرحباً {{agentName}}، لديك {{count}} مهمة تجديد معلقة. تابع مع العملاء اليوم.',
    'Hello {{agentName}}, you have {{count}} pending renewal tasks. Follow up with customers today.',
    ARRAY['IN_APP', 'PUSH']::notification_channel[],
    true
);

-- قالب الترحيب بالعضو الجديد
INSERT INTO notification_templates (
    code, name, description, type, priority,
    title_ar, title_en, message_ar, message_en,
    channels, email_subject_ar, email_subject_en,
    email_body_ar, email_body_en,
    is_active
) VALUES (
    'WELCOME_USER',
    'الترحيب بالعضو الجديد',
    'يُرسل عند تسجيل عضو جديد',
    'WELCOME',
    'MEDIUM',
    'مرحباً بك في الصفحات الخضراء',
    'Welcome to Green Pages',
    'مرحباً {{userName}}! شكراً لانضمامك إلى الصفحات الخضراء. استكشف آلاف الأنشطة التجارية في اليمن.',
    'Hello {{userName}}! Thank you for joining Green Pages. Explore thousands of businesses in Yemen.',
    ARRAY['IN_APP', 'EMAIL']::notification_channel[],
    'مرحباً بك في الصفحات الخضراء',
    'Welcome to Green Pages',
    'عزيزنا {{userName}},<br><br>مرحباً بك في الصفحات الخضراء - دليلك الشامل للأنشطة التجارية في اليمن.<br><br>نتمنى لك تجربة ممتعة ومفيدة.',
    'Dear {{userName}},<br><br>Welcome to Green Pages - your comprehensive guide to businesses in Yemen.<br><br>We wish you an enjoyable and useful experience.',
    true
);
