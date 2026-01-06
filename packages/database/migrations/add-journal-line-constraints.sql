-- Migration: Add DB-Level Constraints to AccJournalLine
-- Purpose: Ensure data integrity at database level
-- Date: 2026-01-06

-- 1. Constraint: A line cannot have both debit and credit > 0
-- Only one can be > 0 at a time
ALTER TABLE "AccJournalLine"
ADD CONSTRAINT "chk_debit_or_credit_only"
CHECK (
  (debit > 0 AND credit = 0)
  OR
  (credit > 0 AND debit = 0)
  OR
  (debit = 0 AND credit = 0)
);

-- 2. Constraint: Amounts must be non-negative
ALTER TABLE "AccJournalLine"
ADD CONSTRAINT "chk_amounts_non_negative"
CHECK (debit >= 0 AND credit >= 0);

-- 3. Index on journalEntryId for faster queries
CREATE INDEX IF NOT EXISTS "idx_journal_line_entry_id" 
ON "AccJournalLine"("journalEntryId");

-- 4. Index on accountId for ledger queries
CREATE INDEX IF NOT EXISTS "idx_journal_line_account_id" 
ON "AccJournalLine"("accountId");

-- 5. Index on dimensions for dimensional reporting
CREATE INDEX IF NOT EXISTS "idx_journal_line_dimensions" 
ON "AccJournalLine" USING GIN ("dimensions");
