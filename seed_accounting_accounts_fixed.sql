-- Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø­Ø³Ø§Ø¨Ø§Øª Ø§Ù„Ù…Ø­Ø§Ø³Ø¨ÙŠØ© Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ© Ù„Ù„Ù†Ø¸Ø§Ù…
-- ÙŠØ¬Ø¨ ØªØ´ØºÙŠÙ„ Ù‡Ø°Ø§ Ø§Ù„Ø³ÙƒØ±ÙŠØ¨Øª Ù„ØªÙØ¹ÙŠÙ„ Ù†Ø¸Ø§Ù… Ø§Ù„ÙÙˆØ§ØªÙŠØ±

-- Ø§Ù„Ø­ØµÙˆÙ„ Ø¹Ù„Ù‰ Ø§Ù„Ø¹Ù…Ù„Ø© Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ© (Ø§ÙØªØ±Ø§Ø¶ Ø£Ù†Ù‡Ø§ Ù…ÙˆØ¬ÙˆØ¯Ø©)
-- Ø¥Ø°Ø§ Ù„Ù… ØªÙƒÙ† Ù…ÙˆØ¬ÙˆØ¯Ø©ØŒ Ø³Ù†Ù†Ø´Ø¦Ù‡Ø§

-- Ø§Ù„ØªØ£ÙƒØ¯ Ù…Ù† ÙˆØ¬ÙˆØ¯ Ø¹Ù…Ù„Ø© Ø£Ø³Ø§Ø³ÙŠØ©
INSERT INTO acc_currencies (id, code, name_ar, name_en, symbol, decimal_places, is_base, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'SYP',
  'Ø§Ù„Ù„ÙŠØ±Ø© Ø§Ù„Ø³ÙˆØ±ÙŠØ©',
  'Syrian Pound',
  'Ù„.Ø³',
  2,
  true,
  true,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- 1. Ø§Ù„Ø£ØµÙˆÙ„ (Assets) - 1000-1999
INSERT INTO acc_accounts (id, code, name_ar, name_en, account_type, normal_balance, is_posting, currency_mode, is_system_account, is_active, level, created_at, updated_at)
VALUES
  -- 1.1 Ø§Ù„Ø£ØµÙˆÙ„ Ø§Ù„Ù…ØªØ¯Ø§ÙˆÙ„Ø©
  (gen_random_uuid(), '1000', 'Ø§Ù„Ø£ØµÙˆÙ„ Ø§Ù„Ù…ØªØ¯Ø§ÙˆÙ„Ø©', 'Current Assets', 'ASSET', 'DEBIT', false, 'MONO', true, true, 0, NOW(), NOW()),
  
  -- Ø§Ù„Ù†Ù‚Ø¯ÙŠØ©
  (gen_random_uuid(), '1100', 'Ø§Ù„Ù†Ù‚Ø¯ÙŠØ© ÙˆÙ…Ø§ ÙÙŠ Ø­ÙƒÙ…Ù‡Ø§', 'Cash and Cash Equivalents', 'ASSET', 'DEBIT', false, 'MONO', true, true, 1, NOW(), NOW()),
  (gen_random_uuid(), '1101', 'Ø§Ù„ØµÙ†Ø¯ÙˆÙ‚', 'Cash on Hand', 'ASSET', 'DEBIT', true, 'MONO', true, true, 2, NOW(), NOW()),
  (gen_random_uuid(), '1102', 'Ø§Ù„Ø¨Ù†Ùƒ', 'Bank Account', 'ASSET', 'DEBIT', true, 'MONO', true, true, 2, NOW(), NOW()),
  (gen_random_uuid(), '1103', 'ØªØ·Ù‡ÙŠØ± Ù†Ù‚Ø¯ÙŠ', 'Cash Clearing', 'ASSET', 'DEBIT', true, 'MONO', true, true, 2, NOW(), NOW()),
  
  -- Ø§Ù„Ø°Ù…Ù… Ø§Ù„Ù…Ø¯ÙŠÙ†Ø©
  (gen_random_uuid(), '1200', 'Ø§Ù„Ø°Ù…Ù… Ø§Ù„Ù…Ø¯ÙŠÙ†Ø©', 'Accounts Receivable', 'ASSET', 'DEBIT', false, 'MONO', true, true, 1, NOW(), NOW()),
  (gen_random_uuid(), '1201', 'Ø°Ù…Ù… Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡', 'Customer Receivables', 'ASSET', 'DEBIT', true, 'MONO', true, true, 2, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  is_active = true,
  updated_at = NOW();

-- 2. Ø§Ù„Ø®ØµÙˆÙ… (Liabilities) - 2000-2999
INSERT INTO acc_accounts (id, code, name_ar, name_en, account_type, normal_balance, is_posting, currency_mode, is_system_account, is_active, level, created_at, updated_at)
VALUES
  (gen_random_uuid(), '2000', 'Ø§Ù„Ø®ØµÙˆÙ… Ø§Ù„Ù…ØªØ¯Ø§ÙˆÙ„Ø©', 'Current Liabilities', 'LIABILITY', 'CREDIT', false, 'MONO', true, true, 0, NOW(), NOW()),
  
  -- Ø°Ù…Ù… Ø¯Ø§Ø¦Ù†Ø©
  (gen_random_uuid(), '2100', 'Ø§Ù„Ø°Ù…Ù… Ø§Ù„Ø¯Ø§Ø¦Ù†Ø©', 'Accounts Payable', 'LIABILITY', 'CREDIT', false, 'MONO', true, true, 1, NOW(), NOW()),
  (gen_random_uuid(), '2101', 'Ù…Ø³ØªØ­Ù‚Ø§Øª Ø§Ù„Ù…ÙˆØ±Ø¯ÙŠÙ†', 'Suppliers Payable', 'LIABILITY', 'CREDIT', true, 'MONO', true, true, 2, NOW(), NOW()),
  (gen_random_uuid(), '2102', 'Ù…Ø³ØªØ­Ù‚Ø§Øª Ø§Ù„Ù…Ù†Ø¯ÙˆØ¨ÙŠÙ†', 'Agents Payable', 'LIABILITY', 'CREDIT', true, 'MONO', true, true, 2, NOW(), NOW()),
  
  -- Ø§Ù„Ù…Ø­Ø§ÙØ¸
  (gen_random_uuid(), '2200', 'Ø§Ù„ØªØ²Ø§Ù…Ø§Øª Ø§Ù„Ù…Ø­Ø§ÙØ¸', 'Wallet Liabilities', 'LIABILITY', 'CREDIT', false, 'MONO', true, true, 1, NOW(), NOW()),
  (gen_random_uuid(), '2201', 'Ù…Ø­Ø§ÙØ¸ Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡', 'Customer Wallets', 'LIABILITY', 'CREDIT', true, 'MONO', true, true, 2, NOW(), NOW()),
  
  -- Ø¶Ø±Ø§Ø¦Ø¨
  (gen_random_uuid(), '2300', 'Ø§Ù„Ø¶Ø±Ø§Ø¦Ø¨ Ø§Ù„Ù…Ø³ØªØ­Ù‚Ø©', 'Taxes Payable', 'LIABILITY', 'CREDIT', false, 'MONO', true, true, 1, NOW(), NOW()),
  (gen_random_uuid(), '2301', 'Ø¶Ø±ÙŠØ¨Ø© Ø§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª Ø§Ù„Ù…Ø³ØªØ­Ù‚Ø©', 'Sales Tax Payable', 'LIABILITY', 'CREDIT', true, 'MONO', true, true, 2, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  is_active = true,
  updated_at = NOW();

-- 3. Ø­Ù‚ÙˆÙ‚ Ø§Ù„Ù…Ù„ÙƒÙŠØ© (Equity) - 3000-3999
INSERT INTO acc_accounts (id, code, name_ar, name_en, account_type, normal_balance, is_posting, currency_mode, is_system_account, is_active, level, created_at, updated_at)
VALUES
  (gen_random_uuid(), '3000', 'Ø­Ù‚ÙˆÙ‚ Ø§Ù„Ù…Ù„ÙƒÙŠØ©', 'Equity', 'EQUITY', 'CREDIT', false, 'MONO', true, true, 0, NOW(), NOW()),
  (gen_random_uuid(), '3100', 'Ø§Ù„Ø£Ø±Ø¨Ø§Ø­ Ø§Ù„Ù…Ø­ØªØ¬Ø²Ø©', 'Retained Earnings', 'EQUITY', 'CREDIT', true, 'MONO', true, true, 1, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  is_active = true,
  updated_at = NOW();

-- 4. Ø§Ù„Ø¥ÙŠØ±Ø§Ø¯Ø§Øª (Revenue) - 4000-4999
INSERT INTO acc_accounts (id, code, name_ar, name_en, account_type, normal_balance, is_posting, currency_mode, is_system_account, is_active, level, created_at, updated_at)
VALUES
  (gen_random_uuid(), '4000', 'Ø§Ù„Ø¥ÙŠØ±Ø§Ø¯Ø§Øª', 'Revenue', 'REVENUE', 'CREDIT', false, 'MONO', true, true, 0, NOW(), NOW()),
  (gen_random_uuid(), '4100', 'Ø¥ÙŠØ±Ø§Ø¯Ø§Øª Ø§Ù„Ø§Ø´ØªØ±Ø§ÙƒØ§Øª', 'Subscription Revenue', 'REVENUE', 'CREDIT', true, 'MONO', true, true, 1, NOW(), NOW()),
  (gen_random_uuid(), '4200', 'Ø¥ÙŠØ±Ø§Ø¯Ø§Øª Ø§Ù„Ø¥Ø¹Ù„Ø§Ù†Ø§Øª', 'Advertisement Revenue', 'REVENUE', 'CREDIT', true, 'MONO', true, true, 1, NOW(), NOW()),
  (gen_random_uuid(), '4300', 'Ø¥ÙŠØ±Ø§Ø¯Ø§Øª Ø§Ù„Ø®Ø¯Ù…Ø§Øª', 'Service Revenue', 'REVENUE', 'CREDIT', true, 'MONO', true, true, 1, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  is_active = true,
  updated_at = NOW();

-- 5. Ø§Ù„Ù…ØµØ±ÙˆÙØ§Øª (Expenses) - 5000-5999
INSERT INTO acc_accounts (id, code, name_ar, name_en, account_type, normal_balance, is_posting, currency_mode, is_system_account, is_active, level, created_at, updated_at)
VALUES
  (gen_random_uuid(), '5000', 'Ø§Ù„Ù…ØµØ±ÙˆÙØ§Øª', 'Expenses', 'EXPENSE', 'DEBIT', false, 'MONO', true, true, 0, NOW(), NOW()),
  (gen_random_uuid(), '5100', 'Ù…ØµØ±ÙˆÙ Ø§Ù„Ø¹Ù…ÙˆÙ„Ø§Øª', 'Commission Expense', 'EXPENSE', 'DEBIT', true, 'MONO', true, true, 1, NOW(), NOW()),
  (gen_random_uuid(), '5200', 'Ù…ØµØ±ÙˆÙØ§Øª Ø¥Ø¯Ø§Ø±ÙŠØ©', 'Administrative Expenses', 'EXPENSE', 'DEBIT', true, 'MONO', true, true, 1, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  is_active = true,
  updated_at = NOW();

-- Ø±Ø³Ø§Ù„Ø© Ù†Ø¬Ø§Ø­
SELECT 'ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø­Ø³Ø§Ø¨Ø§Øª Ø§Ù„Ù…Ø­Ø§Ø³Ø¨ÙŠØ© Ø¨Ù†Ø¬Ø§Ø­!' AS result;

