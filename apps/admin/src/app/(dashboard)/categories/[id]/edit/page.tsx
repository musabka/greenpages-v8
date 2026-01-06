'use client';

import { useEffect, useMemo, useState, use } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowRight,
  Save,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { useCategories, useCategory, useUpdateCategory } from '@/lib/hooks';
import * as Fa6Icons from 'react-icons/fa6';
import type { IconType } from 'react-icons';

type FlatCategoryOption = {
  id: string;
  label: string;
};

function getIconComponent(iconName?: string | null): IconType | null {
  if (!iconName) return null;

  const pascal = iconName
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  const exportName = `Fa${pascal}`;
  return ((Fa6Icons as any)[exportName] as IconType | undefined) ?? null;
}

function flattenCategories(
  categories: any[],
  level = 0,
  out: FlatCategoryOption[] = []
) {
  for (const category of categories) {
    const prefix = level > 0 ? `${'— '.repeat(level)}` : '';
    out.push({
      id: category.id,
      label: `${prefix}${category.nameAr}`,
    });
    if (Array.isArray(category.children) && category.children.length > 0) {
      flattenCategories(category.children, level + 1, out);
    }
  }
  return out;
}

function collectDescendantIds(category: any): Set<string> {
  const ids = new Set<string>();
  const walk = (node: any) => {
    const children = Array.isArray(node?.children) ? node.children : [];
    for (const child of children) {
      if (child?.id) ids.add(child.id);
      walk(child);
    }
  };
  walk(category);
  return ids;
}

export default function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: categoryId } = use(params);
  const router = useRouter();

  const { data: category, isLoading: isCategoryLoading, isError } = useCategory(categoryId);
  const { data: categoriesTree, isLoading: isCategoriesLoading } = useCategories({ includeChildren: true });
  const updateCategory = useUpdateCategory();

  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [parentId, setParentId] = useState('');
  const [icon, setIcon] = useState('');
  const [image, setImage] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState<number>(0);

  useEffect(() => {
    if (!category) return;

    setNameAr(category.nameAr ?? '');
    setNameEn(category.nameEn ?? '');
    setSlug(category.slug ?? '');
    setParentId(category.parentId ?? '');
    setIcon(category.icon ?? '');
    setImage(category.image ?? '');
    setIsActive(Boolean(category.isActive));
    setIsFeatured(Boolean(category.isFeatured));
    setSortOrder(typeof category.sortOrder === 'number' ? category.sortOrder : 0);
  }, [category]);

  const excludedParentIds = useMemo(() => {
    if (!category) return new Set<string>([categoryId]);
    const descendants = collectDescendantIds(category);
    descendants.add(categoryId);
    return descendants;
  }, [category, categoryId]);

  const parentOptions = useMemo(() => {
    const tree = Array.isArray(categoriesTree) ? categoriesTree : [];
    const flat = flattenCategories(tree);
    return flat.filter((opt) => !excludedParentIds.has(opt.id));
  }, [categoriesTree, excludedParentIds]);

  const IconPreview = useMemo(() => getIconComponent(icon), [icon]);

  const handleSave = async () => {
    if (!nameAr.trim()) return;

    try {
      await updateCategory.mutateAsync({
        id: categoryId,
        data: {
          nameAr: nameAr.trim(),
          nameEn: nameEn.trim() || undefined,
          slug: slug.trim() || undefined,
          icon: icon.trim() || undefined,
          image: image.trim() || undefined,
          isActive,
          isFeatured,
          sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
          parentId: (parentId || null) as any,
        },
      });

      router.push('/categories');
    } catch {
      // handled in hook
    }
  };

  const isSaving = updateCategory.isPending;

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
            <h1 className="page-title">تعديل التصنيف</h1>
            <p className="text-gray-500 mt-1">تعديل بيانات التصنيف وإعداداته</p>
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={isSaving || isCategoryLoading || isCategoriesLoading || !nameAr.trim()}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          حفظ
        </button>
      </div>

      {/* Loading / Error */}
      {isCategoryLoading && (
        <div className="card">
          <div className="card-body flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
            <span className="text-gray-600">جاري تحميل بيانات التصنيف...</span>
          </div>
        </div>
      )}

      {!isCategoryLoading && isError && (
        <div className="card">
          <div className="card-body">
            <p className="text-red-600">فشل في تحميل بيانات التصنيف</p>
          </div>
        </div>
      )}

      {!isCategoryLoading && !isError && (
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
                    يمكنك تركه كما هو أو تعديله يدوياً
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
                    الأيقونة (اسم FontAwesome)
                  </label>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                      {IconPreview ? (
                        <IconPreview className="w-6 h-6 text-gray-700" aria-hidden="true" />
                      ) : (
                        <span className="text-xl text-gray-500">📁</span>
                      )}
                    </div>

                    <input
                      type="text"
                      className="input flex-1"
                      placeholder="مثل: building-flag أو utensils"
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      dir="ltr"
                    />
                  </div>

                  <p className="text-sm text-gray-500 mt-1">
                    الاسم يُخزَّن كنص (kebab-case) ويُعرض كأيقونة
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رابط صورة التصنيف (اختياري)
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="https://..."
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    dir="ltr"
                  />

                  <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 mt-3">
                    <div className="text-center">
                      <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">رفع الصور غير مفعّل هنا</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
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
                    min={0}
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
