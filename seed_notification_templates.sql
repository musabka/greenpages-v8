-- Default Notification Templates
INSERT INTO "notification_templates" (code, name, description, type, priority, title_ar, title_en, message_ar, message_en, channels, is_system, created_at, updated_at) VALUES
-- Business Templates
('business_approved', 'Business Approved Template', 'Notification for business approval', 'BUSINESS_APPROVED', 'MEDIUM', 'تم الموافقة على نشاطك', 'Business Approved', 'تم الموافقة على نشاطك التجاري {{businessName}} ونشره في الموقع', 'Your business {{businessName}} has been approved and published', ARRAY['IN_APP', 'EMAIL']::"NotificationChannel"[], true, NOW(), NOW()),
('business_rejected', 'Business Rejected Template', 'Notification for business rejection', 'BUSINESS_REJECTED', 'MEDIUM', 'تم رفض نشاطك', 'Business Rejected', 'تم رفض نشاطك التجاري {{businessName}}. السبب: {{reason}}', 'Your business {{businessName}} has been rejected. Reason: {{reason}}', ARRAY['IN_APP', 'EMAIL']::"NotificationChannel"[], true, NOW(), NOW()),
('business_update', 'Business Updated Template', 'Notification for business update', 'BUSINESS_UPDATE', 'LOW', 'تم تحديث نشاطك', 'Business Updated', 'تم تحديث بيانات نشاطك التجاري {{businessName}}', 'Your business {{businessName}} has been updated', ARRAY['IN_APP']::"NotificationChannel"[], true, NOW(), NOW()),

-- Package/Subscription Templates  
('subscription_expiring', 'Subscription Expiring Template', 'Notification for subscription expiration', 'SUBSCRIPTION_EXPIRING', 'HIGH', 'انتهاء الباقة قريباً', 'Subscription Expiring Soon', 'باقتك {{packageName}} ستنتهي خلال {{daysLeft}} يوم', 'Your subscription {{packageName}} will expire in {{daysLeft}} days', ARRAY['IN_APP', 'EMAIL', 'PUSH']::"NotificationChannel"[], true, NOW(), NOW()),
('subscription_expired', 'Subscription Expired Template', 'Notification for expired subscription', 'SUBSCRIPTION_EXPIRED', 'HIGH', 'انتهت الباقة', 'Subscription Expired', 'انتهت صلاحية باقتك {{packageName}}', 'Your subscription {{packageName}} has expired', ARRAY['IN_APP', 'EMAIL']::"NotificationChannel"[], true, NOW(), NOW()),
('subscription_renewed', 'Subscription Renewed Template', 'Notification for subscription renewal', 'SUBSCRIPTION_RENEWED', 'MEDIUM', 'تجديد الباقة', 'Subscription Renewed', 'تم تجديد باقتك {{packageName}}', 'Your subscription {{packageName}} has been renewed', ARRAY['IN_APP', 'EMAIL']::"NotificationChannel"[], true, NOW(), NOW()),

-- Review Templates
('review_new', 'New Review Template', 'Notification for new review', 'REVIEW_NEW', 'MEDIUM', 'مراجعة جديدة', 'New Review', 'تلقيت مراجعة جديدة على {{businessName}} من {{userName}}', 'You received a new review on {{businessName}} from {{userName}}', ARRAY['IN_APP', 'PUSH']::"NotificationChannel"[], true, NOW(), NOW()),
('review_reply', 'Review Reply Template', 'Notification for review reply', 'REVIEW_REPLY', 'MEDIUM', 'رد على مراجعة', 'Review Reply', 'رد {{businessName}} على مراجعتك', '{{businessName}} replied to your review', ARRAY['IN_APP']::"NotificationChannel"[], true, NOW(), NOW()),

-- System Templates
('promotional', 'Promotional Template', 'Promotional messages', 'PROMOTIONAL', 'HIGH', 'عرض خاص', 'Special Offer', '{{title}}', '{{title}}', ARRAY['IN_APP', 'PUSH']::"NotificationChannel"[], true, NOW(), NOW())

ON CONFLICT (code) DO NOTHING;
