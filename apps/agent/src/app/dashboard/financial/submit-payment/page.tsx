'use client';

import Link from 'next/link';
import { ArrowRight, DollarSign, Info, User } from 'lucide-react';
import { useAgentBalance } from '@/lib/hooks/useFinancial';

export default function SubmitPaymentPage() {
  const { data: balance } = useAgentBalance();

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link
            href="/dashboard/financial"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">تسليم المبالغ</h1>
            <p className="text-gray-500 mt-1">معلومات حول تسليم المقبوضات</p>
          </div>
        </div>

        {/* Current Balance Card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-100 mb-1">رصيدك الحالي (في ذمتك)</p>
              <p className="text-3xl font-bold">
                {balance?.currentBalance.toLocaleString() || 0}
              </p>
              <p className="text-sm text-blue-100 mt-1">ليرة سورية</p>
            </div>
            <div className="p-4 bg-white/20 rounded-xl">
              <DollarSign className="w-10 h-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-500 rounded-xl">
            <Info className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-amber-900 text-lg mb-3">آلية تسليم المبالغ</h3>
            <div className="space-y-3 text-amber-800">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                  1
                </div>
                <p>
                  قم بتسليم المبالغ النقدية المُحصّلة إلى <strong>مدير المحافظة</strong> عند العودة للمكتب.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                  2
                </div>
                <p>
                  يقوم مدير المحافظة بتأكيد استلام المبلغ في النظام من خلال لوحة التحكم الخاصة به.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                  3
                </div>
                <p>
                  بعد تأكيد الاستلام، يتم تحديث رصيدك تلقائياً وإضافة عمولتك المستحقة.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Manager Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-green-600" />
          تواصل مع مدير المحافظة
        </h3>
        
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <p className="text-gray-600 text-sm">
            للاستفسار عن تسليم المبالغ أو أي مسائل مالية، تواصل مع مدير المحافظة التابع لك.
          </p>
          
          <div className="pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2">ملاحظة:</p>
            <p className="text-sm text-gray-700">
              يُفضّل تسليم المبالغ المحصّلة في نهاية كل يوم عمل لتجنب تراكم الأموال النقدية.
            </p>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="mt-6">
        <Link
          href="/dashboard/financial"
          className="block w-full text-center py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          العودة للحسابات المالية
        </Link>
      </div>
    </div>
  );
}
