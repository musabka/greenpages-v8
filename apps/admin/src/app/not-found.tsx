'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileQuestion, ArrowRight } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="w-10 h-10 text-gray-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          الصفحة غير موجودة
        </h1>
        
        <p className="text-gray-500 mb-8">
          عذراً، الصفحة التي تحاول الوصول إليها غير موجودة أو تم نقلها.
        </p>
        
        <div className="space-y-3">
          <Link 
            href="/"
            className="flex items-center justify-center gap-2 w-full bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors font-medium"
          >
            العودة للرئيسية
          </Link>
          
          <button 
            type="button"
            onClick={() => router.back()}
            className="flex items-center justify-center gap-2 w-full bg-gray-50 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors font-medium"
          >
            <ArrowRight className="w-4 h-4" />
            الرجوع للصفحة السابقة
          </button>
        </div>
      </div>
    </div>
  );
}
