-- إنشاء الحسابات المحاسبية الأساسية للنظام
-- يجب تشغيل هذا السكريبت لتفعيل نظام الفواتير

-- الحصول على العملة الأساسية (افتراض أنها موجودة)
-- إذا لم تكن موجودة، سننشئها

-- التأكد من وجود عملة أساسية
INSERT INTO acc_currencies (id, code, name_ar, name_en, symbol, decimal_places, is_base, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'SYP',
  'الليرة السورية',
  'Syrian Pound',
  'ل.س',
  2,
  true,
  true,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- 1. الأصول (Assets) - 1000-1999
INSERT INTO acc_accounts (id, code, name_ar, name_en, account_type, normal_balance, is_posting, currency_mode, is_system_account, is_active, level, created_at, updated_at)
VALUES
  -- 1.1 الأصول المتداولة
  (gen_random_uuid(), '1000', 'الأصول المتداولة', 'Current Assets', 'ASSET', 'DEBIT', false, 'BASE_ONLY', true, true, 0, NOW(), NOW()),
  
  -- النقدية
  (gen_random_uuid(), '1100', 'النقدية وما في حكمها', 'Cash and Cash Equivalents', 'ASSET', 'DEBIT', false, 'BASE_ONLY', true, true, 1, NOW(), NOW()),
  (gen_random_uuid(), '1101', 'الصندوق', 'Cash on Hand', 'ASSET', 'DEBIT', true, 'BASE_ONLY', true, true, 2, NOW(), NOW()),
  (gen_random_uuid(), '1102', 'البنك', 'Bank Account', 'ASSET', 'DEBIT', true, 'BASE_ONLY', true, true, 2, NOW(), NOW()),
  (gen_random_uuid(), '1103', 'تطهير نقدي', 'Cash Clearing', 'ASSET', 'DEBIT', true, 'BASE_ONLY', true, true, 2, NOW(), NOW()),
  
  -- الذمم المدينة
  (gen_random_uuid(), '1200', 'الذمم المدينة', 'Accounts Receivable', 'ASSET', 'DEBIT', false, 'BASE_ONLY', true, true, 1, NOW(), NOW()),
  (gen_random_uuid(), '1201', 'ذمم العملاء', 'Customer Receivables', 'ASSET', 'DEBIT', true, 'BASE_ONLY', true, true, 2, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  is_active = true,
  updated_at = NOW();

-- 2. الخصوم (Liabilities) - 2000-2999
INSERT INTO acc_accounts (id, code, name_ar, name_en, account_type, normal_balance, is_posting, currency_mode, is_system_account, is_active, level, created_at, updated_at)
VALUES
  (gen_random_uuid(), '2000', 'الخصوم المتداولة', 'Current Liabilities', 'LIABILITY', 'CREDIT', false, 'BASE_ONLY', true, true, 0, NOW(), NOW()),
  
  -- ذمم دائنة
  (gen_random_uuid(), '2100', 'الذمم الدائنة', 'Accounts Payable', 'LIABILITY', 'CREDIT', false, 'BASE_ONLY', true, true, 1, NOW(), NOW()),
  (gen_random_uuid(), '2101', 'مستحقات الموردين', 'Suppliers Payable', 'LIABILITY', 'CREDIT', true, 'BASE_ONLY', true, true, 2, NOW(), NOW()),
  (gen_random_uuid(), '2102', 'مستحقات المندوبين', 'Agents Payable', 'LIABILITY', 'CREDIT', true, 'BASE_ONLY', true, true, 2, NOW(), NOW()),
  
  -- المحافظ
  (gen_random_uuid(), '2200', 'التزامات المحافظ', 'Wallet Liabilities', 'LIABILITY', 'CREDIT', false, 'BASE_ONLY', true, true, 1, NOW(), NOW()),
  (gen_random_uuid(), '2201', 'محافظ العملاء', 'Customer Wallets', 'LIABILITY', 'CREDIT', true, 'BASE_ONLY', true, true, 2, NOW(), NOW()),
  
  -- ضرائب
  (gen_random_uuid(), '2300', 'الضرائب المستحقة', 'Taxes Payable', 'LIABILITY', 'CREDIT', false, 'BASE_ONLY', true, true, 1, NOW(), NOW()),
  (gen_random_uuid(), '2301', 'ضريبة المبيعات المستحقة', 'Sales Tax Payable', 'LIABILITY', 'CREDIT', true, 'BASE_ONLY', true, true, 2, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  is_active = true,
  updated_at = NOW();

-- 3. حقوق الملكية (Equity) - 3000-3999
INSERT INTO acc_accounts (id, code, name_ar, name_en, account_type, normal_balance, is_posting, currency_mode, is_system_account, is_active, level, created_at, updated_at)
VALUES
  (gen_random_uuid(), '3000', 'حقوق الملكية', 'Equity', 'EQUITY', 'CREDIT', false, 'BASE_ONLY', true, true, 0, NOW(), NOW()),
  (gen_random_uuid(), '3100', 'الأرباح المحتجزة', 'Retained Earnings', 'EQUITY', 'CREDIT', true, 'BASE_ONLY', true, true, 1, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  is_active = true,
  updated_at = NOW();

-- 4. الإيرادات (Revenue) - 4000-4999
INSERT INTO acc_accounts (id, code, name_ar, name_en, account_type, normal_balance, is_posting, currency_mode, is_system_account, is_active, level, created_at, updated_at)
VALUES
  (gen_random_uuid(), '4000', 'الإيرادات', 'Revenue', 'REVENUE', 'CREDIT', false, 'BASE_ONLY', true, true, 0, NOW(), NOW()),
  (gen_random_uuid(), '4100', 'إيرادات الاشتراكات', 'Subscription Revenue', 'REVENUE', 'CREDIT', true, 'BASE_ONLY', true, true, 1, NOW(), NOW()),
  (gen_random_uuid(), '4200', 'إيرادات الإعلانات', 'Advertisement Revenue', 'REVENUE', 'CREDIT', true, 'BASE_ONLY', true, true, 1, NOW(), NOW()),
  (gen_random_uuid(), '4300', 'إيرادات الخدمات', 'Service Revenue', 'REVENUE', 'CREDIT', true, 'BASE_ONLY', true, true, 1, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  is_active = true,
  updated_at = NOW();

-- 5. المصروفات (Expenses) - 5000-5999
INSERT INTO acc_accounts (id, code, name_ar, name_en, account_type, normal_balance, is_posting, currency_mode, is_system_account, is_active, level, created_at, updated_at)
VALUES
  (gen_random_uuid(), '5000', 'المصروفات', 'Expenses', 'EXPENSE', 'DEBIT', false, 'BASE_ONLY', true, true, 0, NOW(), NOW()),
  (gen_random_uuid(), '5100', 'مصروف العمولات', 'Commission Expense', 'EXPENSE', 'DEBIT', true, 'BASE_ONLY', true, true, 1, NOW(), NOW()),
  (gen_random_uuid(), '5200', 'مصروفات إدارية', 'Administrative Expenses', 'EXPENSE', 'DEBIT', true, 'BASE_ONLY', true, true, 1, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  is_active = true,
  updated_at = NOW();

-- رسالة نجاح
SELECT 'تم إنشاء الحسابات المحاسبية بنجاح!' AS result;
