-- تنظيف بيانات الباقات الافتراضية
-- تحديث جميع الاشتراكات التي تستخدم باقة افتراضية لتكون بدون تاريخ انتهاء

UPDATE business_packages bp
SET end_date = NULL
FROM packages p
WHERE bp.package_id = p.id
  AND p.is_default = true
  AND bp.end_date IS NOT NULL;

-- عرض النتيجة
SELECT 
  b.name_ar as "اسم النشاط",
  p.name_ar as "اسم الباقة",
  p.is_default as "باقة_افتراضية",
  bp.start_date as "تاريخ_البدء",
  bp.end_date as "تاريخ_الانتهاء",
  bp.is_active as "نشط"
FROM business_packages bp
JOIN businesses b ON bp.business_id = b.id
JOIN packages p ON bp.package_id = p.id
WHERE p.is_default = true
ORDER BY bp.created_at DESC
LIMIT 10;
