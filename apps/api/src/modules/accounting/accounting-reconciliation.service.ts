import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { AccJournalStatus } from '@greenpages/database';
import { ACCOUNT_CODES } from './accounting-policy.service';

/**
 * AccountingReconciliationService
 * 
 * خدمة المطابقة بين Wallet و Accounting
 * 
 * القاعدة: Accounting = SSOT (Single Source of Truth)
 *         Wallet.balance = Projection/Cache فقط
 */

export interface ReconciliationResult {
  walletId: string;
  userId: string;
  userName: string;
  walletBalance: number;
  accountingBalance: number;
  difference: number;
  status: 'MATCHED' | 'DISCREPANCY';
}

export interface ReconciliationReport {
  generatedAt: Date;
  totalWallets: number;
  matchedCount: number;
  discrepancyCount: number;
  totalWalletBalance: number;
  totalAccountingBalance: number;
  totalDifference: number;
  details: ReconciliationResult[];
}

@Injectable()
export class AccountingReconciliationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * مطابقة جميع المحافظ مع المحاسبة
   */
  async reconcileAllWallets(): Promise<ReconciliationReport> {
    const wallets = await this.prisma.wallet.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // الحصول على حساب التزام المحافظ
    const walletLiabilityAccount = await this.prisma.accAccount.findUnique({
      where: { code: ACCOUNT_CODES.WALLET_LIABILITY },
    });

    if (!walletLiabilityAccount) {
      throw new Error('Wallet liability account not found. Please run seed first.');
    }

    const details: ReconciliationResult[] = [];
    let matchedCount = 0;
    let discrepancyCount = 0;
    let totalWalletBalance = 0;
    let totalAccountingBalance = 0;

    for (const wallet of wallets) {
      // حساب الرصيد المحاسبي من القيود
      const accountingBalance = await this.calculateAccountingBalance(
        walletLiabilityAccount.id,
        wallet.userId,
      );

      const walletBalance = Number(wallet.balance);
      const difference = Math.abs(walletBalance - accountingBalance);
      const status = difference < 0.01 ? 'MATCHED' : 'DISCREPANCY';

      if (status === 'MATCHED') {
        matchedCount++;
      } else {
        discrepancyCount++;
      }

      totalWalletBalance += walletBalance;
      totalAccountingBalance += accountingBalance;

      details.push({
        walletId: wallet.id,
        userId: wallet.userId,
        userName: `${wallet.user.firstName} ${wallet.user.lastName}`,
        walletBalance,
        accountingBalance,
        difference,
        status,
      });
    }

    return {
      generatedAt: new Date(),
      totalWallets: wallets.length,
      matchedCount,
      discrepancyCount,
      totalWalletBalance,
      totalAccountingBalance,
      totalDifference: Math.abs(totalWalletBalance - totalAccountingBalance),
      details: details.filter(d => d.status === 'DISCREPANCY'), // إرجاع الفروقات فقط
    };
  }

  /**
   * مطابقة محفظة واحدة
   */
  async reconcileWallet(walletId: string): Promise<ReconciliationResult> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const walletLiabilityAccount = await this.prisma.accAccount.findUnique({
      where: { code: ACCOUNT_CODES.WALLET_LIABILITY },
    });

    if (!walletLiabilityAccount) {
      throw new Error('Wallet liability account not found');
    }

    const accountingBalance = await this.calculateAccountingBalance(
      walletLiabilityAccount.id,
      wallet.userId,
    );

    const walletBalance = Number(wallet.balance);
    const difference = Math.abs(walletBalance - accountingBalance);

    return {
      walletId: wallet.id,
      userId: wallet.userId,
      userName: `${wallet.user.firstName} ${wallet.user.lastName}`,
      walletBalance,
      accountingBalance,
      difference,
      status: difference < 0.01 ? 'MATCHED' : 'DISCREPANCY',
    };
  }

  /**
   * تصحيح رصيد المحفظة ليطابق المحاسبة
   * (يحدث Wallet فقط - لا يعدل Accounting)
   */
  async fixWalletProjection(walletId: string): Promise<{
    success: boolean;
    oldBalance: number;
    newBalance: number;
    message: string;
  }> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const walletLiabilityAccount = await this.prisma.accAccount.findUnique({
      where: { code: ACCOUNT_CODES.WALLET_LIABILITY },
    });

    if (!walletLiabilityAccount) {
      throw new Error('Wallet liability account not found');
    }

    const accountingBalance = await this.calculateAccountingBalance(
      walletLiabilityAccount.id,
      wallet.userId,
    );

    const oldBalance = Number(wallet.balance);

    if (Math.abs(oldBalance - accountingBalance) < 0.01) {
      return {
        success: true,
        oldBalance,
        newBalance: oldBalance,
        message: 'Wallet balance already matches accounting',
      };
    }

    // تحديث رصيد المحفظة ليطابق المحاسبة
    await this.prisma.wallet.update({
      where: { id: walletId },
      data: {
        balance: new Decimal(accountingBalance),
      },
    });

    // تسجيل في سجل التدقيق
    await this.prisma.accAuditLog.create({
      data: {
        userId: wallet.userId,
        action: 'RECONCILE_FIX',
        entityType: 'Wallet',
        entityId: walletId,
        oldValues: { balance: oldBalance },
        newValues: { balance: accountingBalance },
        reason: 'Projection fix to match accounting SSOT',
      },
    });

    return {
      success: true,
      oldBalance,
      newBalance: accountingBalance,
      message: `Wallet balance corrected from ${oldBalance} to ${accountingBalance}`,
    };
  }

  /**
   * حساب الرصيد المحاسبي لمستخدم من القيود
   */
  private async calculateAccountingBalance(
    accountId: string,
    userId: string,
  ): Promise<number> {
    // جمع كل حركات حساب التزام المحافظ للمستخدم
    const lines = await this.prisma.accJournalLine.findMany({
      where: {
        accountId,
        journalEntry: {
          status: AccJournalStatus.POSTED,
        },
        // البحث في dimensions للمستخدم
        dimensions: {
          path: ['userId'],
          equals: userId,
        },
      },
    });

    // حساب الرصيد (Credit - Debit لحسابات الالتزامات)
    let balance = 0;
    for (const line of lines) {
      balance += Number(line.credit) - Number(line.debit);
    }

    return balance;
  }

  /**
   * مطابقة حسابات المقاصة (Clearing Accounts)
   */
  async reconcileClearingAccounts(): Promise<{
    accounts: {
      code: string;
      name: string;
      balance: number;
      status: 'CLEAR' | 'PENDING';
    }[];
  }> {
    const clearingCodes = [
      ACCOUNT_CODES.CASH,
      ACCOUNT_CODES.BANK_MAIN,
      ACCOUNT_CODES.PAYMENT_GATEWAYS,
      ACCOUNT_CODES.MOBILE_MONEY,
    ];

    const results = [];

    for (const code of clearingCodes) {
      const account = await this.prisma.accAccount.findUnique({
        where: { code },
      });

      if (!account) continue;

      // حساب الرصيد
      const lines = await this.prisma.accJournalLine.findMany({
        where: {
          accountId: account.id,
          journalEntry: {
            status: AccJournalStatus.POSTED,
          },
        },
      });

      let balance = 0;
      for (const line of lines) {
        balance += Number(line.debit) - Number(line.credit);
      }

      results.push({
        code: account.code,
        name: account.nameAr,
        balance,
        status: Math.abs(balance) < 0.01 ? 'CLEAR' : 'PENDING',
      });
    }

    return { accounts: results };
  }

  /**
   * تقرير التزامات المحافظ الإجمالي
   */
  async getWalletLiabilityReport(): Promise<{
    totalWalletTableBalance: number;
    totalAccountingLiability: number;
    difference: number;
    status: 'MATCHED' | 'DISCREPANCY';
  }> {
    // مجموع أرصدة المحافظ من جدول Wallet
    const walletAggregate = await this.prisma.wallet.aggregate({
      _sum: {
        balance: true,
      },
    });
    const totalWalletTableBalance = Number(walletAggregate._sum.balance || 0);

    // مجموع التزامات المحافظ من المحاسبة
    const walletLiabilityAccount = await this.prisma.accAccount.findUnique({
      where: { code: ACCOUNT_CODES.WALLET_LIABILITY },
    });

    let totalAccountingLiability = 0;
    if (walletLiabilityAccount) {
      const lines = await this.prisma.accJournalLine.findMany({
        where: {
          accountId: walletLiabilityAccount.id,
          journalEntry: {
            status: AccJournalStatus.POSTED,
          },
        },
      });

      for (const line of lines) {
        totalAccountingLiability += Number(line.credit) - Number(line.debit);
      }
    }

    const difference = Math.abs(totalWalletTableBalance - totalAccountingLiability);

    return {
      totalWalletTableBalance,
      totalAccountingLiability,
      difference,
      status: difference < 0.01 ? 'MATCHED' : 'DISCREPANCY',
    };
  }
}
