-- إضافة باقات للنشاطات التجارية الموجودة
-- تنفيذ هذا النص على قاعدة البيانات إذا كانت الباقات فارغة

-- إذا لم توجد باقات، أضفها للنشاطات الأولى
INSERT INTO business_packages (id, business_id, package_id, start_date, end_date, is_active, auto_renew, override_enabled, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  b.id,
  p.id,
  NOW(),
  NOW() + INTERVAL '1 year',
  true,
  false,
  false,
  NOW(),
  NOW()
FROM businesses b
LEFT JOIN business_packages bp ON b.id = bp.business_id
CROSS JOIN packages p
WHERE bp.id IS NULL
  AND b.status = 'APPROVED'
  AND p.name_ar = 'الباقة الفضية'
LIMIT 10
ON CONFLICT DO NOTHING;
