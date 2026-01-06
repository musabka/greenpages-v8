'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AgentRootPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    
    if (token) {
      // Redirect to dashboard
      router.replace('/dashboard');
    } else {
      // Redirect to login
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-gray-600">جارٍ التحميل...</p>
      </div>
    </div>
  );
}
