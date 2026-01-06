-- إنشاء AgentProfile للمندوب (agent1@greenpages.sy)
-- يجب تشغيل هذا بعد إنشاء المستخدم

-- 1. إنشاء ملف المندوب
INSERT INTO agent_profiles (
  id,
  user_id,
  manager_id,
  base_salary,
  commission_rate,
  is_active
)
SELECT
  uuid_generate_v4(),
  u.id,
  NULL, -- يمكن ربطه بمدير محافظة لاحقاً
  0, -- راتب أساسي 0 حالياً
  10, -- نسبة عمولة 10%
  true
FROM users u
WHERE u.email = 'agent1@greenpages.sy'
  AND u.role = 'AGENT'
  AND NOT EXISTS (SELECT 1 FROM agent_profiles ap WHERE ap.user_id = u.id);

-- 2. ربط المندوب بجميع المحافظات (للتجربة)
INSERT INTO agent_governorates (
  id,
  agent_profile_id,
  governorate_id,
  is_active
)
SELECT
  uuid_generate_v4(),
  ap.id,
  g.id,
  true
FROM agent_profiles ap
CROSS JOIN governorates g
JOIN users u ON u.id = ap.user_id
WHERE u.email = 'agent1@greenpages.sy'
  AND NOT EXISTS (
    SELECT 1 
    FROM agent_governorates ag 
    WHERE ag.agent_profile_id = ap.id 
      AND ag.governorate_id = g.id
  );

-- 3. التحقق من النتيجة
SELECT 
  u.email,
  u.first_name,
  u.last_name,
  u.role,
  ap.id as agent_profile_id,
  ap.base_salary,
  ap.commission_rate,
  COUNT(ag.id) as governorates_count
FROM users u
JOIN agent_profiles ap ON ap.user_id = u.id
LEFT JOIN agent_governorates ag ON ag.agent_profile_id = ap.id
WHERE u.email = 'agent1@greenpages.sy'
GROUP BY u.id, ap.id;
