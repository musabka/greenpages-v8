'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowRight,
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  User,
  DollarSign,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface JournalEntry {
  id: string;
  entryNumber: string;
  description: string;
  descriptionAr: string;
  status: 'DRAFT' | 'POSTED' | 'VOID';
  entryDate: string;
  postingDate: string | null;
  voidDate: string | null;
  voidReason: string | null;
  totalAmount: number;
  sourceModule: string;
  sourceEventId: string;
  createdAt: string;
  lines: {
    id: string;
    accountCode: string;
    debit: string;
    credit: string;
    memo: string;
    account: {
      code: string;
      nameAr: string;
      nameEn: string;
    };
  }[];
  currency: {
    code: string;
    nameAr: string;
    symbol: string;
  };
  period: {
    name: string;
    startDate: string;
    endDate: string;
  };
}

export default function JournalEntryDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchEntry(params.id as string);
    }
  }, [params.id]);

  const fetchEntry = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(`${baseUrl}/api/v1/admin/accounting/journal-entries/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('فشل جلب البيانات');

      const data = await res.json();
      setEntry(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    if (!confirm('هل أنت متأكد من ترحيل هذا القيد؟')) return;

    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      const res = await fetch(
        `${baseUrl}/api/v1/admin/accounting/journal-entries/${entry?.id}/post`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user.id }),
        }
      );

      if (!res.ok) throw new Error('فشل ترحيل القيد');

      alert('تم ترحيل القيد بنجاح');
      fetchEntry(params.id as string);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleVoid = async () => {
    const reason = prompt('أدخل سبب الإلغاء:');
    if (!reason) return;

    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      const res = await fetch(
        `${baseUrl}/api/v1/admin/accounting/journal-entries/${entry?.id}/void`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user.id, reason }),
        }
      );

      if (!res.ok) throw new Error('فشل إلغاء القيد');

      alert('تم إلغاء القيد بنجاح');
      fetchEntry(params.id as string);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 space-x-reverse text-gray-700 hover:text-gray-900"
        >
          <ArrowRight className="w-5 h-5" />
          <span>رجوع</span>
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">{error || 'القيد غير موجود'}</p>
        </div>
      </div>
    );
  }

  const statusConfig = {
    DRAFT: { label: 'مسودة', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    POSTED: { label: 'مرحّل', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    VOID: { label: 'ملغي', color: 'bg-red-100 text-red-700', icon: XCircle },
  };

  const { label, color, icon: StatusIcon } = statusConfig[entry.status];

  const totalDebit = entry.lines.reduce((sum, line) => sum + Number(line.debit), 0);
  const totalCredit = entry.lines.reduce((sum, line) => sum + Number(line.credit), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{entry.entryNumber}</h1>
            <p className="text-gray-600 mt-1">{entry.descriptionAr}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 space-x-reverse">
          {entry.status === 'DRAFT' && (
            <button
              onClick={handlePost}
              className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
            >
              <CheckCircle className="w-5 h-5" />
              <span>ترحيل القيد</span>
            </button>
          )}

          {entry.status === 'POSTED' && (
            <button
              onClick={handleVoid}
              className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              <XCircle className="w-5 h-5" />
              <span>إلغاء القيد</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center space-x-2 space-x-reverse">
        <span className={`inline-flex items-center space-x-1 space-x-reverse px-3 py-1 rounded-full text-sm font-medium ${color}`}>
          <StatusIcon className="w-4 h-4" />
          <span>{label}</span>
        </span>
        {entry.status === 'VOID' && entry.voidReason && (
          <span className="text-sm text-gray-600">السبب: {entry.voidReason}</span>
        )}
      </div>

      {/* Entry Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 space-x-reverse">
            <Calendar className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600">تاريخ القيد</p>
              <p className="text-lg font-semibold text-gray-900">
                {format(new Date(entry.entryDate), 'dd MMMM yyyy', { locale: ar })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 space-x-reverse">
            <DollarSign className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-600">المبلغ الإجمالي</p>
              <p className="text-lg font-semibold text-gray-900">
                {entry.totalAmount.toLocaleString('ar-SY')} {entry.currency.symbol}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 space-x-reverse">
            <FileText className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-sm text-gray-600">المصدر</p>
              <p className="text-lg font-semibold text-gray-900">{entry.sourceModule}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 space-x-reverse">
            <Calendar className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-sm text-gray-600">الفترة المحاسبية</p>
              <p className="text-lg font-semibold text-gray-900">{entry.period.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Journal Lines */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold text-gray-900">الأسطر المحاسبية</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  رمز الحساب
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  اسم الحساب
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  البيان
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  مدين
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  دائن
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entry.lines.map((line) => (
                <tr key={line.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono font-medium text-gray-900">
                      {line.account.code}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{line.account.nameAr}</div>
                    <div className="text-xs text-gray-500">{line.account.nameEn}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{line.memo}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {Number(line.debit) > 0 && (
                      <span className="text-sm font-semibold text-gray-900">
                        {Number(line.debit).toLocaleString('ar-SY', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {Number(line.credit) > 0 && (
                      <span className="text-sm font-semibold text-gray-900">
                        {Number(line.credit).toLocaleString('ar-SY', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-bold">
              <tr>
                <td colSpan={3} className="px-6 py-4 text-right">
                  الإجمالي
                </td>
                <td className="px-6 py-4 text-green-700">
                  {totalDebit.toLocaleString('ar-SY', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-4 text-blue-700">
                  {totalCredit.toLocaleString('ar-SY', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">معلومات إضافية</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">معرّف الحدث المصدر:</span>
            <span className="mr-2 font-mono text-gray-900">{entry.sourceEventId}</span>
          </div>
          <div>
            <span className="text-gray-600">تاريخ الإنشاء:</span>
            <span className="mr-2 text-gray-900">
              {format(new Date(entry.createdAt), 'dd/MM/yyyy HH:mm', { locale: ar })}
            </span>
          </div>
          {entry.postingDate && (
            <div>
              <span className="text-gray-600">تاريخ الترحيل:</span>
              <span className="mr-2 text-gray-900">
                {format(new Date(entry.postingDate), 'dd/MM/yyyy HH:mm', { locale: ar })}
              </span>
            </div>
          )}
          {entry.voidDate && (
            <div>
              <span className="text-gray-600">تاريخ الإلغاء:</span>
              <span className="mr-2 text-gray-900">
                {format(new Date(entry.voidDate), 'dd/MM/yyyy HH:mm', { locale: ar })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
