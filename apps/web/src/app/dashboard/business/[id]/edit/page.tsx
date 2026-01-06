'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useState, useEffect, use } from 'react';
import {
  Save,
  ArrowRight,
  Loader2,
  AlertCircle,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Image as ImageIcon,
} from 'lucide-react';

interface BusinessData {
  id: string;
  nameAr: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  addressAr?: string;
  addressEn?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
}

export default function EditBusinessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<BusinessData>>({});

  // Fetch business data
  const { data: business, isLoading } = useQuery({
    queryKey: ['business', id],
    queryFn: async () => {
      const response = await api.get<BusinessData>(`/businesses/${id}`);
      return response.data;
    },
  });

  // Initialize form data
  useEffect(() => {
    if (business) {
      setFormData({
        nameAr: business.nameAr,
        nameEn: business.nameEn,
        descriptionAr: business.descriptionAr,
        descriptionEn: business.descriptionEn,
        addressAr: business.addressAr,
        addressEn: business.addressEn,
        phone: business.phone,
        email: business.email,
        website: business.website,
      });
    }
  }, [business]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<BusinessData>) => {
      return api.put(`/businesses/${id}`, data);
    },
    onSuccess: () => {
      alert('تم تحديث البيانات بنجاح');
      queryClient.invalidateQueries({ queryKey: ['business', id] });
      queryClient.invalidateQueries({ queryKey: ['my-businesses'] });
      router.push('/dashboard/my-businesses');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'فشل تحديث البيانات');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleChange = (field: keyof BusinessData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">النشاط غير موجود</h3>
            <p className="text-gray-600">لا يمكن العثور على النشاط التجاري المطلوب</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowRight className="w-5 h-5" />
            رجوع
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">تعديل بيانات النشاط</h1>
          <p className="text-gray-600">قم بتحديث معلومات نشاطك التجاري</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Building2 className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">المعلومات الأساسية</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم النشاط (عربي) *
                </label>
                <input
                  type="text"
                  value={formData.nameAr || ''}
                  onChange={(e) => handleChange('nameAr', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم النشاط (English)
                </label>
                <input
                  type="text"
                  value={formData.nameEn || ''}
                  onChange={(e) => handleChange('nameEn', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                وصف النشاط (عربي)
              </label>
              <textarea
                value={formData.descriptionAr || ''}
                onChange={(e) => handleChange('descriptionAr', e.target.value)}
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                وصف النشاط (English)
              </label>
              <textarea
                value={formData.descriptionEn || ''}
                onChange={(e) => handleChange('descriptionEn', e.target.value)}
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">العنوان</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  العنوان (عربي)
                </label>
                <textarea
                  value={formData.addressAr || ''}
                  onChange={(e) => handleChange('addressAr', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  العنوان (English)
                </label>
                <textarea
                  value={formData.addressEn || ''}
                  onChange={(e) => handleChange('addressEn', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Phone className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">معلومات الاتصال</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline ml-1" />
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline ml-1" />
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe className="w-4 h-4 inline ml-1" />
                  الموقع الإلكتروني
                </label>
                <input
                  type="url"
                  value={formData.website || ''}
                  onChange={(e) => handleChange('website', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  dir="ltr"
                  placeholder="https://"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  حفظ التغييرات
                </>
              )}
            </button>
          </div>
        </form>

        {/* Notice */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">ملاحظة هامة:</p>
              <p>
                يمكنك تحديث المعلومات الأساسية لنشاطك. التغييرات الكبيرة قد تتطلب مراجعة من
                المسؤولين قبل نشرها.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
