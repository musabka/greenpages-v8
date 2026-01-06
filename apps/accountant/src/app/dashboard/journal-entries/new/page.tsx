'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Save, ArrowRight } from 'lucide-react';

interface Account {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
}

interface Currency {
  id: string;
  code: string;
  nameAr: string;
  symbol: string;
}

interface JournalLine {
  accountCode: string;
  debit: number;
  credit: number;
  memo: string;
}

export default function NewJournalEntryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  
  const [description, setDescription] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [currencyId, setCurrencyId] = useState('');
  const [lines, setLines] = useState<JournalLine[]>([
    { accountCode: '', debit: 0, credit: 0, memo: '' },
    { accountCode: '', debit: 0, credit: 0, memo: '' },
  ]);

  useEffect(() => {
    fetchAccounts();
    fetchCurrencies();
  }, []);

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(`${baseUrl}/api/v1/admin/accounting/accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      }
    } catch (err) {
      console.error('فشل جلب الحسابات:', err);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(`${baseUrl}/api/v1/admin/accounting/currencies`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCurrencies(data);
        if (data.length > 0) {
          const baseCurrency = data.find((c: Currency) => c.code === 'SYP') || data[0];
          setCurrencyId(baseCurrency.id);
        }
      }
    } catch (err) {
      console.error('فشل جلب العملات:', err);
    }
  };

  const addLine = () => {
    setLines([...lines, { accountCode: '', debit: 0, credit: 0, memo: '' }]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 2) {
      alert('يجب أن يحتوي القيد على سطرين على الأقل');
      return;
    }
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: keyof JournalLine, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const calculateTotals = () => {
    const totalDebit = lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
    return { totalDebit, totalCredit, difference: totalDebit - totalCredit };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { totalDebit, totalCredit, difference } = calculateTotals();
    
    if (Math.abs(difference) > 0.01) {
      alert('القيد غير متوازن! يجب أن تتساوى المدين والدائن');
      return;
    }

    if (totalDebit === 0) {
      alert('لا يمكن إنشاء قيد بقيمة صفر');
      return;
    }

    const validLines = lines.filter(
      (line) => line.accountCode && (Number(line.debit) > 0 || Number(line.credit) > 0)
    );

    if (validLines.length < 2) {
      alert('يجب إضافة سطرين صالحين على الأقل');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      const res = await fetch(`${baseUrl}/api/v1/admin/accounting/journal-entries/manual`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          description,
          descriptionAr,
          entryDate,
          currencyId,
          lines: validLines.map((line) => ({
            accountCode: line.accountCode,
            debit: Number(line.debit) || 0,
            credit: Number(line.credit) || 0,
            memo: line.memo,
          })),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'فشل إنشاء القيد');
      }

      const data = await res.json();
      alert('تم إنشاء القيد بنجاح');
      router.push(`/dashboard/journal-entries/${data.id}`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const { totalDebit, totalCredit, difference } = calculateTotals();
  const isBalanced = Math.abs(difference) < 0.01;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">قيد محاسبي يدوي جديد</h1>
          <p className="text-gray-600 mt-2">إنشاء قيد محاسبي جديد</p>
        </div>
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 space-x-reverse px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <ArrowRight className="w-5 h-5" />
          <span>رجوع</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">المعلومات الأساسية</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الوصف بالعربية *
              </label>
              <input
                type="text"
                required
                value={descriptionAr}
                onChange={(e) => setDescriptionAr(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="مثال: قيد تسوية نهاية الشهر"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (EN) *
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., Month-end adjustment entry"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                التاريخ *
              </label>
              <input
                type="date"
                required
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                العملة *
              </label>
              <select
                required
                value={currencyId}
                onChange={(e) => setCurrencyId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">اختر العملة</option>
                {currencies.map((currency) => (
                  <option key={currency.id} value={currency.id}>
                    {currency.nameAr} ({currency.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Journal Lines */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">الأسطر المحاسبية</h2>
            <button
              type="button"
              onClick={addLine}
              className="flex items-center space-x-2 space-x-reverse px-3 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة سطر</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                    الحساب
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                    البيان
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                    مدين
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                    دائن
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">
                    إجراء
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {lines.map((line, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3">
                      <select
                        value={line.accountCode}
                        onChange={(e) => updateLine(index, 'accountCode', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">اختر الحساب</option>
                        {accounts.map((account) => (
                          <option key={account.id} value={account.code}>
                            {account.code} - {account.nameAr}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={line.memo}
                        onChange={(e) => updateLine(index, 'memo', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="البيان..."
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line.debit || ''}
                        onChange={(e) => updateLine(index, 'debit', e.target.value)}
                        className="w-32 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line.credit || ''}
                        onChange={(e) => updateLine(index, 'credit', e.target.value)}
                        className="w-32 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeLine(index)}
                        className="text-red-600 hover:text-red-800"
                        disabled={lines.length <= 2}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-semibold">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-right">
                    الإجمالي
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-lg">{totalDebit.toLocaleString('ar-SY', { minimumFractionDigits: 2 })}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-lg">{totalCredit.toLocaleString('ar-SY', { minimumFractionDigits: 2 })}</div>
                  </td>
                  <td className="px-4 py-3"></td>
                </tr>
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-right">
                    الفرق
                  </td>
                  <td colSpan={3} className="px-4 py-3">
                    <div
                      className={`text-lg font-bold ${
                        isBalanced ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {Math.abs(difference).toLocaleString('ar-SY', { minimumFractionDigits: 2 })}
                      {isBalanced ? ' ✓ متوازن' : ' ✗ غير متوازن'}
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4 space-x-reverse">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={loading || !isBalanced}
            className="flex items-center space-x-2 space-x-reverse px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            <span>{loading ? 'جارٍ الحفظ...' : 'حفظ القيد'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
