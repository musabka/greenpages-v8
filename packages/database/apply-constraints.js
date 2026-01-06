/**
 * Apply DB-level constraints to AccJournalLine
 * Run: node apply-constraints.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function applyConstraints() {
  console.log('🔧 Applying database constraints to acc_journal_lines...\n');

  try {
    // 1. Add debit_or_credit_only constraint
    console.log('1️⃣ Adding debit_or_credit_only constraint...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "acc_journal_lines"
      DROP CONSTRAINT IF EXISTS "chk_debit_or_credit_only";
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "acc_journal_lines"
      ADD CONSTRAINT "chk_debit_or_credit_only"
      CHECK (
        (debit > 0 AND credit = 0)
        OR
        (credit > 0 AND debit = 0)
        OR
        (debit = 0 AND credit = 0)
      );
    `);
    console.log('   ✅ debit_or_credit_only constraint added\n');

    // 2. Add amounts_non_negative constraint
    console.log('2️⃣ Adding amounts_non_negative constraint...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "acc_journal_lines"
      DROP CONSTRAINT IF EXISTS "chk_amounts_non_negative";
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "acc_journal_lines"
      ADD CONSTRAINT "chk_amounts_non_negative"
      CHECK (debit >= 0 AND credit >= 0);
    `);
    console.log('   ✅ amounts_non_negative constraint added\n');

    // 3. Create indexes
    console.log('3️⃣ Creating performance indexes...');
    
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "idx_journal_line_entry_id" 
      ON "acc_journal_lines"("journal_entry_id");
    `);
    console.log('   ✅ idx_journal_line_entry_id created');

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "idx_journal_line_account_id" 
      ON "acc_journal_lines"("account_id");
    `);
    console.log('   ✅ idx_journal_line_account_id created');

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "idx_journal_line_dimensions" 
      ON "acc_journal_lines" USING GIN ("dimensions");
    `);
    console.log('   ✅ idx_journal_line_dimensions created\n');

    console.log('✅ All constraints and indexes applied successfully!');

  } catch (error) {
    console.error('❌ Error applying constraints:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

applyConstraints()
  .then(() => {
    console.log('\n🎉 Migration completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
