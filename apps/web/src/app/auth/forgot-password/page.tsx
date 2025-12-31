'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, CheckCircle, Send } from 'lucide-react';
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_URL = `${API_BASE}/api/v1`;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'حدث خطأ أثناء إرسال رسالة إعادة التعيين');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50 p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg mb-4">
                <span className="text-white font-bold text-4xl">ص</span>
              </div>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">الصفحات الخضراء</h1>
          </div>

          {/* Success Message */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              تم إرسال رسالة إعادة التعيين
            </h2>
            <p className="text-gray-600 mb-6">
              قمنا بإرسال رسالة إلى بريدك الإلكتروني تحتوي على رابط لإعادة تعيين كلمة المرور.
              يرجى التحقق من بريدك الإلكتروني واتباع التعليمات.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              لم تستلم الرسالة؟ تحقق من مجلد الرسائل غير المرغوب فيها (Spam)
            </p>
            <Link href="/auth/login" className="btn btn-primary w-full">
              <ArrowRight className="w-5 h-5" />
              العودة إلى تسجيل الدخول
            </Link>
          </div>

          <p className="text-center text-gray-500 text-sm mt-8">
            © {new Date().getFullYear()} الصفحات الخضراء. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg mb-4">
              <span className="text-white font-bold text-4xl">ص</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">الصفحات الخضراء</h1>
          <p className="text-gray-500 mt-1">إعادة تعيين كلمة المرور</p>
        </div>

        {/* Forgot Password Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Mail className="w-7 h-7 text-primary-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              نسيت كلمة المرور؟
            </h2>
            <p className="text-gray-600 text-sm mt-2">
              أدخل بريدك الإلكتروني وسنرسل لك رابط لإعادة تعيين كلمة المرور
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="label">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="example@email.com"
                  required
                  dir="ltr"
                />
                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full h-12 text-base"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  إرسال رابط إعادة التعيين
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-gray-100 pt-6">
            <Link href="/auth/login" className="text-primary-600 hover:text-primary-700 text-sm font-medium inline-flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              العودة إلى تسجيل الدخول
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-8">
          © {new Date().getFullYear()} الصفحات الخضراء. جميع الحقوق محفوظة.
        </p>
      </div>
    </div>
  );
}
