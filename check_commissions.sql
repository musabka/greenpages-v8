-- التحقق من العمولات الموجودة
SELECT 
  ac.id,
  u.email AS agent_email,
  b.name_ar AS business_name,
  ac.subscription_amount,
  ac.commission_rate,
  ac.commission_amount,
  ac.status,
  ac.type,
  ac.created_at
FROM agent_commissions ac
JOIN agent_profiles ap ON ac.agent_profile_id = ap.id
JOIN users u ON ap.user_id = u.id
JOIN businesses b ON ac.business_id = b.id
ORDER BY ac.created_at DESC
LIMIT 20;

-- إحصائيات العمولات
SELECT 
  status,
  COUNT(*) as count,
  SUM(commission_amount) as total_amount
FROM agent_commissions
GROUP BY status;

-- التحقق من AgentProfile totals
SELECT 
  u.email,
  u.first_name,
  u.last_name,
  ap.total_commissions,
  ap.total_businesses,
  ap.commission_rate,
  ap.requires_approval
FROM agent_profiles ap
JOIN users u ON ap.user_id = u.id;

-- الأنشطة التي لها agent_id
SELECT 
  b.id,
  b.name_ar,
  b.status,
  u.email AS agent_email,
  bp.package_id,
  p.price AS package_price
FROM businesses b
LEFT JOIN users u ON b.agent_id = u.id
LEFT JOIN business_packages bp ON b.id = bp.business_id AND bp.is_active = true
LEFT JOIN packages p ON bp.package_id = p.id
WHERE b.agent_id IS NOT NULL
ORDER BY b.created_at DESC
LIMIT 20;
