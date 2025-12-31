'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  FileText,
  Globe,
  Calendar,
  Loader2,
} from 'lucide-react';
import { useDeletePage, usePages } from '@/lib/hooks';

export default function PagesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = usePages();
  const deletePage = useDeletePage();

  const pages = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const filteredPages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return pages;
    return pages.filter((page) => {
      const titleAr = (page.titleAr ?? '').toLowerCase();
      const titleEn = (page.titleEn ?? '').toLowerCase();
      const slug = (page.slug ?? '').toLowerCase();
      return titleAr.includes(q) || titleEn.includes(q) || slug.includes(q);
    });
  }, [pages, searchQuery]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`هل أنت متأكد من حذف "${title}"؟`)) return;
    try {
      await deletePage.mutateAsync(id);
    } catch {
      // handled in hook
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">الصفحات</h1>
          <p className="text-gray-500 mt-1">إدارة الصفحات الثابتة</p>
        </div>
        <Link href="/pages/new" className="btn btn-primary">
          <Plus className="w-4 h-4" />
          إضافة صفحة
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-card-icon bg-primary-100 text-primary-600">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="stat-card-value">{pages.length}</p>
              <p className="stat-card-label">إجمالي الصفحات</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-card-icon bg-green-100 text-green-600">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <p className="stat-card-value">{pages.filter((p) => p.isPublished).length}</p>
              <p className="stat-card-label">منشورة</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="relative max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث عن صفحة..."
              className="input pr-10"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>الصفحة</th>
                <th>الرابط</th>
                <th>آخر تحديث</th>
                <th>الحالة</th>
                <th className="w-24">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredPages.map((page) => (
                <tr key={page.id}>
                  <td>
                    <div>
                      <span className="font-medium text-gray-900">{page.titleAr}</span>
                      <span className="text-sm text-gray-500 block">{page.titleEn ?? ''}</span>
                    </div>
                  </td>
                  <td>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-600">
                      /{page.slug}
                    </code>
                  </td>
                  <td>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar className="w-4 h-4" />
                      {page.updatedAt ? new Date(page.updatedAt).toLocaleDateString('ar-SY') : '-'}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${page.isPublished ? 'badge-success' : 'badge-gray'}`}>
                      {page.isPublished ? 'منشورة' : 'مسودة'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <a
                        href={`/${page.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                      <Link
                        href={`/pages/${page.id}/edit`}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(page.id, page.titleAr)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        disabled={deletePage.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
