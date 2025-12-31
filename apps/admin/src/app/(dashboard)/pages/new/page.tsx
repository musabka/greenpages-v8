'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, Save, Eye, FileText, Loader2 } from 'lucide-react';
import { useCreatePage } from '@/lib/hooks';

export default function NewPagePage() {
  const router = useRouter();
  const createPage = useCreatePage();

  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [slug, setSlug] = useState('');
  const [contentAr, setContentAr] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  const canSubmit = Boolean(titleAr.trim() && slug.trim() && contentAr.trim());

  const handleSave = async (publish: boolean) => {
    if (!canSubmit) return;
    try {
      await createPage.mutateAsync({
        titleAr: titleAr.trim(),
        titleEn: titleEn.trim() || undefined,
        slug: slug.trim(),
        contentAr: contentAr.trim(),
        contentEn: contentEn.trim() || undefined,
        isPublished: publish,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
        metaTitleAr: metaTitle.trim() || undefined,
        metaDescAr: metaDescription.trim() || undefined,
      });
      router.push('/pages');
    } catch {
      // handled in hook
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <Link href="/pages" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="page-title">إضافة صفحة</h1>
            <p className="text-gray-500 mt-1">إنشاء صفحة ثابتة جديدة</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={slug.trim() ? `/${slug.trim()}` : '#'}
            target={slug.trim() ? '_blank' : undefined}
            rel={slug.trim() ? 'noopener noreferrer' : undefined}
            className={`btn btn-outline ${!slug.trim() ? 'pointer-events-none opacity-50' : ''}`}
          >
            <Eye className="w-4 h-4" />
            معاينة
          </a>
          <button
            className="btn btn-outline"
            onClick={() => handleSave(false)}
            disabled={!canSubmit || createPage.isPending}
          >
            حفظ كمسودة
          </button>
          <button
            className="btn btn-primary"
            onClick={() => handleSave(true)}
            disabled={!canSubmit || createPage.isPending}
          >
            {createPage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            نشر
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-400" />
              <h2 className="font-bold text-gray-900">محتوى الصفحة</h2>
            </div>
            <div className="card-body space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    العنوان (عربي) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="مثال: من نحن"
                    value={titleAr}
                    onChange={(e) => setTitleAr(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    العنوان (إنجليزي)
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., About Us"
                    dir="ltr"
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الرابط (Slug) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">/</span>
                  <input
                    type="text"
                    className="input flex-1"
                    placeholder="about"
                    dir="ltr"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المحتوى (عربي) <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="input font-mono"
                  rows={15}
                  placeholder="اكتب محتوى الصفحة هنا... يدعم HTML"
                  value={contentAr}
                  onChange={(e) => setContentAr(e.target.value)}
                />
                <p className="text-sm text-gray-500 mt-1">
                  يمكنك استخدام HTML أو Markdown
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المحتوى (إنجليزي)
                </label>
                <textarea
                  className="input font-mono"
                  rows={10}
                  placeholder="Write page content here... supports HTML"
                  dir="ltr"
                  value={contentEn}
                  onChange={(e) => setContentEn(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="font-bold text-gray-900">النشر</h2>
            </div>
            <div className="card-body space-y-4">
              <div className="flex items-center justify-between py-2">
                <label className="text-gray-700">منشورة</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ترتيب العرض
                </label>
                <input
                  type="number"
                  className="input"
                  value={sortOrder}
                  min={0}
                  onChange={(e) => setSortOrder(parseInt(e.target.value || '0', 10))}
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="font-bold text-gray-900">تحسين محركات البحث</h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  عنوان الصفحة (Meta Title)
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="عنوان لمحركات البحث"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                />
                <p className="text-sm text-gray-500 mt-1">
                  سيستخدم العنوان الرئيسي إذا تركته فارغاً
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الوصف (Meta Description)
                </label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="وصف مختصر للظهور في نتائج البحث (150-160 حرف)"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
