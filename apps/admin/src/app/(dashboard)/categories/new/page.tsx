'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  Save,
  Image,
  Loader2,
} from 'lucide-react';
import { useCategories, useCreateCategory } from '@/lib/hooks';
import { uploadApi } from '@/lib/api';

type FlatCategoryOption = { id: string; label: string };

function flattenCategories(categories: any[], level = 0, out: FlatCategoryOption[] = []) {
  for (const category of categories) {
    const prefix = level > 0 ? `${'— '.repeat(level)}` : '';
    out.push({ id: category.id, label: `${prefix}${category.nameAr}` });
    if (Array.isArray(category.children) && category.children.length > 0) {
      flattenCategories(category.children, level + 1, out);
    }
  }
  return out;
}

export default function NewCategoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialParentId = searchParams.get('parentId') ?? '';

  const { data: categoriesTree, isLoading: isCategoriesLoading } = useCategories({ includeChildren: true });
  const createCategory = useCreateCategory();

  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [parentId, setParentId] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [iconEmoji, setIconEmoji] = useState('');
  const [iconName, setIconName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (initialParentId && !parentId) {
      setParentId(initialParentId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialParentId]);

  const parentOptions = useMemo(() => {
    const tree = Array.isArray(categoriesTree) ? categoriesTree : [];
    return flattenCategories(tree);
  }, [categoriesTree]);

  const handlePickImage = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await uploadApi.uploadImage(file, 'categories');
      setImageUrl(res.data.url);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    const trimmedNameAr = nameAr.trim();
    if (!trimmedNameAr) return;

    const icon = (iconName.trim() || iconEmoji.trim()) || undefined;

    try {
      await createCategory.mutateAsync({
        nameAr: trimmedNameAr,
        nameEn: nameEn.trim() || undefined,
        slug: slug.trim() || undefined,
        parentId: parentId || undefined,
        descriptionAr: descriptionAr.trim() || undefined,
        descriptionEn: descriptionEn.trim() || undefined,
        icon,
        image: imageUrl.trim() || undefined,
        isActive,
        isFeatured,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
        metaTitleAr: metaTitle.trim() || undefined,
        metaDescAr: metaDescription.trim() || undefined,
      });

      router.push('/categories');
    } catch {
      // handled in hook
    }
  };

  const isSaving = createCategory.isPending;
  const canSave = !!nameAr.trim() && !isUploading && !isSaving;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <Link
            href="/categories"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="page-title">إضافة تصنيف</h1>
            <p className="text-gray-500 mt-1">أضف تصنيف جديد للأنشطة التجارية</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={!canSave}>
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          حفظ
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="font-bold text-gray-900">المعلومات الأساسية</h2>
            </div>
            <div className="card-body space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الاسم (عربي) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="مثال: مطاعم ومقاهي"
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الاسم (إنجليزي)
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., Restaurants & Cafes"
                    dir="ltr"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الرابط (Slug)
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="restaurants-cafes"
                  dir="ltr"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
                <p className="text-sm text-gray-500 mt-1">
                  سيتم إنشاؤه تلقائياً من الاسم إذا تركته فارغاً
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  التصنيف الأب
                </label>
                <select
                  className="select"
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  disabled={isCategoriesLoading}
                >
                  <option value="">بدون (تصنيف رئيسي)</option>
                  {parentOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الوصف (عربي)
                  </label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="وصف مختصر للتصنيف..."
                    value={descriptionAr}
                    onChange={(e) => setDescriptionAr(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الوصف (إنجليزي)
                  </label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Short description..."
                    dir="ltr"
                    value={descriptionEn}
                    onChange={(e) => setDescriptionEn(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Icon & Image */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-bold text-gray-900">الأيقونة والصورة</h2>
            </div>
            <div className="card-body space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الأيقونة (Emoji أو رمز)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    className="input w-20 text-center text-2xl"
                    placeholder="🍽️"
                    maxLength={4}
                    value={iconEmoji}
                    onChange={(e) => setIconEmoji(e.target.value)}
                  />
                  <span className="text-gray-500">أو</span>
                  <input
                    type="text"
                    className="input flex-1"
                    placeholder="اسم الأيقونة (مثل: utensils)"
                    dir="ltr"
                    value={iconName}
                    onChange={(e) => setIconName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  صورة التصنيف
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div
                  className="h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-primary-500 transition-colors cursor-pointer"
                  onClick={handlePickImage}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handlePickImage();
                  }}
                >
                  <div className="text-center">
                    <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      {isUploading
                        ? 'جاري الرفع...'
                        : imageUrl
                          ? 'تم رفع الصورة'
                          : 'انقر للرفع'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Settings */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-bold text-gray-900">الإعدادات</h2>
            </div>
            <div className="card-body space-y-4">
              <div className="flex items-center justify-between py-2">
                <label className="text-gray-700">نشط</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between py-2">
                <label className="text-gray-700">مميز</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
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
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  min={0}
                />
              </div>
            </div>
          </div>

          {/* SEO */}
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
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الوصف (Meta Description)
                </label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="وصف مختصر للظهور في نتائج البحث"
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
