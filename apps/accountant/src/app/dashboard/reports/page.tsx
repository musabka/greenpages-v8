'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface TrialBalanceAccount {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  debitTotal: number;
  creditTotal: number;
  balance: number;
}

interface IncomeStatementLine {
  categoryType: 'REVENUE' | 'EXPENSE';
  categoryName: string;
  amount: number;
}

interface BalanceSheetSection {
  sectionType: 'ASSET' | 'LIABILITY' | 'EQUITY';
  sectionName: string;
  amount: number;
}

type ReportType = 'trial-balance' | 'income-statement' | 'balance-sheet';

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>('trial-balance');
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currencyId, setCurrencyId] = useState('');
  const [currencies, setCurrencies] = useState<any[]>([]);

  // Trial Balance
  const [trialBalance, setTrialBalance] = useState<TrialBalanceAccount[]>([]);
  const [trialBalanceTotals, setTrialBalanceTotals] = useState({ debit: 0, credit: 0 });

  // Income Statement
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatementLine[]>([]);
  const [incomeStatementSummary, setIncomeStatementSummary] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0,
  });

  // Balance Sheet
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetSection[]>([]);
  const [balanceSheetSummary, setBalanceSheetSummary] = useState({
    totalAssets: 0,
    totalLiabilities: 0,
    totalEquity: 0,
  });

  useEffect(() => {
    fetchCurrencies();
    // Set default dates (current month)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    setDateFrom(format(firstDay, 'yyyy-MM-dd'));
    setDateTo(format(now, 'yyyy-MM-dd'));
  }, []);

  const fetchCurrencies = async () => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await axios.get(`${baseUrl}/api/v1/admin/accounting/currencies`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrencies(response.data);
      if (response.data.length > 0) {
        const baseCurrency = response.data.find((c: any) => c.isBase);
        setCurrencyId(baseCurrency?.id || response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
    }
  };

  const fetchTrialBalance = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const params = new URLSearchParams();
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      if (currencyId) params.append('currencyId', currencyId);

      const response = await axios.get(
        `${baseUrl}/api/v1/admin/accounting/reports/trial-balance?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTrialBalance(response.data.accounts || []);
      setTrialBalanceTotals(response.data.totals || { debit: 0, credit: 0 });
    } catch (error) {
      console.error('Error fetching trial balance:', error);
      alert('فشل في تحميل ميزان المراجعة');
    } finally {
      setLoading(false);
    }
  };

  const fetchIncomeStatement = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const params = new URLSearchParams();
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      if (currencyId) params.append('currencyId', currencyId);

      const response = await axios.get(
        `${baseUrl}/api/v1/admin/accounting/reports/income-statement?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setIncomeStatement(response.data.lines || []);
      setIncomeStatementSummary(response.data.summary || { totalRevenue: 0, totalExpenses: 0, netIncome: 0 });
    } catch (error) {
      console.error('Error fetching income statement:', error);
      alert('فشل في تحميل قائمة الدخل');
    } finally {
      setLoading(false);
    }
  };

  const fetchBalanceSheet = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const params = new URLSearchParams();
      if (dateTo) params.append('asOfDate', dateTo);
      if (currencyId) params.append('currencyId', currencyId);

      const response = await axios.get(
        `${baseUrl}/api/v1/admin/accounting/reports/balance-sheet?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setBalanceSheet(response.data.sections || []);
      setBalanceSheetSummary(response.data.summary || { totalAssets: 0, totalLiabilities: 0, totalEquity: 0 });
    } catch (error) {
      console.error('Error fetching balance sheet:', error);
      alert('فشل في تحميل الميزانية العمومية');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = () => {
    if (activeReport === 'trial-balance') {
      fetchTrialBalance();
    } else if (activeReport === 'income-statement') {
      fetchIncomeStatement();
    } else if (activeReport === 'balance-sheet') {
      fetchBalanceSheet();
    }
  };

  const handleExport = () => {
    // TODO: Implement export functionality (PDF/Excel)
    alert('سيتم تطوير وظيفة التصدير قريباً');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">التقارير المالية</h1>
        <p className="text-sm text-gray-600 mt-1">ميزان المراجعة، قائمة الدخل، والميزانية العمومية</p>
      </div>

      {/* Report Type Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveReport('trial-balance')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeReport === 'trial-balance'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ميزان المراجعة
            </button>
            <button
              onClick={() => setActiveReport('income-statement')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeReport === 'income-statement'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              قائمة الدخل
            </button>
            <button
              onClick={() => setActiveReport('balance-sheet')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeReport === 'balance-sheet'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              الميزانية العمومية
            </button>
          </nav>
        </div>

        {/* Filters */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {activeReport !== 'balance-sheet' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">من تاريخ</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {activeReport === 'balance-sheet' ? 'في تاريخ' : 'إلى تاريخ'}
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">العملة</label>
              <select
                value={currencyId}
                onChange={(e) => setCurrencyId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {currencies.map((currency) => (
                  <option key={currency.id} value={currency.id}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleGenerateReport}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'جاري التحميل...' : 'عرض التقرير'}
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                تصدير
              </button>
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div className="p-6">
          {/* Trial Balance */}
          {activeReport === 'trial-balance' && (
            <div className="space-y-4">
              {trialBalance.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            رمز الحساب
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            اسم الحساب
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">النوع</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">مدين</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">دائن</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الرصيد</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {trialBalance.map((account) => (
                          <tr key={account.accountId}>
                            <td className="px-4 py-3 text-sm font-mono">{account.accountCode}</td>
                            <td className="px-4 py-3 text-sm">{account.accountName}</td>
                            <td className="px-4 py-3 text-sm">{account.accountType}</td>
                            <td className="px-4 py-3 text-sm text-red-600">
                              {account.debitTotal > 0 ? account.debitTotal.toLocaleString() : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-green-600">
                              {account.creditTotal > 0 ? account.creditTotal.toLocaleString() : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium">
                              {account.balance.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 font-bold">
                        <tr>
                          <td colSpan={3} className="px-4 py-3 text-sm">الإجمالي</td>
                          <td className="px-4 py-3 text-sm text-red-600">
                            {trialBalanceTotals.debit.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-green-600">
                            {trialBalanceTotals.credit.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {(trialBalanceTotals.debit - trialBalanceTotals.credit).toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  {Math.abs(trialBalanceTotals.debit - trialBalanceTotals.credit) < 0.01 ? (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-green-800 font-medium">✓ ميزان المراجعة متوازن</p>
                    </div>
                  ) : (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-red-800 font-medium">⚠ ميزان المراجعة غير متوازن</p>
                      <p className="text-sm text-red-700 mt-1">
                        الفرق: {Math.abs(trialBalanceTotals.debit - trialBalanceTotals.credit).toLocaleString()}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  اختر الفترة والعملة ثم اضغط "عرض التقرير"
                </div>
              )}
            </div>
          )}

          {/* Income Statement */}
          {activeReport === 'income-statement' && (
            <div className="space-y-4">
              {incomeStatement.length > 0 ? (
                <>
                  <div className="space-y-6">
                    {/* Revenue Section */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-green-700">الإيرادات</h3>
                      <div className="space-y-2">
                        {incomeStatement
                          .filter((line) => line.categoryType === 'REVENUE')
                          .map((line, idx) => (
                            <div key={idx} className="flex justify-between items-center py-2 border-b">
                              <span className="text-gray-700">{line.categoryName}</span>
                              <span className="font-medium text-green-600">{line.amount.toLocaleString()}</span>
                            </div>
                          ))}
                      </div>
                      <div className="flex justify-between items-center py-3 bg-green-50 px-4 mt-2 rounded">
                        <span className="font-bold">إجمالي الإيرادات</span>
                        <span className="font-bold text-green-700 text-lg">
                          {incomeStatementSummary.totalRevenue.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Expenses Section */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-red-700">المصروفات</h3>
                      <div className="space-y-2">
                        {incomeStatement
                          .filter((line) => line.categoryType === 'EXPENSE')
                          .map((line, idx) => (
                            <div key={idx} className="flex justify-between items-center py-2 border-b">
                              <span className="text-gray-700">{line.categoryName}</span>
                              <span className="font-medium text-red-600">{line.amount.toLocaleString()}</span>
                            </div>
                          ))}
                      </div>
                      <div className="flex justify-between items-center py-3 bg-red-50 px-4 mt-2 rounded">
                        <span className="font-bold">إجمالي المصروفات</span>
                        <span className="font-bold text-red-700 text-lg">
                          {incomeStatementSummary.totalExpenses.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Net Income */}
                    <div
                      className={`flex justify-between items-center py-4 px-6 rounded-lg ${
                        incomeStatementSummary.netIncome >= 0 ? 'bg-blue-50' : 'bg-orange-50'
                      }`}
                    >
                      <span className="font-bold text-xl">صافي الربح / (الخسارة)</span>
                      <span
                        className={`font-bold text-2xl ${
                          incomeStatementSummary.netIncome >= 0 ? 'text-blue-700' : 'text-orange-700'
                        }`}
                      >
                        {incomeStatementSummary.netIncome.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  اختر الفترة والعملة ثم اضغط "عرض التقرير"
                </div>
              )}
            </div>
          )}

          {/* Balance Sheet */}
          {activeReport === 'balance-sheet' && (
            <div className="space-y-4">
              {balanceSheet.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Assets */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-blue-700 border-b-2 border-blue-700 pb-2">الأصول</h3>
                    {balanceSheet
                      .filter((section) => section.sectionType === 'ASSET')
                      .map((section, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2">
                          <span className="text-gray-700">{section.sectionName}</span>
                          <span className="font-medium">{section.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    <div className="flex justify-between items-center py-3 bg-blue-50 px-4 rounded font-bold">
                      <span>إجمالي الأصول</span>
                      <span className="text-blue-700 text-lg">
                        {balanceSheetSummary.totalAssets.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Liabilities & Equity */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-red-700 border-b-2 border-red-700 pb-2">
                      الالتزامات وحقوق الملكية
                    </h3>
                    
                    <div className="mb-4">
                      <h4 className="text-md font-semibold text-gray-700 mb-2">الالتزامات</h4>
                      {balanceSheet
                        .filter((section) => section.sectionType === 'LIABILITY')
                        .map((section, idx) => (
                          <div key={idx} className="flex justify-between items-center py-2">
                            <span className="text-gray-700">{section.sectionName}</span>
                            <span className="font-medium">{section.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      <div className="flex justify-between items-center py-2 bg-red-50 px-4 rounded font-semibold mt-2">
                        <span>إجمالي الالتزامات</span>
                        <span className="text-red-700">{balanceSheetSummary.totalLiabilities.toLocaleString()}</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-md font-semibold text-gray-700 mb-2">حقوق الملكية</h4>
                      {balanceSheet
                        .filter((section) => section.sectionType === 'EQUITY')
                        .map((section, idx) => (
                          <div key={idx} className="flex justify-between items-center py-2">
                            <span className="text-gray-700">{section.sectionName}</span>
                            <span className="font-medium">{section.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      <div className="flex justify-between items-center py-2 bg-green-50 px-4 rounded font-semibold mt-2">
                        <span>إجمالي حقوق الملكية</span>
                        <span className="text-green-700">{balanceSheetSummary.totalEquity.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-3 bg-purple-50 px-4 rounded font-bold mt-4">
                      <span>إجمالي الالتزامات وحقوق الملكية</span>
                      <span className="text-purple-700 text-lg">
                        {(balanceSheetSummary.totalLiabilities + balanceSheetSummary.totalEquity).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Balance Check */}
                  <div className="col-span-1 md:col-span-2">
                    {Math.abs(
                      balanceSheetSummary.totalAssets -
                        (balanceSheetSummary.totalLiabilities + balanceSheetSummary.totalEquity)
                    ) < 0.01 ? (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-green-800 font-medium">✓ الميزانية العمومية متوازنة</p>
                      </div>
                    ) : (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-800 font-medium">⚠ الميزانية العمومية غير متوازنة</p>
                        <p className="text-sm text-red-700 mt-1">
                          الفرق:{' '}
                          {Math.abs(
                            balanceSheetSummary.totalAssets -
                              (balanceSheetSummary.totalLiabilities + balanceSheetSummary.totalEquity)
                          ).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  اختر التاريخ والعملة ثم اضغط "عرض التقرير"
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
