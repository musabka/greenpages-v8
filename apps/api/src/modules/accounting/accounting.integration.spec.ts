/**
 * Accounting Integration Tests
 * 
 * اختبارات التكامل للنظام المحاسبي
 * تغطي 10 سيناريوهات رئيسية كما هو محدد في الخطة
 * 
 * التشغيل: pnpm jest accounting.integration.spec.ts
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../prisma/prisma.service';
import { AccountingService } from './accounting.service';
import { AccountingPolicyService } from './accounting-policy.service';
import { AccountingReconciliationService } from './accounting-reconciliation.service';
import { AccSourceModule, AccJournalStatus } from '@greenpages/database';

describe('Accounting Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accountingService: AccountingService;
  let policyService: AccountingPolicyService;
  let reconciliationService: AccountingReconciliationService;

  // Test user ID
  const testUserId = 'test-user-integration';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        AccountingService,
        AccountingPolicyService,
        AccountingReconciliationService,
      ],
    }).compile();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    accountingService = moduleFixture.get<AccountingService>(AccountingService);
    policyService = moduleFixture.get<AccountingPolicyService>(AccountingPolicyService);
    reconciliationService = moduleFixture.get<AccountingReconciliationService>(AccountingReconciliationService);

    // Ensure base data exists
    await accountingService.seedBaseCurrencies();
    await accountingService.seedSystemAccounts();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ==========================================================================
  // TEST 1: Wallet Top-Up Creates Balanced Entry
  // ==========================================================================
  describe('Scenario 1: Wallet Top-Up', () => {
    it('should create a balanced journal entry for wallet top-up', async () => {
      const lines = policyService.mapTopUpApproval({
        amount: 10000,
        method: 'CASH',
        walletOwnerId: 'user-123',
        governorateId: 'gov-damascus',
      });

      // Verify balance
      expect(() => policyService.validateBalance(lines)).not.toThrow();

      // Verify account codes
      expect(lines.length).toBeGreaterThanOrEqual(2);
      expect(lines.some(l => l.accountCode === '1101')).toBe(true); // CASH
      expect(lines.some(l => l.accountCode === '2101')).toBe(true); // WALLET_LIABILITY
    });

    it('should create journal entry with correct sourceEventId', async () => {
      const topUpId = `topup-${Date.now()}`;
      
      const entry = await accountingService.createJournalEntry(testUserId, {
        description: 'Test wallet top-up',
        descriptionAr: 'اختبار شحن محفظة',
        sourceModule: AccSourceModule.WALLET,
        sourceEventId: `TOPUP-APPROVED-${topUpId}`,
        sourceEntityType: 'WalletTopUp',
        sourceEntityId: topUpId,
        lines: [
          { accountCode: '1101', debit: 5000, credit: 0 },
          { accountCode: '2101', debit: 0, credit: 5000 },
        ],
        autoPost: true,
      });

      expect(entry.id).toBeDefined();
      expect(entry.status).toBe(AccJournalStatus.POSTED);
      expect(entry.sourceEventId).toBe(`TOPUP-APPROVED-${topUpId}`);
    });
  });

  // ==========================================================================
  // TEST 2: Wallet Payment Creates Balanced Entry
  // ==========================================================================
  describe('Scenario 2: Wallet Payment for Subscription', () => {
    it('should create balanced entry with tax line', async () => {
      const lines = policyService.mapWalletPayment({
        grossAmount: 12000,
        netAmount: 10000,
        taxAmount: 2000,
        paymentType: 'SUBSCRIPTION',
        walletOwnerId: 'user-456',
        businessId: 'business-789',
      });

      // Verify balance
      expect(() => policyService.validateBalance(lines)).not.toThrow();

      // Verify structure: Debit Wallet, Credit Revenue, Credit Tax
      const debitLines = lines.filter(l => l.debit > 0);
      const creditLines = lines.filter(l => l.credit > 0);

      expect(debitLines.length).toBe(1);
      expect(debitLines[0].debit).toBe(12000);
      expect(creditLines.length).toBe(2);
    });
  });

  // ==========================================================================
  // TEST 3: Invoice Issue Creates AR Entry
  // ==========================================================================
  describe('Scenario 3: Invoice Issuance', () => {
    it('should create invoice with DRAFT status', async () => {
      const invoice = await accountingService.createInvoice(testUserId, {
        customerId: 'customer-001',
        customerName: 'Test Customer',
        invoiceType: 'SALE',
        lines: [
          { description: 'Service A', quantity: 1, unitPrice: 5000 },
          { description: 'Service B', quantity: 2, unitPrice: 2500 },
        ],
      });

      expect(invoice.status).toBe('DRAFT');
      expect(Number(invoice.total)).toBe(10000);
      expect(invoice.journalEntryId).toBeNull();
    });

    it('should create journal entry when invoice is issued', async () => {
      const invoice = await accountingService.createInvoice(testUserId, {
        customerId: 'customer-002',
        customerName: 'Test Customer 2',
        invoiceType: 'SALE',
        lines: [
          { description: 'Test Service', quantity: 1, unitPrice: 10000 },
        ],
      });

      const issuedInvoice = await accountingService.issueInvoice(invoice.id, testUserId);

      expect(issuedInvoice.status).toBe('ISSUED');
      expect(issuedInvoice.journalEntryId).toBeDefined();
      expect(issuedInvoice.issuedAt).toBeDefined();
    });
  });

  // ==========================================================================
  // TEST 4: Invoice Payment Records Correctly
  // ==========================================================================
  describe('Scenario 4: Invoice Payment', () => {
    it('should record payment and update invoice status', async () => {
      // Create and issue invoice
      const invoice = await accountingService.createInvoice(testUserId, {
        customerId: 'customer-003',
        customerName: 'Payment Test Customer',
        invoiceType: 'SALE',
        lines: [
          { description: 'Product', quantity: 1, unitPrice: 15000 },
        ],
      });
      await accountingService.issueInvoice(invoice.id, testUserId);

      // Record payment
      const result = await accountingService.recordInvoicePayment(
        invoice.id,
        testUserId,
        15000,
        'WALLET',
      );

      expect(result.status).toBe('PAID');
      expect(result.paidAmount).toBe(15000);
      expect(result.journalEntryId).toBeDefined();
    });

    it('should handle partial payments', async () => {
      const invoice = await accountingService.createInvoice(testUserId, {
        customerId: 'customer-004',
        customerName: 'Partial Payment Customer',
        invoiceType: 'SALE',
        lines: [
          { description: 'Big Product', quantity: 1, unitPrice: 20000 },
        ],
      });
      await accountingService.issueInvoice(invoice.id, testUserId);

      // First partial payment
      const result1 = await accountingService.recordInvoicePayment(
        invoice.id,
        testUserId,
        10000,
        'CASH',
      );
      expect(result1.status).toBe('PARTIAL');

      // Second payment to complete
      const result2 = await accountingService.recordInvoicePayment(
        invoice.id,
        testUserId,
        10000,
        'BANK',
      );
      expect(result2.status).toBe('PAID');
    });
  });

  // ==========================================================================
  // TEST 5: Credit Note Creates Reversal Entry
  // ==========================================================================
  describe('Scenario 5: Credit Note / Refund', () => {
    it('should create credit note for full refund', async () => {
      // Create and issue original invoice
      const invoice = await accountingService.createInvoice(testUserId, {
        customerId: 'customer-005',
        customerName: 'Refund Customer',
        invoiceType: 'SALE',
        lines: [
          { description: 'Refundable Product', quantity: 1, unitPrice: 8000 },
        ],
      });
      await accountingService.issueInvoice(invoice.id, testUserId);

      // Create full refund credit note
      const creditNote = await accountingService.createCreditNote(testUserId, invoice.id, {
        reason: 'Customer returned product',
        reasonAr: 'إرجاع منتج من العميل',
        refundType: 'FULL',
      });

      expect(creditNote.invoiceType).toBe('CREDIT_NOTE');
      expect(Number(creditNote.total)).toBe(8000);
      expect(creditNote.originalInvoiceId).toBe(invoice.id);
    });

    it('should create reversal journal entry when credit note is issued', async () => {
      const invoice = await accountingService.createInvoice(testUserId, {
        customerId: 'customer-006',
        customerName: 'Refund Customer 2',
        invoiceType: 'SALE',
        lines: [
          { description: 'Product', quantity: 1, unitPrice: 5000 },
        ],
      });
      await accountingService.issueInvoice(invoice.id, testUserId);

      const creditNote = await accountingService.createCreditNote(testUserId, invoice.id, {
        reason: 'Partial refund',
        refundType: 'PARTIAL',
        amount: 2000,
      });

      const issuedCN = await accountingService.issueCreditNote(creditNote.id, testUserId);

      expect(issuedCN.journalEntryId).toBeDefined();
    });
  });

  // ==========================================================================
  // TEST 6: Commission Earned Creates Expense & Payable
  // ==========================================================================
  describe('Scenario 6: Agent Commission', () => {
    it('should create balanced commission accrual entry', async () => {
      const lines = policyService.mapCommissionEarned({
        amount: 1500,
        agentProfileId: 'agent-profile-001',
        governorateId: 'gov-aleppo',
      });

      expect(() => policyService.validateBalance(lines)).not.toThrow();
      expect(lines.some(l => l.accountCode === '5100')).toBe(true); // COMMISSION_EXPENSE
      expect(lines.some(l => l.accountCode === '2201')).toBe(true); // AGENT_PAYABLE
    });
  });

  // ==========================================================================
  // TEST 7: Commission Settlement Creates Payment Entry
  // ==========================================================================
  describe('Scenario 7: Agent Settlement', () => {
    it('should create balanced settlement entry', async () => {
      const lines = policyService.mapCommissionPayment({
        amount: 5000,
        agentProfileId: 'agent-profile-002',
        paymentMethod: 'CASH',
      });

      expect(() => policyService.validateBalance(lines)).not.toThrow();
      expect(lines.some(l => l.accountCode === '2201' && l.debit > 0)).toBe(true); // AGENT_PAYABLE debit
      expect(lines.some(l => l.accountCode === '1101' && l.credit > 0)).toBe(true); // CASH credit
    });
  });

  // ==========================================================================
  // TEST 8: Period Closing Blocks New Entries
  // ==========================================================================
  describe('Scenario 8: Period Closing', () => {
    it('should reject entries in closed period', async () => {
      // Get or create a period
      const period = await accountingService.getOrCreatePeriodForDate(new Date());

      // Close the period (create an older period and close it)
      const oldDate = new Date();
      oldDate.setMonth(oldDate.getMonth() - 6);
      const oldPeriod = await accountingService.getOrCreatePeriodForDate(oldDate);
      
      // Close it
      await accountingService.closePeriod(oldPeriod.id, testUserId);

      // Try to create entry in closed period - should fail
      await expect(
        accountingService.createJournalEntry(testUserId, {
          description: 'Test in closed period',
          sourceModule: AccSourceModule.MANUAL,
          occurredAt: oldDate,
          lines: [
            { accountCode: '1101', debit: 1000, credit: 0 },
            { accountCode: '2101', debit: 0, credit: 1000 },
          ],
        }),
      ).rejects.toThrow('فترة مغلقة');
    });
  });

  // ==========================================================================
  // TEST 9: Idempotency - Duplicate sourceEventId Rejected
  // ==========================================================================
  describe('Scenario 9: Idempotency', () => {
    it('should return existing entry for duplicate sourceEventId', async () => {
      const uniqueEventId = `IDEMPOTENCY-TEST-${Date.now()}`;

      // First creation
      const entry1 = await accountingService.createJournalEntry(testUserId, {
        description: 'Idempotency test',
        sourceModule: AccSourceModule.WALLET,
        sourceEventId: uniqueEventId,
        lines: [
          { accountCode: '1101', debit: 1000, credit: 0 },
          { accountCode: '2101', debit: 0, credit: 1000 },
        ],
      });

      // Second creation with same sourceEventId
      const entry2 = await accountingService.createJournalEntry(testUserId, {
        description: 'Idempotency test duplicate',
        sourceModule: AccSourceModule.WALLET,
        sourceEventId: uniqueEventId,
        lines: [
          { accountCode: '1101', debit: 2000, credit: 0 },
          { accountCode: '2101', debit: 0, credit: 2000 },
        ],
      });

      // Should return the same entry
      expect(entry2.id).toBe(entry1.id);
    });
  });

  // ==========================================================================
  // TEST 10: Wallet Reconciliation
  // ==========================================================================
  describe('Scenario 10: Wallet Reconciliation', () => {
    it('should detect discrepancies between wallet and accounting', async () => {
      const report = await reconciliationService.getWalletLiabilityReport();

      expect(report).toHaveProperty('totalWalletTableBalance');
      expect(report).toHaveProperty('totalAccountingLiability');
      expect(report).toHaveProperty('status');
    });

    it('should reconcile clearing accounts', async () => {
      const result = await reconciliationService.reconcileClearingAccounts();

      expect(result.accounts).toBeDefined();
      expect(Array.isArray(result.accounts)).toBe(true);
    });
  });

  // ==========================================================================
  // TEST 11: Dimensions Validation
  // ==========================================================================
  describe('Scenario 11: Dimensions Validation', () => {
    it('should reject invalid dimension keys', () => {
      expect(() => {
        policyService.validateDimensions({
          userId: 'valid-user',
          invalidKey: 'should-fail',
        } as any);
      }).toThrow('not allowed');
    });

    it('should accept valid dimensions', () => {
      const validated = policyService.validateDimensions({
        userId: 'user-123',
        governorateId: 'gov-001',
        businessId: 'business-456',
      });

      expect(validated.userId).toBe('user-123');
      expect(validated.governorateId).toBe('gov-001');
    });
  });

  // ==========================================================================
  // TEST 12: Balance Validation
  // ==========================================================================
  describe('Scenario 12: Balance Validation', () => {
    it('should reject unbalanced entries', () => {
      const unbalancedLines = [
        { accountCode: '1101', debit: 1000, credit: 0 },
        { accountCode: '2101', debit: 0, credit: 500 },
      ];

      expect(() => policyService.validateBalance(unbalancedLines)).toThrow('not balanced');
    });

    it('should reject negative amounts', () => {
      const negativeLines = [
        { accountCode: '1101', debit: -1000, credit: 0 },
        { accountCode: '2101', debit: 0, credit: -1000 },
      ];

      expect(() => policyService.validateBalance(negativeLines)).toThrow('non-negative');
    });

    it('should reject lines with both debit and credit', () => {
      const bothLines = [
        { accountCode: '1101', debit: 500, credit: 500 },
      ];

      expect(() => policyService.validateBalance(bothLines)).toThrow('both debit and credit');
    });
  });

  // ==========================================================================
  // TEST 13: Manager Settlement
  // ==========================================================================
  describe('Scenario 13: Manager Settlement', () => {
    it('should create balanced manager settlement entry', async () => {
      const lines = policyService.mapManagerSettlement({
        totalAmount: 20000,
        governorateShare: 15000,
        companyShare: 5000,
        managerId: 'manager-001',
        governorateId: 'gov-homs',
      });

      expect(() => policyService.validateBalance(lines)).not.toThrow();
      expect(lines.some(l => l.accountCode === '2202' && l.debit > 0)).toBe(true); // MANAGER_PAYABLE debit
    });
  });

  // ==========================================================================
  // TEST 14: Gamification Reward (No Cash Movement)
  // ==========================================================================
  describe('Scenario 14: Gamification Reward', () => {
    it('should create balanced gamification entry', async () => {
      const lines = policyService.mapGamificationReward({
        amount: 500,
        userId: 'user-gamification',
        rewardType: 'BADGE',
      });

      expect(() => policyService.validateBalance(lines)).not.toThrow();
      expect(lines.some(l => l.accountCode === '5400')).toBe(true); // GAMIFICATION_EXPENSE
    });
  });
});
