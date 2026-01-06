'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol?: string;
  isBase: boolean;
  isActive: boolean;
  createdAt: string;
}

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  parentId?: string;
  currencyControl: 'MONO' | 'MULTI';
  currencyId?: string;
  isActive: boolean;
  balance?: number;
}

type ActiveTab = 'currencies' | 'accounts';

export default function CurrenciesAndAccountsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('currencies');
  const [loading, setLoading] = useState(true);

  // Currencies
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [newCurrency, setNewCurrency] = useState({
    code: '',
    nameAr: '',
    nameEn: '',
    symbol: '',
    isBase: false,
  });

  // Accounts
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    if (activeTab === 'currencies') {
      fetchCurrencies();
    } else {
      fetchAccounts();
    }
  }, [activeTab]);

  const fetchCurrencies = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await axios.get(`${baseUrl}/api/v1/admin/accounting/currencies`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrencies(response.data);
    } catch (error) {
      console.error('Error fetching currencies:', error);
      alert('فشل في تحميل العملات');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await axios.get(`${baseUrl}/api/v1/admin/accounting/accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAccounts(response.data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      alert('فشل في تحميل دليل الحسابات');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCurrency = async () => {
    if (!newCurrency.code || !newCurrency.nameAr || !newCurrency.nameEn) {
      alert('يرجى ملء جميع الحقول المطلوبة (الرمز، الاسم بالعربي، الاسم بالإنجليزي)');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      await axios.post(
        `${baseUrl}/api/v1/admin/accounting/currencies`,
        {
          code: newCurrency.code.toUpperCase(),
          nameAr: newCurrency.nameAr,
          nameEn: newCurrency.nameEn,
          symbol: newCurrency.symbol || undefined,
          isBase: newCurrency.isBase,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('تم إضافة العملة بنجاح');
      setShowCurrencyModal(false);
      setNewCurrency({ code: '', nameAr: '', nameEn: '', symbol: '', isBase: false });
      fetchCurrencies();
    } catch (error: any) {
      console.error('Error creating currency:', error);
      alert(error.response?.data?.message || 'فشل في إضافة العملة');
    }
  };

  const handleSetBaseCurrency = async (currencyId: string) => {
    if (!confirm('هل تريد جعل هذه العملة هي العملة الأساسية؟')) return;

    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      await axios.post(
        `${baseUrl}/api/v1/admin/accounting/currencies/${currencyId}/set-base`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('تم تعيين العملة الأساسية بنجاح');
      fetchCurrencies();
    } catch (error: any) {
      console.error('Error setting base currency:', error);
      alert(error.response?.data?.message || 'فشل في تعيين العملة الأساسية');
    }
  };

  const handleToggleCurrencyStatus = async (currencyId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const action = newStatus ? 'تفعيل' : 'تعطيل';
    
    if (!confirm(`هل تريد ${action} هذه العملة؟`)) return;

    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      await axios.patch(
        `${baseUrl}/api/v1/admin/accounting/currencies/${currencyId}`,
        { isActive: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`تم ${action} العملة بنجاح`);
      fetchCurrencies();
    } catch (error: any) {
      console.error('Error toggling currency status:', error);
      alert(error.response?.data?.message || `فشل في ${action} العملة`);
    }
  };

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      account.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || account.type === filterType;
    return matchesSearch && matchesType;
  });

  const accountTypes = Array.from(new Set(accounts.map((a) => a.type)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">العملات ودليل الحسابات</h1>
        <p className="text-sm text-gray-600 mt-1">إدارة العملات والاطلاع على دليل الحسابات</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('currencies')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'currencies'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              العملات
            </button>
            <button
              onClick={() => setActiveTab('accounts')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'accounts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              دليل الحسابات
            </button>
          </nav>
        </div>

        {/* Currencies Tab */}
        {activeTab === 'currencies' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm text-gray-600">
                  إجمالي العملات: <strong>{currencies.length}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowCurrencyModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                + إضافة عملة
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-500">جاري التحميل...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الرمز</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الرمز</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">عملة أساسية</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ الإضافة</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currencies.length > 0 ? (
                      currencies.map((currency) => (
                        <tr key={currency.id}>
                          <td className="px-4 py-3 text-sm font-mono font-bold">{currency.code}</td>
                          <td className="px-4 py-3 text-sm">{currency.name}</td>
                          <td className="px-4 py-3 text-sm">{currency.symbol || '-'}</td>
                          <td className="px-4 py-3 text-sm">
                            {currency.isBase ? (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                نعم
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                currency.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {currency.isActive ? 'نشطة' : 'معطلة'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {format(new Date(currency.createdAt), 'dd MMM yyyy', { locale: ar })}
                          </td>
                          <td className="px-4 py-3 text-sm space-x-2 space-x-reverse">
                            {!currency.isBase && (
                              <button
                                onClick={() => handleSetBaseCurrency(currency.id)}
                                className="text-blue-600 hover:underline text-xs"
                              >
                                جعلها أساسية
                              </button>
                            )}
                            <button
                              onClick={() => handleToggleCurrencyStatus(currency.id, currency.isActive)}
                              className={`hover:underline text-xs ${
                                currency.isActive ? 'text-red-600' : 'text-green-600'
                              }`}
                            >
                              {currency.isActive ? 'تعطيل' : 'تفعيل'}
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                          لا توجد عملات. قم بإضافة عملة جديدة.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Accounts Tab */}
        {activeTab === 'accounts' && (
          <div className="p-6">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="بحث برمز أو اسم الحساب..."
                />
              </div>
              <div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">جميع الأنواع</option>
                  {accountTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-500">جاري التحميل...</div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  عرض <strong>{filteredAccounts.length}</strong> من <strong>{accounts.length}</strong> حساب
                </div>
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
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          التحكم بالعملة
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الرصيد</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAccounts.length > 0 ? (
                        filteredAccounts.map((account) => (
                          <tr key={account.id}>
                            <td className="px-4 py-3 text-sm font-mono font-medium">{account.code}</td>
                            <td className="px-4 py-3 text-sm">{account.name}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                {account.type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  account.currencyControl === 'MONO'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-800'
                                }`}
                              >
                                {account.currencyControl === 'MONO' ? 'عملة واحدة' : 'متعدد العملات'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  account.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {account.isActive ? 'نشط' : 'معطل'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium">
                              {account.balance !== undefined ? account.balance.toLocaleString() : '-'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                            لا توجد حسابات تطابق معايير البحث
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Currency Modal */}
      {showCurrencyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">إضافة عملة جديدة</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  رمز العملة (ISO) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCurrency.code}
                  onChange={(e) => setNewCurrency({ ...newCurrency, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono"
                  placeholder="مثال: USD, EUR, SAR"
                  maxLength={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم العملة بالعربي <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCurrency.nameAr}
                  onChange={(e) => setNewCurrency({ ...newCurrency, nameAr: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="مثال: الدولار الأمريكي"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم العملة بالإنجليزي <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCurrency.nameEn}
                  onChange={(e) => setNewCurrency({ ...newCurrency, nameEn: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="مثال: US Dollar"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رمز العملة (اختياري)</label>
                <input
                  type="text"
                  value={newCurrency.symbol}
                  onChange={(e) => setNewCurrency({ ...newCurrency, symbol: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="مثال: $, €, ر.س"
                  maxLength={3}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isBase"
                  checked={newCurrency.isBase}
                  onChange={(e) => setNewCurrency({ ...newCurrency, isBase: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="isBase" className="text-sm text-gray-700">
                  جعل هذه العملة أساسية
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleCreateCurrency}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                إضافة العملة
              </button>
              <button
                onClick={() => {
                  setShowCurrencyModal(false);
                  setNewCurrency({ code: '', nameAr: '', nameEn: '', symbol: '', isBase: false });
                }}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
