'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  FolderTree,
  GripVertical,
  Loader2,
} from 'lucide-react';
import { useCategories, useDeleteCategory } from '@/lib/hooks';
import * as Fa6Icons from 'react-icons/fa6';
import type { IconType } from 'react-icons';

export default function CategoriesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const { data: categoriesResponse, isLoading } = useCategories({ includeChildren: true });
  const deleteCategory = useDeleteCategory();

  const categories = Array.isArray(categoriesResponse)
    ? categoriesResponse
    : Array.isArray((categoriesResponse as any)?.data)
      ? (categoriesResponse as any).data
      : [];

  const getIconComponent = (iconName?: string | null): IconType | null => {
    if (!iconName) return null;

    // Seed stores FontAwesome-style kebab-case names (e.g. "building-flag").
    // react-icons/fa6 exports components like FaBuildingFlag.
    const pascal = iconName
      .split('-')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');

    const exportName = `Fa${pascal}`;
    return ((Fa6Icons as any)[exportName] as IconType | undefined) ?? null;
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف "${name}"؟`)) {
      try {
        await deleteCategory.mutateAsync(id);
      } catch (error) {
        // Error handled in hook
      }
    }
  };

  const query = searchQuery.trim();
  const queryLower = query.toLowerCase();

  const filteredCategories = query
    ? categories.filter((cat: any) => {
        const nameAr = cat.nameAr ?? '';
        const nameEn = (cat.nameEn ?? '').toLowerCase();
        return nameAr.includes(query) || nameEn.includes(queryLower);
      })
    : categories;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">التصنيفات</h1>
          <p className="text-gray-500 mt-1">إدارة تصنيفات الأنشطة التجارية</p>
        </div>
        <Link href="/categories/new" className="btn btn-primary">
          <Plus className="w-4 h-4" />
          إضافة تصنيف
        </Link>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="relative max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث عن تصنيف..."
              className="input pr-10"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Categories Tree */}
      <div className="card">
        <div className="card-header flex items-center gap-2">
          <FolderTree className="w-5 h-5 text-gray-400" />
          <h2 className="font-bold text-gray-900">شجرة التصنيفات</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {filteredCategories.map((category: any) => (
            <div key={category.id}>
              {/* Parent Category */}
              <div className="flex items-center gap-3 px-6 py-4 hover:bg-gray-50">
                <GripVertical className="w-5 h-5 text-gray-300 cursor-grab" />
                
                {(category.children?.length ?? 0) > 0 ? (
                  <button
                    onClick={() => toggleExpand(category.id)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    {expandedIds.includes(category.id) ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                ) : (
                  <div className="w-6" />
                )}

                <span className="text-2xl">
                  {(() => {
                    const Icon = getIconComponent(category.icon);
                    return Icon ? (
                      <Icon className="w-6 h-6 text-gray-600" aria-hidden="true" />
                    ) : (
                      category.icon || '📁'
                    );
                  })()}
                </span>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{category.nameAr}</span>
                    {category.isFeatured && (
                      <span className="badge badge-primary text-xs">مميز</span>
                    )}
                    {!category.isActive && (
                      <span className="badge badge-gray text-xs">معطل</span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">{category.nameEn}</span>
                </div>

                <div className="text-sm text-gray-500">
                  {(category as any)._count?.businesses ?? 0} نشاط
                </div>

                <div className="flex items-center gap-1">
                  <Link
                    href={`/categories/${category.id}/edit`}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button 
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    onClick={() => handleDelete(category.id, category.nameAr)}
                    disabled={deleteCategory.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Children */}
              {expandedIds.includes(category.id) && (category.children?.length ?? 0) > 0 && (
                <div className="bg-gray-50 border-t border-gray-100">
                  {category.children?.map((child: any) => (
                    <div
                      key={child.id}
                      className="flex items-center gap-3 px-6 py-3 pr-20 hover:bg-gray-100"
                    >
                      <GripVertical className="w-4 h-4 text-gray-300 cursor-grab" />
                      
                      <div className="flex-1">
                        <span className="text-gray-700">{child.nameAr}</span>
                      </div>

                      <div className="text-sm text-gray-500">
                        {(child as any)._count?.businesses ?? 0} نشاط
                      </div>

                      <div className="flex items-center gap-1">
                        <Link
                          href={`/categories/${child.id}/edit`}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button 
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          onClick={() => handleDelete(child.id, child.nameAr)}
                          disabled={deleteCategory.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Add subcategory button */}
                  <Link
                    href={`/categories/new?parentId=${category.id}`}
                    className="flex items-center gap-2 px-6 py-3 pr-20 text-primary-600 hover:bg-primary-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">إضافة تصنيف فرعي</span>
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <FolderTree className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد تصنيفات</p>
          </div>
        )}
      </div>
    </div>
  );
}
