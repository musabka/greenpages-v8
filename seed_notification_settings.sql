-- Notification Settings Seed
INSERT INTO "settings" (key, value_ar, value_en, type, "group", description, is_public, created_at, updated_at) VALUES
-- Firebase FCM
('notification_fcm_enabled', 'false', 'false', 'boolean', 'notifications', 'تفعيل Firebase Cloud Messaging', false, NOW(), NOW()),
('notification_fcm_server_key', '', '', 'text', 'notifications', 'مفتاح خادم Firebase', false, NOW(), NOW()),
('notification_fcm_sender_id', '', '', 'text', 'notifications', 'معرف المرسل Firebase', false, NOW(), NOW()),
('notification_fcm_project_id', '', '', 'text', 'notifications', 'معرف مشروع Firebase', false, NOW(), NOW()),

-- SMTP Email
('notification_smtp_enabled', 'false', 'false', 'boolean', 'notifications', 'تفعيل SMTP للبريد الإلكتروني', false, NOW(), NOW()),
('notification_smtp_host', '', '', 'text', 'notifications', 'خادم SMTP', false, NOW(), NOW()),
('notification_smtp_port', '587', '587', 'text', 'notifications', 'منفذ SMTP', false, NOW(), NOW()),
('notification_smtp_user', '', '', 'text', 'notifications', 'مستخدم SMTP', false, NOW(), NOW()),
('notification_smtp_password', '', '', 'text', 'notifications', 'كلمة مرور SMTP', false, NOW(), NOW()),
('notification_smtp_from_email', '', '', 'text', 'notifications', 'البريد الإلكتروني للمرسل', false, NOW(), NOW()),
('notification_smtp_from_name', 'الصفحات الخضراء', 'Green Pages', 'text', 'notifications', 'اسم المرسل', false, NOW(), NOW()),
('notification_smtp_secure', 'true', 'true', 'boolean', 'notifications', 'استخدام TLS', false, NOW(), NOW()),

-- SMS Gateway
('notification_sms_enabled', 'false', 'false', 'boolean', 'notifications', 'تفعيل SMS Gateway', false, NOW(), NOW()),
('notification_sms_provider', 'twilio', 'twilio', 'text', 'notifications', 'مزود خدمة SMS', false, NOW(), NOW()),
('notification_sms_api_key', '', '', 'text', 'notifications', 'مفتاح API للـSMS', false, NOW(), NOW()),
('notification_sms_api_secret', '', '', 'text', 'notifications', 'Secret للـSMS', false, NOW(), NOW()),
('notification_sms_from_number', '', '', 'text', 'notifications', 'رقم المرسل', false, NOW(), NOW()),
('notification_sms_account_sid', '', '', 'text', 'notifications', 'Account SID لـTwilio', false, NOW(), NOW())

ON CONFLICT (key) DO UPDATE SET
  value_ar = EXCLUDED.value_ar,
  value_en = EXCLUDED.value_en,
  type = EXCLUDED.type,
  "group" = EXCLUDED."group",
  description = EXCLUDED.description,
  is_public = EXCLUDED.is_public,
  updated_at = NOW();
